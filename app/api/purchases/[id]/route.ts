import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const batchRes = await query(
      `
      SELECT 
        b.*,
        sup.name as "supplierName",
        sup.phone as "supplierPhone",
        sup.market,
        u.name as "createdByName"
      FROM purchase_batches b
      LEFT JOIN suppliers sup ON b."supplierId" = sup.id
      JOIN users u ON b."createdById" = u.id
      WHERE b.id = $1 OR b."batchNumber" = $1
    `,
      [id]
    );

    if (batchRes.rows.length === 0) {
      return NextResponse.json({ error: 'Purchase batch not found' }, { status: 404 });
    }

    const batch = batchRes.rows[0];

    const itemsRes = await query(
      `
      SELECT 
        pi.*,
        p.name as "productName",
        p.sku as "productSku",
        p.size,
        p.condition,
        p."sellingPrice",
        c.name as "categoryName"
      FROM purchase_items pi
      JOIN products p ON pi."productId" = p.id
      JOIN categories c ON p."categoryId" = c.id
      WHERE pi."purchaseBatchId" = $1
    `,
      [batch.id]
    );

    return NextResponse.json({
      batch,
      items: itemsRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching purchase batch details:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase batch' }, { status: 500 });
  }
}
