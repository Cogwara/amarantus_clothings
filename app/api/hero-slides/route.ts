import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, logAudit } from '@/lib/auth';
import { z } from 'zod';

const slideSchema = z.object({
  title: z.string().min(2, 'Title is required (minimum 2 characters)'),
  subtitle: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  buttonText: z.string().default('Shop Now'),
  buttonLink: z.string().min(1, 'Button link is required').default('#catalog'),
  imageUrl: z.string().nullable().optional(),
  imageLayout: z.string().default('full'),
  bgGradient: z.string().default('emerald'),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await query(`ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS image_layout VARCHAR(50) DEFAULT 'full';`);

    const res = await query(`
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
      ORDER BY display_order ASC, created_at DESC
    `);

    return NextResponse.json({ slides: res.rows });
  } catch (error: any) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json({ error: 'Failed to fetch slides' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'OWNER' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Only owners and managers can create hero slides' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = slideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid slide data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const res = await query(
      `
      INSERT INTO hero_slides (
        title,
        subtitle,
        tagline,
        button_text,
        button_link,
        image_url,
        image_layout,
        bg_gradient,
        display_order,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        d.title,
        d.subtitle || null,
        d.tagline || null,
        d.buttonText,
        d.buttonLink,
        d.imageUrl || null,
        d.imageLayout || 'full',
        d.bgGradient,
        d.displayOrder,
        d.isActive,
      ]
    );

    const createdSlide = res.rows[0];

    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entity: 'HERO_SLIDE',
      entityId: createdSlide.id,
      description: `Created hero slide: "${createdSlide.title}" with link "${createdSlide.buttonLink}"`,
    });

    return NextResponse.json({ slide: createdSlide }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating hero slide:', error);
    return NextResponse.json({ error: error.message || 'Failed to create slide' }, { status: 500 });
  }
}
