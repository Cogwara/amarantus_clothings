import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { visitorId, currentPage, pageTitle } = body;

    if (!visitorId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfIp = request.headers.get('cf-connecting-ip');
    const ipAddress = (forwarded ? forwarded.split(',')[0].trim() : (realIp || cfIp || '127.0.0.1'));

    await query(
      `
      UPDATE site_visitors
      SET
        last_active_at = NOW(),
        current_page = COALESCE($1, current_page),
        page_title = COALESCE($2, page_title),
        ip_address = COALESCE($3, ip_address)
      WHERE id = $4 OR visitor_id = $4
    `,
      [currentPage || null, pageTitle || null, ipAddress, visitorId.trim()]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
