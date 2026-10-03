import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function ensureFlashSaleTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS flash_sale_settings (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
      title VARCHAR(255) NOT NULL DEFAULT 'Flash Sales',
      subtitle VARCHAR(255) DEFAULT 'Limited Stock • Special Markdowns',
      is_enabled BOOLEAN NOT NULL DEFAULT true,
      countdown_hours INT NOT NULL DEFAULT 24,
      end_time TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS flash_sale_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id VARCHAR(255) NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
      discount_percent INT NOT NULL DEFAULT 40,
      flash_price NUMERIC(12, 2),
      display_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await query(`
    INSERT INTO flash_sale_settings (id, title, subtitle, is_enabled, countdown_hours)
    VALUES ('default', 'Flash Sales', 'Limited Stock • Special Markdowns', true, 24)
    ON CONFLICT (id) DO NOTHING;
  `);

  // If table is newly created and empty, seed with top active products so storefront remains populated
  const countRes = await query('SELECT COUNT(*) FROM flash_sale_items');
  if (parseInt(countRes.rows[0].count) === 0) {
    await query(`
      INSERT INTO flash_sale_items (product_id, discount_percent, display_order, is_active)
      SELECT id, 40, ROW_NUMBER() OVER (ORDER BY "createdAt" DESC), true
      FROM products
      WHERE status != 'INACTIVE'
      LIMIT 6
      ON CONFLICT DO NOTHING;
    `);
  }
}

export async function GET() {
  try {
    await ensureFlashSaleTables();

    // Fetch settings
    const settingsRes = await query(`
      SELECT 
        id,
        title,
        subtitle,
        is_enabled as "isEnabled",
        countdown_hours as "countdownHours",
        end_time as "endTime",
        updated_at as "updatedAt"
      FROM flash_sale_settings
      WHERE id = 'default'
      LIMIT 1
    `);

    const settings = settingsRes.rows[0] || {
      id: 'default',
      title: 'Flash Sales',
      subtitle: 'Limited Stock • Special Markdowns',
      isEnabled: true,
      countdownHours: 24,
      endTime: null,
    };

    // If flash sales disabled globally, return empty items
    if (!settings.isEnabled) {
      return NextResponse.json({ settings, items: [] });
    }

    // Fetch active flash sale items joined with products
    const itemsRes = await query(`
      SELECT 
        fsi.id,
        fsi.product_id as "productId",
        fsi.discount_percent as "discountPercent",
        fsi.flash_price as "flashPrice",
        fsi.display_order as "displayOrder",
        fsi.is_active as "isActive",
        fsi.created_at as "createdAt",
        fsi.updated_at as "updatedAt",
        p.name as "productName",
        p.sku as "productSku",
        p."sellingPrice" as "productPrice",
        p.size as "productSize",
        p.condition as "productCondition",
        p.quantity as "productQuantity",
        p.status as "productStatus",
        c.name as "categoryName",
        pi.url as "primaryImageUrl",
        COALESCE(
          (SELECT json_agg(json_build_object('id', img.id, 'url', img.url, 'isPrimary', img."isPrimary") ORDER BY img."isPrimary" DESC, img."createdAt" ASC)
           FROM product_images img
           WHERE img."productId" = p.id),
          '[]'::json
        ) as images
      FROM flash_sale_items fsi
      JOIN products p ON fsi.product_id = p.id
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."isPrimary" = true
      WHERE fsi.is_active = true AND p.status != 'INACTIVE'
      ORDER BY fsi.display_order ASC, fsi.created_at ASC
    `);

    // Map items to calculate prices
    const items = itemsRes.rows.map((row) => {
      const discount = row.discountPercent || 40;
      const originalPrice = Number(row.productPrice);
      const computedFlashPrice = row.flashPrice
        ? Number(row.flashPrice)
        : Math.round(originalPrice * (1 - discount / 100));

      return {
        ...row,
        flashPrice: computedFlashPrice,
        originalPrice,
        product: {
          id: row.productId,
          sku: row.productSku,
          name: row.productName,
          sellingPrice: computedFlashPrice,
          originalPrice: originalPrice,
          size: row.productSize,
          condition: row.productCondition,
          quantity: row.productQuantity,
          status: row.productStatus,
          categoryName: row.categoryName,
          primaryImageUrl: row.primaryImageUrl,
          images: row.images,
        },
      };
    });

    return NextResponse.json({ settings, items });
  } catch (error: any) {
    console.error('Error fetching public flash sales:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
  }
}
