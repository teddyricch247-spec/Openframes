import { parseEndTimestampMs } from './pricing';

// Per-visitor flash sale that starts once Black Friday has actually ended.
// Each browser gets its own random 24h–48h window. When the window hits 00:00 a fresh random one starts, forever.
// The end time lives in localStorage, so a visitor keeps the same deadline across reloads and tabs.

export const FLASH_SALE_MIN_MS = 24 * 60 * 60 * 1000;
export const FLASH_SALE_MAX_MS = 48 * 60 * 60 * 1000;
export const FLASH_SALE_STORAGE_KEY = 'openframe_flash_sale_end';

// Allowed gap between a stored end time and "now + 48h" before we treat it as tampered / clock-shifted.
const CLOCK_SLACK_MS = 60 * 1000;

// Fallback for browsers where localStorage is blocked, so the sale still behaves during the session.
let memoryEndMs: number | null = null;

/** Uniform random duration between 24:00:00 and 48:00:00 (inclusive), in ms. */
export function randomFlashSaleDurationMs(random: () => number = Math.random): number {
  return FLASH_SALE_MIN_MS + Math.floor(random() * (FLASH_SALE_MAX_MS - FLASH_SALE_MIN_MS + 1));
}

function readStoredEndMs(): number | null {
  try {
    const raw = window.localStorage.getItem(FLASH_SALE_STORAGE_KEY);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStoredEndMs(endMs: number): void {
  try {
    window.localStorage.setItem(FLASH_SALE_STORAGE_KEY, String(endMs));
  } catch {
    // Storage blocked or full: memoryEndMs still covers this session.
  }
}

// A saved end time is only reused if it is still in the future and not further away than the 48h maximum.
function isUsableEnd(endMs: number | null, nowMs: number): endMs is number {
  return (
    endMs !== null &&
    Number.isFinite(endMs) &&
    endMs > nowMs &&
    endMs - nowMs <= FLASH_SALE_MAX_MS + CLOCK_SLACK_MS
  );
}

/**
 * End time (ms) of this visitor's current flash sale, or null while Black Friday is still running.
 * - First call after Black Friday ends: starts a random 24–48h window and saves it.
 * - Later calls: return the saved end time.
 * - When the end time is reached (or the saved value is invalid): starts a new random window.
 * Browser only. Call it from an effect or event handler, never during render.
 */
export function resolveFlashSaleEndMs(
  nowMs: number,
  blackFridayEndMs: number = parseEndTimestampMs()
): number | null {
  if (nowMs < blackFridayEndMs) return null;

  const saved = readStoredEndMs() ?? memoryEndMs;
  if (isUsableEnd(saved, nowMs)) {
    memoryEndMs = saved;
    return saved;
  }

  const nextEndMs = nowMs + randomFlashSaleDurationMs();
  memoryEndMs = nextEndMs;
  writeStoredEndMs(nextEndMs);
  return nextEndMs;
}
