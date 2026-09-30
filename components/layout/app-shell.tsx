'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, NAV_ITEMS } from './sidebar';
import { Topbar } from './topbar';
import { BottomNav } from './bottom-nav';
import { User, Role } from '@/lib/types';
import { X, Sparkles, ShoppingBag, ExternalLink } from 'lucide-react';

interface AppShellProps {
  user: User | null;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({
  user,
  children,
  title,
  subtitle,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const userRole: Role = user?.role || 'OWNER';
  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex">
      {/* Desktop Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <Topbar
          user={user}
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Drawer / More Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-slideRight">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#F0F4F1]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#16803C] text-white flex items-center justify-center font-bold text-sm">
                  CS
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17211B]">
                    ClothShop
                  </h3>
                  <p className="text-[11px] text-[#66736B]">Elegance Thrift</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full text-[#66736B] hover:bg-[#F8FAF9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Front Shop Link */}
            <div className="p-3 border-b border-[#F0F4F1]">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-semibold text-[#16803C] bg-[#EAF7EE] border border-[#C5E9CE]"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Customer Storefront</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-[#8A968F]">
                Navigation
              </div>
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.route || pathname.startsWith(`${item.route}/`);

                return (
                  <Link
                    key={item.route}
                    href={item.route}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#16803C] text-white font-semibold'
                        : 'text-[#17211B] hover:bg-[#F8FAF9]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF1E2] text-[#D96F0B]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-[#F0F4F1] bg-[#F8FAF9]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#16803C]">
                <Sparkles className="w-4 h-4 text-[#F28C28]" />
                <span>Nigerian Thrift Retail</span>
              </div>
              <p className="text-[11px] text-[#66736B] mt-0.5">
                Role: <span className="font-bold text-[#17211B]">{userRole}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenMore={() => setMobileMenuOpen(true)} />
    </div>
  );
}
