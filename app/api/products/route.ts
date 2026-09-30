import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  sku: z.string().optional(),
  description: z.string().optional(),
  size: z.string().default('M'),
  gender: z.string().default('UNISEX'),
  condition: z.enum(['EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR']).default('EXCELLENT'),
  brand: z.string().optional(),
  color: z.string().optional(),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  quantity: z.number().int().min(0, 'Initial quantity cannot be negative'),
  minimumStock: z.number().int().min(0).default(3),
  imageUrl: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const size = searchParams.get('size') || '';
    const condition = searchParams.get('condition') || '';
    const status = searchParams.get('status') || '';
    const clearanceOnly = searchParams.get('clearance') === 'true';

    let sql = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p."categoryId",
        c.name as "categoryName",
        p.description,
        p.size,
        p.gender,
        p.condition,
        p.brand,
        p.color,
        p."costPrice",
        p."sellingPrice",
        p.quantity,
        p."minimumStock",
        p.status,
        p."dateAdded",
        p."createdAt",
        p."updatedAt",
        pi.url as "primaryImageUrl",
        EXTRACT(DAY FROM NOW() - p."dateAdded")::int as "daysInStock"
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."isPrimary" = true
      WHERE p.status != 'INACTIVE'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (search.trim()) {
      sql += ` AND (p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (categoryId) {
      sql += ` AND p."categoryId" = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (size) {
      sql += ` AND p.size = $${paramIndex}`;
      params.push(size);
      paramIndex++;
    }

    if (condition) {
      sql += ` AND p.condition = $${paramIndex}`;
      params.push(condition);
      paramIndex++;
    }

    if (status) {
      if (status === 'LOW_STOCK') {
        sql += ` AND (p.quantity <= p."minimumStock" AND p.quantity > 0)`;
      } else if (status === 'OUT_OF_STOCK') {
        sql += ` AND p.quantity = 0`;
      } else {
        sql += ` AND p.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
    }

    if (clearanceOnly) {
      sql += ` AND p."dateAdded" < NOW() - INTERVAL '45 days' AND p.quantity > 0`;
    }

    sql += ` ORDER BY p."dateAdded" DESC`;

    const res = await query(sql, params);
    return NextResponse.json({ products: res.rows });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json(
        { error: 'Staff members cannot add products directly' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid product data' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Generate SKU if not provided (e.g. TH-DRS-1234)
    const sku =
      data.sku?.trim() ||
      'TH-' +
        data.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM') +
        '-' +
        Math.floor(1000 + Math.random() * 9000);

    const productId = 'prod_' + Math.random().toString(36).substring(2, 9);

    // Calculate initial status
    let initialStatus = 'AVAILABLE';
    if (data.quantity === 0) {
      initialStatus = 'OUT_OF_STOCK';
    } else if (data.quantity <= data.minimumStock) {
      initialStatus = 'LOW_STOCK';
    }

    const newProduct = await withTransaction(async (client) => {
      // 1. Insert product
      const insertRes = await client.query(
        `
        INSERT INTO products (
          id, sku, name, "categoryId", description, size, gender, condition,
          brand, color, "costPrice", "sellingPrice", quantity, "minimumStock",
          status, "dateAdded", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW(), NOW())
        RETURNING *
      `,
        [
          productId,
          sku,
          data.name,
          data.categoryId,
          data.description || null,
          data.size,
          data.gender,
          data.condition,
          data.brand || null,
          data.color || null,
          data.costPrice,
          data.sellingPrice,
          data.quantity,
          data.minimumStock,
          initialStatus,
        ]
      );

      // 2. Insert primary image if provided
      if (data.imageUrl?.trim()) {
        await client.query(
          `
          INSERT INTO product_images (id, "productId", url, "isPrimary", "createdAt")
          VALUES ($1, $2, $3, true, NOW())
        `,
          ['img_' + Math.random().toString(36).substring(2, 9), productId, data.imageUrl.trim()]
        );
      }

      // 3. Insert initial stock movement if quantity > 0
      if (data.quantity > 0) {
        await client.query(
          `
          INSERT INTO stock_movements (id, "productId", type, quantity, "referenceId", notes, "createdById", "createdAt")
          VALUES ($1, $2, 'ADJUSTMENT', $3, 'INITIAL_STOCK', 'Product creation initial stock', $4, NOW())
        `,
          ['mov_' + Math.random().toString(36).substring(2, 9), productId, data.quantity, user.id]
        );
      }

      return insertRes.rows[0];
    });

    await logAudit({
      userId: user.id,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: productId,
      description: `Added product ${data.name} (SKU: ${sku}) with initial qty ${data.quantity}`,
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
