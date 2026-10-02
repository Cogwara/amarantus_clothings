import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function ensureTableAndSeed() {
  await query(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255),
      tagline VARCHAR(255),
      button_text VARCHAR(100) NOT NULL DEFAULT 'Shop Now',
      button_link VARCHAR(500) NOT NULL DEFAULT '#catalog',
      image_url TEXT,
      bg_gradient VARCHAR(255) DEFAULT 'emerald',
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      image_layout VARCHAR(50) DEFAULT 'full',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await query(`ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS image_layout VARCHAR(50) DEFAULT 'full';`);

  const count = await query('SELECT COUNT(*) FROM hero_slides');
  if (parseInt(count.rows[0].count) === 0) {
    await query(`
      INSERT INTO hero_slides (title, subtitle, tagline, button_text, button_link, image_url, bg_gradient, display_order, is_active)
      VALUES 
      ('Celebrate Nigeria, Celebrate Savings', 'Up to 40% off • UK Grade A Thrift', '★ • NAIJA WE DEY FOR YOU •', 'Shop Now', '#catalog', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', 'emerald', 1, true),
      ('Fresh Thursday Drop, Direct From UK Bales', 'New Season Tops, Dresses & Blazers', '🔥 JUST ARRIVED THIS THURSDAY', 'Explore New Arrivals', '#catalog', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80', 'sunset', 2, true),
      ('Clearance Mega Sale, 50% Off Selected Pieces', 'Limited Quantities • While Stock Lasts', '⚡ FINAL MARKDOWNS', 'Shop Clearance', '#catalog', 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80', 'ruby', 3, true);
    `);
  }
}

export async function GET() {
  try {
    await ensureTableAndSeed();

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
      WHERE is_active = true
      ORDER BY display_order ASC, created_at DESC
    `);

    return NextResponse.json({ slides: res.rows });
  } catch (error: any) {
    console.error('Error fetching public hero slides:', error);
    // Return graceful fallback so the frontend never crashes
    return NextResponse.json({
      slides: [
        {
          id: 'default-1',
          title: 'Celebrate Nigeria, Celebrate Savings',
          subtitle: 'Up to 40% off • UK Grade A Thrift',
          tagline: '★ • NAIJA WE DEY FOR YOU •',
          buttonText: 'Shop Now',
          buttonLink: '#catalog',
          imageUrl:
            'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
          bgGradient: 'emerald',
          displayOrder: 1,
          isActive: true,
        },
      ],
    });
  }
}
