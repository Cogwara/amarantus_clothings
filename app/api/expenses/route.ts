import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const createExpenseSchema = z.object({
  category: z.enum([
    'TRANSPORT',
    'RENT',
    'ELECTRICITY',
    'PACKAGING',
    'STAFF',
    'MARKETING',
    'MARKET_EXPENSE',
    'OTHER',
  ]),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  amount: z.number().min(1, 'Amount must be greater than zero'),
  expenseDate: z.string().optional(),
});

const updateExpenseSchema = z.object({
  id: z.string().min(1, 'Expense ID required'),
  category: z.enum([
    'TRANSPORT',
    'RENT',
    'ELECTRICITY',
    'PACKAGING',
    'STAFF',
    'MARKETING',
    'MARKET_EXPENSE',
    'OTHER',
  ]).optional(),
  description: z.string().min(2, 'Description must be at least 2 characters').optional(),
  amount: z.number().min(1, 'Amount must be greater than zero').optional(),
  expenseDate: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const month = searchParams.get('month') || ''; // 'YYYY-MM' format

    let sql = `
      SELECT 
        e.id,
        e.category,
        e.description,
        e.amount,
        e."expenseDate",
        e."createdById",
        e."createdAt",
        COALESCE(u.name, 'Shop User') as "createdByName"
      FROM expenses e
      LEFT JOIN users u ON e."createdById" = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND e.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (month) {
      sql += ` AND TO_CHAR(e."expenseDate", 'YYYY-MM') = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    sql += ` ORDER BY e."expenseDate" DESC, e."createdAt" DESC LIMIT 200`;

    const res = await query(sql, params);

    // Summary statistics - tailored to month if specified, or overall
    let summarySql = `
      SELECT 
        category,
        COALESCE(SUM(amount), 0)::float as "totalAmount",
        COUNT(id)::int as count
      FROM expenses
    `;
    const summaryParams: any[] = [];
    if (month) {
      summarySql += ` WHERE TO_CHAR("expenseDate", 'YYYY-MM') = $1 GROUP BY category ORDER BY "totalAmount" DESC`;
      summaryParams.push(month);
    } else {
      summarySql += ` GROUP BY category ORDER BY "totalAmount" DESC`;
    }

    const summaryRes = await query(summarySql, summaryParams);

    // Current month total for quick stat
    const currentMonthRes = await query(`
      SELECT COALESCE(SUM(amount), 0)::float as "currentMonthTotal"
      FROM expenses
      WHERE DATE_TRUNC('month', "expenseDate") = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // All time total
    const allTimeRes = await query(`
      SELECT COALESCE(SUM(amount), 0)::float as "allTimeTotal"
      FROM expenses
    `);

    return NextResponse.json({
      expenses: res.rows,
      monthlyBreakdown: summaryRes.rows,
      currentMonthTotal: currentMonthRes.rows[0]?.currentMonthTotal || 0,
      allTimeTotal: allTimeRes.rows[0]?.allTimeTotal || 0,
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to record expenses' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid expense data' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const expenseId = 'exp_' + Math.random().toString(36).substring(2, 9);
    const dateObj = data.expenseDate ? new Date(data.expenseDate) : new Date();

    const insertRes = await query(
      `
      INSERT INTO expenses (id, category, description, amount, "expenseDate", "createdById", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `,
      [expenseId, data.category, data.description, data.amount, dateObj, user.id]
    );

    await logAudit({
      userId: user.id,
      action: 'CREATE_EXPENSE',
      entity: 'Expense',
      entityId: expenseId,
      description: `Added ${data.category} expense of ₦${data.amount.toLocaleString()} - "${data.description}"`,
    });

    const newExpense = {
      ...insertRes.rows[0],
      createdByName: user.name,
    };

    return NextResponse.json({ success: true, expense: newExpense }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding expense:', error);
    return NextResponse.json({ error: 'Failed to create expense: ' + (error?.message || '') }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Only owners or managers can edit expenses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid expense update data' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const existing = await query(`SELECT * FROM expenses WHERE id = $1`, [data.id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const current = existing.rows[0];
    const category = data.category || current.category;
    const description = data.description || current.description;
    const amount = data.amount !== undefined ? data.amount : current.amount;
    const expenseDate = data.expenseDate ? new Date(data.expenseDate) : current.expenseDate;

    const updateRes = await query(
      `
      UPDATE expenses 
      SET category = $1, description = $2, amount = $3, "expenseDate" = $4
      WHERE id = $5
      RETURNING *
      `,
      [category, description, amount, expenseDate, data.id]
    );

    await logAudit({
      userId: user.id,
      action: 'UPDATE_EXPENSE',
      entity: 'Expense',
      entityId: data.id,
      description: `Updated expense: ₦${amount.toLocaleString()} - "${description}" (${category})`,
    });

    return NextResponse.json({ success: true, expense: updateRes.rows[0] });
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can delete expenses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
    }

    const delRes = await query(`DELETE FROM expenses WHERE id = $1 RETURNING *`, [id]);
    if (delRes.rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'DELETE_EXPENSE',
      entity: 'Expense',
      entityId: id,
      description: `Deleted expense of ₦${delRes.rows[0].amount.toLocaleString()}`,
    });

    return NextResponse.json({ success: true, message: 'Expense deleted' });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
