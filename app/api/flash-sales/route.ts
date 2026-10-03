import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

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

// 1. GET: Fetch flash sale settings and all items
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureFlashSaleTables();

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
      ORDER BY fsi.display_order ASC, fsi.created_at DESC
    `);

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
      };
    });

    return NextResponse.json({ settings, items });
  } catch (error: any) {
    console.error('Error fetching flash sales:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
  }
}

// 2. POST: Add item to flash sales
const addItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  discountPercent: z.number().int().min(5).max(95).default(40),
  flashPrice: z.number().optional().nullable(),
  displayOrder: z.number().int().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Only owners and managers can modify flash sales' }, { status: 403 });
    }

    await ensureFlashSaleTables();

    const body = await request.json();
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid data' }, { status: 400 });
    }

    const { productId, discountPercent, flashPrice, displayOrder } = parsed.data;

    // Check if product exists
    const prodRes = await query('SELECT id, name, "sellingPrice" FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = prodRes.rows[0];

    // Determine display order
    let order = displayOrder;
    if (order === undefined) {
      const maxOrderRes = await query('SELECT COALESCE(MAX(display_order), 0) + 1 as "nextOrder" FROM flash_sale_items');
      order = maxOrderRes.rows[0].nextOrder;
    }

    // Insert or update on conflict
    const insertRes = await query(
      `
      INSERT INTO flash_sale_items (product_id, discount_percent, flash_price, display_order, is_active, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW())
      ON CONFLICT (product_id) DO UPDATE SET
        discount_percent = EXCLUDED.discount_percent,
        flash_price = EXCLUDED.flash_price,
        display_order = EXCLUDED.display_order,
        is_active = true,
        updated_at = NOW()
      RETURNING *
    `,
      [productId, discountPercent, flashPrice || null, order]
    );

    await logAudit({
      userId: user.id,
      action: 'ADD_FLASH_SALE_ITEM',
      entity: 'FlashSaleItem',
      entityId: insertRes.rows[0].id,
      description: `Added "${product.name}" to Flash Sales with ${discountPercent}% discount`,
    });

    return NextResponse.json({ success: true, item: insertRes.rows[0] });
  } catch (error: any) {
    console.error('Error adding flash sale item:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add item to flash sales' }, { status: 500 });
  }
}

// 3. PUT: Update item or settings
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Only owners and managers can update flash sales' }, { status: 403 });
    }

    await ensureFlashSaleTables();

    const body = await request.json();

    // A. Update Settings
    if (body.settings) {
      const s = body.settings;
      const updateRes = await query(
        `
        UPDATE flash_sale_settings
        SET 
          title = COALESCE($1, title),
          subtitle = COALESCE($2, subtitle),
          is_enabled = COALESCE($3, is_enabled),
          countdown_hours = COALESCE($4, countdown_hours),
          end_time = $5,
          updated_at = NOW()
        WHERE id = 'default'
        RETURNING *
      `,
        [s.title, s.subtitle, s.isEnabled, s.countdownHours, s.endTime || null]
      );

      await logAudit({
        userId: user.id,
        action: 'UPDATE_FLASH_SALE_SETTINGS',
        entity: 'FlashSaleSettings',
        entityId: 'default',
        description: `Updated Flash Sale settings (Enabled: ${s.isEnabled})`,
      });

      return NextResponse.json({ success: true, settings: updateRes.rows[0] });
    }

    // B. Reorder bulk items
    if (Array.isArray(body.reorder)) {
      for (let i = 0; i < body.reorder.length; i++) {
        const itemId = body.reorder[i];
        await query('UPDATE flash_sale_items SET display_order = $1 WHERE id = $2', [i + 1, itemId]);
      }
      return NextResponse.json({ success: true });
    }

    // C. Update single item
    const { id, discountPercent, flashPrice, displayOrder, isActive } = body;
    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const updateItemRes = await query(
      `
      UPDATE flash_sale_items
      SET 
        discount_percent = COALESCE($1, discount_percent),
        flash_price = $2,
        display_order = COALESCE($3, display_order),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `,
      [discountPercent, flashPrice === undefined ? null : flashPrice, displayOrder, isActive, id]
    );

    return NextResponse.json({ success: true, item: updateItemRes.rows[0] });
  } catch (error: any) {
    console.error('Error updating flash sales:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update flash sales' }, { status: 500 });
  }
}

// 4. DELETE: Remove item from flash sales
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Only owners and managers can remove flash sale items' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const productId = searchParams.get('productId');

    if (!id && !productId) {
      return NextResponse.json({ error: 'ID or Product ID required' }, { status: 400 });
    }

    let deleteRes;
    if (id) {
      deleteRes = await query('DELETE FROM flash_sale_items WHERE id = $1 RETURNING *', [id]);
    } else {
      deleteRes = await query('DELETE FROM flash_sale_items WHERE product_id = $1 RETURNING *', [productId]);
    }

    if (deleteRes.rows.length === 0) {
      return NextResponse.json({ error: 'Flash sale item not found' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'REMOVE_FLASH_SALE_ITEM',
      entity: 'FlashSaleItem',
      entityId: deleteRes.rows[0].id,
      description: `Removed product ${deleteRes.rows[0].product_id} from Flash Sales`,
    });

    return NextResponse.json({ success: true, deleted: deleteRes.rows[0] });
  } catch (error: any) {
    console.error('Error removing flash sale item:', error);
    return NextResponse.json({ error: error?.message || 'Failed to remove item' }, { status: 500 });
  }
}
