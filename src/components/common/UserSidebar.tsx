'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Star,
  ClipboardList,
  Briefcase,
  History,
  Wallet,
  BarChart3,
  Bell,
  User,
  Settings,
  Sparkles,
  ShieldAlert,
  MessageSquareText,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Assistant', href: '/chat', icon: MessageSquareText },
  { label: 'Markets', href: '/markets', icon: TrendingUp },
  { label: 'Watchlist', href: '/watchlist', icon: Star },
  { label: 'Orders', href: '/orders', icon: ClipboardList },
  { label: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { label: 'Trades', href: '/trades', icon: History },
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const UserSidebar: React.FC<{ isOpen?: boolean }> = ({ isOpen = true }) => {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#1E2638] bg-[#0B0E14] transition-transform duration-200 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-[#1E2638] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          TradeCore
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:bg-[#121722] hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 p-4 border-t border-[#1E2638]">
        <div className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-900/30 to-indigo-900/20 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span>Go Premium</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Unlock advanced charts, real-time analytics and more.
          </p>
          <button className="mt-3 w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 shadow-md">
            Upgrade Now
          </button>
        </div>

        <div className="rounded-xl border border-[#1E2638] bg-[#121722] p-3">
          <div className="text-[11px] font-semibold text-slate-400">Market Status</div>
          <div className="mt-1.5 flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Market Open</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">09:47:32 AM - 11 Aug 2026</div>
        </div>
      </div>
    </aside>
  );
};
