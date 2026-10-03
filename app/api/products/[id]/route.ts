import { NextResponse } from 'next/server';
import { query, ensureDiscountColumns } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  categoryId: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  size: z.string().optional(),
  gender: z.string().optional(),
  condition: z.enum(['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR']).optional(),
  brand: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  minimumStock: z.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  discountPercent: z.number().int().min(0).max(95).optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await query(
      `
      SELECT 
        p.*,
        c.name as "categoryName",
        pi.url as "primaryImageUrl",
        COALESCE(
          (SELECT json_agg(json_build_object('id', img.id, 'url', img.url, 'isPrimary', img."isPrimary") ORDER BY img."isPrimary" DESC, img."createdAt" ASC)
           FROM product_images img
           WHERE img."productId" = p.id),
          '[]'::json
        ) as images,
        EXTRACT(DAY FROM NOW() - p."dateAdded")::int as "daysInStock"
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."isPrimary" = true
      WHERE p.id = $1
    `,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get stock movements
    const movementsRes = await query(
      `
      SELECT sm.*, u.name as "createdByName"
      FROM stock_movements sm
      LEFT JOIN users u ON sm."createdById" = u.id
      WHERE sm."productId" = $1
      ORDER BY sm."createdAt" DESC
      LIMIT 15
    `,
      [id]
    );

    return NextResponse.json({
      product: res.rows[0],
      movements: movementsRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized to edit product' }, { status: 403 });
    }

    await ensureDiscountColumns();

    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const data = parsed.data;

    // Update product fields
    const res = await query(
      `
      UPDATE products
      SET
        name = COALESCE($1, name),
        "categoryId" = COALESCE($2, "categoryId"),
        description = COALESCE($3, description),
        size = COALESCE($4, size),
        gender = COALESCE($5, gender),
        condition = COALESCE($6, condition),
        brand = COALESCE($7, brand),
        color = COALESCE($8, color),
        "costPrice" = COALESCE($9, "costPrice"),
        "sellingPrice" = COALESCE($10, "sellingPrice"),
        "minimumStock" = COALESCE($11, "minimumStock"),
        "discountPercent" = CASE WHEN $12::boolean THEN $13::int ELSE "discountPercent" END,
        "updatedAt" = NOW()
      WHERE id = $14
      RETURNING *
    `,
      [
        data.name,
        data.categoryId,
        data.description,
        data.size,
        data.gender,
        data.condition,
        data.brand,
        data.color,
        data.costPrice,
        data.sellingPrice,
        data.minimumStock,
        data.discountPercent !== undefined,
        data.discountPercent ?? null,
        id,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update images if provided
    if (data.images !== undefined) {
      await query(`DELETE FROM product_images WHERE "productId" = $1`, [id]);
      const validImages = data.images.map((u) => u.trim()).filter(Boolean);
      for (let i = 0; i < validImages.length; i++) {
        const isPrimary = i === 0;
        await query(
          `INSERT INTO product_images (id, "productId", url, "isPrimary", "createdAt")
           VALUES ($1, $2, $3, $4, NOW())`,
          ['img_' + Math.random().toString(36).substring(2, 9), id, validImages[i], isPrimary]
        );
      }
    } else if (data.imageUrl !== undefined && data.imageUrl.trim()) {
      await query(
        `UPDATE product_images SET "isPrimary" = false WHERE "productId" = $1`,
        [id]
      );
      await query(
        `
        INSERT INTO product_images (id, "productId", url, "isPrimary", "createdAt")
        VALUES ($1, $2, $3, true, NOW())
      `,
        ['img_' + Math.random().toString(36).substring(2, 9), id, data.imageUrl.trim()]
      );
    }

    await logAudit({
      userId: user.id,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: id,
      description: `Updated product details for ${res.rows[0].name}`,
    });

    return NextResponse.json({ success: true, product: res.rows[0] });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only shop owners have permission to delete inventory products' },
        { status: 403 }
      );
    }

    // Check if product exists
    const prodRes = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (prodRes.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const product = prodRes.rows[0];

    // Check if referenced in sales or purchase receipts
    const salesCheck = await query('SELECT COUNT(*) FROM sale_items WHERE "productId" = $1', [id]);
    const purchasesCheck = await query('SELECT COUNT(*) FROM purchase_items WHERE "productId" = $1', [id]);
    const hasSales = parseInt(salesCheck.rows[0]?.count || '0') > 0;
    const hasPurchases = parseInt(purchasesCheck.rows[0]?.count || '0') > 0;

    if (!hasSales && !hasPurchases) {
      // Safe to permanently remove product and related child records
      await query('DELETE FROM product_images WHERE "productId" = $1', [id]);
      await query('DELETE FROM stock_movements WHERE "productId" = $1', [id]);
      await query('DELETE FROM discounts WHERE "productId" = $1', [id]);
      await query('DELETE FROM social_posts WHERE "productId" = $1', [id]);
      await query('DELETE FROM products WHERE id = $1', [id]);
    } else {
      // Has historical accounting/sale records: archive as INACTIVE so history is preserved
      await query(
        `UPDATE products 
         SET status = 'INACTIVE', quantity = 0, "updatedAt" = NOW() 
         WHERE id = $1`,
        [id]
      );
    }

    await logAudit({
      userId: user.id,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: id,
      description: `Owner ${user.name} deleted product "${product.name}" (SKU: ${product.sku}) from inventory`,
    });

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" successfully deleted from inventory`,
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
