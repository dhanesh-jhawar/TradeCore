'use client';

import React, { useState } from 'react';
import { UserSidebar } from '@/components/common/UserSidebar';
import { Header } from '@/components/common/Header';
import { User, ShieldCheck, Award, Mail, Phone, Calendar, Briefcase } from 'lucide-react';

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="h-6 w-6 text-blue-500" />
              <span>User Profile & Verification</span>
            </h1>
            <p className="text-sm text-slate-400">Account status, KYC verification, and trading identity</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Card: Avatar & Status */}
            <div className="lg:col-span-4 trade-card p-6 text-center space-y-4">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 font-extrabold text-white text-3xl shadow-xl shadow-blue-600/30">
                AR
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Arjun Reddy</h2>
                <div className="text-xs text-amber-400 font-semibold mt-1">👑 Premium Trader</div>
                <div className="text-xs text-slate-400 mt-1">arjun@tradecore.io</div>
              </div>

              <div className="pt-3 border-t border-[#1E2638] flex justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> KYC Verified
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
                  Active Trader
                </span>
              </div>
            </div>

            {/* Right Details Card */}
            <div className="lg:col-span-8 trade-card p-6 space-y-6">
              <h3 className="text-base font-bold text-white border-b border-[#1E2638] pb-3">Personal Details</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-slate-500 font-semibold">Account ID</div>
                  <div className="font-bold text-white text-sm mt-0.5">USR2451</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-slate-500 font-semibold">Role</div>
                  <div className="font-bold text-blue-400 text-sm mt-0.5">TRADER_USER</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-slate-500 font-semibold">Virtual Margin Balance</div>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">₹4,82,650.75</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#1E2638]">
                  <div className="text-slate-500 font-semibold">Risk Classification</div>
                  <div className="font-bold text-purple-400 text-sm mt-0.5">Moderate Growth</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
