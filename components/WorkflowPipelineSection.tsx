'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Terminal, Check } from 'lucide-react';
import { WORKFLOW_STEPS, getTotalWorkflowMinutes } from '@/lib/guide-data';

interface WorkflowPipelineSectionProps {
  onStepSelect?: (stepTitle: string) => void;
}

export default function WorkflowPipelineSection({
  onStepSelect,
}: WorkflowPipelineSectionProps) {
  const [activeStepNumber, setActiveStepNumber] = useState<number>(1);
  const totalMinutes = getTotalWorkflowMinutes(WORKFLOW_STEPS);
  const activeStep =
    WORKFLOW_STEPS.find((s) => s.stepNumber === activeStepNumber) ?? WORKFLOW_STEPS[0];

  return (
    <section id="workflow" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Reference-inspired clean section header */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-6 w-1 rounded-full bg-blue-600"
            />
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
              The 20-Minute Production Pipeline
            </h2>
          </div>
          <span className="font-mono text-sm font-semibold text-emerald-700 tabular-nums">
            Total actual work: {totalMinutes} minutes (editing included)
          </span>
        </div>

        {/* 4 Numbered Horizontal Cards matching reference's "Trending Reviews" strip */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((step) => {
            const isSelected = step.stepNumber === activeStepNumber;
            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => {
                  setActiveStepNumber(step.stepNumber);
                  onStepSelect?.(step.title);
                }}
                aria-pressed={isSelected}
                className={`group relative flex items-start gap-3.5 rounded-xl border p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/55'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                {/* Mini graphic thumbnail + numbered blue badge (matching reference's blue numbered circles) */}
                <div className="relative flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-950 text-sky-300">
                  <span className="font-mono text-xs font-bold tabular-nums">
                    {step.durationMinutes}m
                  </span>
                  <span className="text-[10px] text-slate-300">{step.shortLabel}</span>
                  <span
                    className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold tabular-nums shadow-sm ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-blue-600 font-mono tabular-nums">
                    {step.minuteRange}
                  </div>
                  <h3 className="mt-1 font-display text-sm font-bold leading-snug text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 truncate">{step.toolUsed}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detail Strip */}
        <motion.div
          key={activeStep.stepNumber}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/45 p-6"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-blue-700">
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <Clock className="h-3.5 w-3.5" />
                  Step 0{activeStep.stepNumber} · {activeStep.minuteRange}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-800">
                  <Terminal className="h-3.5 w-3.5" />
                  {activeStep.toolUsed}
                </span>
              </div>
              <h3 className="mt-2 font-display text-xl font-bold text-slate-950">
                {activeStep.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                {activeStep.summary}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-white p-4 lg:col-span-4">
              <div className="text-xs font-medium text-slate-500">Stage Output</div>
              <div className="mt-1.5 flex items-start gap-2 text-sm font-semibold text-slate-900">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>{activeStep.deliverable}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
