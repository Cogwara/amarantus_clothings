'use client';

// Client-side analytics tracker for storefront presence, item clicks, WhatsApp redirections, and searches

function safeGetStorage(storage: Storage | undefined, key: string): string | null {
  try {
    if (typeof window === 'undefined' || !storage) return null;
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(storage: Storage | undefined, key: string, value: string): void {
  try {
    if (typeof window === 'undefined' || !storage) return;
    storage.setItem(key, value);
  } catch {}
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server_visitor';
  const KEY = 'cs_storefront_visitor_id';
  let id = safeGetStorage(window.localStorage, KEY);
  if (!id) {
    id = 'vis_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    safeSetStorage(window.localStorage, KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  const KEY = 'cs_storefront_session_id';
  let id = safeGetStorage(window.sessionStorage, KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    safeSetStorage(window.sessionStorage, KEY, id);
  }
  return id;
}

export interface TrackEventPayload {
  eventType: 'PAGE_VIEW' | 'ITEM_CLICK' | 'ITEM_VIEW' | 'WHATSAPP_REDIRECT' | 'SEARCH' | 'ADD_TO_CART' | 'SHARE';
  productId?: string;
  productName?: string;
  productSku?: string;
  searchQuery?: string;
  searchResultsCount?: number;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

export async function trackStorefrontEvent(payload: TrackEventPayload): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const currentUrl = payload.pageUrl || window.location.pathname + window.location.search;
    const currentTitle = payload.pageTitle || document.title || 'Storefront';
    const currentReferrer = payload.referrer || document.referrer || '';

    const body = {
      visitorId,
      sessionId,
      eventType: payload.eventType,
      productId: payload.productId,
      productName: payload.productName,
      productSku: payload.productSku,
      searchQuery: payload.searchQuery,
      searchResultsCount: payload.searchResultsCount,
      pageUrl: currentUrl,
      pageTitle: currentTitle,
      referrer: currentReferrer,
      metadata: payload.metadata || {},
    };

    // Use keepalive fetch so request finishes even if page redirects/navigates
    await fetch('/api/public/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch (err) {
    // Fail silently so customer experience is never interrupted
  }
}

export async function sendPresenceHeartbeat(currentPage?: string, pageTitle?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const visitorId = getVisitorId();
    const url = currentPage || window.location.pathname + window.location.search;
    const title = pageTitle || document.title || 'Storefront';

    await fetch('/api/public/analytics/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        currentPage: url,
        pageTitle: title,
      }),
      keepalive: true,
    });
  } catch (err) {}
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastTrackedQuery = '';

export function trackDebouncedSearch(query: string, resultsCount: number, delayMs = 1200): void {
  const trimmed = query.trim();
  if (!trimmed || trimmed === lastTrackedQuery || trimmed.length < 2) return;

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = setTimeout(() => {
    lastTrackedQuery = trimmed;
    trackStorefrontEvent({
      eventType: 'SEARCH',
      searchQuery: trimmed,
      searchResultsCount: resultsCount,
      pageTitle: `Search: "${trimmed}"`,
    });
  }, delayMs);
}
