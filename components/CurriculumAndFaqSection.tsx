'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import AnimatedBotanicalBackdrop from './AnimatedBotanicalBackdrop';
import { FAQS } from '@/lib/guide-data';
import type { PricingSummary } from '@/lib/pricing';

interface CurriculumAndFaqSectionProps {
  pricing: PricingSummary;
  onOpenCheckout: () => void;
}

const COMPACT_HIGHLIGHTS = [
  {
    index: '01',
    title: 'Zero-Sub Agent Setup',
    summary:
      'Wire free open-source terminal agents and local/free models in minutes instead of paying $20–$200/month.',
  },
  {
    index: '02',
    title: '12 Scene Blueprints',
    summary:
      'Copy structured motion prompts so agents draw clean typography, SVG diagrams, and charts cleanly first try.',
  },
  {
    index: '03',
    title: '20-Minute Full Build',
    summary:
      'Watch the unedited workflow from empty directory to FFmpeg 60fps render and 4-minute SFX edit pass.',
  },
];

export default function CurriculumAndFaqSection({
  pricing,
  onOpenCheckout,
}: CurriculumAndFaqSectionProps) {
  const [openFaqId, setOpenFaqId] = useState<string>(FAQS[0].id);

  return (
    <>
      {/* Compact Playbook Overview Band (Short, crisp copy replacing previous long sections) */}
      <section
        id="inside"
        className="relative overflow-hidden border-t border-emerald-950/10 py-10 sm:py-14"
      >
        <AnimatedBotanicalBackdrop variant="section" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-emerald-950/10 pb-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-block h-5 w-1 rounded-full bg-blue-600"
              />
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                What’s Inside the Playbook
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-600">
              Free open-source tools · 20 min total build
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {COMPACT_HIGHLIGHTS.map((item) => (
              <div
                key={item.index}
                className="rounded-2xl border border-slate-200/90 bg-white/95 p-5"
              >
                <div className="font-mono text-xs font-bold text-blue-600 tabular-nums">
                  {item.index}
                </div>
                <h3 className="mt-1.5 font-display text-base font-bold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {item.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact FAQ + Single Button CTA */}
      <section id="faq" className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-6 w-1 rounded-full bg-blue-600"
            />
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                  >
                    <span className="font-display text-base font-semibold text-slate-950">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-4 pr-8 text-sm leading-relaxed text-slate-600">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onOpenCheckout}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap cursor-pointer"
            >
              <span>Claim Black Friday Access — ${pricing.effectivePrice}</span>
              {pricing.isSaleActive && (
                <span className="font-mono text-sm font-normal text-blue-200 line-through tabular-nums">
                  ${pricing.regularPrice}
                </span>
              )}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-bold text-slate-900">OpenFrame</span>
            <span aria-hidden="true">·</span>
            <span>Open-Source Code Animation Workflow</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#examples" className="hover:text-blue-600">
              Examples
            </a>
            <a href="#inside" className="hover:text-blue-600">
              Playbook
            </a>
            <a href="#faq" className="hover:text-blue-600">
              FAQ
            </a>
            <Link href="/login" className="font-medium text-blue-700 hover:text-blue-600">
              Admin Login
            </Link>
            <span className="text-slate-400">© 2026 OpenFrame</span>
          </div>
        </div>
      </footer>
    </>
  );
}
