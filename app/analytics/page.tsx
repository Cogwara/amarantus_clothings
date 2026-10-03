'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Activity,
  Users,
  Search,
  MousePointerClick,
  MessageCircle,
  ExternalLink,
  Eye,
  RefreshCw,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  ShoppingBag,
  Sparkles,
  Flame,
  Copy,
  Check,
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';

interface LiveVisitor {
  id: string;
  visitorId: string;
  ipAddress: string;
  deviceType: string;
  browser: string;
  os: string;
  currentPage: string;
  pageTitle: string;
  referrer: string;
  firstSeenAt: string;
  lastActiveAt: string;
  totalPageviews: number;
  isOnline?: boolean;
  secondsAgo: number;
}

interface TopSearch {
  query: string;
  searchCount: number;
  lastSearchedAt: string;
  avgResults: number;
}

interface TopItem {
  productId: string;
  productName: string;
  productSku: string;
  sellingPrice?: number;
  imageUrl?: string;
  clicksCount: number;
  viewsCount: number;
  whatsappCount: number;
  totalInteractions: number;
  lastInteractedAt: string;
}

interface StorefrontEvent {
  id: string;
  eventType: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  searchQuery?: string;
  searchResultsCount?: number;
  ipAddress: string;
  pageUrl: string;
  pageTitle: string;
  referrer: string;
  metadata?: any;
  createdAt: string;
  secondsAgo: number;
}

interface AnalyticsData {
  liveCount: number;
  liveVisitors: LiveVisitor[];
  todaySummary: {
    uniqueVisitorsToday: number;
    pageviewsToday: number;
    itemClicksToday: number;
    itemViewsToday: number;
    whatsappRedirectsToday: number;
    searchesToday: number;
    addToCartToday: number;
  };
  topSearches: TopSearch[];
  topItems: TopItem[];
  recentEvents: StorefrontEvent[];
  recentVisitors: LiveVisitor[];
}

export default function AnalyticsPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'live' | 'searches' | 'items' | 'events'>('live');
  const [ipFilter, setIpFilter] = React.useState<string>('');
  const [eventFilter, setEventFilter] = React.useState<string>('ALL');
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<Date>(new Date());
  const [copiedIp, setCopiedIp] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setCurrentUser(d.user);
      })
      .catch(() => {});
  }, []);

  const fetchAnalytics = React.useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await fetch('/api/analytics/live', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh interval (every 6 seconds for live presence)
  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAnalytics]);

  const copyIp = (ip: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      setTimeout(() => setCopiedIp(null), 2000);
    }
  };

  const formatSecondsAgo = (seconds: number) => {
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  const getDeviceIcon = (deviceType: string) => {
    const lower = (deviceType || '').toLowerCase();
    if (lower === 'mobile') return <Smartphone className="w-4 h-4 text-emerald-600" />;
    if (lower === 'tablet') return <Tablet className="w-4 h-4 text-blue-600" />;
    return <Monitor className="w-4 h-4 text-gray-600" />;
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'WHATSAPP_REDIRECT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EE] text-[#16803C] border border-[#C5E9CE]">
            <MessageCircle className="w-3 h-3 text-[#16803C]" />
            WhatsApp Redirect
          </span>
        );
      case 'ITEM_CLICK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            <MousePointerClick className="w-3 h-3 text-[#2563EB]" />
            Item Click
          </span>
        );
      case 'ITEM_VIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE]">
            <Eye className="w-3 h-3 text-[#7C3AED]" />
            Modal View
          </span>
        );
      case 'SEARCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF1E2] text-[#D96F0B] border border-[#FED7AA]">
            <Search className="w-3 h-3 text-[#D96F0B]" />
            Search
          </span>
        );
      case 'ADD_TO_CART':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            <ShoppingBag className="w-3 h-3 text-[#059669]" />
            Add to Bag
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
            <Globe className="w-3 h-3" />
            Page View
          </span>
        );
    }
  };

  const summary = data?.todaySummary || {
    uniqueVisitorsToday: 0,
    pageviewsToday: 0,
    itemClicksToday: 0,
    itemViewsToday: 0,
    whatsappRedirectsToday: 0,
    searchesToday: 0,
    addToCartToday: 0,
  };

  const filteredEvents = (data?.recentEvents || []).filter((e) => {
    if (ipFilter && !e.ipAddress.toLowerCase().includes(ipFilter.toLowerCase())) return false;
    if (eventFilter !== 'ALL' && e.eventType !== eventFilter) return false;
    return true;
  });

  const maxSearchCount = Math.max(
    ...(data?.topSearches || []).map((s) => s.searchCount),
    1
  );

  return (
    <AppShell
      user={currentUser}
      title="Live Traffic & Clicks"
      subtitle="Real-time visitor tracking, search trends, item clicks, and WhatsApp redirections"
    >
      <div className="space-y-6">
        {/* Top Control Bar: Live Indicator, Auto-Refresh Toggle, Manual Refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-[14px] border border-[#DDE5DF] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16803C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#16803C]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#17211B]">
                  {data?.liveCount ?? 0} {data?.liveCount === 1 ? 'Shopper' : 'Shoppers'} Online Now
                </h2>
                <Badge variant="green" className="text-[10px]">
                  Real-time
                </Badge>
              </div>
              <p className="text-xs text-[#66736B]">
                Active on storefront in the last 3 minutes • Updated{' '}
                {lastRefreshedAt.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#66736B] cursor-pointer select-none bg-[#F8FAF9] px-3 py-1.5 rounded-[10px] border border-[#EBEFEA]">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#16803C] focus:ring-[#16803C]"
              />
              <span>Live Auto-Sync (6s)</span>
            </label>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Link href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="text-xs font-bold gap-1.5">
                <span>View Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Today's KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Live Shoppers */}
          <div className="bg-gradient-to-br from-[#EAF7EE] to-[#d8f5df] border border-[#BCE8C5] rounded-[14px] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Live Online</span>
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-[#0D5C2E]">{data?.liveCount ?? 0}</div>
            <div className="text-[10px] font-semibold text-emerald-700 mt-1">active right now</div>
          </div>

          {/* 2. Today's Unique Visitors */}
          <div className="bg-white border border-[#DDE5DF] rounded-[14px] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[#66736B] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Visitors</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-[#17211B]">{summary.uniqueVisitorsToday}</div>
            <div className="text-[10px] font-medium text-[#66736B] mt-1">
              {summary.pageviewsToday} pageviews today
            </div>
          </div>

          {/* 3. Item Clicks */}
          <div className="bg-white border border-[#DDE5DF] rounded-[14px] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[#66736B] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Item Clicks</span>
              <MousePointerClick className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-[#17211B]">{summary.itemClicksToday}</div>
            <div className="text-[10px] font-medium text-[#66736B] mt-1">
              {summary.itemViewsToday} detail modal views
            </div>
          </div>

          {/* 4. WhatsApp Redirections */}
          <div className="bg-white border border-[#DDE5DF] rounded-[14px] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[#66736B] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">WhatsApp Clicks</span>
              <MessageCircle className="w-4 h-4 text-[#16803C]" />
            </div>
            <div className="text-2xl font-black text-[#16803C]">
              {summary.whatsappRedirectsToday}
            </div>
            <div className="text-[10px] font-medium text-[#66736B] mt-1">direct inquiries</div>
          </div>

          {/* 5. Customer Searches */}
          <div className="bg-white border border-[#DDE5DF] rounded-[14px] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[#66736B] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Searches</span>
              <Search className="w-4 h-4 text-[#D96F0B]" />
            </div>
            <div className="text-2xl font-black text-[#17211B]">{summary.searchesToday}</div>
            <div className="text-[10px] font-medium text-[#66736B] mt-1">queries entered</div>
          </div>

          {/* 6. Add to Bag */}
          <div className="bg-white border border-[#DDE5DF] rounded-[14px] p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[#66736B] mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Cart Adds</span>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-[#17211B]">{summary.addToCartToday}</div>
            <div className="text-[10px] font-medium text-[#66736B] mt-1">items bagged</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-[#DDE5DF] overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2.5 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'live'
                ? 'bg-[#16803C] text-white shadow-xs'
                : 'text-[#66736B] hover:text-[#17211B] hover:bg-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Live Shoppers ({data?.liveCount ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('searches')}
            className={`px-4 py-2.5 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'searches'
                ? 'bg-[#16803C] text-white shadow-xs'
                : 'text-[#66736B] hover:text-[#17211B] hover:bg-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Top Searches ({data?.topSearches?.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2.5 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'items'
                ? 'bg-[#16803C] text-white shadow-xs'
                : 'text-[#66736B] hover:text-[#17211B] hover:bg-white'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Clicked & Redirected Items ({data?.topItems?.length ?? 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2.5 rounded-[10px] text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'events'
                ? 'bg-[#16803C] text-white shadow-xs'
                : 'text-[#66736B] hover:text-[#17211B] hover:bg-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Activity Stream ({data?.recentEvents?.length ?? 0})</span>
          </button>
        </div>

        {/* TAB 1: Live Shoppers & Presence */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16803C] animate-pulse" />
                    Currently Live Visitors on Storefront
                  </CardTitle>
                  <p className="text-xs text-[#66736B] mt-0.5">
                    Showing shoppers active on your website right now with their client IP, device, and active page
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Window: Last 3 mins
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-xs text-[#66736B]">Loading live shoppers...</div>
                ) : !data?.liveVisitors || data.liveVisitors.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#F0F4F1] flex items-center justify-center mx-auto text-[#66736B]">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-[#17211B]">No shoppers live right now</h4>
                    <p className="text-xs text-[#66736B] max-w-md mx-auto">
                      As soon as a customer opens your store link on their phone or laptop, their IP address,
                      device, and the exact item they are viewing will show up right here in real time.
                    </p>
                    <div className="pt-2">
                      <Link href="/" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5">
                          <span>Open Storefront in New Tab to Test</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAF9] text-[#66736B] font-bold border-y border-[#DDE5DF] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Status & IP Address</th>
                          <th className="py-3 px-4">Device & Browser</th>
                          <th className="py-3 px-4">Current Page / Item Viewed</th>
                          <th className="py-3 px-4">Activity Time</th>
                          <th className="py-3 px-4">Pageviews</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F4F1]">
                        {data.liveVisitors.map((vis) => (
                          <tr key={vis.id} className="hover:bg-[#F8FAF9]/80 transition-colors">
                            {/* Status & IP */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#16803C] animate-pulse shrink-0" />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-[#17211B]">
                                      {vis.ipAddress}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyIp(vis.ipAddress)}
                                      className="text-gray-400 hover:text-gray-700"
                                      title="Copy IP"
                                    >
                                      {copiedIp === vis.ipAddress ? (
                                        <Check className="w-3 h-3 text-[#16803C]" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                  <span className="text-[10px] text-[#8A968F] font-mono">
                                    {vis.visitorId.substring(0, 14)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Device & Browser */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {getDeviceIcon(vis.deviceType)}
                                <div>
                                  <div className="font-semibold text-[#17211B]">
                                    {vis.deviceType} • {vis.os}
                                  </div>
                                  <div className="text-[10px] text-[#66736B]">{vis.browser}</div>
                                </div>
                              </div>
                            </td>

                            {/* Current Page / Item */}
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-medium text-[#17211B] truncate" title={vis.pageTitle}>
                                {vis.pageTitle || 'Amarantus Storefront'}
                              </div>
                              <div
                                className="text-[10px] text-[#66736B] font-mono truncate"
                                title={vis.currentPage}
                              >
                                {vis.currentPage || '/'}
                              </div>
                            </td>

                            {/* Activity Time */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 font-semibold text-[#16803C]">
                                <Clock className="w-3 h-3" />
                                <span>{formatSecondsAgo(vis.secondsAgo)}</span>
                              </div>
                              <span className="text-[10px] text-[#8A968F]">
                                Seen: {new Date(vis.firstSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>

                            {/* Pageviews */}
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="font-mono text-xs">
                                {vis.totalPageviews} {vis.totalPageviews === 1 ? 'view' : 'views'}
                              </Badge>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIpFilter(vis.ipAddress);
                                  setActiveTab('events');
                                }}
                                className="text-[11px] h-7 px-2.5 font-bold"
                              >
                                Filter Events
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Visitors History (Today's Visitors who may have gone offline) */}
            {data?.recentVisitors && data.recentVisitors.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-[#66736B]">
                    Recent Visitors History (Today)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAF9] text-[#66736B] font-bold border-y border-[#DDE5DF] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Visitor & IP</th>
                          <th className="py-2.5 px-4">Device</th>
                          <th className="py-2.5 px-4">Last Page Viewed</th>
                          <th className="py-2.5 px-4">Last Seen</th>
                          <th className="py-2.5 px-4">Total Views</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F4F1]">
                        {data.recentVisitors.slice(0, 15).map((vis) => (
                          <tr key={vis.id} className="hover:bg-[#F8FAF9]/60">
                            <td className="py-2.5 px-4 font-mono font-medium text-[#17211B]">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    vis.isOnline ? 'bg-[#16803C]' : 'bg-gray-300'
                                  }`}
                                />
                                <span>{vis.ipAddress}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-[#66736B]">
                              {vis.deviceType} • {vis.browser}
                            </td>
                            <td className="py-2.5 px-4 text-[#17211B] truncate max-w-xs">
                              {vis.pageTitle || vis.currentPage}
                            </td>
                            <td className="py-2.5 px-4 text-[#66736B]">
                              {formatSecondsAgo(vis.secondsAgo)}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[#66736B]">
                              {vis.totalPageviews}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: Top Customer Searches ("what search people do more") */}
        {activeTab === 'searches' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#D96F0B]" />
                    What Customers Search For Most (Search Demand Analytics)
                  </CardTitle>
                  <p className="text-xs text-[#66736B] mt-0.5">
                    Analyzes customer search queries, total frequency, and whether items were found in catalog
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Ranked by Popularity
                </Badge>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-xs text-[#66736B]">Loading searches...</div>
                ) : !data?.topSearches || data.topSearches.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Search className="w-10 h-10 text-gray-300 mx-auto" />
                    <h4 className="text-sm font-bold text-[#17211B]">No search queries logged yet</h4>
                    <p className="text-xs text-[#66736B] max-w-sm mx-auto">
                      When visitors type queries into the search bar on your Front Shop, they will be aggregated
                      here so you know exactly what items are in demand!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.topSearches.map((s, idx) => {
                      const percent = Math.round((s.searchCount / maxSearchCount) * 100);
                      const isZeroResults = (s.avgResults || 0) === 0;

                      return (
                        <div
                          key={s.query}
                          className="p-3.5 rounded-[12px] bg-white border border-[#DDE5DF] hover:border-[#16803C] transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Rank Pill */}
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                  idx === 0
                                    ? 'bg-[#FFDC73] text-[#7C2D12]'
                                    : idx === 1
                                    ? 'bg-[#E2E8F0] text-[#334155]'
                                    : idx === 2
                                    ? 'bg-[#FED7AA] text-[#9A3412]'
                                    : 'bg-[#F0F4F1] text-[#66736B]'
                                }`}
                              >
                                #{idx + 1}
                              </span>

                              <div>
                                <span className="text-sm font-bold text-[#17211B] capitalize">
                                  &ldquo;{s.query}&rdquo;
                                </span>
                                <div className="text-[11px] text-[#8A968F] flex items-center gap-2 mt-0.5">
                                  <span>
                                    Last searched:{' '}
                                    {new Date(s.lastSearchedAt).toLocaleDateString()}{' '}
                                    {new Date(s.lastSearchedAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              {/* Stock status indicator based on search results */}
                              {isZeroResults ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>0 in catalog (Restock Demand!)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EAF7EE] text-[#16803C] border border-[#C5E9CE]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>~{s.avgResults} found in catalog</span>
                                </span>
                              )}

                              {/* Search count badge */}
                              <Badge variant="green" className="text-xs font-mono font-bold px-2.5 py-1">
                                {s.searchCount} {s.searchCount === 1 ? 'search' : 'searches'}
                              </Badge>
                            </div>
                          </div>

                          {/* Progress bar of relative search frequency */}
                          <div className="w-full bg-[#F0F4F1] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#16803C] to-[#10B981] h-full rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Smart Inventory Advice Callout */}
            <div className="p-4 rounded-[14px] bg-[#FFF9F2] border border-[#FED7AA] flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#D96F0B] shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-[#7C2D12]">
                <strong className="block text-sm font-bold text-[#9A3412] mb-1">
                  💡 Thursday Market Buying Strategy
                </strong>
                Queries marked with &ldquo;0 in catalog&rdquo; represent high customer demand that resulted in
                no matches. You can use these exact search keywords as your shopping list for fresh bales when
                restocking from UK thrift suppliers!
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Clicked & Redirected Items ("track click, IP address, redirection on each item") */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-[#16803C]" />
                    Most Clicked & Redirected Items
                  </CardTitle>
                  <p className="text-xs text-[#66736B] mt-0.5">
                    Track which clothing pieces get the most customer interest and WhatsApp order clicks
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Ranked by Customer Engagement
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-8 text-center text-xs text-[#66736B]">Loading items...</div>
                ) : !data?.topItems || data.topItems.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <MousePointerClick className="w-10 h-10 text-gray-300 mx-auto" />
                    <h4 className="text-sm font-bold text-[#17211B]">No item interactions recorded yet</h4>
                    <p className="text-xs text-[#66736B] max-w-sm mx-auto">
                      When visitors click product cards or click &ldquo;Order on WhatsApp&rdquo;, their engagement
                      will appear here ranked by total interest!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FAF9] text-[#66736B] font-bold border-y border-[#DDE5DF] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Item Details</th>
                          <th className="py-3 px-4">Card Clicks</th>
                          <th className="py-3 px-4">Modal Views</th>
                          <th className="py-3 px-4">WhatsApp Orders</th>
                          <th className="py-3 px-4">Conversion Rate</th>
                          <th className="py-3 px-4 text-right">Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F4F1]">
                        {data.topItems.map((item, idx) => {
                          const redirectRate =
                            item.clicksCount > 0
                              ? Math.round((item.whatsappCount / item.clicksCount) * 100)
                              : 0;

                          return (
                            <tr key={item.productId + idx} className="hover:bg-[#F8FAF9]/80 transition-colors">
                              {/* Item Details */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-[8px] bg-gray-100 overflow-hidden shrink-0 border border-[#DDE5DF]">
                                    {item.imageUrl ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        CS
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[#17211B] line-clamp-1">
                                      {item.productName}
                                    </div>
                                    <div className="text-[10px] text-[#66736B] flex items-center gap-2 mt-0.5">
                                      {item.productSku && (
                                        <span className="font-mono bg-[#F0F4F1] px-1 rounded">
                                          {item.productSku}
                                        </span>
                                      )}
                                      {item.sellingPrice && (
                                        <span className="font-bold text-[#16803C]">
                                          {formatNaira(item.sellingPrice)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Card Clicks */}
                              <td className="py-3 px-4 font-mono font-bold text-[#17211B]">
                                <span className="inline-flex items-center gap-1">
                                  <MousePointerClick className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{item.clicksCount}</span>
                                </span>
                              </td>

                              {/* Modal Views */}
                              <td className="py-3 px-4 font-mono font-bold text-[#17211B]">
                                <span className="inline-flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5 text-purple-500" />
                                  <span>{item.viewsCount}</span>
                                </span>
                              </td>

                              {/* WhatsApp Redirections */}
                              <td className="py-3 px-4 font-mono font-bold text-[#16803C]">
                                <span className="inline-flex items-center gap-1 bg-[#EAF7EE] px-2 py-0.5 rounded-full border border-[#C5E9CE]">
                                  <MessageCircle className="w-3.5 h-3.5 text-[#16803C]" />
                                  <span>{item.whatsappCount}</span>
                                </span>
                              </td>

                              {/* Conversion Rate */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-14 bg-gray-200 h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#16803C] h-full rounded-full"
                                      style={{ width: `${Math.min(redirectRate, 100)}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-xs font-bold text-[#17211B]">
                                    {redirectRate}%
                                  </span>
                                </div>
                              </td>

                              {/* Preview Action */}
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href={`/?item=${encodeURIComponent(item.productSku || item.productId)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="ghost" size="sm" className="h-7 text-xs font-bold">
                                    <span>Store View</span>
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: Live Event Stream (Chronological audit of clicks, IPs, and redirects) */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-[12px] border border-[#DDE5DF]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-[#66736B] shrink-0" />
                <span className="text-xs font-bold text-[#17211B]">Filter Events:</span>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="rounded-[8px] border border-[#DDE5DF] bg-white px-3 py-1.5 text-xs text-[#17211B] focus:border-[#16803C] focus:outline-none font-semibold"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="WHATSAPP_REDIRECT">WhatsApp Redirections</option>
                  <option value="ITEM_CLICK">Item Clicks</option>
                  <option value="ITEM_VIEW">Modal Views</option>
                  <option value="SEARCH">Customer Searches</option>
                  <option value="ADD_TO_CART">Cart Adds</option>
                  <option value="PAGE_VIEW">Page Views</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-72">
                <Input
                  type="text"
                  placeholder="Filter by IP address..."
                  value={ipFilter}
                  onChange={(e) => setIpFilter(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
                {ipFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIpFilter('')}
                    className="h-8 text-xs px-2"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Chronological Event Stream ({filteredEvents.length} events)
                </CardTitle>
                {ipFilter && (
                  <Badge variant="outline" className="text-xs font-mono">
                    Filtered by IP: {ipFilter}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#66736B]">
                    No events matching filter criteria.
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0F4F1] max-h-[650px] overflow-y-auto">
                    {filteredEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3.5 hover:bg-[#F8FAF9] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="shrink-0 mt-0.5 sm:mt-0">{getEventBadge(evt.eventType)}</div>

                          <div>
                            <div className="font-semibold text-[#17211B]">
                              {evt.eventType === 'WHATSAPP_REDIRECT' && (
                                <span>
                                  Customer clicked WhatsApp order for{' '}
                                  <strong className="text-[#16803C]">
                                    {evt.productName || 'General Inquiry'}
                                  </strong>
                                </span>
                              )}
                              {evt.eventType === 'ITEM_CLICK' && (
                                <span>
                                  Clicked product card:{' '}
                                  <strong className="text-[#17211B]">{evt.productName}</strong>
                                </span>
                              )}
                              {evt.eventType === 'ITEM_VIEW' && (
                                <span>
                                  Opened detail modal for:{' '}
                                  <strong className="text-[#17211B]">{evt.productName}</strong>
                                </span>
                              )}
                              {evt.eventType === 'SEARCH' && (
                                <span>
                                  Customer searched for:{' '}
                                  <strong className="text-[#D96F0B]">&ldquo;{evt.searchQuery}&rdquo;</strong>{' '}
                                  ({evt.searchResultsCount ?? 0} items found)
                                </span>
                              )}
                              {evt.eventType === 'ADD_TO_CART' && (
                                <span>
                                  Added to bag:{' '}
                                  <strong className="text-[#059669]">{evt.productName}</strong>
                                </span>
                              )}
                              {evt.eventType === 'PAGE_VIEW' && (
                                <span>Visited page: {evt.pageTitle || evt.pageUrl}</span>
                              )}
                            </div>

                            <div className="text-[11px] text-[#66736B] flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-medium text-[#17211B]">
                                IP: {evt.ipAddress}
                              </span>
                              <span>•</span>
                              <span className="truncate max-w-xs font-mono">{evt.pageUrl}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#8A968F] shrink-0 self-end sm:self-auto font-mono">
                          <Clock className="w-3 h-3 text-[#16803C]" />
                          <span>{formatSecondsAgo(evt.secondsAgo)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
