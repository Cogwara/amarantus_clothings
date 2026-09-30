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
  description: z.string().min(2, 'Description is required'),
  amount: z.number().min(1, 'Amount must be greater than zero'),
  expenseDate: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const month = searchParams.get('month') || ''; // 'YYYY-MM' format

    let sql = `
      SELECT 
        e.*,
        u.name as "createdByName"
      FROM expenses e
      JOIN users u ON e."createdById" = u.id
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

    sql += ` ORDER BY e."expenseDate" DESC LIMIT 100`;

    const res = await query(sql, params);

    // Summary statistics
    const summaryRes = await query(`
      SELECT 
        category,
        COALESCE(SUM(amount), 0)::float as "totalAmount",
        COUNT(id)::int as count
      FROM expenses
      WHERE DATE_TRUNC('month', "expenseDate") = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY category
      ORDER BY "totalAmount" DESC
    `);

    return NextResponse.json({
      expenses: res.rows,
      monthlyBreakdown: summaryRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Staff members are not authorized to record expenses' },
        { status: 403 }
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

    return NextResponse.json({ success: true, expense: insertRes.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
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
