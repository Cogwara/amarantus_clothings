'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Zap,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Package,
  Camera,
  Settings as SettingsIcon,
} from 'lucide-react';
import { formatNaira } from '@/lib/calculations';
import { FlashSaleItem, FlashSaleSettings, Product } from '@/lib/types';

const DISCOUNT_PRESETS = [20, 30, 40, 50, 60, 70];

export default function FlashSalesPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [items, setItems] = React.useState<FlashSaleItem[]>([]);
  const [settings, setSettings] = React.useState<FlashSaleSettings>({
    id: 'default',
    title: 'Flash Sales',
    subtitle: 'Limited Stock • Special Markdowns',
    isEnabled: true,
    countdownHours: 24,
    endTime: null,
  });
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Messages
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Add Items Modal
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [pickerSearch, setPickerSearch] = React.useState('');
  const [pickerCategory, setPickerCategory] = React.useState('ALL');
  const [pickerStockOnly, setPickerStockOnly] = React.useState(true);
  const [selectedDiscountForAdd, setSelectedDiscountForAdd] = React.useState(40);
  const [addingProductId, setAddingProductId] = React.useState<string | null>(null);

  // Settings Modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [formTitle, setFormTitle] = React.useState('Flash Sales');
  const [formSubtitle, setFormSubtitle] = React.useState('Limited Stock • Special Markdowns');
  const [formIsEnabled, setFormIsEnabled] = React.useState(true);
  const [formCountdownHours, setFormCountdownHours] = React.useState(24);
  const [formEndTime, setFormEndTime] = React.useState('');
  const [savingSettings, setSavingSettings] = React.useState(false);

  // Quick Inline Edit state
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, fsRes, pRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/flash-sales').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/products').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);

      if (fsRes) {
        if (fsRes.items) setItems(fsRes.items);
        if (fsRes.settings) {
          setSettings(fsRes.settings);
          setFormTitle(fsRes.settings.title || 'Flash Sales');
          setFormSubtitle(fsRes.settings.subtitle || 'Limited Stock • Special Markdowns');
          setFormIsEnabled(fsRes.settings.isEnabled !== false);
          setFormCountdownHours(fsRes.settings.countdownHours || 24);
          if (fsRes.settings.endTime) {
            try {
              const dt = new Date(fsRes.settings.endTime);
              setFormEndTime(dt.toISOString().slice(0, 16));
            } catch {
              setFormEndTime('');
            }
          }
        }
      }

      if (pRes?.products) {
        setAllProducts(pRes.products);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Categories from all products
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set).sort();
  }, [allProducts]);

  // Filtered products for modal picker
  const filteredPickerProducts = React.useMemo(() => {
    return allProducts.filter((p) => {
      if (pickerSearch.trim()) {
        const q = pickerSearch.toLowerCase().trim();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchCat = p.categoryName?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBrand && !matchCat) return false;
      }
      if (pickerCategory !== 'ALL' && p.categoryName !== pickerCategory) return false;
      if (pickerStockOnly && p.quantity <= 0) return false;
      return true;
    });
  }, [allProducts, pickerSearch, pickerCategory, pickerStockOnly]);

  // Set of product IDs currently in flash sales
  const flashSaleProductIds = React.useMemo(() => {
    return new Set(items.map((it) => it.productId));
  }, [items]);

  // Add Item to Flash Sale
  const handleAddItem = async (productId: string, discount: number = selectedDiscountForAdd) => {
    setAddingProductId(productId);
    try {
      const res = await fetch('/api/flash-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          discountPercent: discount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await loadData();
        showToast('Product added to Flash Sales!', 'success');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add item');
      }
    } finally {
      setAddingProductId(null);
    }
  };

  // Remove Item from Flash Sale
  const handleRemoveItem = async (itemId: string, productName?: string) => {
    if (!confirm(`Are you sure you want to remove "${productName || 'this item'}" from Flash Sales?`)) return;

    try {
      const res = await fetch(`/api/flash-sales?id=${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== itemId));
        showToast('Item removed from Flash Sales', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Item Discount
  const handleUpdateDiscount = async (itemId: string, discountPercent: number) => {
    try {
      const res = await fetch('/api/flash-sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemId,
          discountPercent,
        }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id === itemId) {
              const origPrice = Number(it.productPrice);
              const newFlash = Math.round(origPrice * (1 - discountPercent / 100));
              return {
                ...it,
                discountPercent,
                flashPrice: newFlash,
              };
            }
            return it;
          })
        );
        showToast(`Discount updated to ${discountPercent}%`, 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Item Active/Pause
  const handleToggleItemActive = async (itemId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/flash-sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemId,
          isActive: !currentActive,
        }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, isActive: !currentActive } : it))
        );
        showToast(!currentActive ? 'Item enabled on Flash Sales' : 'Item paused', 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Move Item Up / Down
  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    setItems(newItems);

    try {
      await fetch('/api/flash-sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: newItems.map((it) => it.id),
        }),
      });
      showToast('Order updated', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings Modal
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/flash-sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            title: formTitle.trim() || 'Flash Sales',
            subtitle: formSubtitle.trim() || null,
            isEnabled: formIsEnabled,
            countdownHours: formCountdownHours,
            endTime: formEndTime ? new Date(formEndTime).toISOString() : null,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        setIsSettingsModalOpen(false);
        showToast('Flash Sale settings saved!', 'success');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  // Master Toggle Enabled
  const handleToggleGlobalEnabled = async () => {
    const nextState = !settings.isEnabled;
    setSettings((prev) => ({ ...prev, isEnabled: nextState }));
    setFormIsEnabled(nextState);

    try {
      await fetch('/api/flash-sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            isEnabled: nextState,
          },
        }),
      });
      showToast(nextState ? 'Flash Sales enabled on storefront' : 'Flash Sales hidden from storefront', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell
      user={currentUser}
      title="Flash Sales Manager"
      subtitle="Choose exactly which clothing pieces appear in the Flash Sales banner, customize discount markdowns, and control countdown timers"
    >
      <div className="space-y-6">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`px-4 py-3 rounded-[10px] shadow-lg flex items-center gap-2.5 text-xs font-semibold ${
                toastMessage.type === 'success'
                  ? 'bg-[#16803C] text-white'
                  : 'bg-[#17211B] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Top Control Bar & Stats */}
        <div className="bg-[#FFF4EE] border border-[#FCD9B8] rounded-[16px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#E52E04] text-white flex items-center justify-center shrink-0 shadow-md">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-[#9A2105]">
                  {settings.title || 'Flash Sales'}
                </h3>
                <Badge
                  variant={settings.isEnabled ? 'green' : 'gray'}
                  className="text-[10px] font-bold"
                >
                  {settings.isEnabled ? 'LIVE ON STOREFRONT' : 'PAUSED'}
                </Badge>
              </div>
              <p className="text-xs text-[#C2410C] mt-0.5">
                {settings.subtitle || 'Choose handpicked deals to drive high urgency sales'} • {items.length} items configured
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Quick Toggle Live */}
            <button
              onClick={handleToggleGlobalEnabled}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-bold border transition-all flex items-center gap-1.5 ${
                settings.isEnabled
                  ? 'bg-white border-[#C5E9CE] text-[#16803C] hover:bg-[#EAF7EE]'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${settings.isEnabled ? 'bg-[#16803C]' : 'bg-gray-400'}`} />
              <span>{settings.isEnabled ? 'Live on Website' : 'Hidden from Website'}</span>
            </button>

            {/* Settings Modal Button */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 bg-white border-[#DDE5DF] hover:bg-gray-50"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-[#66736B]" />
              <span>Timer & Settings</span>
            </Button>

            {/* Add Products Button */}
            <Button
              variant="primary"
              size="sm"
              className="text-xs h-8 gap-1.5 bg-[#E52E04] hover:bg-[#C22703] font-bold shadow-sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Items to Flash Sales</span>
            </Button>
          </div>
        </div>

        {/* Live Storefront Preview Section (What Customers See) */}
        <Card className="border-[#DDE5DF] overflow-hidden shadow-xs">
          <CardHeader className="bg-[#FAFBFB] py-3 px-5 border-b border-[#F0F4F1] flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#17211B]">
              <Eye className="w-4 h-4 text-[#E52E04]" />
              <span>Live Website Preview: How Customers See Your Flash Sales</span>
            </div>
            <Link
              href="/#catalog"
              target="_blank"
              className="text-xs text-[#16803C] hover:underline font-semibold flex items-center gap-1"
            >
              <span>View Live Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 bg-[#F4F7F5]">
            <div className="bg-white rounded-[16px] border border-[#DDE5DF] overflow-hidden shadow-sm max-w-5xl mx-auto">
              {/* Header Bar */}
              <div className="bg-[#E52E04] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 fill-white text-white" />
                  <h2 className="text-base font-black tracking-wide uppercase">
                    {settings.title || 'Flash Sales'}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white/90 hidden sm:inline">
                    Time Left:
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold">
                    <span className="bg-black/30 px-2 py-0.5 rounded">18h</span>
                    <span>:</span>
                    <span className="bg-black/30 px-2 py-0.5 rounded">42m</span>
                    <span>:</span>
                    <span className="bg-black/30 px-2 py-0.5 rounded">15s</span>
                  </div>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1">
                  <span>See All Deals</span>
                  <span>→</span>
                </span>
              </div>

              {/* Deals Carousel Row */}
              <div className="p-4 overflow-x-auto flex gap-4 no-scrollbar">
                {items.length === 0 ? (
                  <div className="w-full py-8 text-center text-xs text-[#66736B] space-y-2">
                    <p className="font-semibold">No items chosen for Flash Sales yet.</p>
                    <p className="text-[11px]">Click &quot;Add Items to Flash Sales&quot; above to select your clothes!</p>
                  </div>
                ) : (
                  items
                    .filter((it) => it.isActive)
                    .map((it) => {
                      const discount = it.discountPercent || 40;
                      const origPrice = Number(it.productPrice);
                      const flashPrice = it.flashPrice || Math.round(origPrice * (1 - discount / 100));
                      const thumb = it.primaryImageUrl || (it.images && it.images[0]?.url);

                      return (
                        <div
                          key={it.id}
                          className="w-44 shrink-0 bg-white rounded-[12px] border border-[#F0F4F1] p-2.5 flex flex-col justify-between shadow-2xs"
                        >
                          <div className="relative aspect-square w-full rounded-[10px] overflow-hidden bg-gray-100 mb-2">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={it.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Camera className="w-6 h-6" />
                              </div>
                            )}
                            <div className="absolute top-1.5 right-1.5 bg-[#DC2626] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                              -{discount}%
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-[#17211B] line-clamp-1">
                              {it.productName}
                            </h4>
                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-[#17211B]">
                                {formatNaira(flashPrice)}
                              </span>
                              <span className="text-[10px] text-[#8A968F] line-through">
                                {formatNaira(origPrice)}
                              </span>
                            </div>

                            <div className="mt-2 space-y-1">
                              <div className="w-full bg-[#EAEFEA] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#DC2626] h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.max(25, it.productQuantity * 15))}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-[#66736B] block">
                                {it.productQuantity} items left
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Flash Sale Items Manager (Ordering & Discounts) */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#17211B] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E52E04]" />
                <span>Configured Flash Sale Items ({items.length})</span>
              </h3>
              <p className="text-xs text-[#66736B] mt-0.5">
                Items appear in the exact order shown below. Adjust discounts or rearrange positions anytime.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 self-start sm:self-auto"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 text-[#16803C]" />
              <span>Add More Items</span>
            </Button>
          </div>

          {loading && items.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#DDE5DF] rounded-[16px] space-y-2">
              <div className="w-6 h-6 border-2 border-[#E52E04] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#66736B]">Loading flash sale items...</p>
            </div>
          ) : items.length === 0 ? (
            <Card className="border-[#DDE5DF] p-10 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FFF1E2] text-[#E52E04] flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 fill-[#E52E04]" />
                </div>
                <h4 className="font-bold text-sm text-[#17211B]">
                  No Items Currently in Flash Sales
                </h4>
                <p className="text-xs text-[#66736B]">
                  Choose any clothes from your inventory to put them on Flash Sale with custom promotional discounts.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#E52E04] hover:bg-[#C22703] font-bold"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span>Choose Clothes for Flash Sale</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((it, idx) => {
                const discount = it.discountPercent || 40;
                const origPrice = Number(it.productPrice);
                const flashPrice = it.flashPrice || Math.round(origPrice * (1 - discount / 100));
                const thumb = it.primaryImageUrl || (it.images && it.images[0]?.url);

                return (
                  <Card
                    key={it.id}
                    className={`border transition-all overflow-hidden ${
                      it.isActive
                        ? 'border-[#DDE5DF] hover:border-[#E52E04] shadow-xs'
                        : 'border-gray-200 bg-gray-50/60 opacity-70'
                    }`}
                  >
                    <div className="p-4 space-y-3">
                      {/* Product Thumbnail & Basic Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-[10px] bg-gray-100 border border-[#E5EBE7] overflow-hidden shrink-0 relative flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={it.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-6 h-6 text-gray-300" />
                          )}
                          <div className="absolute top-1 left-1 bg-[#E52E04] text-white font-black text-[9px] px-1 rounded shadow-xs">
                            #{idx + 1}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-[#17211B] truncate" title={it.productName}>
                              {it.productName}
                            </h4>
                            <Badge
                              variant={it.isActive ? 'green' : 'gray'}
                              className="text-[9px] px-1.5 py-0"
                            >
                              {it.isActive ? 'Active' : 'Paused'}
                            </Badge>
                          </div>

                          <p className="text-[11px] text-[#66736B] mt-0.5">
                            SKU: <span className="font-mono text-[#17211B]">{it.productSku}</span> • Size: {it.productSize}
                          </p>

                          {/* Pricing Display */}
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-sm font-black text-[#E52E04]">
                              {formatNaira(flashPrice)}
                            </span>
                            <span className="text-xs text-[#8A968F] line-through">
                              {formatNaira(origPrice)}
                            </span>
                            <span className="text-[10px] font-bold text-[#16803C] bg-[#EAF7EE] px-1 rounded">
                              Save {formatNaira(origPrice - flashPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Discount Selector Row */}
                      <div className="pt-2 border-t border-[#F0F4F1] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#17211B]">Markdown Discount:</span>
                          <span className="font-black text-[#E52E04]">-{discount}% OFF</span>
                        </div>

                        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                          {DISCOUNT_PRESETS.map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => handleUpdateDiscount(it.id, pct)}
                              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold transition-all ${
                                discount === pct
                                  ? 'bg-[#E52E04] text-white shadow-xs scale-105'
                                  : 'bg-white border border-[#DDE5DF] text-[#66736B] hover:border-[#E52E04]'
                              }`}
                            >
                              -{pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Item Bottom Actions: Reorder & Delete */}
                      <div className="pt-2 border-t border-[#F0F4F1] flex items-center justify-between gap-2">
                        {/* Order Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(idx, 'UP')}
                            className="p-1 rounded border border-[#DDE5DF] bg-white text-[#66736B] hover:text-[#17211B] disabled:opacity-30 disabled:pointer-events-none"
                            title="Move item earlier"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === items.length - 1}
                            onClick={() => handleMoveOrder(idx, 'DOWN')}
                            className="p-1 rounded border border-[#DDE5DF] bg-white text-[#66736B] hover:text-[#17211B] disabled:opacity-30 disabled:pointer-events-none"
                            title="Move item later"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] text-[#8A968F] font-mono ml-1">
                            Slot #{idx + 1}
                          </span>
                        </div>

                        {/* Active Toggle & Delete */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleItemActive(it.id, it.isActive)}
                            className="text-[11px] text-[#66736B] hover:text-[#17211B] font-medium px-2 py-1 rounded hover:bg-gray-100"
                          >
                            {it.isActive ? 'Pause' : 'Activate'}
                          </button>

                          <Button
                            variant="danger"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => handleRemoveItem(it.id, it.productName)}
                            title="Remove from Flash Sales"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Add Products to Flash Sale */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Clothes to Flash Sales"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <p className="text-xs text-[#66736B]">
              Search and pick any listed items to feature in the Flash Sales banner on your home page.
            </p>

            {/* Default Discount Rate for Add */}
            <div className="bg-[#FFF4EE] p-3 rounded-[10px] border border-[#FCD9B8] flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#9A2105]">
                Discount for Added Items:
              </span>
              <div className="flex items-center gap-1.5">
                {DISCOUNT_PRESETS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setSelectedDiscountForAdd(pct)}
                    className={`px-2.5 py-1 rounded-[6px] text-xs font-bold transition-all ${
                      selectedDiscountForAdd === pct
                        ? 'bg-[#E52E04] text-white shadow-xs'
                        : 'bg-white border border-[#DDE5DF] text-[#66736B] hover:border-[#E52E04]'
                    }`}
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-[#8A968F] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#DDE5DF] rounded-[8px] text-xs text-[#17211B] focus:border-[#E52E04] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={pickerCategory}
                  onChange={(e) => setPickerCategory(e.target.value)}
                  className="w-full py-2 px-2.5 bg-white border border-[#DDE5DF] rounded-[8px] text-xs text-[#17211B] focus:border-[#E52E04] focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center">
                <label className="flex items-center gap-1.5 text-xs text-[#17211B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pickerStockOnly}
                    onChange={(e) => setPickerStockOnly(e.target.checked)}
                    className="rounded text-[#E52E04] focus:ring-[#E52E04]"
                  />
                  <span>In Stock</span>
                </label>
              </div>
            </div>

            {/* Product List */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1 divide-y divide-[#F0F4F1]">
              {filteredPickerProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#66736B]">
                  No products found matching your filter.
                </div>
              ) : (
                filteredPickerProducts.map((p) => {
                  const alreadyIn = flashSaleProductIds.has(p.id);
                  const isAdding = addingProductId === p.id;
                  const thumb = p.primaryImageUrl || (p.images && p.images[0]?.url);
                  const calculatedFlash = Math.round(p.sellingPrice * (1 - selectedDiscountForAdd / 100));

                  return (
                    <div
                      key={p.id}
                      className="pt-2.5 pb-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-[8px] bg-gray-100 border border-[#E5EBE7] overflow-hidden shrink-0 flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera className="w-4 h-4 text-gray-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#17211B] truncate">{p.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-[#66736B] mt-0.5">
                            <span className="font-mono">{p.sku}</span>
                            <span>• Size {p.size}</span>
                            <span>• {p.quantity} in stock</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-bold text-[#17211B]">
                              {formatNaira(p.sellingPrice)}
                            </span>
                            <span className="text-[10px] text-[#E52E04] font-semibold">
                              Flash Price: {formatNaira(calculatedFlash)} (-{selectedDiscountForAdd}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {alreadyIn ? (
                          <div className="flex items-center gap-1 text-[11px] text-[#16803C] font-bold bg-[#EAF7EE] px-2.5 py-1 rounded-full border border-[#C5E9CE]">
                            <Check className="w-3.5 h-3.5" />
                            <span>In Flash Sale</span>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs h-7 gap-1 bg-[#E52E04] hover:bg-[#C22703]"
                            isLoading={isAdding}
                            onClick={() => handleAddItem(p.id, selectedDiscountForAdd)}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Add</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#F0F4F1] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal: Settings & Timer */}
        <Modal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          title="Flash Sale Banner & Countdown Settings"
        >
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#17211B] mb-1">
                Section Headline
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Flash Sales, Weekend Mega Drop"
                className="w-full px-3 py-2 bg-white border border-[#DDE5DF] rounded-[8px] text-xs text-[#17211B] focus:border-[#E52E04] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[#17211B] mb-1">
                Subtitle / Marketing Hook
              </label>
              <input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="e.g. Limited Stock • Grade A First Selection"
                className="w-full px-3 py-2 bg-white border border-[#DDE5DF] rounded-[8px] text-xs text-[#17211B] focus:border-[#E52E04] focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#FAFBFB] rounded-[10px] border border-[#E5EBE7] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#17211B] block">
                    Show Flash Sales on Storefront
                  </span>
                  <span className="text-[11px] text-[#66736B]">
                    Toggle off to temporarily hide the entire Flash Sales banner
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsEnabled}
                  onChange={(e) => setFormIsEnabled(e.target.checked)}
                  className="rounded text-[#E52E04] focus:ring-[#E52E04] h-4 w-4"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17211B] mb-1">
                  Countdown Duration (Hours)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={formCountdownHours}
                    onChange={(e) => setFormCountdownHours(parseInt(e.target.value) || 24)}
                    className="w-24 px-3 py-1.5 bg-white border border-[#DDE5DF] rounded-[8px] text-xs text-[#17211B] focus:border-[#E52E04] focus:outline-none"
                  />
                  <span className="text-[11px] text-[#66736B]">
                    Hours (Live daily rollover clock)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-[#E52E04] hover:bg-[#C22703]"
                isLoading={savingSettings}
              >
                Save Settings
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
