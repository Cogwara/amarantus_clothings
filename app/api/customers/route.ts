import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let sql = `
      SELECT 
        c.*,
        COUNT(s.id)::int as "totalPurchases",
        COALESCE(SUM(s."totalAmount"), 0)::float as "totalSpent",
        MAX(s."saleDate") as "lastPurchaseDate"
      FROM customers c
      LEFT JOIN sales s ON s."customerId" = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (search.trim()) {
      sql += ` AND (c.name ILIKE $1 OR c.phone ILIKE $1 OR c.email ILIKE $1 OR c.address ILIKE $1)`;
      params.push(`%${search.trim()}%`);
    }

    sql += ` GROUP BY c.id ORDER BY "totalSpent" DESC`;

    const res = await query(sql, params);
    return NextResponse.json({ customers: res.rows });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid customer data' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const customerId = 'cust_' + Math.random().toString(36).substring(2, 9);

    const insertRes = await query(
      `
      INSERT INTO customers (id, name, phone, email, address, notes, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `,
      [customerId, data.name, data.phone || null, data.email || null, data.address || null, data.notes || null]
    );

    await logAudit({
      userId: user.id,
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: customerId,
      description: `Registered new customer: ${data.name} (${data.phone || 'No phone'})`,
    });

    return NextResponse.json({ success: true, customer: insertRes.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
