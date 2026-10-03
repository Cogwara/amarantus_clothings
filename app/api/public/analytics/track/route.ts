import { NextResponse } from 'next/server';
import { query, ensureDiscountColumns } from '@/lib/db';

function parseUserAgent(ua: string) {
  let deviceType = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  if (!ua) return { deviceType, os, browser };

  const uaLower = ua.toLowerCase();

  // Device
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) {
    deviceType = 'Mobile';
  } else if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) {
    deviceType = 'Tablet';
  }

  // OS
  if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/windows nt/i.test(ua)) {
    os = 'Windows';
  } else if (/mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser
  if (/chrome|crios/i.test(ua) && !/edg|opr|opera/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/whatsapp/i.test(uaLower)) {
    browser = 'WhatsApp In-App';
  } else if (/instagram/i.test(uaLower)) {
    browser = 'Instagram In-App';
  }

  return { deviceType, os, browser };
}

export async function POST(request: Request) {
  try {
    await ensureDiscountColumns();

    const body = await request.json().catch(() => ({}));
    const {
      visitorId,
      sessionId,
      eventType,
      productId,
      productName,
      productSku,
      searchQuery,
      searchResultsCount,
      pageUrl,
      pageTitle,
      referrer,
      metadata,
    } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType required' }, { status: 400 });
    }

    // Extract Client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfIp = request.headers.get('cf-connecting-ip');
    const ipAddress = (forwarded ? forwarded.split(',')[0].trim() : (realIp || cfIp || '127.0.0.1'));

    const userAgent = request.headers.get('user-agent') || '';
    const { deviceType, os, browser } = parseUserAgent(userAgent);

    const safeVisitorId = visitorId?.trim() || 'vis_' + Math.random().toString(36).substring(2, 11);
    const safeSessionId = sessionId?.trim() || 'sess_' + Math.random().toString(36).substring(2, 11);
    const currentPage = pageUrl || '/';
    const safePageTitle = pageTitle || 'Storefront';
    const safeReferrer = referrer || 'Direct / Storefront';

    // 1. Upsert Visitor in site_visitors for live presence
    await query(
      `
      INSERT INTO site_visitors (
        id, visitor_id, ip_address, user_agent, device_type, browser, os,
        current_page, page_title, referrer, first_seen_at, last_active_at, total_pageviews
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), 1)
      ON CONFLICT (id) DO UPDATE SET
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        device_type = EXCLUDED.device_type,
        browser = EXCLUDED.browser,
        os = EXCLUDED.os,
        current_page = EXCLUDED.current_page,
        page_title = COALESCE(EXCLUDED.page_title, site_visitors.page_title),
        last_active_at = NOW(),
        total_pageviews = site_visitors.total_pageviews + 1
    `,
      [
        safeVisitorId,
        safeVisitorId,
        ipAddress,
        userAgent,
        deviceType,
        browser,
        os,
        currentPage,
        safePageTitle,
        safeReferrer,
      ]
    );

    // 2. Insert event in storefront_events
    const eventId = 'evt_' + Math.random().toString(36).substring(2, 10);
    await query(
      `
      INSERT INTO storefront_events (
        id, event_type, product_id, product_name, product_sku,
        search_query, search_results_count, visitor_id, session_id,
        ip_address, user_agent, page_url, page_title, referrer,
        metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
    `,
      [
        eventId,
        eventType,
        productId || null,
        productName || null,
        productSku || null,
        searchQuery || null,
        typeof searchResultsCount === 'number' ? searchResultsCount : null,
        safeVisitorId,
        safeSessionId,
        ipAddress,
        userAgent,
        currentPage,
        safePageTitle,
        safeReferrer,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    return NextResponse.json({ success: true, eventId });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Tracking error' }, { status: 500 });
  }
}
