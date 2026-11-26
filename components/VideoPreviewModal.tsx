'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, Film, X } from 'lucide-react';
import type { HeroVideoPlaceholder } from '@/lib/guide-data';

interface VideoPreviewModalProps {
  placeholder: HeroVideoPlaceholder | null;
  onClose: () => void;
  onGetGuide: () => void;
}

export default function VideoPreviewModal({
  placeholder,
  onClose,
  onGetGuide,
}: VideoPreviewModalProps) {
  useEffect(() => {
    if (!placeholder) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [placeholder, onClose]);

  if (!placeholder) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-emerald-900/25 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="font-mono text-xs text-blue-600 tabular-nums">
              {placeholder.slotCode} · {placeholder.duration}
            </p>
            <h3
              id="video-modal-title"
              className="mt-0.5 font-display text-lg font-bold text-slate-950"
            >
              {placeholder.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scene preview"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-[200px_1fr] sm:items-center">
          <div className="relative mx-auto aspect-[9/16] w-[190px] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-md sm:w-full">
            <Image
              src={placeholder.imageSrc}
              alt={placeholder.title}
              fill
              sizes="200px"
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200/80 bg-blue-50/60 p-3.5">
              <Film className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{placeholder.toolStack}</p>
                <p className="mt-1 leading-relaxed text-slate-600">{placeholder.description}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onGetGuide();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              <span>Get the 20-Min Guide — $17</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
