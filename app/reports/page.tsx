'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  ShoppingBag,
  Wallet,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { formatNaira, formatCompactNaira } from '@/lib/calculations';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
];

const PIE_COLORS = ['#16803C', '#F28C28', '#0F5C2E', '#D96F0B', '#2563EB', '#7C3AED', '#DB2777'];

export default function ReportsPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [period, setPeriod] = React.useState('30days');
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const loadReports = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/reports?period=${period}`).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (rRes) setData(rRes);
    } finally {
      setLoading(false);
    }
  }, [period]);

  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = data?.summary || {
    totalSales: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    grossMarginPercent: 0,
    netMarginPercent: 0,
    totalSalesCount: 0,
    totalUnitsSold: 0,
  };

  return (
    <AppShell
      user={currentUser}
      title="Financial Reports & Profitability"
      subtitle="Accurate Gross Profit (Sales - COGS), Operating Expenses and Net Profit"
    >
      <div className="space-y-6">
        {/* Period Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[12px] border border-[#DDE5DF] shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-all shrink-0 ${
                  period === opt.value
                    ? 'bg-[#16803C] text-white shadow-sm'
                    : 'bg-white text-[#66736B] hover:text-[#17211B] border border-[#DDE5DF]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#66736B]">
            Showing statistics for <strong className="text-[#17211B]">{period.replace('_', ' ')}</strong>
          </div>
        </div>

        {/* 5 Core Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Total Revenue / Sales */}
          <Card className="border-t-4 border-t-[#16803C]">
            <CardContent className="p-4">
              <span className="text-[11px] font-bold text-[#66736B] uppercase tracking-wider">
                Total Revenue
              </span>
              <h3 className="text-xl font-bold text-[#17211B] mt-1.5">
                {formatNaira(summary.totalSales)}
              </h3>
              <p className="text-[11px] text-[#66736B] mt-1">
                {summary.totalSalesCount} sales • {summary.totalUnitsSold} pcs
              </p>
            </CardContent>
          </Card>

          {/* 2. Cost of Goods Sold (COGS) */}
          <Card className="border-t-4 border-t-gray-400">
            <CardContent className="p-4">
              <span className="text-[11px] font-bold text-[#66736B] uppercase tracking-wider">
                Cost of Goods (COGS)
              </span>
              <h3 className="text-xl font-bold text-[#17211B] mt-1.5">
                {formatNaira(summary.costOfGoodsSold)}
              </h3>
              <p className="text-[11px] text-[#66736B] mt-1">
                Actual purchase cost of items sold
              </p>
            </CardContent>
          </Card>

          {/* 3. Gross Profit */}
          <Card className="border-t-4 border-t-[#16803C]">
            <CardContent className="p-4">
              <span className="text-[11px] font-bold text-[#16803C] uppercase tracking-wider">
                Gross Profit
              </span>
              <h3 className="text-xl font-bold text-[#16803C] mt-1.5">
                {formatNaira(summary.grossProfit)}
              </h3>
              <p className="text-[11px] font-bold text-[#16803C] mt-1">
                Margin: {summary.grossMarginPercent}%
              </p>
            </CardContent>
          </Card>

          {/* 4. Operating Expenses */}
          <Card className="border-t-4 border-t-[#F28C28]">
            <CardContent className="p-4">
              <span className="text-[11px] font-bold text-[#D96F0B] uppercase tracking-wider">
                Operating Expenses
              </span>
              <h3 className="text-xl font-bold text-[#17211B] mt-1.5">
                {formatNaira(summary.totalExpenses)}
              </h3>
              <p className="text-[11px] text-[#66736B] mt-1">
                Rent, power, transport & packaging
              </p>
            </CardContent>
          </Card>

          {/* 5. Net Profit */}
          <Card className="border-t-4 border-t-[#0F5C2E] bg-[#EAF7EE]/30">
            <CardContent className="p-4">
              <span className="text-[11px] font-bold text-[#0F5C2E] uppercase tracking-wider">
                Net Profit
              </span>
              <h3
                className={`text-xl font-bold mt-1.5 ${
                  summary.netProfit >= 0 ? 'text-[#16803C]' : 'text-red-600'
                }`}
              >
                {formatNaira(summary.netProfit)}
              </h3>
              <p className="text-[11px] font-bold text-[#0F5C2E] mt-1">
                Net Margin: {summary.netMarginPercent}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts: Sales vs Profit Timeline & Category Revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue vs Profit Timeline (8 cols) */}
          <Card className="lg:col-span-8">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Revenue vs. Cost & Profit Timeline</CardTitle>
                <p className="text-xs text-[#66736B]">
                  Daily breakdown for the selected analysis period
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-72 flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.timeline || []}>
                      <XAxis dataKey="formattedDate" stroke="#8A968F" fontSize={11} />
                      <YAxis
                        stroke="#8A968F"
                        fontSize={11}
                        tickFormatter={(v) => formatCompactNaira(v)}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatNaira(Number(val)), '']}
                      />
                      <Legend />
                      <Bar dataKey="sales" name="Sales Revenue" fill="#16803C" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cogs" name="COGS Cost" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Gross Profit" fill="#F28C28" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Sales Breakdown (4 cols) */}
          <Card className="lg:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle>Category Sales Share</CardTitle>
              <p className="text-xs text-[#66736B]">Revenue by clothing department</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <div className="space-y-4">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.categorySales || []}
                          dataKey="revenue"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={65}
                          fill="#16803C"
                        >
                          {(data?.categorySales || []).map((_: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatNaira(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {(data?.categorySales || []).map((cat: any, i: number) => (
                      <div key={cat.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                          />
                          <span className="text-[#17211B] font-medium truncate">
                            {cat.category}
                          </span>
                        </div>
                        <span className="font-bold text-[#16803C] shrink-0">
                          {formatCompactNaira(cat.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Operating Expenses Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Top Selling Products in Period</CardTitle>
              <p className="text-xs text-[#66736B]">Ranked by total revenue generated</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Product</th>
                      <th className="py-2.5 px-3 font-medium">Category</th>
                      <th className="py-2.5 px-2 text-center font-medium">Sold</th>
                      <th className="py-2.5 px-3 font-medium text-right">Revenue</th>
                      <th className="py-2.5 px-4 font-medium text-right">Gross Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {(data?.topProducts || []).map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-4 font-semibold text-[#17211B]">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-3 text-[#66736B]">{p.categoryName}</td>
                        <td className="py-2.5 px-2 text-center font-bold">{p.unitsSold}</td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {formatNaira(p.revenue)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#16803C]">
                          {formatNaira(p.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Expenses by Category Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Operating Expenses Breakdown</CardTitle>
              <p className="text-xs text-[#66736B]">Overhead costs logged in period</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Category</th>
                      <th className="py-2.5 px-3 font-medium text-center">Entries</th>
                      <th className="py-2.5 px-4 font-medium text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {(data?.categoryExpenses || []).map((e: any) => (
                      <tr key={e.category}>
                        <td className="py-2.5 px-4 font-semibold text-[#17211B]">
                          {e.category.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-center">{e.count}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#D96F0B]">
                          {formatNaira(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
