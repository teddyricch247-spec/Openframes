'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowRight, ChevronDown, ChevronUp, Play } from 'lucide-react';
import AnimatedBotanicalBackdrop from './AnimatedBotanicalBackdrop';
import type { HeroVideoPlaceholder } from '@/lib/guide-data';
import {
  formatPadTwo,
  type CountdownBreakdown,
  type PricingSummary,
} from '@/lib/pricing';

interface HeroSectionProps {
  placeholders: HeroVideoPlaceholder[];
  pricing: PricingSummary;
  countdown: CountdownBreakdown;
  onSelectPlaceholder: (item: HeroVideoPlaceholder) => void;
  onOpenCheckout: () => void;
}

function VideoCard({
  item,
  onSelect,
  sizes,
  className = '',
}: {
  item: HeroVideoPlaceholder;
  onSelect: (item: HeroVideoPlaceholder) => void;
  sizes: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-label={`Preview ${item.title} animation scene`}
      className={`group relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-slate-900/15 bg-slate-950 text-left shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer ${className}`}
    >
      <Image
        src={item.imageSrc}
        alt={item.title}
        fill
        sizes={sizes}
        referrerPolicy="no-referrer"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />

      {/* Minimal play button */}
      <span className="absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/45 text-white backdrop-blur-xs transition-colors duration-150 group-hover:bg-blue-600">
        <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
      </span>

      {/* Subtle bottom scrim with concise title only */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-3 pb-3 pt-8">
        <h3 className="font-display text-xs font-bold leading-tight text-white sm:text-sm">
          {item.title}
        </h3>
      </div>
    </button>
  );
}

interface ArcPose {
  y: number;
  x: number;
  rotate: number;
  scale: number;
  zIndex: number;
  opacity: number;
}

function getArcPose(relOffset: number): ArcPose {
  switch (relOffset) {
    case 0:
      return { y: -4, x: 0, rotate: 0, scale: 1, zIndex: 50, opacity: 1 };
    case 1:
      return { y: 16, x: 42, rotate: 10, scale: 0.92, zIndex: 40, opacity: 0.96 };
    case 2:
      return { y: 40, x: 74, rotate: 19, scale: 0.85, zIndex: 30, opacity: 0.86 };
    case 3:
      return { y: 62, x: 88, rotate: 26, scale: 0.78, zIndex: 15, opacity: 0.62 };
    case -1:
      return { y: 16, x: -42, rotate: -10, scale: 0.92, zIndex: 40, opacity: 0.96 };
    default:
      return { y: 40, x: -74, rotate: -19, scale: 0.85, zIndex: 30, opacity: 0.86 };
  }
}

function getCircularOffset(index: number, activeIndex: number, length: number): number {
  let diff = (index - activeIndex + length) % length;
  if (diff > Math.floor(length / 2)) {
    diff -= length;
  }
  return diff;
}

function MobileArcVideoDeck({
  placeholders,
  onSelectPlaceholder,
}: {
  placeholders: HeroVideoPlaceholder[];
  onSelectPlaceholder: (item: HeroVideoPlaceholder) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [interactionTick, setInteractionTick] = useState(0);
  const pointerStartRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const lastWheelAtRef = useRef(0);

  const count = placeholders.length;

  // Auto-cycle top playing card every 3.4 seconds
  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 3400);
    return () => window.clearInterval(id);
  }, [count, interactionTick]);

  const stepCard = (delta: number) => {
    setActiveIndex((prev) => (prev + delta + count) % count);
    setInteractionTick((t) => t + 1);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, active: true };
    suppressClickRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current?.active) return;
    const dy = e.clientY - pointerStartRef.current.y;
    const dx = e.clientX - pointerStartRef.current.x;
    if (Math.abs(dy) > 8 || Math.abs(dx) > 8) {
      suppressClickRef.current = true;
    }
    setDragOffset({
      x: Math.max(-88, Math.min(88, dx)),
      y: Math.max(-72, Math.min(72, dy)),
    });
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current?.active) return;
    const dy = e.clientY - pointerStartRef.current.y;
    const dx = e.clientX - pointerStartRef.current.x;
    pointerStartRef.current = null;
    setDragOffset({ x: 0, y: 0 });

    if (dy <= -28 || dx <= -32) {
      stepCard(1);
    } else if (dy >= 28 || dx >= 32) {
      stepCard(-1);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastWheelAtRef.current < 360) return;
    if (Math.abs(e.deltaY) >= 18 || Math.abs(e.deltaX) >= 18) {
      lastWheelAtRef.current = now;
      const dir = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      stepCard(dir > 0 ? 1 : -1);
    }
  };

  return (
    <div
      data-testid="mobile-arc-video-deck"
      className="lg:hidden flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center py-5"
    >
      {/* Fanned Playing-Card Arc Stage with 9:16 Portrait Cards */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
        aria-roledescription="carousel"
        aria-label="Playing-card arc stack of 9:16 animation previews"
        className="relative flex h-[436px] w-full max-w-[366px] items-center justify-center select-none"
      >
        {placeholders.map((item, idx) => {
          const rel = getCircularOffset(idx, activeIndex, count);
          const pose = getArcPose(rel);
          const isTop = rel === 0;
          const isDragging = isTop && (dragOffset.x !== 0 || dragOffset.y !== 0);
          const liveX = isTop ? pose.x + dragOffset.x : pose.x;
          const liveY = isTop ? pose.y + dragOffset.y : pose.y;
          const liveRotate = isTop ? pose.rotate + dragOffset.x * 0.12 : pose.rotate;

          return (
            <motion.div
              key={item.id}
              data-card-active={isTop ? 'true' : 'false'}
              animate={{
                x: liveX,
                y: liveY,
                rotate: liveRotate,
                scale: pose.scale,
                opacity: pose.opacity,
              }}
              transition={
                isDragging
                  ? { duration: 0.04 }
                  : { type: 'spring', stiffness: 260, damping: 23, mass: 0.9 }
              }
              style={{ zIndex: pose.zIndex, transformOrigin: '50% 115%' }}
              className="absolute aspect-[9/16] w-[184px] sm:w-[202px]"
            >
              <button
                type="button"
                onClick={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  if (isTop) {
                    onSelectPlaceholder(item);
                  } else {
                    setActiveIndex(idx);
                    setInteractionTick((t) => t + 1);
                  }
                }}
                aria-label={
                  isTop
                    ? `Preview ${item.title} animation scene`
                    : `Bring ${item.title} to front`
                }
                className={`group relative h-full w-full overflow-hidden rounded-2xl border bg-slate-950 text-left shadow-xl transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer ${
                  isTop ? 'border-white/55 shadow-blue-950/30' : 'border-white/25 shadow-slate-950/25'
                }`}
              >
                <Image
                  src={item.imageSrc}
                  alt={item.title}
                  fill
                  sizes="202px"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />

                <span className="absolute right-2.5 top-2.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/45 text-white backdrop-blur-xs transition-colors duration-150 group-hover:bg-blue-600">
                  <Play className="ml-0.5 h-3 w-3 fill-current" />
                </span>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent px-3 pb-2.5 pt-7">
                  <h3 className="font-display text-xs font-bold leading-tight text-white">
                    {item.title}
                  </h3>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Tactile Stack Controls */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => stepCard(-1)}
          aria-label="Previous video card"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors hover:border-blue-300 hover:text-blue-600 cursor-pointer"
        >
          <ChevronUp className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5" role="group" aria-label="Select video card">
          {placeholders.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveIndex(idx);
                setInteractionTick((t) => t + 1);
              }}
              aria-label={`Show card ${idx + 1}: ${item.title}`}
              aria-current={idx === activeIndex ? 'true' : undefined}
              className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                idx === activeIndex ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => stepCard(1)}
          aria-label="Next video card"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors hover:border-blue-300 hover:text-blue-600 cursor-pointer"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function HeroSection({
  placeholders,
  pricing,
  countdown,
  onSelectPlaceholder,
  onOpenCheckout,
}: HeroSectionProps) {
  return (
    <section
      id="examples"
      className="relative overflow-hidden border-b border-emerald-950/10 pb-6 pt-2 sm:pb-10 sm:pt-6"
    >
      <AnimatedBotanicalBackdrop variant="hero" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* 1. ALL 6 9:16 ANIMATION SHOWCASE CARDS FIRST */}
        <MobileArcVideoDeck
          placeholders={placeholders}
          onSelectPlaceholder={onSelectPlaceholder}
        />

        <div
          data-testid="desktop-9x16-grid"
          className="hidden lg:grid lg:grid-cols-6 lg:gap-4"
        >
          {placeholders.map((item) => (
            <VideoCard
              key={item.id}
              item={item}
              onSelect={onSelectPlaceholder}
              sizes="(min-width: 1024px) 180px, 200px"
            />
          ))}
        </div>

        {/* 2. BLACK FRIDAY OFFER & HEADLINE STAGE (Takes nearly full 9:16 mobile screen on scroll) */}
        <div
          data-testid="mobile-offer-stage"
          className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-4xl flex-col items-center justify-center py-12 text-center lg:mt-8 lg:min-h-0 lg:py-0"
        >
          <div className="inline-flex flex-wrap items-center justify-center rounded-full border border-slate-900/12 bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-900 shadow-sm sm:text-sm">
            <span>Black Friday Sale • </span>
            <span className="ml-1 font-mono font-bold text-blue-700 tabular-nums">
              {pricing.isSaleActive
                ? `Save $${pricing.savingsAmount} (${pricing.discountPercent}% off)`
                : 'Standard Edition'}
            </span>
          </div>

          <h1
            className="mt-4 font-display font-extrabold tracking-tight text-slate-950 lg:mt-3"
            style={{
              fontSize: 'clamp(2.15rem, 3.6vw, 3rem)',
              lineHeight: 1.08,
              textWrap: 'balance',
            }}
          >
            Make code-drawn animations for free in 20 minutes.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-700 lg:mt-3 lg:text-[15px]">
            Skip the Claude Code subscription. Get the exact open-source agent setup, prompt
            blueprints, and rapid edit system I use to go from blank folder to finished animation
            in 20 minutes of actual work.
          </p>

          {/* Single Primary CTA + High-Contrast Sale Countdown */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 lg:mt-5 lg:flex-row lg:gap-5">
            <button
              type="button"
              onClick={onOpenCheckout}
              className="inline-flex w-full max-w-xs items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap cursor-pointer lg:w-auto lg:px-6 lg:py-3"
            >
              <span>Get the Guide — ${pricing.effectivePrice}</span>
              {pricing.isSaleActive && (
                <span className="font-mono text-sm font-normal text-blue-200 line-through tabular-nums">
                  ${pricing.regularPrice}
                </span>
              )}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="inline-flex flex-col items-center gap-1 rounded-xl bg-slate-950 px-4 py-2.5 text-white shadow-sm sm:flex-row sm:gap-2.5">
              <span className="text-xs font-medium text-slate-300 whitespace-nowrap">
                {countdown.isExpired ? 'Offer ended' : 'Sale ends in:'}
              </span>
              <span
                aria-label="Black Friday countdown"
                className="font-mono text-sm font-bold text-sky-300 tabular-nums whitespace-nowrap"
              >
                {formatPadTwo(countdown.days)}d : {formatPadTwo(countdown.hours)}h :{' '}
                {formatPadTwo(countdown.minutes)}m : {formatPadTwo(countdown.seconds)}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
