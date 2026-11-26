import LandingClient from '@/components/LandingClient';

const SSR_FALLBACK_TIMESTAMP_MS = new Date('2026-11-26T05:26:00').getTime();

export default function HomePage() {
  return <LandingClient initialTimestampMs={SSR_FALLBACK_TIMESTAMP_MS} />;
}
