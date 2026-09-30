import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  phone: z.string().optional().nullable(),
  market: z.string().default('Katangua Market'),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        s.*,
        COUNT(b.id)::int as "batchCount",
        COALESCE(SUM(b."totalCost"), 0)::float as "totalSuppliedAmount"
      FROM suppliers s
      LEFT JOIN purchase_batches b ON b."supplierId" = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
    `);

    return NextResponse.json({ suppliers: res.rows });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized to add suppliers' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const data = parsed.data;
    const supplierId = 'sup_' + Math.random().toString(36).substring(2, 9);

    const insertRes = await query(
      `
      INSERT INTO suppliers (id, name, phone, market, notes, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `,
      [supplierId, data.name, data.phone || null, data.market, data.notes || null]
    );

    await logAudit({
      userId: user.id,
      action: 'CREATE_SUPPLIER',
      entity: 'Supplier',
      entityId: supplierId,
      description: `Added supplier: ${data.name} (${data.market})`,
    });

    return NextResponse.json({ success: true, supplier: insertRes.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
