'use client';

import React, { useState, useEffect } from 'react';
import { UserSidebar } from '@/components/common/UserSidebar';
import { Header } from '@/components/common/Header';
import { useWebSocket } from '@/components/WebSocketProvider';
import { Wallet, PlusCircle, ArrowUpCircle, ArrowDownCircle, CheckCircle } from 'lucide-react';

export default function WalletPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [amount, setAmount] = useState<number>(50000);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchWallet = () => {
    fetch('/api/wallet')
      .then((res) => res.json())
      .then((data) => {
        if (data.wallet) setWallet(data.wallet);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  useWebSocket(wallet?.userId ? `USER_${wallet.userId}` : null, (event) => {
    if (['TRADE_EXECUTED', 'ORDER_CREATED', 'ORDER_CANCELLED'].includes(event.eventType)) {
      fetchWallet();
    }
  });

  const handleTransaction = async (action: 'DEPOSIT' | 'WITHDRAWAL') => {
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, amount }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(data.message);
        fetchWallet();
        setTimeout(() => setMsg(null), 4000);
      } else {
        alert(data.error || 'Transaction failed');
      }
    } catch {
      alert('Error');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wallet className="h-6 w-6 text-blue-500" />
              <span>Virtual Wallet & Funds Manager</span>
            </h1>
            <p className="text-sm text-slate-400">Manage virtual cash reserves, deposit funds, and inspect transaction logs</p>
          </div>

          {msg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 text-sm font-semibold">
              <CheckCircle className="h-5 w-5" />
              <span>{msg}</span>
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="trade-card p-5 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Available Balance</div>
              <div className="text-3xl font-extrabold text-emerald-400">
                ₹{wallet?.availableBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '85,430.30'}
              </div>
              <div className="text-[11px] text-slate-500">Ready for instant trading</div>
            </div>

            <div className="trade-card p-5 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Used Margin</div>
              <div className="text-3xl font-extrabold text-amber-400">
                ₹{wallet?.usedMargin?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '3,84,789.95'}
              </div>
              <div className="text-[11px] text-slate-500">Committed in positions</div>
            </div>

            <div className="trade-card p-5 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Total Account Capital</div>
              <div className="text-3xl font-extrabold text-white">
                ₹{wallet?.totalBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '4,70,220.25'}
              </div>
              <div className="text-[11px] text-slate-500">Total account balance</div>
            </div>
          </div>

          {/* Deposit / Withdraw Controls & Logs */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 trade-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-[#1E2638] pb-2">Virtual Fund Transfer</h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Enter Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#1E2638] bg-[#0B0E14] px-4 py-3 text-lg font-extrabold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleTransaction('DEPOSIT')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Deposit Funds</span>
                </button>
                <button
                  onClick={() => handleTransaction('WITHDRAWAL')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>

            {/* Transaction Logs */}
            <div className="lg:col-span-7 trade-card p-5 space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-[#1E2638] pb-2">Wallet Transaction History</h3>
              <div className="space-y-2.5 text-xs">
                {wallet?.transactions?.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0E14]/50 border border-[#1E2638]/40">
                    <div>
                      <div className="font-bold text-white">{tx.description}</div>
                      <div className="text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleString()}</div>
                    </div>
                    <div className={`font-extrabold ${tx.type === 'DEPOSIT' || tx.type === 'TRADE_CREDIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'DEPOSIT' || tx.type === 'TRADE_CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
