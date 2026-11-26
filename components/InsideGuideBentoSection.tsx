'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Code2, Cpu, FolderGit2, Layers, Sparkles } from 'lucide-react';
import type { PricingSummary } from '@/lib/pricing';

interface InsideGuideBentoSectionProps {
  pricing: PricingSummary;
  onOpenCheckout: () => void;
}

export default function InsideGuideBentoSection({
  pricing,
  onOpenCheckout,
}: InsideGuideBentoSectionProps) {
  const [cadence, setCadence] = useState<'standard' | 'pro'>('standard');

  const monthlySubSaved = cadence === 'standard' ? 20 : 100;
  const yearlySavings = monthlySubSaved * 12;

  return (
    <section id="inside-guide" className="border-t border-slate-100 bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Reference-inspired section header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-6 w-1 rounded-full bg-blue-600"
            />
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
              Inside the Guide
            </h2>
          </div>
          <a
            href="#curriculum"
            className="text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-blue-600"
          >
            View all 6 modules
          </a>
        </div>

        {/* 3-Column Asymmetric Bento Grid matching "What New Today" in the reference */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Tall Featured Card (deep royal blue showcase matching Puva reference left card) */}
          <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 p-6 text-white lg:col-span-4">
            <div>
              <div className="text-xs font-medium text-emerald-300">
                Open-Source Efficiency · $0/mo Stack
              </div>
              <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-white">
                Zero Claude Code Subscription Required
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-blue-100/85">
                You do not need a recurring $20–$200/month coding agent plan to generate crisp,
                frame-accurate motion code. I show you the exact free open-source CLI agents and
                model endpoints that get the job done cleanly.
              </p>

              <div className="mt-6 space-y-2.5 border-t border-blue-800/70 pt-5 text-sm">
                {[
                  'OpenCode / Aider CLI setup in 3 minutes',
                  'Free-tier & local Ollama fallback routing',
                  'Remotion + SVG + Canvas 2D boilerplate',
                  'Full 20-minute real-time edit included',
                ].map((line) => (
                  <div key={line} className="flex items-start gap-2.5 text-blue-50">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-blue-800/70 pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-blue-200/80">Black Friday Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm text-blue-300/70 line-through tabular-nums">
                    ${pricing.regularPrice}
                  </span>
                  <span className="font-mono text-2xl font-bold text-white tabular-nums">
                    ${pricing.effectivePrice}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCheckout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 cursor-pointer"
              >
                <span>Unlock Full Guide</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Middle Column: 3 Stacked Clean Item Cards */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-4">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Cpu className="h-7 w-7" />
              </div>
              <div>
                <div className="text-xs font-medium text-blue-600">
                  Open-Source CLI · Setup
                </div>
                <h3 className="mt-1 font-display text-base font-bold leading-snug text-slate-950">
                  Copy-Paste Agent Config & Model Routing
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Ready-to-run config files for free coding models that output clean motion code.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Code2 className="h-7 w-7" />
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-700">
                  Templates · 12 Scenes
                </div>
                <h3 className="mt-1 font-display text-base font-bold leading-snug text-slate-950">
                  Prompt Blueprints That Nail Geometry First Try
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Structured scene prompts for charts, UI explainers, and kinetic typography.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Layers className="h-7 w-7" />
              </div>
              <div>
                <div className="text-xs font-medium text-blue-600">
                  Editing · 4 Minutes
                </div>
                <h3 className="mt-1 font-display text-base font-bold leading-snug text-slate-950">
                  Marker-Based Cut & Audio Sync Pass
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Finish sound effects, pacing trims, and final 60fps export inside 20 minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 2 Stacked Wide Cards */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-4">
            {/* Interactive Savings Comparison Card */}
            <div className="flex flex-1 flex-col justify-between rounded-2xl border border-blue-900/12 bg-gradient-to-br from-blue-50/70 via-white to-emerald-50/70 p-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-blue-900">
                    Annual Tooling Cost Comparison
                  </span>
                  <div className="inline-flex rounded-lg border border-blue-200 bg-white p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setCadence('standard')}
                      className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                        cadence === 'standard'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      $20/mo plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setCadence('pro')}
                      className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                        cadence === 'pro'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      $100/mo plan
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-extrabold text-slate-950 tabular-nums">
                    ${yearlySavings}
                  </span>
                  <span className="text-sm text-slate-600">saved per year</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Replace a ${monthlySubSaved}/month subscription with open-source tooling plus a{' '}
                  <span className="font-semibold text-emerald-700">
                    one-time ${pricing.effectivePrice} guide
                  </span>
                  .
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-3 text-xs">
                <div>
                  <div className="text-slate-500">Paid Subscription</div>
                  <div className="font-mono font-bold text-slate-900 tabular-nums">
                    ${yearlySavings}/yr
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">OpenFrame Stack</div>
                  <div className="font-mono font-bold text-emerald-700 tabular-nums">
                    ${pricing.effectivePrice} once
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Right Visual Card */}
            <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 p-5 text-white">
              <div className="flex items-center justify-between text-xs text-sky-300">
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <FolderGit2 className="h-4 w-4" />
                  STARTER REPOSITORY
                </span>
                <Sparkles className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="mt-6">
                <h3 className="font-display text-lg font-bold leading-snug text-white">
                  Includes Complete Starter Repo, FFmpeg Presets & Unedited 20-Min Walkthrough
                </h3>
                <p className="mt-1.5 text-xs text-slate-200/80">
                  Clone once, run locally, and watch every click from minute 00:00 to 20:00.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
