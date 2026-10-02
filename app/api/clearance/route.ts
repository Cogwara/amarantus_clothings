import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';
import { calculateDiscountedPrice } from '@/lib/calculations';

const applyClearanceSchema = z.object({
  productId: z.string(),
  discountPercent: z.number().min(5).max(70),
  newSellingPrice: z.number().min(100),
});

export async function GET() {
  try {
    // Fetch products unsold or in stock beyond 45 days, or already marked CLEARANCE
    const res = await query(`
      SELECT 
        p.id,
        p.sku,
        p.name,
        p."categoryId",
        c.name as "categoryName",
        p.size,
        p.condition,
        p.brand,
        p.color,
        p."costPrice",
        p."sellingPrice",
        p.quantity,
        p.status,
        p."dateAdded",
        pi.url as "primaryImageUrl",
        EXTRACT(DAY FROM NOW() - p."dateAdded")::int as "daysInStock",
        COALESCE((
          SELECT SUM(si.quantity) 
          FROM sale_items si 
          WHERE si."productId" = p.id
        ), 0)::int as "totalSold"
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."isPrimary" = true
      WHERE (p."dateAdded" < NOW() - INTERVAL '45 days' OR p.status = 'CLEARANCE')
        AND p.quantity > 0
        AND p.status != 'INACTIVE'
      ORDER BY "daysInStock" DESC
    `);

    // Track clearance sales that have already happened
    const clearanceSalesRes = await query(`
      SELECT 
        s."saleNumber",
        s."saleDate",
        p.name as "productName",
        si.quantity,
        si."unitSellingPrice",
        si.profit
      FROM sale_items si
      JOIN sales s ON si."saleId" = s.id
      JOIN products p ON si."productId" = p.id
      WHERE p.status = 'CLEARANCE' OR p."dateAdded" < NOW() - INTERVAL '45 days'
      ORDER BY s."saleDate" DESC
      LIMIT 10
    `);

    return NextResponse.json({
      clearanceItems: res.rows,
      clearanceSales: clearanceSalesRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching clearance items:', error);
    return NextResponse.json({ error: 'Failed to fetch clearance items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Staff members are not authorized to mark clearance discounts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = applyClearanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid clearance parameters' }, { status: 400 });
    }

    const { productId, discountPercent, newSellingPrice } = parsed.data;

    const result = await withTransaction(async (client) => {
      // 1. Get current product details
      const prodRes = await client.query(
        `SELECT id, name, "sellingPrice", "costPrice" FROM products WHERE id = $1 FOR UPDATE`,
        [productId]
      );

      if (prodRes.rows.length === 0) {
        throw new Error('Product not found');
      }

      const prod = prodRes.rows[0];
      const previousPrice = prod.sellingPrice;

      // 2. Update product price and status to CLEARANCE
      const updatedProdRes = await client.query(
        `
        UPDATE products 
        SET "sellingPrice" = $1, status = 'CLEARANCE', "updatedAt" = NOW()
        WHERE id = $2
        RETURNING *
      `,
        [newSellingPrice, productId]
      );

      // 3. Insert discount record
      const discountId = 'disc_' + Math.random().toString(36).substring(2, 9);
      await client.query(
        `
        INSERT INTO discounts (id, "productId", "discountType", "discountValue", "startDate", "isActive")
        VALUES ($1, $2, 'PERCENTAGE', $3, NOW(), true)
      `,
        [discountId, productId, discountPercent]
      );

      // 4. Record CLEARANCE stock movement note
      await client.query(
        `
        INSERT INTO stock_movements (id, "productId", type, quantity, notes, "createdById", "createdAt")
        VALUES ($1, $2, 'CLEARANCE', 0, $3, $4, NOW())
      `,
        [
          'mov_' + Math.random().toString(36).substring(2, 9),
          productId,
          `Applied ${discountPercent}% clearance discount (price reduced from ₦${previousPrice.toLocaleString()} to ₦${newSellingPrice.toLocaleString()})`,
          user.id,
        ]
      );

      return {
        product: updatedProdRes.rows[0],
        previousPrice,
        newSellingPrice,
        discountPercent,
      };
    });

    await logAudit({
      userId: user.id,
      action: 'APPLY_CLEARANCE',
      entity: 'Product',
      entityId: productId,
      description: `Marked ${result.product.name} for clearance with ${discountPercent}% discount (₦${result.previousPrice} -> ₦${newSellingPrice})`,
    });

    return NextResponse.json({
      success: true,
      product: result.product,
      message: `Product marked as clearance with ${discountPercent}% discount.`,
    });
  } catch (error: any) {
    console.error('Error applying clearance discount:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to apply clearance' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only business owners can remove items from clearance' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      // 1. Revert product status to AVAILABLE
      const prodRes = await client.query(
        `UPDATE products 
         SET status = 'AVAILABLE', "updatedAt" = NOW()
         WHERE id = $1
         RETURNING *`,
        [productId]
      );

      if (prodRes.rows.length === 0) {
        throw new Error('Product not found');
      }

      // 2. Deactivate discounts
      await client.query(
        `UPDATE discounts SET "isActive" = false WHERE "productId" = $1`,
        [productId]
      );

      // 3. Record stock movement note
      await client.query(
        `INSERT INTO stock_movements (id, "productId", type, quantity, notes, "createdById", "createdAt")
         VALUES ($1, $2, 'ADJUSTMENT', 0, $3, $4, NOW())`,
        [
          'mov_' + Math.random().toString(36).substring(2, 9),
          productId,
          'Removed from clearance. Restored to regular inventory.',
          user.id,
        ]
      );

      return prodRes.rows[0];
    });

    await logAudit({
      userId: user.id,
      action: 'REMOVE_CLEARANCE',
      entity: 'Product',
      entityId: productId,
      description: `Owner removed ${result.name} from clearance. Status restored to AVAILABLE.`,
    });

    return NextResponse.json({
      success: true,
      message: `Product "${result.name}" removed from clearance.`,
      product: result,
    });
  } catch (error: any) {
    console.error('Error removing clearance:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to remove clearance' },
      { status: 500 }
    );
  }
}

