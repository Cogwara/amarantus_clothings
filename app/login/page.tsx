'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const targetUrl = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
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
        router.push(targetUrl);
        router.refresh();
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[#DDE5DF] shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">Sign in to your shop</CardTitle>
        <CardDescription>
          {redirectParam ? (
            <span className="text-[#16803C] font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Login required to access {redirectParam}
            </span>
          ) : (
            'Enter your credentials below to access your dashboard'
          )}
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
            placeholder="name@example.com"
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
            Sign In to Account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-3">
          <Logo variant="stacked" size="lg" subtitle="MANAGER PORTAL" />
          <p className="text-xs text-[#66736B]">
            Thrift & Retail Fashion Business Platform • FCT Abuja
          </p>
        </div>

        {/* Login Card inside Suspense for searchParams */}
        <React.Suspense
          fallback={
            <Card className="border-[#DDE5DF] shadow-lg p-8 text-center text-sm text-gray-400">
              Loading sign-in...
            </Card>
          }
        >
          <LoginForm />
        </React.Suspense>

        {/* Back to Customer Storefront Link */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16803C] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer Storefront</span>
          </Link>

          <p className="text-center text-xs text-[#8A968F]">
            Amarantus Clothings • FCT, Nigeria
          </p>
        </div>
      </div>
    </div>
  );
}
