export const REGULAR_PRICE_USD = 47;
export const BLACK_FRIDAY_PRICE_USD = 17;
// Local date-time string (no fixed timezone offset) so Black Friday always ends at 11:59:59 PM in the user's local timezone.
export const BLACK_FRIDAY_END_ISO = '2026-11-27T23:59:59';

export interface PricingSummary {
  regularPrice: number;
  salePrice: number;
  savingsAmount: number;
  discountPercent: number;
  isSaleActive: boolean;
  effectivePrice: number;
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

export function getCountdownToBlackFriday(
  nowMs: number,
  endIso: string = BLACK_FRIDAY_END_ISO
): CountdownBreakdown {
  const endMs = parseEndTimestampMs(endIso);
  const diff = Math.max(0, endMs - nowMs);

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

export function calculateBlackFridayPricing(
  nowMs: number,
  endIso: string = BLACK_FRIDAY_END_ISO
): PricingSummary {
  const endMs = parseEndTimestampMs(endIso);
  const isSaleActive = nowMs < endMs;
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
  };
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
