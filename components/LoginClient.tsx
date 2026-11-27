'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { markDeviceAsAdmin } from '@/lib/track-client';

export default function LoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Enter both your admin username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || 'Invalid username or password.');
        setIsSubmitting(false);
        return;
      }

      // This browser now belongs to an admin: its visits are never counted again.
      markDeviceAsAdmin();

      router.push('/admin');
      router.refresh();
    } catch {
      setErrorMessage('Unable to verify credentials right now. Try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-8 sm:px-6">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-lg font-extrabold tracking-tight text-slate-950"
        >
          OpenFrame
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:border-blue-300 hover:text-blue-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Landing Page</span>
        </Link>
      </header>

      <main className="mx-auto my-8 w-full max-w-md">
        <div className="rounded-2xl border border-emerald-950/12 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>OpenFrame Analytics Portal</span>
          </div>

          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-slate-950">
            Admin Sign In
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Sign in to view visitor locations, timestamps, button clicks, and Black Friday
            conversion rates.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-700"
              >
                Username
              </label>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-700"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-3.5 pr-11 text-sm text-slate-950 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>{isSubmitting ? 'Signing in...' : 'Sign In to Analytics'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl text-center text-xs text-slate-500">
        OpenFrame Analytics · Protected Admin View
      </footer>
    </div>
  );
}
