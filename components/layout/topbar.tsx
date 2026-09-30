'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Menu,
  X,
  LogOut,
  AlertTriangle,
  CalendarDays,
  Tag,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { User, Role } from '@/lib/types';
import { Badge } from '../ui/badge';

interface TopbarProps {
  user: User | null;
  onOpenMobileMenu?: () => void;
  title?: string;
  subtitle?: string;
}

export function Topbar({
  user,
  onOpenMobileMenu,
  title,
  subtitle,
}: TopbarProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<{
    lowStockCount: number;
    clearanceCount: number;
    hasThursdayPlan: boolean;
    todaySalesCount: number;
  }>({
    lowStockCount: 0,
    clearanceCount: 0,
    hasThursdayPlan: true,
    todaySalesCount: 0,
  });

  React.useEffect(() => {
    // Fetch notification stats
    fetch('/api/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setNotifications(data);
      })
      .catch(() => {});
  }, []);

  const totalAlerts =
    notifications.lowStockCount +
    (notifications.clearanceCount > 0 ? 1 : 0) +
    (notifications.hasThursdayPlan ? 1 : 0);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const roleColors: Record<Role, 'green' | 'orange' | 'gray'> = {
    OWNER: 'green',
    MANAGER: 'orange',
    STAFF: 'gray',
  };

  return (
    <header className="h-16 bg-white border-b border-[#DDE5DF] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-[10px] text-[#17211B] hover:bg-[#F8FAF9] focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {title ? (
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#17211B] leading-none">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#66736B] mt-0.5 hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[#17211B]">
                Good day 👋
              </span>
              <span className="text-xs text-[#66736B] hidden sm:inline">
                • Elegance Thrift Haven
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Currency tag, Notifications, User info */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Naira Currency Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF7EE] border border-[#C5E9CE] text-xs font-semibold text-[#16803C]">
          <span>🇳🇬 NGN (₦)</span>
        </div>

        {/* View Front Shop */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-[#FFF1E2] border border-[#FCD9B6] text-xs font-semibold text-[#D96F0B] hover:bg-[#FFE6CC] transition-colors"
          title="Open Public Customer Storefront in new tab"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Front Shop</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-[10px] text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF9] relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#F28C28] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[14px] shadow-xl border border-[#DDE5DF] p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F4F1]">
                <h4 className="font-bold text-sm text-[#17211B]">
                  Shop Notifications
                </h4>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-[#66736B] hover:text-[#17211B]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-[#F0F4F1] max-h-80 overflow-y-auto">
                {notifications.hasThursdayPlan && (
                  <Link
                    href="/thursday-plan"
                    onClick={() => setShowNotifications(false)}
                    className="flex items-start gap-3 py-3 hover:bg-[#F8FAF9] px-2 rounded-[8px] transition-colors"
                  >
                    <div className="p-2 rounded-full bg-[#FFF1E2] text-[#D96F0B] mt-0.5">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#17211B]">
                        Thursday Purchasing Plan Ready
                      </p>
                      <p className="text-[11px] text-[#66736B] mt-0.5">
                        Recommended purchases calculated for upcoming market day.
                      </p>
                    </div>
                  </Link>
                )}

                {notifications.lowStockCount > 0 && (
                  <Link
                    href="/inventory?status=LOW_STOCK"
                    onClick={() => setShowNotifications(false)}
                    className="flex items-start gap-3 py-3 hover:bg-[#F8FAF9] px-2 rounded-[8px] transition-colors"
                  >
                    <div className="p-2 rounded-full bg-red-50 text-red-600 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#17211B]">
                        {notifications.lowStockCount} Products Low on Stock
                      </p>
                      <p className="text-[11px] text-[#66736B] mt-0.5">
                        Items have reached or dropped below minimum reorder point.
                      </p>
                    </div>
                  </Link>
                )}

                {notifications.clearanceCount > 0 && (
                  <Link
                    href="/clearance"
                    onClick={() => setShowNotifications(false)}
                    className="flex items-start gap-3 py-3 hover:bg-[#F8FAF9] px-2 rounded-[8px] transition-colors"
                  >
                    <div className="p-2 rounded-full bg-[#EAF7EE] text-[#16803C] mt-0.5">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#17211B]">
                        {notifications.clearanceCount} Items for Clearance
                      </p>
                      <p className="text-[11px] text-[#66736B] mt-0.5">
                        Unsold for over 45 days. Review recommended discounts.
                      </p>
                    </div>
                  </Link>
                )}

                <div className="py-2.5 px-2 flex items-center justify-between text-xs text-[#66736B]">
                  <span>Today&apos;s Completed Sales</span>
                  <span className="font-bold text-[#16803C]">
                    {notifications.todaySalesCount} sales
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0F4F1] text-center">
                <Link
                  href="/dashboard"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-[#16803C] hover:underline"
                >
                  View Full Dashboard →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Badge & Profile */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#DDE5DF]">
            <div className="w-8 h-8 rounded-full bg-[#16803C] text-white flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#17211B] leading-tight">
                {user.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant={roleColors[user.role] || 'gray'} className="text-[10px] py-0 px-1.5">
                  {user.role}
                </Badge>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-[8px] text-[#66736B] hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-bold px-3 py-1.5 rounded-[8px] bg-[#16803C] text-white hover:bg-[#0F5C2E]"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
