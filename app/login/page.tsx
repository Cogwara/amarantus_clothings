'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShoppingBag, Lock, Mail, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('owner@clothshop.ng');
  const [password, setPassword] = React.useState('password123');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to sign in');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-[16px] bg-[#16803C] text-white items-center justify-center font-black text-2xl shadow-md">
            CS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17211B] tracking-tight">
            ClothShop Manager
          </h1>
          <p className="text-sm text-[#66736B]">
            Thrift & Used-Clothing Retail Business Platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-[#DDE5DF] shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Sign in to your shop</CardTitle>
            <CardDescription>
              Enter your credentials or choose a quick role below
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {error && (
              <div className="p-3 mb-4 rounded-[10px] bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@clothshop.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold text-base mt-2"
                isLoading={loading}
              >
                Sign In to Dashboard
              </Button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="mt-6 pt-5 border-t border-[#F0F4F1]">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#66736B] mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#F28C28]" />
                <span>Quick Role Demo Logins</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('owner@clothshop.ng')}
                  className={`p-2 rounded-[10px] border text-left transition-all ${
                    email === 'owner@clothshop.ng'
                      ? 'border-[#16803C] bg-[#EAF7EE] text-[#16803C]'
                      : 'border-[#DDE5DF] bg-white hover:bg-[#F8FAF9] text-[#17211B]'
                  }`}
                >
                  <p className="text-xs font-bold">Owner</p>
                  <p className="text-[10px] text-[#66736B]">Amaka (Full)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('manager@clothshop.ng')}
                  className={`p-2 rounded-[10px] border text-left transition-all ${
                    email === 'manager@clothshop.ng'
                      ? 'border-[#F28C28] bg-[#FFF1E2] text-[#D96F0B]'
                      : 'border-[#DDE5DF] bg-white hover:bg-[#F8FAF9] text-[#17211B]'
                  }`}
                >
                  <p className="text-xs font-bold">Manager</p>
                  <p className="text-[10px] text-[#66736B]">Chidi (Ops)</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('staff@clothshop.ng')}
                  className={`p-2 rounded-[10px] border text-left transition-all ${
                    email === 'staff@clothshop.ng'
                      ? 'border-[#16803C] bg-[#EAF7EE] text-[#16803C]'
                      : 'border-[#DDE5DF] bg-white hover:bg-[#F8FAF9] text-[#17211B]'
                  }`}
                >
                  <p className="text-xs font-bold">Staff</p>
                  <p className="text-[10px] text-[#66736B]">Blessing (POS)</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Routine Note */}
        <p className="text-center text-xs text-[#66736B]">
          Elegance Thrift Haven • Katangua Market Branch • Lagos, Nigeria
        </p>
      </div>
    </div>
  );
}
