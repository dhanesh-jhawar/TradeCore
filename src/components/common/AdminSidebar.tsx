'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Zap,
  BookOpen,
  ClipboardList,
  History,
  Building2,
  Users,
  BarChart3,
  Microscope,
  RotateCcw,
  Activity,
  FileText,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Live Exchange', href: '/admin/exchange', icon: Zap },
  { label: 'Order Book', href: '/admin/order-book', icon: BookOpen },
  { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
  { label: 'Trades', href: '/admin/trades', icon: History },
  { label: 'Companies', href: '/admin/companies', icon: Building2 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Market Analytics', href: '/admin/market-analytics', icon: BarChart3 },
  { label: 'Company Analysis', href: '/admin/company-analysis', icon: Microscope },
  { label: 'Replay Engine', href: '/admin/replay', icon: RotateCcw },
  { label: 'System Monitor', href: '/admin/system', icon: Activity },
  { label: 'Event Logs', href: '/admin/logs', icon: FileText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export const AdminSidebar: React.FC<{ isOpen?: boolean }> = ({ isOpen = true }) => {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#1E2638] bg-[#0B0E14] transition-transform duration-200 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-[#1E2638] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <Link href="/admin" className="text-lg font-bold tracking-tight text-white">
            TradeCore
          </Link>
          <span className="ml-2 rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-400">
            ADMIN
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-purple-600 font-semibold text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:bg-[#121722] hover:text-white'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1E2638]">
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
          <div className="text-[11px] font-semibold text-purple-300">Exchange Engine Status</div>
          <div className="mt-1 flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Matching Engine Active</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">0ms Latency • 100 Companies</div>
        </div>
      </div>
    </aside>
  );
};
