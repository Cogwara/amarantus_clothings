import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';
import { generateSocialCaptions } from '@/lib/calculations';

const createPostSchema = z.object({
  productId: z.string(),
  platform: z.enum(['WHATSAPP', 'INSTAGRAM']),
  caption: z.string().min(5),
  imageUrl: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'READY', 'POSTED']).default('READY'),
});

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        sp.*,
        COALESCE(sp."imageUrl", pi.url) as "imageUrl",
        p.name as "productName",
        p.sku as "productSku",
        p."sellingPrice" as "productPrice",
        p.size as "productSize",
        p.condition as "productCondition",
        c.name as "categoryName"
      FROM social_posts sp
      JOIN products p ON sp."productId" = p.id
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN product_images pi ON pi."productId" = p.id AND pi."isPrimary" = true
      ORDER BY sp."createdAt" DESC
    `);

    return NextResponse.json({ posts: res.rows });
  } catch (error: any) {
    console.error('Error fetching social posts:', error);
    return NextResponse.json({ error: 'Failed to fetch social posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid post data' }, { status: 400 });
    }

    const data = parsed.data;
    const postId = 'post_' + Math.random().toString(36).substring(2, 9);

    const insertRes = await query(
      `
      INSERT INTO social_posts (id, "productId", platform, caption, "imageUrl", status, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `,
      [postId, data.productId, data.platform, data.caption, data.imageUrl || null, data.status]
    );

    await logAudit({
      userId: user.id,
      action: 'CREATE_SOCIAL_POST',
      entity: 'SocialPost',
      entityId: postId,
      description: `Generated ${data.platform} social post for product ${data.productId}`,
    });

    return NextResponse.json({ success: true, post: insertRes.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving social post:', error);
    return NextResponse.json({ error: 'Failed to save social post' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'Post ID and status required' }, { status: 400 });
    }

    const updateRes = await query(
      `UPDATE social_posts SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    return NextResponse.json({ success: true, post: updateRes.rows[0] });
  } catch (error: any) {
    console.error('Error updating social post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized to delete social posts' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const delRes = await query(`DELETE FROM social_posts WHERE id = $1 RETURNING *`, [id]);
    if (delRes.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'DELETE_SOCIAL_POST',
      entity: 'SocialPost',
      entityId: id,
      description: `Deleted prepared ${delRes.rows[0].platform} post for product ${delRes.rows[0].productId}`,
    });

    return NextResponse.json({ success: true, message: 'Social post deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting social post:', error);
    return NextResponse.json({ error: 'Failed to delete social post' }, { status: 500 });
  }
}

