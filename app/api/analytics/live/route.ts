import { NextResponse } from 'next/server';
import { query, ensureDiscountColumns } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ensureDiscountColumns();

    // 1. Live Active Visitors (active in last 3 minutes)
    const liveVisitorsRes = await query(`
      SELECT 
        id,
        visitor_id as "visitorId",
        ip_address as "ipAddress",
        device_type as "deviceType",
        browser,
        os,
        current_page as "currentPage",
        page_title as "pageTitle",
        referrer,
        first_seen_at as "firstSeenAt",
        last_active_at as "lastActiveAt",
        total_pageviews as "totalPageviews",
        ROUND(EXTRACT(EPOCH FROM (NOW() - last_active_at)))::int as "secondsAgo"
      FROM site_visitors
      WHERE last_active_at >= NOW() - INTERVAL '3 minutes'
      ORDER BY last_active_at DESC
      LIMIT 60
    `);

    // 2. Today's Summary Metrics (Midnight to Now)
    const todaySummaryRes = await query(`
      SELECT 
        COUNT(DISTINCT visitor_id)::int as "uniqueVisitorsToday",
        COUNT(CASE WHEN event_type = 'PAGE_VIEW' THEN 1 END)::int as "pageviewsToday",
        COUNT(CASE WHEN event_type = 'ITEM_CLICK' THEN 1 END)::int as "itemClicksToday",
        COUNT(CASE WHEN event_type = 'ITEM_VIEW' THEN 1 END)::int as "itemViewsToday",
        COUNT(CASE WHEN event_type = 'WHATSAPP_REDIRECT' THEN 1 END)::int as "whatsappRedirectsToday",
        COUNT(CASE WHEN event_type = 'SEARCH' THEN 1 END)::int as "searchesToday",
        COUNT(CASE WHEN event_type = 'ADD_TO_CART' THEN 1 END)::int as "addToCartToday"
      FROM storefront_events
      WHERE created_at >= DATE_TRUNC('day', NOW())
    `);

    // 3. Top Searched Queries ("what search people do more")
    const topSearchesRes = await query(`
      SELECT 
        LOWER(TRIM(search_query)) as query,
        COUNT(*)::int as "searchCount",
        MAX(created_at) as "lastSearchedAt",
        ROUND(AVG(COALESCE(search_results_count, 0)))::int as "avgResults"
      FROM storefront_events
      WHERE event_type = 'SEARCH' AND search_query IS NOT NULL AND TRIM(search_query) != ''
      GROUP BY LOWER(TRIM(search_query))
      ORDER BY "searchCount" DESC, "lastSearchedAt" DESC
      LIMIT 20
    `);

    // 4. Top Clicked & Redirected Items
    const topItemsRes = await query(`
      SELECT 
        COALESCE(e.product_id, 'unknown') as "productId",
        COALESCE(e.product_name, p.name, 'Unknown Item') as "productName",
        COALESCE(e.product_sku, p.sku, '') as "productSku",
        p."sellingPrice" as "sellingPrice",
        (SELECT url FROM product_images pi WHERE pi."productId" = e.product_id AND pi."isPrimary" = true LIMIT 1) as "imageUrl",
        COUNT(CASE WHEN e.event_type = 'ITEM_CLICK' THEN 1 END)::int as "clicksCount",
        COUNT(CASE WHEN e.event_type = 'ITEM_VIEW' THEN 1 END)::int as "viewsCount",
        COUNT(CASE WHEN e.event_type = 'WHATSAPP_REDIRECT' THEN 1 END)::int as "whatsappCount",
        COUNT(*)::int as "totalInteractions",
        MAX(e.created_at) as "lastInteractedAt"
      FROM storefront_events e
      LEFT JOIN products p ON e.product_id = p.id
      WHERE e.event_type IN ('ITEM_CLICK', 'ITEM_VIEW', 'WHATSAPP_REDIRECT')
        AND e.product_id IS NOT NULL
      GROUP BY e.product_id, e.product_name, p.name, e.product_sku, p.sku, p."sellingPrice"
      ORDER BY "totalInteractions" DESC
      LIMIT 15
    `);

    // 5. Recent Activity Live Stream (Last 50 events)
    const recentEventsRes = await query(`
      SELECT 
        e.id,
        e.event_type as "eventType",
        e.product_id as "productId",
        e.product_name as "productName",
        e.product_sku as "productSku",
        e.search_query as "searchQuery",
        e.search_results_count as "searchResultsCount",
        e.ip_address as "ipAddress",
        e.page_url as "pageUrl",
        e.page_title as "pageTitle",
        e.referrer,
        e.metadata,
        e.created_at as "createdAt",
        ROUND(EXTRACT(EPOCH FROM (NOW() - e.created_at)))::int as "secondsAgo"
      FROM storefront_events e
      ORDER BY e.created_at DESC
      LIMIT 50
    `);

    // 6. Recent Visitors History (Today / Recent 30 visitors)
    const recentVisitorsRes = await query(`
      SELECT 
        id,
        visitor_id as "visitorId",
        ip_address as "ipAddress",
        device_type as "deviceType",
        browser,
        os,
        current_page as "currentPage",
        page_title as "pageTitle",
        referrer,
        first_seen_at as "firstSeenAt",
        last_active_at as "lastActiveAt",
        total_pageviews as "totalPageviews",
        CASE WHEN last_active_at >= NOW() - INTERVAL '3 minutes' THEN true ELSE false END as "isOnline",
        ROUND(EXTRACT(EPOCH FROM (NOW() - last_active_at)))::int as "secondsAgo"
      FROM site_visitors
      ORDER BY last_active_at DESC
      LIMIT 40
    `);

    const summary = todaySummaryRes.rows[0] || {
      uniqueVisitorsToday: 0,
      pageviewsToday: 0,
      itemClicksToday: 0,
      itemViewsToday: 0,
      whatsappRedirectsToday: 0,
      searchesToday: 0,
      addToCartToday: 0,
    };

    return NextResponse.json({
      liveCount: liveVisitorsRes.rows.length,
      liveVisitors: liveVisitorsRes.rows,
      todaySummary: summary,
      topSearches: topSearchesRes.rows,
      topItems: topItemsRes.rows,
      recentEvents: recentEventsRes.rows,
      recentVisitors: recentVisitorsRes.rows,
    });
  } catch (error: any) {
    console.error('Error fetching live analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
