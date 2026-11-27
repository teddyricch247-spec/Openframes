export const REGULAR_PRICE_USD = 47;
export const BLACK_FRIDAY_PRICE_USD = 17;
// Local date-time string (no fixed timezone offset) so Black Friday always ends at 11:59:59 PM in the user's local timezone.
export const BLACK_FRIDAY_END_ISO = '2026-11-27T23:59:59';

export type SaleKind = 'black_friday' | 'flash';

export interface PricingSummary {
  regularPrice: number;
  salePrice: number;
  savingsAmount: number;
  discountPercent: number;
  isSaleActive: boolean;
  effectivePrice: number;
  /** Which sale is running: the one-off Black Friday sale, or the per-visitor rolling flash sale after it. */
  saleKind: SaleKind;
  /** Short name for badges and countdown labels, e.g. "Black Friday Sale" or "Flash Sale". */
  saleName: string;
  /** Used in button copy: "Claim {saleAccessLabel} — $17". */
  saleAccessLabel: string;
}

export interface CountdownBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export interface CheckoutFormInput {
  fullName: string;
  email: string;
}

export interface CheckoutValidationResult {
  valid: boolean;
  errors: {
    fullName?: string;
    email?: string;
  };
}

export function parseEndTimestampMs(endSpec: string = BLACK_FRIDAY_END_ISO): number {
  const hasExplicitOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(endSpec.trim());
  if (hasExplicitOffset) {
    return new Date(endSpec).getTime();
  }

  const localMatch = endSpec
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/);

  if (localMatch) {
    const year = Number(localMatch[1]);
    const monthIndex = Number(localMatch[2]) - 1;
    const day = Number(localMatch[3]);
    const hours = Number(localMatch[4] ?? '23');
    const minutes = Number(localMatch[5] ?? '59');
    const seconds = Number(localMatch[6] ?? '59');
    return new Date(year, monthIndex, day, hours, minutes, seconds, 999).getTime();
  }

  return new Date(endSpec).getTime();
}

function breakdownFromDiffMs(diffMs: number): CountdownBreakdown {
  const diff = Math.max(0, diffMs);

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

export function getCountdownToBlackFriday(
  nowMs: number,
  endIso: string = BLACK_FRIDAY_END_ISO
): CountdownBreakdown {
  return breakdownFromDiffMs(parseEndTimestampMs(endIso) - nowMs);
}

function buildPricing(isSaleActive: boolean, saleKind: SaleKind): PricingSummary {
  const savingsAmount = isSaleActive ? REGULAR_PRICE_USD - BLACK_FRIDAY_PRICE_USD : 0;
  const discountPercent = isSaleActive
    ? Math.round((savingsAmount / REGULAR_PRICE_USD) * 100)
    : 0;

  return {
    regularPrice: REGULAR_PRICE_USD,
    salePrice: BLACK_FRIDAY_PRICE_USD,
    savingsAmount,
    discountPercent,
    isSaleActive,
    effectivePrice: isSaleActive ? BLACK_FRIDAY_PRICE_USD : REGULAR_PRICE_USD,
    saleKind,
    saleName: saleKind === 'flash' ? 'Flash Sale' : 'Black Friday Sale',
    saleAccessLabel: saleKind === 'flash' ? 'Flash Sale Access' : 'Black Friday Access',
  };
}

export function calculateBlackFridayPricing(
  nowMs: number,
  endIso: string = BLACK_FRIDAY_END_ISO
): PricingSummary {
  return buildPricing(nowMs < parseEndTimestampMs(endIso), 'black_friday');
}

/**
 * Pricing for whichever sale is running right now.
 * - Before Black Friday ends: the Black Friday sale.
 * - After it ends: the visitor's own flash sale, which ends at `flashEndMs` (see lib/flash-sale.ts).
 */
export function calculateSalePricing(
  nowMs: number,
  flashEndMs: number | null,
  endIso: string = BLACK_FRIDAY_END_ISO
): PricingSummary {
  if (nowMs < parseEndTimestampMs(endIso)) {
    return buildPricing(true, 'black_friday');
  }
  return buildPricing(flashEndMs !== null && nowMs < flashEndMs, 'flash');
}

/** Countdown for whichever sale is running right now (same rules as calculateSalePricing). */
export function getSaleCountdown(
  nowMs: number,
  flashEndMs: number | null,
  endIso: string = BLACK_FRIDAY_END_ISO
): CountdownBreakdown {
  const blackFridayEndMs = parseEndTimestampMs(endIso);
  if (nowMs < blackFridayEndMs) {
    return breakdownFromDiffMs(blackFridayEndMs - nowMs);
  }
  return breakdownFromDiffMs((flashEndMs ?? nowMs) - nowMs);
}

export function formatPadTwo(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, '0');
}

export function validateCheckoutForm(input: CheckoutFormInput): CheckoutValidationResult {
  const errors: CheckoutValidationResult['errors'] = {};
  const trimmedName = input.fullName.trim();
  const trimmedEmail = input.email.trim();

  if (trimmedName.length < 2) {
    errors.fullName = 'Enter your full name (at least 2 characters).';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address for instant guide delivery.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
