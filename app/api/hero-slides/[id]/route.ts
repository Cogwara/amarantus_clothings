import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const updateSlideSchema = z.object({
  title: z.string().min(2, 'Title is required').optional(),
  subtitle: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().min(1, 'Button link is required').optional(),
  imageUrl: z.string().nullable().optional(),
  imageLayout: z.string().optional(),
  bgGradient: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const res = await query(
      `
      SELECT 
        id,
        title,
        subtitle,
        tagline,
        button_text as "buttonText",
        button_link as "buttonLink",
        image_url as "imageUrl",
        COALESCE(image_layout, 'full') as "imageLayout",
        bg_gradient as "bgGradient",
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM hero_slides
      WHERE id = $1
    `,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    return NextResponse.json({ slide: res.rows[0] });
  } catch (error: any) {
    console.error('Error fetching slide:', error);
    return NextResponse.json({ error: 'Failed to fetch slide' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Only owners and managers can edit hero slides' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSlideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // Check if slide exists
    const existingRes = await query('SELECT * FROM hero_slides WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    const current = existingRes.rows[0];

    const updatedRes = await query(
      `
      UPDATE hero_slides
      SET
        title = COALESCE($1, title),
        subtitle = CASE WHEN $2::text IS NOT NULL OR $11::boolean = true THEN $2 ELSE subtitle END,
        tagline = CASE WHEN $3::text IS NOT NULL OR $12::boolean = true THEN $3 ELSE tagline END,
        button_text = COALESCE($4, button_text),
        button_link = COALESCE($5, button_link),
        image_url = CASE WHEN $6::text IS NOT NULL OR $13::boolean = true THEN $6 ELSE image_url END,
        image_layout = COALESCE($14, image_layout),
        bg_gradient = COALESCE($7, bg_gradient),
        display_order = COALESCE($8, display_order),
        is_active = COALESCE($9, is_active),
        updated_at = NOW()
      WHERE id = $10
      RETURNING 
        id,
        title,
        subtitle,
        tagline,
        button_text as "buttonText",
        button_link as "buttonLink",
        image_url as "imageUrl",
        COALESCE(image_layout, 'full') as "imageLayout",
        bg_gradient as "bgGradient",
        display_order as "displayOrder",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
      [
        d.title ?? null,
        d.subtitle ?? null,
        d.tagline ?? null,
        d.buttonText ?? null,
        d.buttonLink ?? null,
        d.imageUrl ?? null,
        d.bgGradient ?? null,
        d.displayOrder ?? null,
        d.isActive ?? null,
        id,
        d.subtitle === null,
        d.tagline === null,
        d.imageUrl === null,
        d.imageLayout ?? null,
      ]
    );

    const updatedSlide = updatedRes.rows[0];

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'HERO_SLIDE',
      entityId: id,
      description: `Updated hero slide: "${updatedSlide.title}"`,
    });

    return NextResponse.json({ slide: updatedSlide });
  } catch (error: any) {
    console.error('Error updating hero slide:', error);
    return NextResponse.json({ error: error.message || 'Failed to update slide' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Only owners and managers can delete hero slides' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const res = await query('DELETE FROM hero_slides WHERE id = $1 RETURNING title', [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    await logAudit({
      userId: user.id,
      action: 'DELETE',
      entity: 'HERO_SLIDE',
      entityId: id,
      description: `Deleted hero slide: "${res.rows[0].title}"`,
    });

    return NextResponse.json({ message: 'Slide deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting hero slide:', error);
    return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 });
  }
}
