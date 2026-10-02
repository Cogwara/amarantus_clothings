import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const supplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  phone: z.string().optional().nullable(),
  market: z.string().default('Amarantus Clothings'),
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

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can delete suppliers' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }

    const supRes = await query(`SELECT * FROM suppliers WHERE id = $1`, [id]);
    if (supRes.rows.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    const supplier = supRes.rows[0];

    await query(`UPDATE purchase_batches SET "supplierId" = NULL WHERE "supplierId" = $1`, [id]);
    await query(`DELETE FROM suppliers WHERE id = $1`, [id]);

    await logAudit({
      userId: user.id,
      action: 'DELETE_SUPPLIER',
      entity: 'Supplier',
      entityId: id,
      description: `Owner deleted supplier "${supplier.name}" (${supplier.market})`,
    });

    return NextResponse.json({
      success: true,
      message: `Supplier "${supplier.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}

