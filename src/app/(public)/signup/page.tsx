'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, ArrowRight, Lock, Mail, UserCheck } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('Rahul Sharma');
  const [email, setEmail] = useState('rahul@tradecore.io');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E14] text-white">
      {/* Left Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-[#1E2638] bg-gradient-to-br from-[#0B0E14] via-[#121722] to-[#161F33] p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">TradeCore</span>
        </div>

        <div className="space-y-6 max-w-lg">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400">
            Start Virtual Trading
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Get ₹5,00,000 Virtual Capital Instantly.
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            Create your account to start trading 100+ stocks on the live matching engine with zero financial risk.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          © 2026 TradeCore Exchange Engine. All rights reserved.
        </div>
      </div>

      {/* Right Signup Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-20">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white">TradeCore</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Create Account</h2>
            <p className="text-sm text-slate-400">Join 2,480+ traders on TradeCore platform</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <div className="flex items-center rounded-xl border border-[#1E2638] bg-[#121722] px-3.5 py-3 focus-within:border-blue-500">
                <UserCheck className="mr-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address</label>
              <div className="flex items-center rounded-xl border border-[#1E2638] bg-[#121722] px-3.5 py-3 focus-within:border-blue-500">
                <Mail className="mr-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Password</label>
              <div className="flex items-center rounded-xl border border-[#1E2638] bg-[#121722] px-3.5 py-3 focus-within:border-blue-500">
                <Lock className="mr-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Confirm Password</label>
              <div className="flex items-center rounded-xl border border-[#1E2638] bg-[#121722] px-3.5 py-3 focus-within:border-blue-500">
                <Lock className="mr-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Create Trader Account'}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-blue-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
