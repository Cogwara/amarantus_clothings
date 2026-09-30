'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  CalendarDays,
  Menu,
} from 'lucide-react';

interface BottomNavProps {
  onOpenMore: () => void;
}

export function BottomNav({ onOpenMore }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      route: '/dashboard',
    },
    {
      name: 'Sell (POS)',
      icon: ShoppingCart,
      route: '/sales',
      highlight: true,
    },
    {
      name: 'Inventory',
      icon: Package,
      route: '/inventory',
    },
    {
      name: 'Thursday',
      icon: CalendarDays,
      route: '/thursday-plan',
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#DDE5DF] px-2 flex items-center justify-around z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.route || pathname.startsWith(`${item.route}/`);

        if (item.highlight) {
          return (
            <Link
              key={item.route}
              href={item.route}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-[#16803C] text-white ring-4 ring-[#EAF7EE]'
                    : 'bg-[#16803C] text-white'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-[#16803C] mt-1">
                {item.name}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.route}
            href={item.route}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-[8px] transition-colors ${
              isActive ? 'text-[#16803C]' : 'text-[#66736B] hover:text-[#17211B]'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span
              className={`text-[10px] mt-1 ${
                isActive ? 'font-bold' : 'font-medium'
              }`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}

      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-[8px] text-[#66736B] hover:text-[#17211B]"
      >
        <Menu className="w-5 h-5 stroke-2" />
        <span className="text-[10px] mt-1 font-medium">More</span>
      </button>
    </nav>
  );
}
