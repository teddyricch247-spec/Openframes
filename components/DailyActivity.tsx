'use client';

import { useMemo, useState } from 'react';
import type { DailyBucket } from '@/lib/analytics';

type RangeDays = 7 | 30 | 90;

const RANGE_OPTIONS: RangeDays[] = [7, 30, 90];

interface DailyActivityProps {
  daily: DailyBucket[];
  timeZone: string;
  /** Show the day-by-day table under the chart */
  showTable?: boolean;
}

function weekdayLabel(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function sum(rows: DailyBucket[], pick: (row: DailyBucket) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

export default function DailyActivity({ daily, timeZone, showTable = true }: DailyActivityProps) {
  const [range, setRange] = useState<RangeDays>(30);

  const rows = useMemo(() => daily.slice(-range), [daily, range]);
  const maxValue = Math.max(1, ...rows.map((r) => Math.max(r.newVisitors, r.buttonClicks)));
  const labelEvery = Math.max(1, Math.ceil(rows.length / 6));
  const tableRows = useMemo(() => [...rows].reverse(), [rows]);
  const todayKey = daily.length > 0 ? daily[daily.length - 1].date : '';

  const totals = {
    newVisitors: sum(rows, (r) => r.newVisitors),
    buttonClicks: sum(rows, (r) => r.buttonClicks),
    checkoutOpens: sum(rows, (r) => r.checkoutOpens),
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white" aria-label="Daily activity">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="font-display text-base font-bold text-slate-950">Activity by Day</h2>
          <p className="text-xs text-slate-500">
            Days run midnight to midnight in {timeZone}. Days with no activity show as zero.
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs" role="group" aria-label="Date range">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              aria-pressed={range === option}
              className={`rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                range === option ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-5">
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
            New visitors
            <span className="font-mono font-semibold text-slate-950 tabular-nums">{totals.newVisitors}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            Button clicks
            <span className="font-mono font-semibold text-slate-950 tabular-nums">{totals.buttonClicks}</span>
          </span>
          <span className="text-slate-500">Last {range} days</span>
        </div>

        <div className="relative">
          <span className="absolute left-0 top-0 font-mono text-[10px] text-slate-400 tabular-nums">
            {maxValue}
          </span>
          <div
            className="flex h-44 items-end gap-px border-b border-slate-200 pl-6"
            role="img"
            aria-label={`Bar chart of new visitors and button clicks per day for the last ${range} days`}
          >
            {rows.map((row) => {
              const visitorPct = (row.newVisitors / maxValue) * 100;
              const clickPct = (row.buttonClicks / maxValue) * 100;
              return (
                <div
                  key={row.date}
                  className="flex h-full min-w-0 flex-1 items-end justify-center gap-px"
                  title={`${weekdayLabel(row.date)}: ${row.newVisitors} new visitors, ${row.activeVisitors} active, ${row.buttonClicks} clicks`}
                >
                  <div
                    className={`w-1/2 max-w-[14px] rounded-t-sm ${row.newVisitors > 0 ? 'bg-emerald-600' : 'bg-slate-200'}`}
                    style={{ height: row.newVisitors > 0 ? `${Math.max(4, visitorPct)}%` : '2px' }}
                  />
                  <div
                    className={`w-1/2 max-w-[14px] rounded-t-sm ${row.buttonClicks > 0 ? 'bg-blue-500' : 'bg-slate-200'}`}
                    style={{ height: row.buttonClicks > 0 ? `${Math.max(4, clickPct)}%` : '2px' }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-px pb-5 pl-6 pt-2">
          {rows.map((row, index) => {
            const show = index % labelEvery === 0 || index === rows.length - 1;
            return (
              <div key={row.date} className="min-w-0 flex-1 text-center">
                {show ? (
                  <span className="block whitespace-nowrap text-[10px] text-slate-500">{row.label}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {showTable && (
        <div className="border-t border-slate-200">
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3">Day</th>
                  <th className="px-6 py-3 text-right">New visitors</th>
                  <th className="px-6 py-3 text-right">Active visitors</th>
                  <th className="px-6 py-3 text-right">Button clicks</th>
                  <th className="px-6 py-3 text-right">Checkout opens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-emerald-50/60 font-semibold text-slate-950">
                  <td className="px-6 py-3">Total, last {range} days</td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">{totals.newVisitors}</td>
                  <td className="px-6 py-3 text-right font-mono text-slate-400 tabular-nums">-</td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">{totals.buttonClicks}</td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">{totals.checkoutOpens}</td>
                </tr>
                {tableRows.map((row) => {
                  const isToday = row.date === todayKey;
                  const cell = (value: number) =>
                    value === 0 ? 'text-slate-400' : 'font-semibold text-slate-950';
                  return (
                    <tr key={row.date} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-3 font-medium text-slate-900">
                        {weekdayLabel(row.date)}
                        {isToday && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            Today
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-3 text-right font-mono tabular-nums ${cell(row.newVisitors)}`}>
                        {row.newVisitors}
                      </td>
                      <td className={`px-6 py-3 text-right font-mono tabular-nums ${cell(row.activeVisitors)}`}>
                        {row.activeVisitors}
                      </td>
                      <td className={`px-6 py-3 text-right font-mono tabular-nums ${cell(row.buttonClicks)}`}>
                        {row.buttonClicks}
                      </td>
                      <td className={`px-6 py-3 text-right font-mono tabular-nums ${cell(row.checkoutOpens)}`}>
                        {row.checkoutOpens}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
            New visitors counts a device once, on its first visit. Active visitors counts everyone with a recorded
            visit or click that day, so returning visitors appear there when they click.
          </p>
        </div>
      )}
    </section>
  );
}
