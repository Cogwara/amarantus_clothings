import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only business owners can delete purchase batches' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const batchRes = await query(
      `SELECT * FROM purchase_batches WHERE id = $1 OR "batchNumber" = $1`,
      [id]
    );

    if (batchRes.rows.length === 0) {
      return NextResponse.json({ error: 'Purchase batch not found' }, { status: 404 });
    }

    const batch = batchRes.rows[0];

    await withTransaction(async (client) => {
      // 1. Get purchase items to deduct stock
      const itemsRes = await client.query(
        `SELECT "productId", quantity FROM purchase_items WHERE "purchaseBatchId" = $1`,
        [batch.id]
      );

      for (const item of itemsRes.rows) {
        // Adjust product stock downwards
        await client.query(
          `UPDATE products 
           SET quantity = GREATEST(0, quantity - $1),
               status = CASE 
                 WHEN GREATEST(0, quantity - $1) = 0 THEN 'OUT_OF_STOCK'
                 WHEN GREATEST(0, quantity - $1) <= "minimumStock" THEN 'LOW_STOCK'
                 ELSE status 
               END,
               "updatedAt" = NOW()
           WHERE id = $2`,
          [item.quantity, item.productId]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (id, "productId", type, quantity, "referenceId", notes, "createdById", "createdAt")
           VALUES ($1, $2, 'ADJUSTMENT', $3, $4, $5, $6, NOW())`,
          [
            'mov_' + Math.random().toString(36).substring(2, 9),
            item.productId,
            -item.quantity,
            batch.batchNumber,
            `Purchase batch ${batch.batchNumber} deleted by owner. Stock reduced.`,
            user.id,
          ]
        );
      }

      // 2. Delete purchase items
      await client.query(`DELETE FROM purchase_items WHERE "purchaseBatchId" = $1`, [batch.id]);

      // 3. Delete purchase batch
      await client.query(`DELETE FROM purchase_batches WHERE id = $1`, [batch.id]);
    });

    await logAudit({
      userId: user.id,
      action: 'DELETE_PURCHASE_BATCH',
      entity: 'PurchaseBatch',
      entityId: batch.id,
      description: `Owner deleted purchase batch ${batch.batchNumber} (₦${batch.totalCost?.toLocaleString()}). Stock adjusted.`,
    });

    return NextResponse.json({
      success: true,
      message: `Purchase batch ${batch.batchNumber} deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting purchase batch:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete purchase batch' },
      { status: 500 }
    );
  }
}

