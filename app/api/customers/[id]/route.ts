import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const custRes = await query(
      `
      SELECT 
        c.*,
        COUNT(s.id)::int as "totalPurchases",
        COALESCE(SUM(s."totalAmount"), 0)::float as "totalSpent",
        MAX(s."saleDate") as "lastPurchaseDate"
      FROM customers c
      LEFT JOIN sales s ON s."customerId" = c.id
      WHERE c.id = $1
      GROUP BY c.id
    `,
      [id]
    );

    if (custRes.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Customer's sales
    const salesRes = await query(
      `
      SELECT 
        s.*,
        u.name as "soldByName",
        (SELECT COUNT(*) FROM sale_items WHERE "saleId" = s.id)::int as "itemCount"
      FROM sales s
      JOIN users u ON s."soldById" = u.id
      WHERE s."customerId" = $1
      ORDER BY s."saleDate" DESC
    `,
      [id]
    );

    return NextResponse.json({
      customer: custRes.rows[0],
      sales: salesRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only business owners can delete customer profiles' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const custRes = await query(`SELECT * FROM customers WHERE id = $1`, [id]);
    if (custRes.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    const customer = custRes.rows[0];

    await withTransaction(async (client) => {
      // Disassociate sales so transaction records remain intact
      await client.query(`UPDATE sales SET "customerId" = NULL WHERE "customerId" = $1`, [id]);

      // Delete customer
      await client.query(`DELETE FROM customers WHERE id = $1`, [id]);
    });

    await logAudit({
      userId: user.id,
      action: 'DELETE_CUSTOMER',
      entity: 'Customer',
      entityId: id,
      description: `Owner deleted customer profile: ${customer.name} (${customer.phone || 'No phone'})`,
    });

    return NextResponse.json({
      success: true,
      message: `Customer "${customer.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}

