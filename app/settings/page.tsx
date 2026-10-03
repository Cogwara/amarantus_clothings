'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Settings as SettingsIcon,
  Store,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Building,
  ShieldAlert,
  Sparkles,
  Zap,
  ExternalLink,
  Plus,
  Trash2,
  Tag,
  Truck,
  Percent,
  TrendingDown,
  Eye,
  Check,
  CreditCard,
} from 'lucide-react';
import { Shop } from '@/lib/types';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [shop, setShop] = React.useState<Shop | null>(null);
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Shop Profile Form
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [currency, setCurrency] = React.useState('NGN');
  const [savingShop, setSavingShop] = React.useState(false);
  const [shopMessage, setShopMessage] = React.useState('');

  // Multiple Bank Accounts Settings
  const [bankAccounts, setBankAccounts] = React.useState<any[]>([]);
  const [addBankModal, setAddBankModal] = React.useState(false);
  const [newBankName, setNewBankName] = React.useState('OPAY');
  const [newAccNumber, setNewAccNumber] = React.useState('');
  const [newAccName, setNewAccName] = React.useState('Amarachi Jane Awa');
  const [newIsPrimary, setNewIsPrimary] = React.useState(false);
  const [submittingBank, setSubmittingBank] = React.useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = React.useState<string | null>(null);
  const [deletingBankId, setDeletingBankId] = React.useState<string | null>(null);
  const [bankMessage, setBankMessage] = React.useState('');

  // Storefront Discount Badges Settings
  const [defaultDiscount, setDefaultDiscount] = React.useState(30);
  const [clearanceDiscount, setClearanceDiscount] = React.useState(50);
  const [showDiscountBadges, setShowDiscountBadges] = React.useState(true);
  const [savingDiscounts, setSavingDiscounts] = React.useState(false);
  const [discountMessage, setDiscountMessage] = React.useState('');

  // Demo Reset
  const [resettingDemo, setResettingDemo] = React.useState(false);
  const [demoMessage, setDemoMessage] = React.useState('');

  // Categories & Suppliers Management (Owner Deletable)
  const [categories, setCategories] = React.useState<any[]>([]);
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatDesc, setNewCatDesc] = React.useState('');
  const [addingCat, setAddingCat] = React.useState(false);

  const [newSupName, setNewSupName] = React.useState('');
  const [newSupPhone, setNewSupPhone] = React.useState('');
  const [newSupMarket, setNewSupMarket] = React.useState('Amarantus Clothings');
  const [addingSup, setAddingSup] = React.useState(false);
  const [configMessage, setConfigMessage] = React.useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, sRes, catRes, supRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/settings').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/categories').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/suppliers').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (sRes?.shop) {
        setShop(sRes.shop);
        setName(sRes.shop.name);
        setPhone(sRes.shop.phone);
        setAddress(sRes.shop.address);
        setCurrency(sRes.shop.currency || 'NGN');
        setDefaultDiscount(typeof sRes.shop.defaultDiscountPercent === 'number' ? sRes.shop.defaultDiscountPercent : 30);
        setClearanceDiscount(typeof sRes.shop.clearanceDiscountPercent === 'number' ? sRes.shop.clearanceDiscountPercent : 50);
        setShowDiscountBadges(sRes.shop.showDiscountBadges !== false);
        setBankAccounts(sRes.bankAccounts || []);
      }
      if (sRes?.stats) setStats(sRes.stats);
      if (catRes?.categories) setCategories(catRes.categories);
      if (supRes?.suppliers) setSuppliers(supRes.suppliers);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() || null }),
      });
      if (res.ok) {
        setNewCatName('');
        setNewCatDesc('');
        setConfigMessage('Category added successfully');
        setTimeout(() => setConfigMessage(''), 3000);
        loadData();
      }
    } finally {
      setAddingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');
      setConfigMessage(data.message || 'Category deleted');
      setTimeout(() => setConfigMessage(''), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting category');
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    setAddingSup(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSupName.trim(),
          phone: newSupPhone.trim() || null,
          market: newSupMarket.trim() || 'Amarantus Clothings',
        }),
      });
      if (res.ok) {
        setNewSupName('');
        setNewSupPhone('');
        setConfigMessage('Supplier added successfully');
        setTimeout(() => setConfigMessage(''), 3000);
        loadData();
      }
    } finally {
      setAddingSup(false);
    }
  };

  const handleDeleteSupplier = async (id: string, supName: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${supName}"?`)) return;
    try {
      const res = await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete supplier');
      setConfigMessage(data.message || 'Supplier deleted');
      setTimeout(() => setConfigMessage(''), 3000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting supplier');
    }
  };

  const handleSaveShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShop(true);
    setShopMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, currency }),
      });

      if (res.ok) {
        setShopMessage('Shop profile updated successfully!');
        setTimeout(() => setShopMessage(''), 3000);
        loadData();
      }
    } finally {
      setSavingShop(false);
    }
  };

  const handleSaveDiscounts = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDiscounts(true);
    setDiscountMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shop?.name || name,
          phone: shop?.phone || phone,
          address: shop?.address || address,
          currency: shop?.currency || currency,
          defaultDiscountPercent: Number(defaultDiscount),
          clearanceDiscountPercent: Number(clearanceDiscount),
          showDiscountBadges,
        }),
      });

      if (res.ok) {
        setDiscountMessage('Storefront discount badge settings saved successfully!');
        setTimeout(() => setDiscountMessage(''), 4000);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update discount settings');
      }
    } finally {
      setSavingDiscounts(false);
    }
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newAccNumber.trim() || !newAccName.trim()) {
      alert('Please fill in bank name, account number, and account name.');
      return;
    }
    setSubmittingBank(true);
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: newBankName.trim(),
          accountNumber: newAccNumber.trim(),
          accountName: newAccName.trim(),
          isPrimary: newIsPrimary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add bank account');
      setBankMessage(`Bank account "${newBankName}" added successfully!`);
      setTimeout(() => setBankMessage(''), 4000);
      setAddBankModal(false);
      setNewAccNumber('');
      setNewIsPrimary(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error adding bank account');
    } finally {
      setSubmittingBank(false);
    }
  };

  const handleSetPrimaryAccount = async (id: string) => {
    setSettingPrimaryId(id);
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPrimary: true }),
      });
      if (res.ok) {
        setBankMessage('Primary bank account updated! This account is now primary for customer transfers.');
        setTimeout(() => setBankMessage(''), 4000);
        loadData();
      }
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const handleDeleteBankAccount = async (acc: any) => {
    if (!confirm(`Are you sure you want to delete ${acc.bankName} (${acc.accountNumber})?`)) return;
    setDeletingBankId(acc.id);
    try {
      const res = await fetch(`/api/bank-accounts?id=${acc.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');
      setBankMessage('Bank account deleted successfully.');
      setTimeout(() => setBankMessage(''), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error deleting bank account');
    } finally {
      setDeletingBankId(null);
    }
  };

  const handleResetDemoData = async () => {
    if (
      !confirm(
        'Are you sure you want to reset demo data? This will re-seed all sample products, transactions, and categories back to pristine default state.'
      )
    ) {
      return;
    }

    setResettingDemo(true);
    setDemoMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_demo' }),
      });

      const data = await res.json();
      if (res.ok) {
        setDemoMessage('Demo data restored successfully!');
        setTimeout(() => setDemoMessage(''), 4000);
        loadData();
      }
    } finally {
      setResettingDemo(false);
    }
  };

  return (
    <AppShell
      user={currentUser}
      title="Store Settings & Configuration"
      subtitle="Shop business profile, receipt details and demo data management"
    >
      <div className="space-y-6 max-w-4xl">
        {/* Shop Profile Settings Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F0F4F1] flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#16803C]" />
              <div>
                <CardTitle>Business Information & Receipts</CardTitle>
                <p className="text-xs text-[#66736B]">
                  Appears on customer sales receipts and social marketing posts
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {shopMessage && (
              <div className="p-3 mb-4 rounded-[10px] bg-[#EAF7EE] border border-[#C5E9CE] text-xs font-bold text-[#16803C] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{shopMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveShopProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Registered Shop Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elegance Thrift Haven"
                  required
                />

                <Input
                  label="Business Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  required
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Physical Shop Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Plot 78 Gbazango Kubwa FCT"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#17211B] mb-1.5">
                    Store Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-[10px] border border-[#DDE5DF] bg-white px-3.5 py-2.5 text-sm text-[#17211B] focus:border-[#16803C] focus:outline-none"
                  >
                    <option value="NGN">Nigerian Naira (₦ - NGN)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={savingShop}
                  className="font-bold"
                >
                  Save Business Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Payment & Multiple Bank Accounts Settings */}
        <Card className="border-[#DDE5DF] overflow-hidden shadow-xs">
          <CardHeader className="pb-3 border-b border-[#F0F4F1] bg-[#F8FAF9]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-[8px] bg-[#16803C] text-white">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Bank Accounts for Customer Payments</CardTitle>
                    <Badge variant="green" className="text-[10px] font-bold">
                      {bankAccounts.length} Active {bankAccounts.length === 1 ? 'Account' : 'Accounts'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#66736B]">
                    Manage multiple bank accounts (e.g. OPAY, Moniepoint, GTBank) displayed to shoppers on checkout
                  </p>
                </div>
              </div>

              {currentUser?.role === 'OWNER' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setNewBankName('OPAY');
                    setNewAccNumber('');
                    setNewAccName(shop?.name || 'Amarachi Jane Awa');
                    setNewIsPrimary(bankAccounts.length === 0);
                    setAddBankModal(true);
                  }}
                  className="gap-1.5 shrink-0 font-bold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Bank Account</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {bankMessage && (
              <div className="p-3.5 bg-[#EAF7EE] border border-[#C5E9CE] rounded-[10px] flex items-center gap-2 text-xs font-bold text-[#16803C] shadow-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bankMessage}</span>
              </div>
            )}

            {/* List of Configured Accounts */}
            {bankAccounts.length === 0 ? (
              <div className="p-6 text-center bg-[#F8FAF9] rounded-[12px] border border-dashed border-[#DDE5DF]">
                <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#17211B]">No Bank Accounts Configured</p>
                <p className="text-[11px] text-[#66736B] mt-0.5">
                  Click &quot;Add Bank Account&quot; to configure accounts for customer payments.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bankAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className={`p-4 rounded-[12px] border transition-all ${
                      acc.isPrimary
                        ? 'bg-[#F4FAF6] border-[#16803C] shadow-xs'
                        : 'bg-white border-[#DDE5DF] hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#17211B]">{acc.bankName}</span>
                        {acc.isPrimary && (
                          <span className="bg-[#16803C] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                            Primary
                          </span>
                        )}
                      </div>

                      {currentUser?.role === 'OWNER' && (
                        <div className="flex items-center gap-1">
                          {!acc.isPrimary && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetPrimaryAccount(acc.id)}
                              isLoading={settingPrimaryId === acc.id}
                              className="text-[10px] h-6 px-2 text-[#16803C] hover:bg-[#EAF7EE]"
                              title="Set this account as the primary transfer account"
                            >
                              Make Primary
                            </Button>
                          )}
                          {bankAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteBankAccount(acc)}
                              disabled={deletingBankId === acc.id}
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors ml-1 cursor-pointer"
                              title="Delete bank account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#66736B]">Account Number:</span>
                        <span className="font-mono font-bold text-sm text-[#16803C] tracking-wider">
                          {acc.accountNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#66736B]">Account Name:</span>
                        <span className="font-semibold text-xs text-[#17211B] truncate max-w-[200px]">
                          {acc.accountName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storefront Hero Banner & Slides */}
        <Card className="border-[#C5E9CE] overflow-hidden shadow-sm">
          <CardHeader className="pb-3 border-b border-[#F0F4F1] bg-[#EAF7EE]/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-[8px] bg-[#16803C] text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-[#16803C]">
                    Storefront Hero Banner Carousel & Action Links
                  </CardTitle>
                  <p className="text-xs text-[#66736B]">
                    Customize rotating banner slides, promotional images, headlines, and call-to-action links
                  </p>
                </div>
              </div>

              <Link href="/hero-slides">
                <Button variant="primary" size="sm" className="font-bold shadow-sm">
                  <span>Manage Slides</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-[#17211B] leading-relaxed max-w-xl">
              Add new promotional slides with custom marketing headlines, discount badges, action buttons, links, and fashion images. Slides rotate automatically on the home page hero section.
            </p>
            <Link href="/hero-slides" className="shrink-0">
              <Button variant="outline" size="sm" className="font-semibold">
                Open Carousel Editor
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Storefront Flash Sales Customizer Card */}
        <Card className="border-[#FCD9B8] overflow-hidden">
          <CardHeader className="bg-[#FFF4EE] p-5 border-b border-[#FCD9B8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#E52E04] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Zap className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-[#9A2105]">Flash Sales Manager</CardTitle>
                    <Badge variant="orange" className="text-[10px] uppercase font-bold">
                      Storefront Deals
                    </Badge>
                  </div>
                  <p className="text-xs text-[#C2410C] mt-0.5">
                    Choose handpicked clothes for the home page Flash Sales banner, customize discount markdowns, and control countdown timers
                  </p>
                </div>
              </div>

              <Link href="/flash-sales">
                <Button variant="secondary" size="sm" className="font-bold shadow-sm bg-[#E52E04] hover:bg-[#C22703]">
                  <span>Manage Flash Sales</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-[#17211B] leading-relaxed max-w-xl">
              Curate exactly which items appear in the Red Flash Sales banner with live ticking countdown clock. Set individual discount rates (-20% to -70%), reorder slots, or pause items anytime.
            </p>
            <Link href="/flash-sales" className="shrink-0">
              <Button variant="outline" size="sm" className="font-semibold border-[#FCD9B8] text-[#D96F0B] hover:bg-[#FFF4EE]">
                Open Deals Editor
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Storefront Discount Badges & Markdowns Customizer Card */}
        <Card className="border-[#FCD9B8] overflow-hidden shadow-xs">
          <CardHeader className="bg-[#FFF8F5] p-5 border-b border-[#FCD9B8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Percent className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-[#9A2105]">
                      Storefront Discount Badges & Markdowns
                    </CardTitle>
                    <Badge variant="orange" className="text-[10px] uppercase font-bold">
                      Item Pricing
                    </Badge>
                  </div>
                  <p className="text-xs text-[#C2410C] mt-0.5">
                    Control the promotional -30% badge and crossed-out original prices shown on clothing items across the front store
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-6">
            {discountMessage && (
              <div className="p-3 rounded-[10px] bg-[#EAF7EE] border border-[#C5E9CE] text-xs font-bold text-[#16803C] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{discountMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveDiscounts} className="space-y-6">
              {/* Interactive Live Preview Box */}
              <div className="p-4 bg-[#FAFBFB] rounded-[12px] border border-[#E5EBE7] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#17211B]">
                    <Eye className="w-4 h-4 text-[#DC2626]" />
                    <span>Live Customer Preview</span>
                  </div>
                  <p className="text-xs text-[#66736B]">
                    This is how item prices and discount badges appear to customers on your front store:
                  </p>
                </div>

                {/* Sample Product Card Mockup */}
                <div className="w-48 bg-white rounded-[12px] border border-[#DDE5DF] p-3 shadow-xs shrink-0 select-none">
                  <div className="relative aspect-square w-full rounded-[8px] bg-gray-100 overflow-hidden mb-2 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400">Sample Dress</span>
                    {showDiscountBadges && defaultDiscount > 0 ? (
                      <div className="absolute top-1.5 right-1.5 bg-[#DC2626] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                        -{defaultDiscount}%
                      </div>
                    ) : (
                      <div className="absolute top-1.5 right-1.5 bg-gray-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        No Badge
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#17211B] truncate">Silk Vintage Gown</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-sm font-extrabold text-[#16803C]">₦5,000</span>
                    {showDiscountBadges && defaultDiscount > 0 && (
                      <span className="text-[10px] text-[#8A968F] line-through">
                        ₦{Math.round(5000 / (1 - defaultDiscount / 100)).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <div className="p-4 bg-white rounded-[12px] border border-[#DDE5DF] flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs text-[#17211B]">
                    Show Discount Badges on Catalog Items
                  </h4>
                  <p className="text-[11px] text-[#66736B] mt-0.5">
                    When enabled, catalog items show your configured discount % and strikethrough price. When disabled, only the direct price is shown.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={showDiscountBadges}
                    onChange={(e) => setShowDiscountBadges(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16803C]"></div>
                </label>
              </div>

              {/* Default Catalog Discount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#17211B]">
                    Catalog Items Discount Percentage
                  </label>
                  <span className="text-xs font-mono font-bold text-[#DC2626]">
                    Current: -{defaultDiscount}% OFF
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDefaultDiscount(0)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all ${
                      defaultDiscount === 0
                        ? 'bg-[#17211B] text-white shadow-xs'
                        : 'bg-white border border-[#DDE5DF] text-[#66736B] hover:border-[#17211B]'
                    }`}
                  >
                    Off (0%)
                  </button>
                  {[10, 15, 20, 25, 30, 35, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDefaultDiscount(pct)}
                      className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all ${
                        defaultDiscount === pct
                          ? 'bg-[#DC2626] text-white shadow-xs scale-105'
                          : 'bg-white border border-[#DDE5DF] text-[#66736B] hover:border-[#DC2626]'
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-[#66736B]">Or enter custom percent:</span>
                  <input
                    type="number"
                    min="0"
                    max="95"
                    value={defaultDiscount}
                    onChange={(e) => setDefaultDiscount(parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-1 bg-white border border-[#DDE5DF] rounded-[8px] text-xs text-[#17211B] font-bold focus:border-[#DC2626] focus:outline-none"
                  />
                  <span className="text-xs text-[#66736B]">%</span>
                </div>
              </div>

              {/* Clearance Deals Discount */}
              <div className="space-y-2 pt-3 border-t border-[#F0F4F1]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#17211B]">
                    Clearance Deals Discount Percentage
                  </label>
                  <span className="text-xs font-mono font-bold text-[#D96F0B]">
                    Clearance: -{clearanceDiscount}% OFF
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[30, 40, 50, 60, 70].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setClearanceDiscount(pct)}
                      className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all ${
                        clearanceDiscount === pct
                          ? 'bg-[#D96F0B] text-white shadow-xs scale-105'
                          : 'bg-white border border-[#DDE5DF] text-[#66736B] hover:border-[#D96F0B]'
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="font-bold bg-[#DC2626] hover:bg-red-700"
                  isLoading={savingDiscounts}
                >
                  <Check className="w-4 h-4 mr-1" />
                  <span>Save Discount Badge Settings</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Categories & Suppliers Management (Owner Deletable) */}
        {configMessage && (
          <div className="p-3 rounded-[10px] bg-[#EAF7EE] border border-[#C5E9CE] text-xs font-bold text-[#16803C] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{configMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#F0F4F1] flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#16803C]" />
                <CardTitle className="text-sm">Clothing Categories ({categories.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {currentUser?.role === 'OWNER' && (
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <Input
                    placeholder="New category name..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-8 text-xs flex-1"
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={addingCat}
                    className="h-8 text-xs shrink-0 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add</span>
                  </Button>
                </form>
              )}

              <div className="divide-y divide-[#F0F4F1] max-h-56 overflow-y-auto pr-1">
                {categories.length === 0 ? (
                  <p className="text-xs text-[#66736B] py-3 text-center">No categories recorded.</p>
                ) : (
                  categories.map((c) => (
                    <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#17211B]">{c.name}</span>
                        <span className="text-[10px] text-[#66736B] ml-1.5">
                          ({c.productCount || 0} active pieces)
                        </span>
                      </div>
                      {currentUser?.role === 'OWNER' && (
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#F0F4F1] flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#16803C]" />
                <CardTitle className="text-sm">Market Suppliers ({suppliers.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {currentUser?.role === 'OWNER' && (
                <form onSubmit={handleAddSupplier} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Supplier name..."
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                      className="h-8 text-xs flex-1"
                      required
                    />
                    <Input
                      placeholder="Market center..."
                      value={newSupMarket}
                      onChange={(e) => setNewSupMarket(e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={addingSup}
                      className="h-8 text-xs shrink-0 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Add</span>
                    </Button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-[#F0F4F1] max-h-56 overflow-y-auto pr-1">
                {suppliers.length === 0 ? (
                  <p className="text-xs text-[#66736B] py-3 text-center">No suppliers recorded.</p>
                ) : (
                  suppliers.map((s) => (
                    <div key={s.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#17211B]">{s.name}</span>
                        <span className="text-[10px] text-[#66736B] ml-1.5">
                          • {s.market} ({s.batchCount || 0} batches)
                        </span>
                      </div>
                      {currentUser?.role === 'OWNER' && (
                        <button
                          onClick={() => handleDeleteSupplier(s.id, s.name)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database & Demo Data Management */}
        <Card className="border-[#FCD9B8]">
          <CardHeader className="pb-3 border-b border-[#F0F4F1] bg-[#FFF1E2]/40">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#D96F0B]" />
              <div>
                <CardTitle className="text-[#D96F0B]">
                  Demo Data Management
                </CardTitle>
                <p className="text-xs text-[#66736B]">
                  Manage demo dataset for used-clothing retail testing
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-[#17211B] leading-relaxed">
              The application comes pre-loaded with realistic Nigerian used-clothing retail sample data (Amarantus Clothings & Balogun market suppliers, thrift dresses, shirts, jackets, recent sales and Thursday purchasing plan). You can reset or re-seed the dataset anytime below.
            </p>

            {/* Current Counts Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-[#F8FAF9] rounded-[10px] border border-[#DDE5DF] text-xs">
              <div>
                <p className="text-[#66736B]">Products:</p>
                <p className="font-bold text-[#17211B] text-sm">
                  {stats?.totalProducts || 0} items
                </p>
              </div>
              <div>
                <p className="text-[#66736B]">Completed Sales:</p>
                <p className="font-bold text-[#17211B] text-sm">
                  {stats?.totalSales || 0} transactions
                </p>
              </div>
              <div>
                <p className="text-[#66736B]">Purchase Batches:</p>
                <p className="font-bold text-[#17211B] text-sm">
                  {stats?.totalBatches || 0} batches
                </p>
              </div>
            </div>

            {demoMessage && (
              <div className="p-3 rounded-[10px] bg-[#EAF7EE] border border-[#C5E9CE] text-xs font-bold text-[#16803C] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{demoMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-[#66736B]">
                <ShieldAlert className="w-4 h-4 text-[#F28C28]" />
                <span>Requires OWNER role permissions</span>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={handleResetDemoData}
                isLoading={resettingDemo}
                className="gap-2 font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Demo Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Bank Account Modal */}
      <Modal
        isOpen={addBankModal}
        onClose={() => setAddBankModal(false)}
        title="Add Shop Bank Account"
        description="Provide account details where customers will transfer order payments"
        maxWidth="md"
      >
        <form onSubmit={handleAddBankAccount} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#17211B] mb-1.5">
              Select or Type Bank Name
            </label>
            <div className="space-y-2">
              <Input
                placeholder="e.g. OPAY, Moniepoint, PalmPay, GTBank"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['OPAY', 'Moniepoint', 'PalmPay', 'Kuda', 'GTBank', 'Zenith Bank', 'Access Bank', 'UBA'].map(
                  (b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setNewBankName(b)}
                      className={`text-[11px] px-2.5 py-1 rounded-[6px] border font-medium transition-all ${
                        newBankName === b
                          ? 'bg-[#16803C] text-white border-[#16803C] shadow-xs'
                          : 'bg-white border-[#DDE5DF] text-[#66736B] hover:border-gray-400'
                      }`}
                    >
                      {b}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div>
            <Input
              label="Account Number (NUBAN)"
              placeholder="e.g. 6542969118"
              value={newAccNumber}
              onChange={(e) => setNewAccNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Account Name"
              placeholder="e.g. Amarachi Jane Awa"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-[#F8FAF9] rounded-[10px] border border-[#DDE5DF] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#17211B] block">Set as Primary Account</span>
              <span className="text-[11px] text-[#66736B] block">
                Primary accounts are highlighted and shown first to customers at checkout.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={newIsPrimary}
                onChange={(e) => setNewIsPrimary(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#16803C]"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F4F1]">
            <Button type="button" variant="outline" size="md" onClick={() => setAddBankModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={submittingBank} className="font-bold">
              Add Account
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
