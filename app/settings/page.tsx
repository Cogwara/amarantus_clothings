'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  Store,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Building,
  ShieldAlert,
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

  // Demo Reset
  const [resettingDemo, setResettingDemo] = React.useState(false);
  const [demoMessage, setDemoMessage] = React.useState('');

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, sRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/settings').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (uRes?.user) setCurrentUser(uRes.user);
      if (sRes?.shop) {
        setShop(sRes.shop);
        setName(sRes.shop.name);
        setPhone(sRes.shop.phone);
        setAddress(sRes.shop.address);
        setCurrency(sRes.shop.currency || 'NGN');
      }
      if (sRes?.stats) setStats(sRes.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

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
    </AppShell>
  );
}
