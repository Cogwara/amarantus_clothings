import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
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
        "updatedAt" = NOW()
      WHERE id = $12
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
        id,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update primary image if provided
    if (data.imageUrl?.trim()) {
      await query(
        `
        INSERT INTO product_images (id, "productId", url, "isPrimary", "createdAt")
        VALUES ($1, $2, $3, true, NOW())
        ON CONFLICT DO NOTHING
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
      return NextResponse.json({ error: 'Only shop owners can remove products' }, { status: 403 });
    }

    // Soft delete: set status to INACTIVE
    const res = await query(
      `
      UPDATE products
      SET status = 'INACTIVE', "updatedAt" = NOW()
      WHERE id = $1
      RETURNING *
    `,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'DEACTIVATE_PRODUCT',
      entity: 'Product',
      entityId: id,
      description: `Deactivated product ${res.rows[0].name} (SKU: ${res.rows[0].sku})`,
    });

    return NextResponse.json({ success: true, message: 'Product deactivated' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to inactivate product' }, { status: 500 });
  }
}
