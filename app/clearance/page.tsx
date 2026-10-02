'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Tag,
  Clock,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import {
  formatNaira,
  calculateDiscountedPrice,
  CLEARANCE_DISCOUNT_TIERS,
} from '@/lib/calculations';
import { Product } from '@/lib/types';

export default function ClearancePage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [clearanceItems, setClearanceItems] = React.useState<any[]>([]);
  const [clearanceSales, setClearanceSales] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Apply Discount Modal
  const [discountModalItem, setDiscountModalItem] = React.useState<any | null>(null);
  const [selectedPercent, setSelectedPercent] = React.useState<number>(20);
  const [customPrice, setCustomPrice] = React.useState<number>(0);
  const [applying, setApplying] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, cRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/clearance').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (cRes?.clearanceItems) setClearanceItems(cRes.clearanceItems);
      if (cRes?.clearanceSales) setClearanceSales(cRes.clearanceSales);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemoveClearance = async (productId: string) => {
    if (!confirm('Remove this product from clearance and return to regular inventory?')) return;
    try {
      const res = await fetch(`/api/clearance?productId=${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove clearance');
      }
      setSuccessMsg(data.message || 'Removed from clearance successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error removing clearance');
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${productName}" from the store?`)) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }
      setSuccessMsg(`Product "${productName}" deleted from inventory.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  const handleOpenDiscountModal = (item: any) => {
    setDiscountModalItem(item);
    setSelectedPercent(20);
    setCustomPrice(calculateDiscountedPrice(item.sellingPrice, 20));
    setError('');
  };

  const handleSelectTier = (pct: number) => {
    setSelectedPercent(pct);
    if (discountModalItem) {
      setCustomPrice(calculateDiscountedPrice(discountModalItem.sellingPrice, pct));
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountModalItem) return;

    setApplying(true);
    setError('');

    try {
      const res = await fetch('/api/clearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: discountModalItem.id,
          discountPercent: selectedPercent,
          newSellingPrice: Number(customPrice),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply clearance');
      }

      setDiscountModalItem(null);
      setSuccessMsg(`Discount applied to ${discountModalItem.name}!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Error updating price');
    } finally {
      setApplying(false);
    }
  };

  return (
    <AppShell
      user={currentUser}
      title="Clearance & Stagnant Stock"
      subtitle="Identify slow-moving clothing items > 45 days and apply discount clearance sales"
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-[#FFF1E2] border border-[#FCD9B8] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white text-[#D96F0B] flex items-center justify-center shrink-0 shadow-sm">
              <Flame className="w-5 h-5 text-[#F28C28]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#D96F0B]">
                Clearance Recommendation Engine
              </h3>
              <p className="text-xs text-[#17211B] mt-1 max-w-2xl leading-relaxed">
                Items unsold for over 45 days tie down working capital. Discounting these pieces frees up cash for Thursday market bales and keeps clothing fresh!
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-[#66736B]">Identified for Clearance:</span>
            <p className="text-xl font-bold text-[#D96F0B]">
              {clearanceItems.length} Products
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-[#EAF7EE] border border-[#C5E9CE] rounded-[10px] text-xs font-bold text-[#16803C] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Clearance Candidates Grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Stagnant Items (&gt; 45 Days in Shop)</CardTitle>
              <p className="text-xs text-[#66736B]">
                Review suggested markdowns: 10%, 15%, 20%, or 30%
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : clearanceItems.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="w-6 h-6 text-[#16803C]" />}
                title="No Stagnant Inventory!"
                description="Excellent work! All items in your store have been received recently or sold promptly."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Clothing Item</th>
                      <th className="py-3 px-3 font-medium">Category / Size</th>
                      <th className="py-3 px-3 font-medium text-center">Days in Stock</th>
                      <th className="py-3 px-3 font-medium text-center">Qty Left</th>
                      <th className="py-3 px-3 font-medium text-right">Current Price</th>
                      <th className="py-3 px-3 font-medium text-right text-[#D96F0B]">
                        Suggested Discount
                      </th>
                      <th className="py-3 px-4 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {clearanceItems.map((item) => {
                      const suggested20 = calculateDiscountedPrice(item.sellingPrice, 20);

                      return (
                        <tr key={item.id} className="hover:bg-[#F8FAF9] transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#17211B] text-sm">{item.name}</p>
                            <p className="text-[10px] text-[#66736B]">
                              SKU: {item.sku} • Cost: {formatNaira(item.costPrice)}
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-[#17211B]">{item.categoryName}</p>
                            <p className="text-[10px] text-[#66736B]">Size: {item.size}</p>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant="orange" className="font-bold">
                              {item.daysInStock} days
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-[#17211B]">
                            {item.quantity} pcs
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-[#17211B]">
                            {formatNaira(item.sellingPrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-[#D96F0B]">
                            {formatNaira(suggested20)} (-20%)
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {item.status === 'CLEARANCE' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveClearance(item.id)}
                                  className="text-xs h-7 px-2.5 gap-1 text-[#16803C] hover:bg-[#EAF7EE]"
                                  title="Revert back to regular catalog"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Remove Clearance</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleOpenDiscountModal(item)}
                                  className="text-xs h-7 px-3 gap-1"
                                >
                                  <Percent className="w-3.5 h-3.5" />
                                  <span>Apply Discount</span>
                                </Button>
                              )}
                              {currentUser?.role === 'OWNER' && (
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(item.id, item.name)}
                                  className="text-xs h-7 px-2"
                                  title="Delete Product from Shop"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
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

        {/* Clearance Sales History */}
        {clearanceSales.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Clearance Sales Tracked</CardTitle>
              <p className="text-xs text-[#66736B]">
                Items sold after clearance markdown
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAF9] text-[#66736B] border-b border-[#DDE5DF]">
                    <tr>
                      <th className="py-2.5 px-4 font-medium">Sale #</th>
                      <th className="py-2.5 px-3 font-medium">Date</th>
                      <th className="py-2.5 px-3 font-medium">Product</th>
                      <th className="py-2.5 px-2 text-center font-medium">Qty</th>
                      <th className="py-2.5 px-3 font-medium text-right">Sold At</th>
                      <th className="py-2.5 px-4 font-medium text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F4F1]">
                    {clearanceSales.map((cs, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-4 font-semibold text-[#17211B]">
                          {cs.saleNumber}
                        </td>
                        <td className="py-2.5 px-3 text-[#66736B]">
                          {new Date(cs.saleDate).toLocaleDateString('en-NG')}
                        </td>
                        <td className="py-2.5 px-3 text-[#17211B]">{cs.productName}</td>
                        <td className="py-2.5 px-2 text-center font-bold">{cs.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {formatNaira(cs.unitSellingPrice)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#16803C]">
                          {formatNaira(cs.profit)}
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

      {/* Apply Discount Modal */}
      <Modal
        isOpen={Boolean(discountModalItem)}
        onClose={() => setDiscountModalItem(null)}
        title={`Apply Clearance: ${discountModalItem?.name}`}
        description="Select suggested markdown tier or specify custom selling price"
        maxWidth="sm"
      >
        <form onSubmit={handleApplyDiscount} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="p-3 bg-[#F8FAF9] rounded-[10px] border border-[#DDE5DF] space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#66736B]">Original Price:</span>
              <span className="font-bold text-[#17211B]">
                {formatNaira(discountModalItem?.sellingPrice || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66736B]">Purchase Cost:</span>
              <span className="text-[#66736B]">
                {formatNaira(discountModalItem?.costPrice || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66736B]">Days in Shop:</span>
              <span className="font-bold text-[#D96F0B]">
                {discountModalItem?.daysInStock} days
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#17211B] mb-2">
              Select Suggested Discount Tier
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CLEARANCE_DISCOUNT_TIERS.map((tier) => (
                <button
                  key={tier.percent}
                  type="button"
                  onClick={() => handleSelectTier(tier.percent)}
                  className={`py-2 px-1 text-center rounded-[8px] border text-xs font-bold transition-all ${
                    selectedPercent === tier.percent
                      ? 'bg-[#F28C28] text-white border-[#F28C28] shadow-sm'
                      : 'bg-white text-[#17211B] border-[#DDE5DF] hover:bg-[#F8FAF9]'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="New Selling Price (₦)"
            type="number"
            min="100"
            step="100"
            value={customPrice || ''}
            onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
            helperText={`Profit remaining: ${formatNaira(
              (customPrice || 0) - (discountModalItem?.costPrice || 0)
            )} per item`}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setDiscountModalItem(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="md"
              isLoading={applying}
            >
              Confirm Clearance Price
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
