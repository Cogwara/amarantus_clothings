import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch sale header
    const saleRes = await query(
      `
      SELECT 
        s.*,
        c.name as "customerName",
        c.phone as "customerPhone",
        c.address as "customerAddress",
        u.name as "soldByName",
        u.email as "soldByEmail"
      FROM sales s
      LEFT JOIN customers c ON s."customerId" = c.id
      JOIN users u ON s."soldById" = u.id
      WHERE s.id = $1 OR s."saleNumber" = $1
    `,
      [id]
    );

    if (saleRes.rows.length === 0) {
      return NextResponse.json({ error: 'Sale record not found' }, { status: 404 });
    }

    const sale = saleRes.rows[0];

    // Fetch items
    const itemsRes = await query(
      `
      SELECT 
        si.*,
        p.name as "productName",
        p.sku as "productSku",
        p.size,
        p.condition
      FROM sale_items si
      JOIN products p ON si."productId" = p.id
      WHERE si."saleId" = $1
    `,
      [sale.id]
    );

    // Fetch shop settings
    const shopRes = await query(`SELECT * FROM shops LIMIT 1`);
    const shop = shopRes.rows[0] || {
      name: 'Amarantus Clothings',
      phone: '+234 9065043549',
      address: 'Plot 78 Gbazango Kubwa FCT',
      currency: 'NGN',
    };

    return NextResponse.json({
      sale,
      items: itemsRes.rows,
      shop,
    });
  } catch (error: any) {
    console.error('Error fetching sale details:', error);
    return NextResponse.json({ error: 'Failed to fetch sale details' }, { status: 500 });
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
        { error: 'Only business owners can delete completed sale records' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if sale exists
    const saleRes = await query(`SELECT * FROM sales WHERE id = $1 OR "saleNumber" = $1`, [id]);
    if (saleRes.rows.length === 0) {
      return NextResponse.json({ error: 'Sale record not found' }, { status: 404 });
    }
    const sale = saleRes.rows[0];

    await withTransaction(async (client) => {
      // 1. Fetch sale items to restore product stocks
      const itemsRes = await client.query(
        `SELECT "productId", quantity FROM sale_items WHERE "saleId" = $1`,
        [sale.id]
      );

      for (const item of itemsRes.rows) {
        // Return quantity to product stock
        await client.query(
          `UPDATE products 
           SET quantity = quantity + $1,
               status = CASE 
                 WHEN status IN ('OUT_OF_STOCK', 'SOLD_OUT') THEN 'AVAILABLE'
                 ELSE status 
               END,
               "updatedAt" = NOW()
           WHERE id = $2`,
          [item.quantity, item.productId]
        );

        // Record stock movement for return
        await client.query(
          `INSERT INTO stock_movements (id, "productId", type, quantity, "referenceId", notes, "createdById", "createdAt")
           VALUES ($1, $2, 'RETURN', $3, $4, $5, $6, NOW())`,
          [
            'mov_' + Math.random().toString(36).substring(2, 9),
            item.productId,
            item.quantity,
            sale.saleNumber,
            `Sale ${sale.saleNumber} deleted by owner. Stock returned to inventory.`,
            user.id,
          ]
        );
      }

      // 2. Delete sale items
      await client.query(`DELETE FROM sale_items WHERE "saleId" = $1`, [sale.id]);

      // 3. Delete sale record
      await client.query(`DELETE FROM sales WHERE id = $1`, [sale.id]);
    });

    await logAudit({
      userId: user.id,
      action: 'DELETE_SALE',
      entity: 'Sale',
      entityId: sale.id,
      description: `Owner deleted sale ${sale.saleNumber} (₦${sale.totalAmount?.toLocaleString()}). Restored inventory stock.`,
    });

    return NextResponse.json({
      success: true,
      message: `Sale ${sale.saleNumber} deleted and stock restored successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete sale' }, { status: 500 });
  }
}

