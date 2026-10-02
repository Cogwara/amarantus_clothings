import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        c.*,
        COUNT(p.id)::int as "productCount",
        COALESCE(SUM(p.quantity), 0)::int as "totalQuantity"
      FROM categories c
      LEFT JOIN products p ON p."categoryId" = c.id AND p.status != 'INACTIVE'
      WHERE c."isActive" = true
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    return NextResponse.json({ categories: res.rows });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized to add categories' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const { name, description } = parsed.data;
    const categoryId = 'cat_' + Math.random().toString(36).substring(2, 9);

    const insertRes = await query(
      `
      INSERT INTO categories (id, name, description, "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, true, NOW(), NOW())
      RETURNING *
    `,
      [categoryId, name, description || null]
    );

    await logAudit({
      userId: user.id,
      action: 'CREATE_CATEGORY',
      entity: 'Category',
      entityId: categoryId,
      description: `Created category: ${name}`,
    });

    return NextResponse.json({ success: true, category: insertRes.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can delete categories' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const catRes = await query(`SELECT * FROM categories WHERE id = $1`, [id]);
    if (catRes.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    const category = catRes.rows[0];

    const countRes = await query(
      `SELECT COUNT(*)::int as count FROM products WHERE "categoryId" = $1 AND status != 'INACTIVE'`,
      [id]
    );
    const activeProducts = countRes.rows[0].count;

    if (activeProducts > 0) {
      await query(`UPDATE categories SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1`, [id]);
    } else {
      await query(`DELETE FROM purchasing_plan_items WHERE "categoryId" = $1`, [id]);
      await query(`DELETE FROM products WHERE "categoryId" = $1 AND status = 'INACTIVE'`, [id]);
      await query(`DELETE FROM categories WHERE id = $1`, [id]);
    }

    await logAudit({
      userId: user.id,
      action: 'DELETE_CATEGORY',
      entity: 'Category',
      entityId: id,
      description: `Owner deleted category "${category.name}" (Active products: ${activeProducts})`,
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}

