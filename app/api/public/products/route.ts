import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const size = searchParams.get('size') || '';
    const condition = searchParams.get('condition') || '';
    const clearanceOnly = searchParams.get('clearance') === 'true';
    const sort = searchParams.get('sort') || 'newest'; // 'newest', 'price_asc', 'price_desc'

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
        p."sellingPrice",
        p.quantity,
        p.status,
        p."dateAdded",
        pi.url as "primaryImageUrl",
        COALESCE(
          (SELECT json_agg(json_build_object('id', img.id, 'url', img.url))
           FROM product_images img
           WHERE img."productId" = p.id),
          '[]'::json
        ) as images
      FROM products p
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."isPrimary" = true
      WHERE p.status != 'INACTIVE' AND p.quantity > 0
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

    if (clearanceOnly) {
      sql += ` AND (p.status = 'CLEARANCE' OR p."dateAdded" < NOW() - INTERVAL '45 days')`;
    }

    if (sort === 'price_asc') {
      sql += ` ORDER BY p."sellingPrice" ASC`;
    } else if (sort === 'price_desc') {
      sql += ` ORDER BY p."sellingPrice" DESC`;
    } else {
      sql += ` ORDER BY p."dateAdded" DESC`;
    }

    const res = await query(sql, params);

    // Also get categories with counts
    const catRes = await query(`
      SELECT c.id, c.name, COUNT(p.id)::int as count
      FROM categories c
      JOIN products p ON p."categoryId" = c.id
      WHERE p.status != 'INACTIVE' AND p.quantity > 0
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `);

    // Get shop profile
    const shopRes = await query(`SELECT name, phone, address, currency FROM shops LIMIT 1`);
    const shop = shopRes.rows[0] || {
      name: 'Amarantus Clothings',
      phone: '+234 9065043549',
      address: 'Plot 78 Gbazango Kubwa FCT',
      currency: 'NGN',
    };

    return NextResponse.json({
      products: res.rows,
      categories: catRes.rows,
      shop,
    });
  } catch (error: any) {
    console.error('Public products fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch storefront items' }, { status: 500 });
  }
}
