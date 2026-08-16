'use client';

import React, { useState } from 'react';
import { UserSidebar } from '@/components/common/UserSidebar';
import { Header } from '@/components/common/Header';
import { Settings, Lock, Bell, Key, Moon, Save } from 'lucide-react';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [orderConfirmations, setOrderConfirmations] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      <UserSidebar isOpen={sidebarOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="h-6 w-6 text-blue-500" />
              <span>User Settings & Preferences</span>
            </h1>
            <p className="text-sm text-slate-400">Configure notifications, security credentials, and application preferences</p>
          </div>

          {saved && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 text-sm font-semibold">
              Settings updated successfully!
            </div>
          )}

          <div className="trade-card p-6 space-y-6 max-w-3xl">
            <form onSubmit={handleSave} className="space-y-6">
              {/* Notifications */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1E2638] pb-2">
                  <Bell className="h-4 w-4 text-blue-400" />
                  <span>Notification Settings</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B0E14] border border-[#1E2638] cursor-pointer">
                    <span className="font-semibold text-slate-300">Email Trade Confirmations</span>
                    <input
                      type="checkbox"
                      checked={emailNotifs}
                      onChange={(e) => setEmailNotifs(e.target.checked)}
                      className="h-4 w-4 accent-blue-600 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B0E14] border border-[#1E2638] cursor-pointer">
                    <span className="font-semibold text-slate-300">Order Execution Popups</span>
                    <input
                      type="checkbox"
                      checked={orderConfirmations}
                      onChange={(e) => setOrderConfirmations(e.target.checked)}
                      className="h-4 w-4 accent-blue-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1E2638] pb-2">
                  <Lock className="h-4 w-4 text-purple-400" />
                  <span>Security & Credentials</span>
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="text-slate-400 font-semibold">Current Password</label>
                    <input
                      type="password"
                      defaultValue="password123"
                      className="w-full mt-1 rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-semibold">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full mt-1 rounded-xl border border-[#1E2638] bg-[#0B0E14] px-3.5 py-2.5 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
              >
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
