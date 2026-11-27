'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import TopNav from './TopNav';
import HeroSection from './HeroSection';
import CurriculumAndFaqSection from './CurriculumAndFaqSection';
import VideoPreviewModal from './VideoPreviewModal';
import CheckoutPage from './CheckoutPage';
import { HERO_VIDEO_PLACEHOLDERS, type HeroVideoPlaceholder } from '@/lib/guide-data';
import { calculateSalePricing, getSaleCountdown } from '@/lib/pricing';
import { resolveFlashSaleEndMs } from '@/lib/flash-sale';
import { CHECKOUT_HASH } from '@/lib/whop';
import type { CrucialButtonId } from '@/lib/analytics';
import { trackAnalyticsEvent, trackVisitWhenHuman } from '@/lib/track-client';

interface LandingClientProps {
  initialTimestampMs: number;
}

export default function LandingClient({ initialTimestampMs }: LandingClientProps) {
  const [nowMs, setNowMs] = useState<number>(initialTimestampMs);
  // This visitor's own flash-sale deadline. Stays null while Black Friday is still running.
  const [flashEndMs, setFlashEndMs] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<HeroVideoPlaceholder | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const visitLoggedRef = useRef(false);
  const checkoutHashPushedRef = useRef(false);

  // Live 1s tick: updates the clock and rolls the flash sale (start / reset at 00:00) in the same update
  useEffect(() => {
    const sync = () => {
      const now = Date.now();
      setNowMs(now);
      setFlashEndMs(resolveFlashSaleEndMs(now));
    };
    const firstTick = window.setTimeout(sync, 0);
    const id = window.setInterval(sync, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(id);
    };
  }, []);

  // Count the visit once, and only after a real person interacts with the page
  useEffect(() => {
    if (visitLoggedRef.current) return;
    visitLoggedRef.current = true;
    trackVisitWhenHuman();
  }, []);

  // The payment page follows the URL hash (#checkout), so the browser Back button closes it
  // and a direct link to /#checkout opens it.
  useEffect(() => {
    const syncFromHash = () => {
      const isCheckoutHash = window.location.hash === CHECKOUT_HASH;
      if (!isCheckoutHash) checkoutHashPushedRef.current = false;
      setCheckoutOpen(isCheckoutHash);
    };
    const firstSync = window.setTimeout(syncFromHash, 0);
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.clearTimeout(firstSync);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, []);

  const pricing = calculateSalePricing(nowMs, flashEndMs);
  const countdown = getSaleCountdown(nowMs, flashEndMs);

  const openCheckout = () => {
    if (window.location.hash !== CHECKOUT_HASH) {
      checkoutHashPushedRef.current = true;
      window.location.hash = CHECKOUT_HASH;
    }
    setCheckoutOpen(true);
  };

  const closeCheckout = useCallback(() => {
    setCheckoutOpen(false);
    if (window.location.hash !== CHECKOUT_HASH) return;
    if (checkoutHashPushedRef.current) {
      // We added the history entry ourselves, so step back out of it
      checkoutHashPushedRef.current = false;
      window.history.back();
    } else {
      // Page was opened straight on /#checkout: drop the hash without leaving the site
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const handleOpenCheckout = (buttonId: CrucialButtonId) => {
    void trackAnalyticsEvent({ type: 'cta_click', buttonId });
    openCheckout();
  };

  const handleSelectPlaceholder = (item: HeroVideoPlaceholder) => {
    void trackAnalyticsEvent({
      type: 'cta_click',
      buttonId: 'video_placeholder_preview',
      metadata: item.title,
    });
    setSelectedVideo(item);
  };

  return (
    <div className="min-h-screen bg-white pb-16 text-slate-900">
      <TopNav
        salePrice={pricing.effectivePrice}
        onOpenCheckout={() => handleOpenCheckout('nav_get_guide')}
      />

      <main>
        <HeroSection
          placeholders={HERO_VIDEO_PLACEHOLDERS}
          pricing={pricing}
          countdown={countdown}
          onSelectPlaceholder={handleSelectPlaceholder}
          onOpenCheckout={() => handleOpenCheckout('hero_get_guide')}
        />

        <CurriculumAndFaqSection
          pricing={pricing}
          onOpenCheckout={() => handleOpenCheckout('final_claim_offer')}
        />
      </main>

      {/* Always-visible full-width fixed bottom CTA bar across mobile & desktop */}
      <div
        data-testid="sticky-bottom-cta-bar"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-500/40 bg-blue-600 shadow-[0_-6px_24px_rgba(15,23,42,0.16)] pb-[env(safe-area-inset-bottom)]"
      >
        <button
          type="button"
          onClick={() => handleOpenCheckout('sticky_bottom_cta')}
          className="flex h-14 w-full items-center justify-center gap-2.5 bg-blue-600 px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:h-14 sm:text-base cursor-pointer"
        >
          <span>
            {pricing.isSaleActive
              ? `Claim ${pricing.saleAccessLabel} — $${pricing.effectivePrice}`
              : `Get the Guide — $${pricing.effectivePrice}`}
          </span>
          {pricing.isSaleActive && (
            <span className="font-mono text-xs font-normal text-blue-200 line-through tabular-nums sm:text-sm">
              ${pricing.regularPrice}
            </span>
          )}
          {pricing.isSaleActive && (
            <span className="hidden text-xs font-medium text-blue-100 sm:inline">
              · {pricing.saleName}
            </span>
          )}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>

      <VideoPreviewModal
        key={selectedVideo?.id ?? 'closed'}
        placeholder={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onGetGuide={() => handleOpenCheckout('modal_get_guide')}
      />

      {/* Payment page: always mounted and pre-loading, just hidden until a buy button is clicked */}
      <CheckoutPage
        isOpen={checkoutOpen}
        pricing={pricing}
        countdown={countdown}
        onClose={closeCheckout}
      />
    </div>
  );
}
