export type AnalyticsEventType = 'page_visit' | 'cta_click';

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
  /** Salted hash of IP + browser traits. Only set on page_visit, used to spot the same person on a new browser session. */
  fingerprint?: string;
}

export interface CountryMetric {
  countryCode: string;
  countryName: string;
  visits: number;
  ctaClicks: number;
  sharePercent: number;
}

export interface ButtonMetric {
  buttonId: CrucialButtonId;
  label: string;
  clicks: number;
  sharePercent: number;
  opensCheckout: boolean;
}

export interface DailyBucket {
  /** Calendar day, YYYY-MM-DD, in the summary's time zone */
  date: string;
  /** Short label, e.g. "Nov 26" */
  label: string;
  /** First-ever visits from a device on this day */
  newVisitors: number;
  /** Distinct visitors with any recorded activity (visit or click) on this day */
  activeVisitors: number;
  buttonClicks: number;
  checkoutOpens: number;
}

export interface AnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  crucialButtonClicks: number;
  checkoutOpens: number;
  ctaClickRate: number;
  countriesCount: number;
  countryBreakdown: CountryMetric[];
  buttonBreakdown: ButtonMetric[];
  /** Oldest day first, today last. Days with no activity are included as zeros. */
  daily: DailyBucket[];
  /** IANA time zone used to split events into days */
  timeZone: string;
  recentEvents: AnalyticsEvent[];
}

export interface SummaryOptions {
  timeZone?: string;
  nowMs?: number;
  days?: number;
}

export const DEFAULT_DAILY_WINDOW_DAYS = 90;

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

function resolveTimeZone(timeZone?: string | null): string {
  if (!timeZone) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    return 'UTC';
  }
}

function createDayKeyFormatter(timeZone: string): (ms: number) => string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return (ms: number) => {
    const parts = formatter.formatToParts(new Date(ms));
    const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const month = parts.find((p) => p.type === 'month')?.value ?? '01';
    const day = parts.find((p) => p.type === 'day')?.value ?? '01';
    return `${year}-${month}-${day}`;
  };
}

function shiftDayKey(dayKey: string, deltaDays: number): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + deltaDays)).toISOString().slice(0, 10);
}

function labelForDayKey(dayKey: string): string {
  return new Date(`${dayKey}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function buildDailyBuckets(
  events: AnalyticsEvent[],
  options: SummaryOptions = {}
): { daily: DailyBucket[]; timeZone: string } {
  const timeZone = resolveTimeZone(options.timeZone);
  const nowMs = options.nowMs ?? Date.now();
  const days = Math.max(1, Math.min(options.days ?? DEFAULT_DAILY_WINDOW_DAYS, 366));
  const dayKeyOf = createDayKeyFormatter(timeZone);

  const todayKey = dayKeyOf(nowMs);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(shiftDayKey(todayKey, -i));
  }

  const buckets = new Map<
    string,
    { newVisitors: number; active: Set<string>; buttonClicks: number; checkoutOpens: number }
  >();
  for (const key of keys) {
    buckets.set(key, { newVisitors: 0, active: new Set<string>(), buttonClicks: 0, checkoutOpens: 0 });
  }

  for (const event of events) {
    const ms = Date.parse(event.timestamp);
    if (Number.isNaN(ms)) continue;
    const bucket = buckets.get(dayKeyOf(ms));
    if (!bucket) continue;

    bucket.active.add(event.visitorId);
    if (event.type === 'page_visit') {
      bucket.newVisitors += 1;
    } else if (event.type === 'cta_click') {
      bucket.buttonClicks += 1;
      if (event.buttonId && CHECKOUT_BUTTON_IDS.has(event.buttonId)) {
        bucket.checkoutOpens += 1;
      }
    }
  }

  const daily: DailyBucket[] = keys.map((key) => {
    const bucket = buckets.get(key)!;
    return {
      date: key,
      label: labelForDayKey(key),
      newVisitors: bucket.newVisitors,
      activeVisitors: bucket.active.size,
      buttonClicks: bucket.buttonClicks,
      checkoutOpens: bucket.checkoutOpens,
    };
  });

  return { daily, timeZone };
}

export function computeAnalyticsSummary(
  rawEvents: AnalyticsEvent[],
  options: SummaryOptions = {}
): AnalyticsSummary {
  const events = deduplicatePageVisits(rawEvents);
  const visits = events.filter((e) => e.type === 'page_visit');
  const clicks = events.filter((e) => e.type === 'cta_click');

  const uniqueVisitorIds = new Set(visits.map((v) => v.visitorId));
  const checkoutOpens = clicks.filter(
    (c) => c.buttonId && CHECKOUT_BUTTON_IDS.has(c.buttonId)
  ).length;

  // Country aggregation
  const countryMap = new Map<
    string,
    { countryCode: string; countryName: string; visits: number; ctaClicks: number }
  >();

  for (const event of events) {
    const code = event.countryCode || 'US';
    const existing = countryMap.get(code) ?? {
      countryCode: code,
      countryName: event.countryName || COUNTRY_NAME_MAP[code] || code,
      visits: 0,
      ctaClicks: 0,
    };

    if (event.type === 'page_visit') existing.visits += 1;
    if (event.type === 'cta_click') existing.ctaClicks += 1;
    countryMap.set(code, existing);
  }

  const totalVisits = visits.length;

  const countryBreakdown: CountryMetric[] = Array.from(countryMap.values())
    .map((c) => ({
      ...c,
      sharePercent: roundRate(c.visits, totalVisits),
    }))
    .sort((a, b) => b.visits - a.visits || b.ctaClicks - a.ctaClicks);

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

  const { daily, timeZone } = buildDailyBuckets(events, options);

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  return {
    totalVisits,
    uniqueVisitors: uniqueVisitorIds.size,
    crucialButtonClicks: totalClicks,
    checkoutOpens,
    ctaClickRate: roundRate(checkoutOpens, totalVisits),
    countriesCount: countryBreakdown.filter((c) => c.visits > 0).length,
    countryBreakdown,
    buttonBreakdown,
    daily,
    timeZone,
    recentEvents,
  };
}
