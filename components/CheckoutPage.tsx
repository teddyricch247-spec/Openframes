'use client';

import { useEffect, useRef, useState } from 'react';
import { preconnect, preload } from 'react-dom';
import Script from 'next/script';
import { ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import { formatPadTwo, type CountdownBreakdown, type PricingSummary } from '@/lib/pricing';
import { WHOP_CHECKOUT_URL, WHOP_LOADER_SRC, WHOP_PLAN_ID } from '@/lib/whop';

interface CheckoutPageProps {
  isOpen: boolean;
  pricing: PricingSummary;
  countdown: CountdownBreakdown;
  onClose: () => void;
}

/**
 * Full-screen payment "page" that lives inside the landing page.
 *
 * It is mounted from the first render and the Whop checkout starts loading right away, while the page
 * is only hidden (visibility + opacity, NOT display:none or unmounted). Opening it just reveals the
 * already-loaded checkout, so there is no wait when someone clicks a buy button.
 */
export default function CheckoutPage({ isOpen, pricing, countdown, onClose }: CheckoutPageProps) {
  const [embedReady, setEmbedReady] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  // Hints so the browser opens connections to Whop and fetches the loader before hydration finishes.
  preconnect('https://whop.com');
  preconnect('https://js.whop.com');
  preload(WHOP_LOADER_SRC, { as: 'script' });

  // Always call the latest onClose without re-running the effects below (the parent re-renders every second).
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Hide the loading placeholder once Whop's iframe has loaded (with a safety timeout).
  useEffect(() => {
    const host = embedRef.current;
    if (!host) return;

    let watchedFrame: HTMLIFrameElement | null = null;
    const watch = () => {
      const frame = host.querySelector('iframe');
      if (!frame || frame === watchedFrame) return;
      watchedFrame = frame;
      frame.addEventListener('load', () => setEmbedReady(true), { once: true });
    };

    watch();
    const observer = new MutationObserver(watch);
    observer.observe(host, { childList: true, subtree: true });
    const safetyTimer = window.setTimeout(() => setEmbedReady(true), 8000);

    return () => {
      observer.disconnect();
      window.clearTimeout(safetyTimer);
    };
  }, []);

  // While open: lock page scroll behind it, close on Escape.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  // On open: start at the top and put focus on the Back button.
  useEffect(() => {
    if (!isOpen) return;
    overlayRef.current?.scrollTo({ top: 0 });
    backButtonRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      <Script src={WHOP_LOADER_SRC} strategy="afterInteractive" />

      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Secure checkout"
        aria-hidden={!isOpen}
        inert={!isOpen}
        data-testid="checkout-page"
        className={`fixed inset-0 z-50 overflow-y-auto bg-slate-50 transition-opacity duration-150 ${
          isOpen ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'
        }`}
      >
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-3 px-4">
            <button
              ref={backButtonRef}
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Lock className="h-3.5 w-3.5 text-emerald-700" />
              Secure checkout
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-xl px-4 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-emerald-700">
                  {pricing.isSaleActive ? pricing.saleName : 'Standard Edition'}
                </p>
                <h2 className="mt-0.5 font-display text-base font-bold text-slate-950">
                  OpenFrame 20-Min Animation Guide
                </h2>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl font-bold text-blue-700 tabular-nums">
                  ${pricing.effectivePrice}
                </p>
                {pricing.isSaleActive && (
                  <p className="font-mono text-xs text-slate-500 line-through tabular-nums">
                    ${pricing.regularPrice}
                  </p>
                )}
              </div>
            </div>

            {pricing.isSaleActive && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-950 px-3 py-2">
                <span className="text-xs font-medium text-slate-300">Sale ends in:</span>
                <span
                  aria-label={`${pricing.saleName} countdown`}
                  className="font-mono text-xs font-bold text-sky-300 tabular-nums whitespace-nowrap"
                >
                  {formatPadTwo(countdown.days)}d : {formatPadTwo(countdown.hours)}h :{' '}
                  {formatPadTwo(countdown.minutes)}m : {formatPadTwo(countdown.seconds)}s
                </span>
              </div>
            )}
          </div>

          <div className="relative mt-4 min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {!embedReady && (
              <div
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-slate-500"
              >
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                Loading secure checkout…
              </div>
            )}

            {/* Whop's loader finds this element and mounts the checkout inside it. React never renders children here. */}
            <div
              ref={embedRef}
              data-whop-checkout-plan-id={WHOP_PLAN_ID}
              data-whop-checkout-theme="light"
              className="relative z-[1]"
            />
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Checkout not loading?{' '}
            <a
              href={WHOP_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
            >
              Open it in a new tab
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <p className="mt-2 text-center text-xs text-slate-500">
            One-time payment · Lifetime updates · Zero recurring AI subscriptions required
          </p>
        </main>
      </div>
    </>
  );
}
