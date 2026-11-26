'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  Database,
  Globe,
  LogOut,
  MousePointerClick,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { AnalyticsSummary } from '@/lib/analytics';
import type { SupabaseSyncInfo } from '@/lib/analytics-store';

type AdminView = 'overview' | 'countries' | 'buttons' | 'events' | 'supabase';
type EventTypeFilter = 'all' | 'page_visit' | 'cta_click' | 'checkout_submit';

interface AdminDashboardClientProps {
  initialSummary: AnalyticsSummary;
  sessionUsername: string;
  initialSupabaseSync: SupabaseSyncInfo;
  supabaseSql: string;
}

function formatEventTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function eventTypeLabel(type: 'page_visit' | 'cta_click' | 'checkout_submit'): {
  label: string;
  tone: string;
} {
  if (type === 'checkout_submit') {
    return { label: 'Purchase ($17)', tone: 'text-emerald-700 font-semibold' };
  }
  if (type === 'cta_click') {
    return { label: 'Button Click', tone: 'text-amber-700 font-medium' };
  }
  return { label: 'Page Visit', tone: 'text-slate-700 font-medium' };
}

export default function AdminDashboardClient({
  initialSummary,
  sessionUsername,
  initialSupabaseSync,
  supabaseSql,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<AnalyticsSummary>(initialSummary);
  const [supabaseSync, setSupabaseSync] = useState<SupabaseSyncInfo>(initialSupabaseSync);
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<EventTypeFilter>('all');
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchLatest = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/login');
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = (await res.json()) as AnalyticsSummary & { supabaseSync?: SupabaseSyncInfo };
      setSummary(data);
      if (data.supabaseSync) setSupabaseSync(data.supabaseSync);
    } catch {
      setErrorMessage('Could not refresh analytics right now.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    fetch('/api/analytics', { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/login');
          router.refresh();
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data: (AnalyticsSummary & { supabaseSync?: SupabaseSyncInfo }) | null) => {
        if (active && data) {
          setSummary(data);
          if (data.supabaseSync) setSupabaseSync(data.supabaseSync);
        }
      })
      .catch(() => {
        // Keep initial server-rendered summary on transient network error
      });
    return () => {
      active = false;
    };
  }, [router]);

  const handleReset = async (mode: 'empty' | 'reseed') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/analytics?mode=${mode}`, { method: 'DELETE' });
      if (res.status === 401) {
        router.push('/login');
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error('Failed to reset store');
      const data = (await res.json()) as AnalyticsSummary & { supabaseSync?: SupabaseSyncInfo };
      setSummary(data);
      if (data.supabaseSync) setSupabaseSync(data.supabaseSync);
    } catch {
      setErrorMessage('Unable to update analytics store.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(supabaseSql);
      setCopiedSql(true);
      window.setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      setCopiedSql(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return summary.recentEvents.filter((evt) => {
      if (eventFilter !== 'all' && evt.type !== eventFilter) return false;
      if (!q) return true;
      return (
        evt.visitorId.toLowerCase().includes(q) ||
        evt.countryName.toLowerCase().includes(q) ||
        evt.countryCode.toLowerCase().includes(q) ||
        evt.timezone.toLowerCase().includes(q) ||
        evt.referrer.toLowerCase().includes(q) ||
        evt.device.toLowerCase().includes(q) ||
        (evt.buttonLabel ?? '').toLowerCase().includes(q) ||
        (evt.metadata ?? '').toLowerCase().includes(q)
      );
    });
  }, [summary.recentEvents, searchQuery, eventFilter]);

  const maxTimelineVisits = Math.max(1, ...summary.timeline.map((b) => b.visits));

  const navItems: Array<{ id: AdminView; label: string; icon: typeof BarChart3 }> = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'countries', label: 'Visitor Countries', icon: Globe },
    { id: 'buttons', label: 'Crucial Buttons', icon: MousePointerClick },
    { id: 'events', label: 'Visit & Click Log', icon: Users },
    { id: 'supabase', label: 'Supabase SQL & Sync', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* Left Sidebar (260px on desktop, per SaaS dashboard guidelines) */}
      <aside className="border-b border-slate-200 bg-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap"
          >
            OpenFrame
          </Link>
          <span className="font-mono text-xs text-emerald-700">{sessionUsername}</span>
        </div>

        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto p-3 lg:flex-col">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden border-t border-slate-200 p-4 lg:block">
          <p className="text-xs leading-relaxed text-slate-500">
            {supabaseSync.message}
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Landing Page</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Top Bar with Breadcrumb & Primary Controls */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">OpenFrame</span>
            <span className="text-slate-400">/</span>
            <h1 className="font-display font-bold text-slate-950">
              {navItems.find((i) => i.id === activeView)?.label}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 lg:hidden whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Live Site</span>
            </Link>
            <button
              type="button"
              onClick={() => void fetchLatest()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => void handleReset('reseed')}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Demo Data</span>
            </button>
            <button
              type="button"
              onClick={() => void handleReset('empty')}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Events</span>
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {errorMessage}
            </div>
          )}

          {/* KPI Summary Row */}
          <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Total Page Visits</span>
                <Users className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-slate-950 tabular-nums">
                {summary.totalVisits}
              </div>
              <div className="mt-1 text-xs text-slate-600 tabular-nums">
                {summary.uniqueVisitors} unique visitors · {summary.countriesCount} countries
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Crucial Button Clicks</span>
                <MousePointerClick className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-slate-950 tabular-nums">
                {summary.crucialButtonClicks}
              </div>
              <div className="mt-1 text-xs text-slate-600 tabular-nums">
                {summary.checkoutOpens} checkout opens · {summary.ctaClickRate}% CTA click rate
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Conversion Rate</span>
                <TrendingUp className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-emerald-700 tabular-nums">
                {summary.overallConversionRate}%
              </div>
              <div className="mt-1 text-xs text-slate-600 tabular-nums">
                {summary.completedConversions} purchases · {summary.checkoutCompletionRate}% checkout
                completion
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Black Friday Revenue</span>
                <Globe className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold text-slate-950 tabular-nums">
                ${summary.estimatedRevenueUsd}
              </div>
              <div className="mt-1 text-xs text-slate-600 tabular-nums">
                $17 sale price · {summary.completedConversions} guides sold
              </div>
            </div>
          </section>

          {/* Empty State if cleared */}
          {summary.totalVisits === 0 && summary.recentEvents.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <h2 className="font-display text-lg font-bold text-slate-950">
                No visitor events recorded yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Visit the landing page and click a video placeholder or Black Friday CTA to see
                live tracking appear here, or restore the sample dataset.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Open Landing Page
                </Link>
                <button
                  type="button"
                  onClick={() => void handleReset('reseed')}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Restore Demo Data
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Charts: Daily Traffic + Funnel */}
              {activeView === 'overview' && (
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Daily Visits & Conversions Bar Chart */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display text-base font-bold text-slate-950">
                          Visits & Conversions by Day
                        </h2>
                        <p className="text-xs text-slate-500">
                          Daily landing page traffic vs completed $17 purchases
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-200" />
                          Visits
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-700" />
                          Purchases
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex h-44 items-end gap-4 border-b border-slate-200 pb-2">
                      {summary.timeline.map((bucket) => {
                        const visitPct = Math.round((bucket.visits / maxTimelineVisits) * 100);
                        const convPct = Math.round((bucket.conversions / maxTimelineVisits) * 100);
                        return (
                          <div
                            key={bucket.label}
                            className="flex flex-1 flex-col items-center justify-end gap-1.5 h-full"
                          >
                            <div className="flex w-full max-w-[44px] items-end justify-center gap-1 h-full">
                              <div
                                title={`${bucket.visits} visits`}
                                className="w-1/2 rounded-t bg-emerald-200 transition-all"
                                style={{ height: `${Math.max(8, visitPct)}%` }}
                              />
                              <div
                                title={`${bucket.conversions} purchases`}
                                className="w-1/2 rounded-t bg-emerald-700 transition-all"
                                style={{ height: `${bucket.conversions > 0 ? Math.max(8, convPct) : 0}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex gap-4">
                      {summary.timeline.map((bucket) => (
                        <div key={bucket.label} className="flex-1 text-center">
                          <div className="text-xs font-medium text-slate-600">{bucket.label}</div>
                          <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {bucket.visits}v / {bucket.conversions}c
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conversion Funnel */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
                    <h2 className="font-display text-base font-bold text-slate-950">
                      Conversion Funnel
                    </h2>
                    <p className="text-xs text-slate-500">
                      Visitor drop-off from arrival to $17 checkout completion
                    </p>

                    <div className="mt-6 space-y-5">
                      <div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700">1. Page Visits</span>
                          <span className="font-mono font-bold text-slate-950 tabular-nums">
                            {summary.totalVisits} (100%)
                          </span>
                        </div>
                        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700">2. Crucial CTA Clicks (Checkout Opened)</span>
                          <span className="font-mono font-bold text-slate-950 tabular-nums">
                            {summary.checkoutOpens} ({summary.ctaClickRate}%)
                          </span>
                        </div>
                        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${Math.min(100, summary.ctaClickRate)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700">3. Completed Purchases ($17)</span>
                          <span className="font-mono font-bold text-emerald-700 tabular-nums">
                            {summary.completedConversions} ({summary.overallConversionRate}%)
                          </span>
                        </div>
                        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-800"
                            style={{ width: `${Math.min(100, summary.overallConversionRate)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Countries Breakdown Table */}
              {(activeView === 'overview' || activeView === 'countries') && (
                <section className="rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="font-display text-base font-bold text-slate-950">
                      Visitors by Country
                    </h2>
                    <p className="text-xs text-slate-500">
                      Geographic distribution resolved from request headers and visitor timezone
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="px-6 py-3">Country</th>
                          <th className="px-6 py-3 text-right">Visits</th>
                          <th className="px-6 py-3 text-right">Traffic Share</th>
                          <th className="px-6 py-3 text-right">Button Clicks</th>
                          <th className="px-6 py-3 text-right">Purchases</th>
                          <th className="px-6 py-3 text-right">Conv. Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {summary.countryBreakdown.map((row) => (
                          <tr key={row.countryCode} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-slate-900">
                              <span className="font-mono text-xs text-slate-500 mr-2">
                                {row.countryCode}
                              </span>
                              {row.countryName}
                            </td>
                            <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-900">
                              {row.visits}
                            </td>
                            <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-600">
                              {row.sharePercent}%
                            </td>
                            <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-700">
                              {row.ctaClicks}
                            </td>
                            <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-900">
                              {row.conversions}
                            </td>
                            <td className="px-6 py-3 text-right font-mono font-semibold tabular-nums text-emerald-700">
                              {row.conversionRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Crucial Buttons Performance Table */}
              {(activeView === 'overview' || activeView === 'buttons') && (
                <section className="rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="font-display text-base font-bold text-slate-950">
                      Crucial Button Clicks
                    </h2>
                    <p className="text-xs text-slate-500">
                      Click volume across primary CTAs, video placeholder previews, and workflow
                      steps
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="px-6 py-3">Button / Control</th>
                          <th className="px-6 py-3">Role</th>
                          <th className="px-6 py-3 text-right">Clicks</th>
                          <th className="px-6 py-3 text-right">Share of Clicks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {summary.buttonBreakdown.map((btn) => (
                          <tr key={btn.buttonId} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-slate-900">{btn.label}</td>
                            <td className="px-6 py-3 text-xs text-slate-600">
                              {btn.opensCheckout ? 'Opens Checkout ($17)' : 'Engagement / Preview'}
                            </td>
                            <td className="px-6 py-3 text-right font-mono font-semibold tabular-nums text-slate-950">
                              {btn.clicks}
                            </td>
                            <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-600">
                              {btn.sharePercent}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Live Visitor & Interaction Event Log */}
              {(activeView === 'overview' || activeView === 'events') && (
                <section className="rounded-xl border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
                    <div>
                      <h2 className="font-display text-base font-bold text-slate-950">
                        Recent Visitor & Click Timeline
                      </h2>
                      <p className="text-xs text-slate-500">
                        Timestamped visits, country origin, device, and crucial button interactions
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search country, button..."
                          aria-label="Filter visitor events"
                          className="rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs">
                        {(
                          [
                            ['all', 'All'],
                            ['page_visit', 'Visits'],
                            ['cta_click', 'Clicks'],
                            ['checkout_submit', 'Purchases'],
                          ] as Array<[EventTypeFilter, string]>
                        ).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setEventFilter(id)}
                            className={`rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                              eventFilter === id
                                ? 'bg-emerald-700 text-white'
                                : 'text-slate-600 hover:text-slate-950'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="px-6 py-3">When</th>
                          <th className="px-6 py-3">Visitor ID</th>
                          <th className="px-6 py-3">Event</th>
                          <th className="px-6 py-3">Country & Timezone</th>
                          <th className="px-6 py-3">Button / Detail</th>
                          <th className="px-6 py-3">Source · Device</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEvents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                              No events match your current filter.
                            </td>
                          </tr>
                        ) : (
                          filteredEvents.map((evt) => {
                            const badge = eventTypeLabel(evt.type);
                            return (
                              <tr key={evt.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                                  {formatEventTimestamp(evt.timestamp)}
                                </td>
                                <td className="px-6 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                                  {evt.visitorId}
                                </td>
                                <td className={`px-6 py-3 text-xs whitespace-nowrap ${badge.tone}`}>
                                  {badge.label}
                                </td>
                                <td className="px-6 py-3 text-xs text-slate-800 whitespace-nowrap">
                                  <span className="font-mono text-slate-500 mr-1.5">
                                    {evt.countryCode}
                                  </span>
                                  {evt.countryName}
                                  <span className="ml-1.5 text-slate-400">({evt.timezone})</span>
                                </td>
                                <td className="px-6 py-3 text-xs text-slate-700">
                                  {evt.buttonLabel || 'Landing page view'}
                                  {evt.metadata ? ` (${evt.metadata})` : ''}
                                </td>
                                <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">
                                  {evt.referrer} · {evt.device}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Supabase Integration & SQL Setup Panel */}
              {activeView === 'supabase' && (
                <section className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="font-display text-base font-bold text-slate-950">
                          Supabase Project Endpoints & Live Sync
                        </h2>
                        <p className="mt-1 text-xs text-slate-600">{supabaseSync.message}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                          supabaseSync.mode === 'supabase-rest'
                            ? 'bg-emerald-100 text-emerald-800'
                            : supabaseSync.mode === 'supabase-public-storage'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {supabaseSync.mode}
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <dt className="font-semibold text-slate-600">Project API URL</dt>
                        <dd className="mt-1 break-all font-mono text-slate-900">
                          {supabaseSync.projectUrl}
                        </dd>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <dt className="font-semibold text-slate-600">REST API (PostgREST)</dt>
                        <dd className="mt-1 break-all font-mono text-slate-900">
                          {supabaseSync.restUrl}/
                        </dd>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <dt className="font-semibold text-slate-600">Public Storage API</dt>
                        <dd className="mt-1 break-all font-mono text-slate-900">
                          {supabaseSync.storageUrl}/
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display text-base font-bold text-slate-950">
                          SQL to Create Unprotected Public Analytics & IDs Tables
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                          Run this script in your Supabase SQL Editor, then add your Supabase anon
                          key as <code className="font-mono text-blue-700">SUPABASE_ANON_KEY</code>{' '}
                          in project Secrets if Kong requires an <code className="font-mono">apikey</code> header.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCopySql()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                      >
                        {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedSql ? 'Copied SQL' : 'Copy SQL'}</span>
                      </button>
                    </div>

                    <pre className="mt-4 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-200">
                      <code>{supabaseSql}</code>
                    </pre>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
