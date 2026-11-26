'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import TopNav from './TopNav';
import HeroSection from './HeroSection';
import CurriculumAndFaqSection from './CurriculumAndFaqSection';
import VideoPreviewModal from './VideoPreviewModal';
import CheckoutModal from './CheckoutModal';
import { HERO_VIDEO_PLACEHOLDERS, type HeroVideoPlaceholder } from '@/lib/guide-data';
import {
  calculateBlackFridayPricing,
  getCountdownToBlackFriday,
} from '@/lib/pricing';
import type { CrucialButtonId } from '@/lib/analytics';
import { trackAnalyticsEvent } from '@/lib/track-client';

interface LandingClientProps {
  initialTimestampMs: number;
}

export default function LandingClient({ initialTimestampMs }: LandingClientProps) {
  const [nowMs, setNowMs] = useState<number>(initialTimestampMs);
  const [selectedVideo, setSelectedVideo] = useState<HeroVideoPlaceholder | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const visitLoggedRef = useRef(false);

  // Live 1s countdown tick
  useEffect(() => {
    const firstTick = window.setTimeout(() => {
      setNowMs(Date.now());
    }, 0);
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(id);
    };
  }, []);

  // Track initial landing page visit once per mount
  useEffect(() => {
    if (visitLoggedRef.current) return;
    visitLoggedRef.current = true;
    void trackAnalyticsEvent({ type: 'page_visit' });
  }, []);

  const pricing = calculateBlackFridayPricing(nowMs);
  const countdown = getCountdownToBlackFriday(nowMs);

  const handleOpenCheckout = (buttonId: CrucialButtonId) => {
    void trackAnalyticsEvent({ type: 'cta_click', buttonId });
    setCheckoutOpen(true);
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
              ? `Claim Black Friday Access — $${pricing.effectivePrice}`
              : `Get the Guide — $${pricing.effectivePrice}`}
          </span>
          {pricing.isSaleActive && (
            <span className="font-mono text-xs font-normal text-blue-200 line-through tabular-nums sm:text-sm">
              ${pricing.regularPrice}
            </span>
          )}
          <span className="hidden text-xs font-medium text-blue-100 sm:inline">
            · Black Friday Sale
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>

      <VideoPreviewModal
        key={selectedVideo?.id ?? 'closed'}
        placeholder={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onGetGuide={() => handleOpenCheckout('modal_get_guide')}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        pricing={pricing}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
