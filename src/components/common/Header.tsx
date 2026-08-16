'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, Menu, TrendingUp, X } from 'lucide-react';

interface CompanySearchResult {
  id: string;
  symbol: string;
  companyName: string;
  currentPrice: number;
  sector: string;
}

export const Header: React.FC<{ toggleSidebar?: () => void }> = ({ toggleSidebar }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [timeStr, setTimeStr] = useState('09:47:32 AM - 11 Aug 2026');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
          ' - 11 Aug 2026'
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      fetch(`/api/companies?search=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.companies) {
            setResults(data.companies.slice(0, 6));
          }
        })
        .catch(() => {});
    } else {
      setResults([]);
    }
  }, [query]);

  const [user, setUser] = useState<{ name: string; role: string; initials: string } | null>(null);

  useEffect(() => {
    // Fetch authenticated user
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then((data) => {
        if (data.user) {
          const initials = data.user.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
          setUser({ ...data.user, initials });
        }
      })
      .catch(() => {
        // Handle unauthenticated state if needed
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1E2638] bg-[#0B0E14]/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Quick Command Search Bar */}
          <div
            onClick={() => setSearchOpen(true)}
            className="flex w-72 cursor-pointer items-center gap-3 rounded-lg border border-[#1E2638] bg-[#121722] px-3.5 py-2 text-sm text-slate-400 transition hover:border-[#3B82F6] md:w-96"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span className="flex-1 truncate">Search for companies, stocks, ETFs...</span>
            <kbd className="hidden rounded bg-[#1E2638] px-2 py-0.5 text-[10px] font-medium text-slate-300 sm:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Action Icons & User Info */}
        <div className="flex items-center gap-4">
          {/* Live Market Status Pill */}
          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Market Open</span>
            <span className="text-slate-400">• {timeStr}</span>
          </div>

          {/* Notifications */}
          <button
            className="relative rounded-lg border border-[#1E2638] bg-[#121722] p-2 text-slate-300 transition hover:border-[#3B82F6] hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              5
            </span>
          </button>

          {/* User / Admin Profile Badge */}
          <div className="flex items-center gap-3">
            <Link
              href={isAdmin ? "/admin/settings" : "/profile"}
              className="flex items-center gap-3 rounded-lg border border-[#1E2638] bg-[#121722] p-1.5 pr-3 transition hover:border-[#3B82F6]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-white shadow-md text-sm">
                {user?.initials || '..'}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold text-white">
                  {user?.name || 'Loading...'}
                </div>
                <div className="text-[10px] font-medium text-amber-400 flex items-center gap-1">
                  {user?.role === 'ADMIN' ? 'Super Administrator' : '👑 Premium Trader'}
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-slate-400 hover:text-red-400 transition ml-2"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Modal Quick Search Popup */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-20 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-[#1E2638] bg-[#121722] shadow-2xl">
            <div className="flex items-center border-b border-[#1E2638] px-4 py-3">
              <Search className="mr-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type symbol or company name (e.g. TCS, RELIANCE)..."
                className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {results.length > 0 ? (
                results.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSearchOpen(false);
                      router.push(`/market/${c.symbol}`);
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-[#1E2638]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 font-bold text-blue-400 text-xs">
                        {c.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{c.symbol}</div>
                        <div className="text-xs text-slate-400">{c.companyName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">₹{c.currentPrice.toFixed(2)}</div>
                      <div className="text-xs text-blue-400">{c.sector}</div>
                    </div>
                  </div>
                ))
              ) : query.trim() ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No stock found matching "{query}"
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Search across 100+ simulated exchange companies
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
