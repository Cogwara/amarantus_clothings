'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Wallet,
  BarChart3,
  CalendarDays,
  Tag,
  Share2,
  UserCog,
  Settings,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { Role } from '@/lib/types';
import { Logo } from '@/components/ui/logo';

interface SidebarProps {
  userRole?: Role;
}

export const NAV_ITEMS = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    route: '/dashboard',
    roles: ['OWNER', 'MANAGER', 'STAFF'],
  },
  {
    name: 'Sales (POS)',
    icon: ShoppingCart,
    route: '/sales',
    roles: ['OWNER', 'MANAGER', 'STAFF'],
  },
  {
    name: 'Inventory',
    icon: Package,
    route: '/inventory',
    roles: ['OWNER', 'MANAGER', 'STAFF'],
  },
  {
    name: 'Purchasing',
    icon: Truck,
    route: '/purchases',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    name: 'Customers',
    icon: Users,
    route: '/customers',
    roles: ['OWNER', 'MANAGER', 'STAFF'],
  },
  {
    name: 'Expenses',
    icon: Wallet,
    route: '/expenses',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    name: 'Reports & P&L',
    icon: BarChart3,
    route: '/reports',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    name: 'Thursday Plan',
    icon: CalendarDays,
    route: '/thursday-plan',
    badge: 'Weekly',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    name: 'Clearance',
    icon: Tag,
    route: '/clearance',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    name: 'Social Selling',
    icon: Share2,
    route: '/social-selling',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    name: 'Staff & Roles',
    icon: UserCog,
    route: '/staff',
    roles: ['OWNER'],
  },
  {
    name: 'Hero Slides',
    icon: Sparkles,
    route: '/hero-slides',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    name: 'Settings',
    icon: Settings,
    route: '/settings',
    roles: ['OWNER'],
  },
];

export function Sidebar({ userRole = 'OWNER' }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#DDE5DF] h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[#F0F4F1]">
        <Logo size="sm" subtitle="MANAGER" href="/dashboard" />
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#FFF1E2] text-[#D96F0B]">
          Admin
        </span>
      </div>

      {/* Front Shop Link */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-semibold text-[#16803C] bg-[#EAF7EE] hover:bg-[#d5eedb] border border-[#C5E9CE] transition-all group"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#16803C]" />
            <span>Customer Storefront</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#16803C] opacity-70 group-hover:opacity-100" />
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-[#8A968F]">
          Main Menu
        </div>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.route || pathname.startsWith(`${item.route}/`);

          return (
            <Link
              key={item.route}
              href={item.route}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#16803C] text-white shadow-sm font-semibold'
                  : 'text-[#66736B] hover:text-[#17211B] hover:bg-[#F8FAF9]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-white' : 'text-[#66736B]'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#FFF1E2] text-[#D96F0B]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Thursday Market Fast Banner */}
      <div className="p-4 m-3 rounded-[12px] bg-[#EAF7EE] border border-[#C5E9CE]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#16803C]">
          <Sparkles className="w-4 h-4 text-[#F28C28]" />
          <span>Market Day Routine</span>
        </div>
        <p className="text-[11px] text-[#0F5C2E] mt-1 leading-snug">
          Thursdays are for Amarantus Clothings & Balogun market purchasing. Check your plan!
        </p>
        <Link
          href="/thursday-plan"
          className="inline-block mt-2.5 text-xs font-semibold text-[#16803C] hover:underline"
        >
          View Thursday Plan →
        </Link>
      </div>
    </aside>
  );
}
