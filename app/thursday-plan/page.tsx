'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  Printer,
  Save,
  Truck,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';
import { PlanStatus } from '@/lib/types';

export default function ThursdayPlanPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [plan, setPlan] = React.useState<any>(null);
  const [items, setItems] = React.useState<any[]>([]);
  const [status, setStatus] = React.useState<PlanStatus>('READY');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const loadPlan = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, pRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/thursday-plan').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (pRes) {
        setPlan(pRes.plan);
        setItems(pRes.items || []);
        if (pRes.plan?.status) setStatus(pRes.plan.status);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleUpdateItem = (categoryId: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((it) =>
        it.categoryId === categoryId ? { ...it, [field]: value } : it
      )
    );
  };

  const handleSavePlan = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/thursday-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          items: items.map((it) => ({
            categoryId: it.categoryId,
            recommendedQuantity: Number(it.recommendedQuantity) || 0,
            actualQuantityPurchased: Number(it.actualQuantityPurchased) || 0,
            notes: it.notes || null,
          })),
        }),
      });

      if (res.ok) {
        setMessage('Plan saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePrintMarketList = () => {
    window.print();
  };

  const totalRecommendedPieces = items.reduce(
    (acc, it) => acc + (Number(it.recommendedQuantity) || 0),
    0
  );
  const totalActualPieces = items.reduce(
    (acc, it) => acc + (Number(it.actualQuantityPurchased) || 0),
    0
  );

  return (
    <AppShell
      user={currentUser}
      title="Thursday Purchasing Engine"
      subtitle="Data-driven stock recommendation engine for weekly market purchasing trips"
    >
      <div className="space-y-6">
        {/* Banner with Thursday Workflow */}
        <div className="bg-[#EAF7EE] border border-[#C5E9CE] rounded-[12px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white text-[#16803C] flex items-center justify-center shrink-0 shadow-sm">
              <CalendarDays className="w-5 h-5 text-[#F28C28]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#0F5C2E]">
                  Thursday Market Purchasing Engine
                </h3>
                <Badge variant="green" className="font-bold">
                  {status}
                </Badge>
              </div>
              <p className="text-xs text-[#16803C] mt-1 max-w-2xl leading-relaxed">
                Calculates required stock from 30-day actual sales data. Use this shopping list at Katangua or Balogun market. You can manually adjust quantities as needed!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={handlePrintMarketList}
              className="gap-2 bg-white"
            >
              <Printer className="w-4 h-4" />
              <span>Print Market List</span>
            </Button>

            <Link href="/purchases">
              <Button variant="secondary" size="md" className="gap-2">
                <Truck className="w-4 h-4" />
                <span>Go to Intake</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Bar & Plan Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[12px] border border-[#DDE5DF] shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#17211B]">Plan Status:</span>
            <div className="flex items-center gap-1.5">
              {(['DRAFT', 'READY', 'COMPLETED'] as PlanStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`px-3 py-1 rounded-[8px] text-xs font-bold transition-colors ${
                    status === st
                      ? 'bg-[#16803C] text-white shadow-sm'
                      : 'bg-[#F8FAF9] text-[#66736B] hover:text-[#17211B] border border-[#DDE5DF]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {message && (
              <span className="text-xs font-bold text-[#16803C] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{message}</span>
              </span>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={handleSavePlan}
              isLoading={saving}
              className="gap-2 font-bold"
            >
              <Save className="w-4 h-4" />
              <span>Save Plan Adjustments</span>
            </Button>
          </div>
        </div>

        {/* Planning Engine Table */}
        <Card id="printable-thursday-plan">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Category Stock & Recommendations</CardTitle>
              <p className="text-xs text-[#66736B]">
                Formula: Recommended Purchase = (Weekly Avg Sales × 2.5) - Current Stock
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-[#17211B]">
                Target Purchase:{' '}
                <strong className="text-[#16803C] text-sm">
                  {totalRecommendedPieces} pcs
                </strong>
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-[8px] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Clothing Category</th>
                      <th className="py-3 px-3 font-medium text-center">Current Stock</th>
                      <th className="py-3 px-3 font-medium text-center">30-Day Sales</th>
                      <th className="py-3 px-3 font-medium text-center">Weekly Avg</th>
                      <th className="py-3 px-3 font-medium text-center bg-[#EAF7EE]/50 text-[#0F5C2E]">
                        Recommended Buy
                      </th>
                      <th className="py-3 px-3 font-medium text-center">Actual Purchased</th>
                      <th className="py-3 px-4 font-medium">Market Trip Notes / Style</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {items.map((it) => (
                      <tr key={it.categoryId} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#17211B]">
                          {it.categoryName}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-[#17211B]">
                          {it.currentStock}
                        </td>
                        <td className="py-3 px-3 text-center text-[#66736B]">
                          {it.unitsSold30Days} pcs
                        </td>
                        <td className="py-3 px-3 text-center text-[#66736B]">
                          {it.averageWeeklySales} /wk
                        </td>
                        <td className="py-3 px-3 text-center bg-[#EAF7EE]/30">
                          <input
                            type="number"
                            min="0"
                            value={it.recommendedQuantity}
                            onChange={(e) =>
                              handleUpdateItem(
                                it.categoryId,
                                'recommendedQuantity',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-16 px-2 py-1 text-center font-bold text-sm text-[#16803C] rounded border border-[#C5E9CE] bg-white focus:outline-none focus:ring-1 focus:ring-[#16803C]"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={it.actualQuantityPurchased || ''}
                            onChange={(e) =>
                              handleUpdateItem(
                                it.categoryId,
                                'actualQuantityPurchased',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-16 px-2 py-1 text-center font-semibold text-xs rounded border border-[#DDE5DF] bg-white focus:outline-none focus:border-[#16803C]"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="e.g. Focus on chiffon, wrap dresses, vintage prints..."
                            value={it.notes || ''}
                            onChange={(e) =>
                              handleUpdateItem(it.categoryId, 'notes', e.target.value)
                            }
                            className="w-full px-2.5 py-1 text-xs rounded border border-[#DDE5DF] bg-white focus:outline-none focus:border-[#16803C]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#F8FAF9] font-bold text-xs border-t border-[#DDE5DF]">
                    <tr>
                      <td className="py-3 px-4 text-[#17211B]">TOTALS</td>
                      <td className="py-3 px-3 text-center">
                        {items.reduce((a, b) => a + (b.currentStock || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {items.reduce((a, b) => a + (b.unitsSold30Days || 0), 0)}
                      </td>
                      <td className="py-3 px-3 text-center">—</td>
                      <td className="py-3 px-3 text-center text-sm text-[#16803C] bg-[#EAF7EE]/50">
                        {totalRecommendedPieces} pieces
                      </td>
                      <td className="py-3 px-3 text-center text-sm text-[#17211B]">
                        {totalActualPieces} pieces
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Step Guidance */}
        <div className="p-4 bg-white rounded-[12px] border border-[#DDE5DF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#66736B]">
            <Info className="w-4 h-4 text-[#16803C]" />
            <span>
              Done with your market trip? Go to <strong>Purchasing</strong> to record the actual bale invoice and prices.
            </span>
          </div>

          <Link href="/purchases">
            <Button variant="primary" size="sm" className="gap-1 font-bold">
              <span>Record Purchase Intake</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
