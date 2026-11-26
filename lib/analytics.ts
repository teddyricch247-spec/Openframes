export type AnalyticsEventType = 'page_visit' | 'cta_click' | 'checkout_submit';

export type CrucialButtonId =
  | 'nav_get_guide'
  | 'hero_get_guide'
  | 'bento_unlock_guide'
  | 'final_claim_offer'
  | 'modal_get_guide'
  | 'sticky_bottom_cta'
  | 'video_placeholder_preview'
  | 'workflow_step_select';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  visitorId: string;
  countryCode: string;
  countryName: string;
  timezone: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  referrer: string;
  buttonId?: CrucialButtonId;
  buttonLabel?: string;
  metadata?: string;
  revenueUsd?: number;
}

export interface CountryMetric {
  countryCode: string;
  countryName: string;
  visits: number;
  ctaClicks: number;
  conversions: number;
  conversionRate: number;
  sharePercent: number;
}

export interface ButtonMetric {
  buttonId: CrucialButtonId;
  label: string;
  clicks: number;
  sharePercent: number;
  opensCheckout: boolean;
}

export interface TimelineBucket {
  label: string;
  visits: number;
  conversions: number;
}

export interface AnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  crucialButtonClicks: number;
  checkoutOpens: number;
  completedConversions: number;
  estimatedRevenueUsd: number;
  ctaClickRate: number;
  overallConversionRate: number;
  checkoutCompletionRate: number;
  countriesCount: number;
  countryBreakdown: CountryMetric[];
  buttonBreakdown: ButtonMetric[];
  timeline: TimelineBucket[];
  recentEvents: AnalyticsEvent[];
}

const COUNTRY_NAME_MAP: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  AU: 'Australia',
  IN: 'India',
  JP: 'Japan',
  SG: 'Singapore',
  BR: 'Brazil',
  SE: 'Sweden',
  ES: 'Spain',
  IT: 'Italy',
  PL: 'Poland',
  KR: 'South Korea',
  NG: 'Nigeria',
  ZA: 'South Africa',
  MX: 'Mexico',
  IE: 'Ireland',
};

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Amsterdam': 'NL',
  'Europe/Stockholm': 'SE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Warsaw': 'PL',
  'Asia/Tokyo': 'JP',
  'Asia/Singapore': 'SG',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Seoul': 'KR',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX',
  'Africa/Lagos': 'NG',
  'Africa/Johannesburg': 'ZA',
};

export const CHECKOUT_BUTTON_IDS: ReadonlySet<CrucialButtonId> = new Set([
  'nav_get_guide',
  'hero_get_guide',
  'bento_unlock_guide',
  'final_claim_offer',
  'modal_get_guide',
  'sticky_bottom_cta',
]);

export const BUTTON_LABELS: Record<CrucialButtonId, string> = {
  nav_get_guide: 'Top Nav: Get Guide — $17',
  hero_get_guide: 'Hero CTA: Get the Guide — $17',
  bento_unlock_guide: 'Inside Guide: Unlock Full Guide',
  final_claim_offer: 'Offer Card: Claim Black Friday Access',
  modal_get_guide: 'Video Modal: Get 20-Min Guide',
  sticky_bottom_cta: 'Sticky Bottom Bar: Get Guide — $17',
  video_placeholder_preview: 'Hero Bento: Video Placeholder Preview',
  workflow_step_select: '20-Min Pipeline: Step Inspection',
};

export function resolveVisitorCountry(params: {
  headerCountry?: string | null;
  timezone?: string | null;
  acceptLanguage?: string | null;
}): { countryCode: string; countryName: string } {
  const cleanHeader = params.headerCountry?.trim().toUpperCase();
  if (cleanHeader && cleanHeader !== 'XX' && cleanHeader !== 'T1' && /^[A-Z]{2}$/.test(cleanHeader)) {
    return {
      countryCode: cleanHeader,
      countryName: COUNTRY_NAME_MAP[cleanHeader] ?? cleanHeader,
    };
  }

  const tz = params.timezone?.trim();
  if (tz && TIMEZONE_TO_COUNTRY[tz]) {
    const code = TIMEZONE_TO_COUNTRY[tz];
    return {
      countryCode: code,
      countryName: COUNTRY_NAME_MAP[code] ?? code,
    };
  }

  if (params.acceptLanguage) {
    const match = params.acceptLanguage.match(/[a-z]{2,3}[-_]([A-Z]{2})/);
    if (match && match[1]) {
      const code = match[1].toUpperCase();
      return {
        countryCode: code,
        countryName: COUNTRY_NAME_MAP[code] ?? code,
      };
    }
  }

  return { countryCode: 'US', countryName: 'United States' };
}

export function detectDeviceType(userAgent?: string | null): 'Desktop' | 'Mobile' | 'Tablet' {
  if (!userAgent) return 'Desktop';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'Tablet';
  if (/mobile|iphone|android/.test(ua)) return 'Mobile';
  return 'Desktop';
}

function roundRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export function deduplicatePageVisits(events: AnalyticsEvent[]): AnalyticsEvent[] {
  const seenVisitors = new Set<string>();
  const result: AnalyticsEvent[] = [];

  for (const event of events) {
    if (event.type !== 'page_visit') {
      result.push(event);
      continue;
    }
    if (seenVisitors.has(event.visitorId)) {
      continue;
    }
    seenVisitors.add(event.visitorId);
    result.push(event);
  }

  return result;
}

export function computeAnalyticsSummary(rawEvents: AnalyticsEvent[]): AnalyticsSummary {
  const events = deduplicatePageVisits(rawEvents);
  const visits = events.filter((e) => e.type === 'page_visit');
  const clicks = events.filter((e) => e.type === 'cta_click');
  const conversions = events.filter((e) => e.type === 'checkout_submit');

  const uniqueVisitorIds = new Set(visits.map((v) => v.visitorId));
  const checkoutOpens = clicks.filter(
    (c) => c.buttonId && CHECKOUT_BUTTON_IDS.has(c.buttonId)
  ).length;

  const estimatedRevenueUsd = conversions.reduce((sum, c) => sum + (c.revenueUsd ?? 17), 0);

  // Country aggregation
  const countryMap = new Map<
    string,
    { countryCode: string; countryName: string; visits: number; ctaClicks: number; conversions: number }
  >();

  for (const event of events) {
    const code = event.countryCode || 'US';
    const existing = countryMap.get(code) ?? {
      countryCode: code,
      countryName: event.countryName || COUNTRY_NAME_MAP[code] || code,
      visits: 0,
      ctaClicks: 0,
      conversions: 0,
    };

    if (event.type === 'page_visit') existing.visits += 1;
    if (event.type === 'cta_click') existing.ctaClicks += 1;
    if (event.type === 'checkout_submit') existing.conversions += 1;
    countryMap.set(code, existing);
  }

  const totalVisits = visits.length;

  const countryBreakdown: CountryMetric[] = Array.from(countryMap.values())
    .map((c) => ({
      ...c,
      conversionRate: roundRate(c.conversions, c.visits),
      sharePercent: roundRate(c.visits, totalVisits),
    }))
    .sort((a, b) => b.visits - a.visits || b.conversions - a.conversions);

  // Button aggregation
  const buttonCounts = new Map<CrucialButtonId, number>();
  for (const click of clicks) {
    if (!click.buttonId) continue;
    buttonCounts.set(click.buttonId, (buttonCounts.get(click.buttonId) ?? 0) + 1);
  }

  const totalClicks = clicks.length;
  const buttonBreakdown: ButtonMetric[] = (Object.keys(BUTTON_LABELS) as CrucialButtonId[])
    .map((id) => {
      const count = buttonCounts.get(id) ?? 0;
      return {
        buttonId: id,
        label: BUTTON_LABELS[id],
        clicks: count,
        sharePercent: roundRate(count, totalClicks),
        opensCheckout: CHECKOUT_BUTTON_IDS.has(id),
      };
    })
    .sort((a, b) => b.clicks - a.clicks);

  // Daily timeline aggregation (sorted chronologically)
  const dayBuckets = new Map<string, { visits: number; conversions: number; sortKey: string }>();
  for (const event of events) {
    const d = new Date(event.timestamp);
    if (Number.isNaN(d.getTime())) continue;
    const sortKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const entry = dayBuckets.get(sortKey) ?? { visits: 0, conversions: 0, sortKey };
    if (event.type === 'page_visit') entry.visits += 1;
    if (event.type === 'checkout_submit') entry.conversions += 1;
    dayBuckets.set(sortKey, { ...entry, visits: entry.visits, conversions: entry.conversions });
  }

  const timeline: TimelineBucket[] = Array.from(dayBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sortKey, val]) => {
      const d = new Date(`${sortKey}T12:00:00Z`);
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        visits: val.visits,
        conversions: val.conversions,
      };
    });

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  return {
    totalVisits,
    uniqueVisitors: uniqueVisitorIds.size,
    crucialButtonClicks: totalClicks,
    checkoutOpens,
    completedConversions: conversions.length,
    estimatedRevenueUsd,
    ctaClickRate: roundRate(checkoutOpens, totalVisits),
    overallConversionRate: roundRate(conversions.length, totalVisits),
    checkoutCompletionRate: roundRate(conversions.length, checkoutOpens),
    countriesCount: countryBreakdown.filter((c) => c.visits > 0).length,
    countryBreakdown,
    buttonBreakdown,
    timeline,
    recentEvents,
  };
}
