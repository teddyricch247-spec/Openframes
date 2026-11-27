'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Globe,
  ListOrdered,
  LogOut,
  MousePointerClick,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { AnalyticsSummary } from '@/lib/analytics';
import type { SupabaseSyncInfo } from '@/lib/analytics-store';
import DailyActivity from './DailyActivity';

type AdminView = 'overview' | 'daily' | 'log';
type EventTypeFilter = 'all' | 'page_visit' | 'cta_click';

interface AdminDashboardClientProps {
  initialSummary: AnalyticsSummary;
  sessionUsername: string;
  initialSupabaseSync: SupabaseSyncInfo;
}

function formatEventTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function analyticsUrl(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return `/api/analytics?tz=${encodeURIComponent(tz)}`;
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

interface StatCardProps {
  title: string;
  value: number | string;
  note: string;
  icon: typeof Users;
}

function StatCard({ title, value, note, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{title}</span>
        <Icon className="h-4 w-4 text-emerald-700" />
      </div>
      <div className="mt-2 font-mono text-3xl font-bold text-slate-950 tabular-nums">{value}</div>
      <div className="mt-1 text-xs leading-snug text-slate-600">{note}</div>
    </div>
  );
}

export default function AdminDashboardClient({
  initialSummary,
  sessionUsername,
  initialSupabaseSync,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<AnalyticsSummary>(initialSummary);
  const [supabaseSync, setSupabaseSync] = useState<SupabaseSyncInfo>(initialSupabaseSync);
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<EventTypeFilter>('all');

  const fetchLatest = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(analyticsUrl(), { cache: 'no-store' });
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
    fetch(analyticsUrl(), { cache: 'no-store' })
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

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return summary.recentEvents.filter((evt) => {
      if (eventFilter !== 'all' && evt.type !== eventFilter) return false;
      if (!q) return true;
      return (
        evt.countryName.toLowerCase().includes(q) ||
        evt.countryCode.toLowerCase().includes(q) ||
        evt.referrer.toLowerCase().includes(q) ||
        evt.device.toLowerCase().includes(q) ||
        (evt.buttonLabel ?? '').toLowerCase().includes(q) ||
        (evt.metadata ?? '').toLowerCase().includes(q)
      );
    });
  }, [summary.recentEvents, searchQuery, eventFilter]);

  const today = summary.daily.length > 0 ? summary.daily[summary.daily.length - 1] : null;
  const last7 = summary.daily.slice(-7);
  const last7Visitors = last7.reduce((total, d) => total + d.newVisitors, 0);
  const last7Clicks = last7.reduce((total, d) => total + d.buttonClicks, 0);

  const countriesWithVisits = summary.countryBreakdown.filter((c) => c.visits > 0);
  const maxCountryVisits = Math.max(1, ...countriesWithVisits.map((c) => c.visits));
  const buyButtons = summary.buttonBreakdown.filter((b) => b.opensCheckout);
  const otherButtons = summary.buttonBreakdown.filter((b) => !b.opensCheckout);

  const navItems: Array<{ id: AdminView; label: string; icon: typeof BarChart3 }> = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'daily', label: 'Day by Day', icon: CalendarDays },
    { id: 'log', label: 'Visit Log', icon: ListOrdered },
  ];

  const hasNoEvents = summary.totalVisits === 0 && summary.crucialButtonClicks === 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
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
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Landing Page</span>
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
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

          {supabaseSync.mode === 'local-fallback' && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-semibold">Events may not be saved.</span> {supabaseSync.message}
              </p>
            </div>
          )}

          {/* The four numbers that matter, in plain words */}
          {activeView !== 'log' && (
            <section
              aria-label="Key numbers"
              className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
            >
              <StatCard
                title="Visitors, all time"
                value={summary.totalVisits}
                note={
                  summary.countriesCount > 0
                    ? `From ${plural(summary.countriesCount, 'country', 'countries')}`
                    : 'Each person counted once'
                }
                icon={Users}
              />
              <StatCard
                title="Visitors today"
                value={today?.newVisitors ?? 0}
                note={`${plural(today?.buttonClicks ?? 0, 'button click')} today`}
                icon={CalendarDays}
              />
              <StatCard
                title="Visitors, last 7 days"
                value={last7Visitors}
                note={`${plural(last7Clicks, 'button click')} this week`}
                icon={TrendingUp}
              />
              <StatCard
                title="Buy-button clicks"
                value={summary.checkoutOpens}
                note={`${summary.ctaClickRate} clicks per 100 visitors`}
                icon={MousePointerClick}
              />
            </section>
          )}

          {activeView === 'overview' && hasNoEvents && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="font-display text-lg font-bold text-slate-950">No visitors yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Everyone is counted once, and only real people. Bots, link previews and your own
                admin browser are ignored. Visits show up here after a refresh.
              </p>
            </div>
          )}

          {activeView === 'overview' && !hasNoEvents && (
            <>
              <DailyActivity
                daily={summary.daily}
                timeZone={summary.timeZone}
                showTable={false}
                defaultRange={7}
              />

              <section className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                  <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-950">
                    <Globe className="h-4 w-4 text-emerald-700" />
                    Where visitors are from
                  </h2>
                </div>
                {countriesWithVisits.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-500 sm:px-6">No visitors yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {countriesWithVisits.map((row) => (
                      <li key={row.countryCode} className="px-5 py-3 sm:px-6">
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-900">
                            {row.countryName}
                            <span className="ml-2 font-mono text-xs text-slate-400">
                              {row.countryCode}
                            </span>
                          </span>
                          <span className="font-mono tabular-nums text-slate-950">
                            <span className="font-semibold">{row.visits}</span>
                            <span className="ml-2 text-xs text-slate-500">{row.sharePercent}%</span>
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${(row.visits / maxCountryVisits) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                  <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-950">
                    <MousePointerClick className="h-4 w-4 text-emerald-700" />
                    What people clicked
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {plural(summary.crucialButtonClicks, 'click')} in total
                  </p>
                </div>

                {(
                  [
                    ['Buy buttons (open checkout)', buyButtons],
                    ['Other buttons', otherButtons],
                  ] as const
                ).map(([heading, rows]) => (
                  <div key={heading}>
                    <h3 className="bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                      {heading}
                    </h3>
                    <ul className="divide-y divide-slate-100">
                      {rows.map((btn) => (
                        <li
                          key={btn.buttonId}
                          className="flex items-baseline justify-between gap-4 px-5 py-3 text-sm sm:px-6"
                        >
                          <span className={btn.clicks === 0 ? 'text-slate-400' : 'text-slate-900'}>
                            {btn.label}
                          </span>
                          <span
                            className={`shrink-0 font-mono tabular-nums ${
                              btn.clicks === 0 ? 'text-slate-400' : 'font-semibold text-slate-950'
                            }`}
                          >
                            {btn.clicks}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            </>
          )}

          {activeView === 'daily' && (
            <DailyActivity
              daily={summary.daily}
              timeZone={summary.timeZone}
              showTable
              defaultRange={30}
            />
          )}

          {activeView === 'log' && (
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-950">
                    Latest visits and clicks
                  </h2>
                  <p className="text-xs text-slate-500">The 50 most recent, newest first</p>
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

              {filteredEvents.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">
                  {summary.recentEvents.length === 0
                    ? 'Nothing recorded yet.'
                    : 'No events match your filter.'}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredEvents.map((evt) => {
                    const isClick = evt.type === 'cta_click';
                    return (
                      <li key={evt.id} className="px-5 py-3 sm:px-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                isClick ? 'text-amber-700' : 'text-slate-900'
                              }`}
                            >
                              {isClick
                                ? `Clicked: ${evt.buttonLabel ?? 'a button'}${
                                    evt.metadata ? ` (${evt.metadata})` : ''
                                  }`
                                : 'Visited the site'}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {evt.countryName} · {evt.device} ·{' '}
                              {evt.referrer === 'direct' ? 'direct visit' : `from ${evt.referrer}`}
                            </p>
                          </div>
                          <span className="shrink-0 font-mono text-xs text-slate-500 tabular-nums">
                            {formatEventTimestamp(evt.timestamp)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
