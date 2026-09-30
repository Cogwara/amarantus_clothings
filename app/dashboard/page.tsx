'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Wallet,
  CalendarDays,
  AlertTriangle,
  ArrowRight,
  Plus,
  Tag,
  Receipt,
  Truck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { formatNaira, formatCompactNaira } from '@/lib/calculations';
import { ReceiptModal } from '@/components/sales/receipt-modal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

export default function DashboardPage() {
  const [user, setUser] = React.useState<any>(null);
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedReceiptSaleId, setSelectedReceiptSaleId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Fetch current user and dashboard data
    Promise.all([
      fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/dashboard').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([userData, dashData]) => {
        if (userData?.user) setUser(userData.user);
        if (dashData) setData(dashData);
      })
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 17) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  return (
    <AppShell
      user={user}
      title="Business Overview"
      subtitle="Real-time shop performance, sales, inventory and market planning"
    >
      <div className="space-y-6">
        {/* Welcome Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-[#DDE5DF] shadow-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#17211B]">
              {getGreeting()} {user?.name ? user.name.split(' ')[0] : 'Merchant'}
            </h2>
            <p className="text-xs sm:text-sm text-[#66736B] mt-0.5">
              Here is how your clothing retail shop is performing today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/sales">
              <Button variant="primary" size="md" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>New Sale (POS)</span>
              </Button>
            </Link>

            <Link href="/purchases">
              <Button variant="secondary" size="md" className="gap-2">
                <Truck className="w-4 h-4" />
                <span>Add Purchase</span>
              </Button>
            </Link>

            <Link href="/expenses">
              <Button variant="outline" size="md" className="gap-2">
                <Wallet className="w-4 h-4 text-[#F28C28]" />
                <span>Add Expense</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Today's Sales */}
          <Card className="border-l-4 border-l-[#16803C]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                  Today&apos;s Sales
                </span>
                <div className="w-9 h-9 rounded-full bg-[#EAF7EE] text-[#16803C] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <h3 className="text-2xl font-bold text-[#17211B]">
                    {formatNaira(data?.metrics?.todaySales || 0)}
                  </h3>
                )}
                <p className="text-xs text-[#66736B] mt-1">
                  {data?.metrics?.todaySalesCount || 0} completed transaction
                  {(data?.metrics?.todaySalesCount || 0) === 1 ? '' : 's'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Today's Profit */}
          <Card className="border-l-4 border-l-[#16803C]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                  Today&apos;s Profit
                </span>
                <div className="w-9 h-9 rounded-full bg-[#EAF7EE] text-[#16803C] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <h3 className="text-2xl font-bold text-[#16803C]">
                    {formatNaira(data?.metrics?.todayProfit || 0)}
                  </h3>
                )}
                <p className="text-xs text-[#66736B] mt-1">
                  Actual gross profit based on purchase cost
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Stock Value */}
          <Card className="border-l-4 border-l-[#F28C28]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                  Stock Value
                </span>
                <div className="w-9 h-9 rounded-full bg-[#FFF1E2] text-[#D96F0B] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <h3 className="text-2xl font-bold text-[#17211B]">
                    {formatCompactNaira(data?.metrics?.stockCostValue || 0)}
                  </h3>
                )}
                <p className="text-xs text-[#66736B] mt-1">
                  {data?.metrics?.totalItemsInStock || 0} pieces in inventory (
                  {formatCompactNaira(data?.metrics?.stockRetailValue || 0)} retail)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Monthly Expenses */}
          <Card className="border-l-4 border-l-[#F28C28]">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#66736B] uppercase tracking-wider">
                  Monthly Expenses
                </span>
                <div className="w-9 h-9 rounded-full bg-[#FFF1E2] text-[#D96F0B] flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                {loading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <h3 className="text-2xl font-bold text-[#17211B]">
                    {formatNaira(data?.metrics?.monthlyExpenses || 0)}
                  </h3>
                )}
                <p className="text-xs text-[#66736B] mt-1">
                  Rent, logistics, packaging & shop utilities
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thursday Plan Alert Banner */}
        {data?.thursdayPlan && (
          <div className="bg-[#EAF7EE] border border-[#C5E9CE] rounded-[12px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-white text-[#16803C] shadow-sm mt-0.5">
                <CalendarDays className="w-5 h-5 text-[#F28C28]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-[#0F5C2E]">
                    Thursday Market Purchasing Plan is {data.thursdayPlan.status}
                  </h4>
                  <Badge variant="green" className="font-semibold">
                    {data.thursdayPlan.status}
                  </Badge>
                </div>
                <p className="text-xs text-[#16803C] mt-1">
                  Engine recommends purchasing approximately{' '}
                  <span className="font-bold text-[#0F5C2E]">
                    {data.thursdayPlan.totalRecommendedPieces} items
                  </span>{' '}
                  across {data.thursdayPlan.categoryCount} categories for optimum 2.5-week coverage.
                </p>
              </div>
            </div>

            <Link href="/thursday-plan" className="shrink-0">
              <Button variant="primary" size="sm" className="gap-1.5 w-full sm:w-auto">
                <span>Open Thursday Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Charts Section: 7-Day Trend & Top Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales & Profit 7-Day Trend */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sales & Profit Trend</CardTitle>
                <p className="text-xs text-[#66736B] mt-0.5">
                  Daily revenue vs. actual gross profit over the last 7 days
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#16803C]"></span>
                  <span className="text-[#66736B]">Sales</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#F28C28]"></span>
                  <span className="text-[#66736B]">Profit</span>
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.salesTrend || []}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16803C" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#16803C" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F28C28" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#F28C28" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#8A968F" fontSize={11} />
                      <YAxis
                        stroke="#8A968F"
                        fontSize={11}
                        tickFormatter={(v) => formatCompactNaira(v)}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatNaira(Number(val)), '']}
                        labelStyle={{ fontWeight: 'bold', color: '#17211B' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        name="Sales"
                        stroke="#16803C"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#salesGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stroke="#F28C28"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#profitGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Selling Categories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Categories</CardTitle>
                <p className="text-xs text-[#66736B] mt-0.5">By units sold (30 days)</p>
              </div>
              <Link href="/reports" className="text-xs text-[#16803C] hover:underline font-semibold">
                Reports →
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {(data?.topCategories || []).map((cat: any, idx: number) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#17211B]">
                          {idx + 1}. {cat.category}
                        </span>
                        <span className="font-bold text-[#16803C]">
                          {cat.unitsSold} pcs • {formatCompactNaira(cat.revenue)}
                        </span>
                      </div>
                      <div className="w-full bg-[#E5EBE7] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#16803C] h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (cat.unitsSold / 30) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!data?.topCategories || data?.topCategories.length === 0) && (
                    <p className="text-xs text-[#66736B] text-center py-6">
                      No category sales recorded yet.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory Intelligence: Fast Moving, Low Stock, Slow Moving */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fast Moving Products */}
          <Card>
            <CardHeader className="pb-3 flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F28C28]" />
                  <span>Fast Moving Items</span>
                </CardTitle>
                <p className="text-xs text-[#66736B]">Highest velocity thrift items</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#F0F4F1]">
                {(data?.fastMoving || []).slice(0, 4).map((p: any) => (
                  <div key={p.id} className="p-3.5 flex items-center gap-3 hover:bg-[#F8FAF9]">
                    <div className="w-11 h-11 rounded-[8px] bg-gray-100 overflow-hidden shrink-0 border border-[#DDE5DF]">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                          CS
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#17211B] truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[#66736B]">
                        Size: {p.size} • Stock: {p.currentStock} left
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="green" className="text-[10px] font-bold">
                        {p.unitsSold} sold
                      </Badge>
                      <p className="text-[11px] font-bold text-[#17211B] mt-0.5">
                        {formatNaira(p.sellingPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="border-red-200">
            <CardHeader className="pb-3 flex items-center justify-between bg-red-50/50">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Low Stock Alerts</span>
                </CardTitle>
                <p className="text-xs text-[#66736B]">At or below minimum reorder point</p>
              </div>
              <Link href="/inventory?status=LOW_STOCK">
                <Badge variant="red">View All</Badge>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#F0F4F1]">
                {(data?.lowStock || []).slice(0, 4).map((p: any) => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#17211B] truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[#66736B]">
                        {p.categoryName} • Size {p.size}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        {p.quantity} pcs left
                      </span>
                      <p className="text-[10px] text-[#66736B] mt-0.5">
                        Min: {p.minimumStock}
                      </p>
                    </div>
                  </div>
                ))}
                {(!data?.lowStock || data?.lowStock.length === 0) && (
                  <p className="p-4 text-xs text-[#66736B] text-center">
                    All products are comfortably above minimum stock!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Slow Moving / Clearance Recommendations */}
          <Card>
            <CardHeader className="pb-3 flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#D96F0B]" />
                  <span>Clearance Needed</span>
                </CardTitle>
                <p className="text-xs text-[#66736B]">&gt; 45 days in stock</p>
              </div>
              <Link href="/clearance">
                <Badge variant="orange">Clearance</Badge>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#F0F4F1]">
                {(data?.slowMoving || []).slice(0, 4).map((p: any) => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#17211B] truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[#D96F0B] font-medium">
                        {p.daysInStock} days in shop • {p.quantity} in stock
                      </p>
                    </div>
                    <Link href={`/clearance`}>
                      <Button variant="outline" size="sm" className="text-[11px] h-7 px-2">
                        Discount →
                      </Button>
                    </Link>
                  </div>
                ))}
                {(!data?.slowMoving || data?.slowMoving.length === 0) && (
                  <p className="p-4 text-xs text-[#66736B] text-center">
                    No stagnant inventory currently detected!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales & Purchases Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Sales</CardTitle>
                <p className="text-xs text-[#66736B]">Customer purchases and receipts</p>
              </div>
              <Link href="/sales" className="text-xs text-[#16803C] hover:underline font-semibold">
                POS Sales →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Sale #</th>
                      <th className="py-2.5 px-3 font-medium">Customer</th>
                      <th className="py-2.5 px-3 font-medium">Method</th>
                      <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                      <th className="py-2.5 px-4 text-center font-medium">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {(data?.recentSales || []).map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#17211B]">
                          {sale.saleNumber}
                        </td>
                        <td className="py-3 px-3 text-[#17211B]">
                          {sale.customerName}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              sale.paymentMethod === 'TRANSFER'
                                ? 'blue'
                                : sale.paymentMethod === 'POS'
                                ? 'orange'
                                : 'green'
                            }
                            className="text-[10px]"
                          >
                            {sale.paymentMethod}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#16803C]">
                          {formatNaira(sale.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedReceiptSaleId(sale.id)}
                            className="p-1 rounded text-[#16803C] hover:bg-[#EAF7EE] transition-colors"
                            title="View Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Market Purchases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Market Purchases</CardTitle>
                <p className="text-xs text-[#66736B]">Bales received from Katangua & Balogun</p>
              </div>
              <Link href="/purchases" className="text-xs text-[#16803C] hover:underline font-semibold">
                Purchasing →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Batch</th>
                      <th className="py-2.5 px-3 font-medium">Supplier / Market</th>
                      <th className="py-2.5 px-3 font-medium text-center">Pieces</th>
                      <th className="py-2.5 px-4 font-medium text-right">Investment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {(data?.recentPurchases || []).map((b: any) => (
                      <tr key={b.id} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#17211B]">
                          {b.batchNumber}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-[#17211B]">{b.supplierName}</p>
                          <p className="text-[10px] text-[#66736B]">{b.market}</p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-[#17211B]">
                            {b.itemCount} items
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#17211B]">
                          {formatNaira(b.totalCost)}
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

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptSaleId)}
        onClose={() => setSelectedReceiptSaleId(null)}
        saleId={selectedReceiptSaleId}
      />
    </AppShell>
  );
}
