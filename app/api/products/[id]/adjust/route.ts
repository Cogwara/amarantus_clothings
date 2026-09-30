import { NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const adjustStockSchema = z.object({
  type: z.enum(['PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT', 'CLEARANCE']),
  quantityChange: z.number().int(), // e.g. +5 or -2
  notes: z.string().min(2, 'A note or reason is required for audit'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Staff members are not authorized to adjust stock directly' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = adjustStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid adjustment data' },
        { status: 400 }
      );
    }

    const { type, quantityChange, notes } = parsed.data;

    const result = await withTransaction(async (client) => {
      // 1. Lock product row for update
      const prodRes = await client.query(
        `SELECT id, name, sku, quantity, "minimumStock" FROM products WHERE id = $1 FOR UPDATE`,
        [id]
      );

      if (prodRes.rows.length === 0) {
        throw new Error('Product not found');
      }

      const product = prodRes.rows[0];
      const newQuantity = product.quantity + quantityChange;

      // Rule: Never allow inventory quantity to become negative
      if (newQuantity < 0) {
        throw new Error(
          `Cannot deduct ${Math.abs(quantityChange)} units. Only ${product.quantity} items available in stock.`
        );
      }

      // Update product status
      let newStatus = 'AVAILABLE';
      if (newQuantity === 0) {
        newStatus = 'OUT_OF_STOCK';
      } else if (newQuantity <= product.minimumStock) {
        newStatus = 'LOW_STOCK';
      }

      // 2. Update product quantity and status
      const updatedProdRes = await client.query(
        `
        UPDATE products
        SET quantity = $1, status = $2, "updatedAt" = NOW()
        WHERE id = $3
        RETURNING *
      `,
        [newQuantity, newStatus, id]
      );

      // 3. Create StockMovement record
      const movementId = 'mov_' + Math.random().toString(36).substring(2, 9);
      await client.query(
        `
        INSERT INTO stock_movements (id, "productId", type, quantity, notes, "createdById", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
        [movementId, id, type, quantityChange, notes, user.id]
      );

      return {
        product: updatedProdRes.rows[0],
        previousQuantity: product.quantity,
        newQuantity,
      };
    });

    await logAudit({
      userId: user.id,
      action: 'STOCK_ADJUSTMENT',
      entity: 'Product',
      entityId: id,
      description: `Stock adjusted by ${quantityChange > 0 ? '+' : ''}${quantityChange} units (Reason: ${type}, Notes: "${notes}"). Quantity changed from ${result.previousQuantity} to ${result.newQuantity}`,
    });

    return NextResponse.json({
      success: true,
      product: result.product,
      message: `Stock successfully updated to ${result.newQuantity}`,
    });
  } catch (error: any) {
    console.error('Stock adjustment error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to adjust stock' },
      { status: 400 }
    );
  }
}
