import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
