'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
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
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-[16px] bg-[#16803C] text-white items-center justify-center font-black text-2xl shadow-md">
            AC
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17211B] tracking-tight">
            Amarantus Clothings Manager
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
              Enter your credentials below to access your dashboard
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
                Sign In to Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Market Routine Note */}
        <p className="text-center text-xs text-[#66736B]">
          Amarantus Clothings • FCT, Nigeria
        </p>
      </div>
    </div>
  );
}
