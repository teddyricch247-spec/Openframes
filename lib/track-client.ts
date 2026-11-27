'use client';

import type { AnalyticsEventType, CrucialButtonId } from './analytics';
import { IGNORE_DEVICE_COOKIE, isLikelyBotUserAgent } from './bot-detection';

const VISITOR_STORAGE_KEY = 'openframe_visitor_id';
const VISIT_RECORDED_KEY = 'openframe_visit_recorded';
const IGNORE_DEVICE_STORAGE_KEY = 'openframe_ignore';
const VISITOR_COOKIE_NAME = 'openframe_vid';
const VISIT_RECORDED_COOKIE_NAME = 'openframe_counted';

/** A visit only counts once the person has been on the page this long and interacted with it. */
const MIN_TIME_ON_PAGE_MS = 1500;
const HUMAN_INTERACTION_EVENTS = [
  'pointerdown',
  'touchstart',
  'keydown',
  'scroll',
  'wheel',
  'mousemove',
] as const;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds = 31536000): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function createVisitorId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `vis-${crypto.randomUUID()}`;
    }
  } catch {
    // Fall through to the manual id below
  }
  return `vis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'vis-ssr';

  let existing: string | null = null;
  try {
    existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  } catch {
    existing = null;
  }

  if (!existing) {
    existing = readCookie(VISITOR_COOKIE_NAME);
  }

  const visitorId = existing || createVisitorId();

  try {
    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  } catch {
    // Ignore storage quota errors
  }
  writeCookie(VISITOR_COOKIE_NAME, visitorId);

  return visitorId;
}

export function hasRecordedDeviceVisit(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(VISIT_RECORDED_KEY) === '1') {
      return true;
    }
  } catch {
    // Fallback to cookie check below
  }
  return readCookie(VISIT_RECORDED_COOKIE_NAME) === '1';
}

export function markDeviceVisitRecorded(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VISIT_RECORDED_KEY, '1');
  } catch {
    // Ignore storage quota errors
  }
  writeCookie(VISIT_RECORDED_COOKIE_NAME, '1');
}

function clearDeviceVisitRecorded(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(VISIT_RECORDED_KEY);
  } catch {
    // Ignore
  }
  writeCookie(VISIT_RECORDED_COOKIE_NAME, '', 0);
}

/**
 * True when this browser belongs to an admin. Set once at admin login and kept
 * for a year, so the owner's own visits are never counted, even after logging out.
 */
export function isIgnoredDevice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(IGNORE_DEVICE_STORAGE_KEY) === '1') {
      return true;
    }
  } catch {
    // Fallback to cookie check below
  }
  return readCookie(IGNORE_DEVICE_COOKIE) === '1';
}

export function markDeviceAsAdmin(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(IGNORE_DEVICE_STORAGE_KEY, '1');
  } catch {
    // Ignore storage quota errors
  }
  writeCookie(IGNORE_DEVICE_COOKIE, '1');
}

/** Automated browsers announce themselves; real ones don't. */
function looksLikeAutomatedBrowser(): boolean {
  if (typeof navigator === 'undefined') return true;
  if (navigator.webdriver === true) return true;
  if (isLikelyBotUserAgent(navigator.userAgent)) return true;
  if (!navigator.languages || navigator.languages.length === 0) return true;
  return false;
}

/** Coarse, non-identifying browser traits. The server hashes these with IP + user agent. */
function getDeviceHints(): string {
  try {
    const screenPart = `${window.screen.width}x${window.screen.height}x${window.devicePixelRatio || 1}`;
    const lang = navigator.language || '';
    const cores = navigator.hardwareConcurrency || 0;
    return `${screenPart}|${lang}|${cores}`.slice(0, 80);
  } catch {
    return '';
  }
}

export async function trackAnalyticsEvent(payload: {
  type: AnalyticsEventType;
  buttonId?: CrucialButtonId;
  metadata?: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;
  if (isIgnoredDevice() || looksLikeAutomatedBrowser()) return;

  if (payload.type === 'page_visit') {
    if (hasRecordedDeviceVisit()) {
      return;
    }
    markDeviceVisitRecorded();
  }

  const visitorId = getOrCreateVisitorId();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  let referrer = 'direct';
  try {
    if (document.referrer) {
      const url = new URL(document.referrer);
      if (url.host !== window.location.host) {
        referrer = url.host.replace(/^www\./, '');
      }
    }
  } catch {
    referrer = 'direct';
  }

  try {
    const res = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: payload.type,
        visitorId,
        timezone,
        referrer,
        hints: getDeviceHints(),
        buttonId: payload.buttonId,
        metadata: payload.metadata,
      }),
      keepalive: true,
    });
    if (!res.ok && payload.type === 'page_visit' && res.status >= 500) {
      // Server hiccup: allow a later attempt instead of losing this visit forever
      clearDeviceVisitRecorded();
    }
  } catch {
    if (payload.type === 'page_visit') clearDeviceVisitRecorded();
  }
}

let visitWatcherStarted = false;

/**
 * Counts the landing page visit only after the person has stayed a moment and
 * touched, scrolled or moved on the page. Crawlers, link previews and scripts load
 * the page but never interact, so they are never counted.
 */
export function trackVisitWhenHuman(): void {
  if (typeof window === 'undefined' || visitWatcherStarted) return;
  visitWatcherStarted = true;

  if (isIgnoredDevice() || looksLikeAutomatedBrowser() || hasRecordedDeviceVisit()) return;

  const startedAt = Date.now();
  let fired = false;

  const stopListening = () => {
    for (const name of HUMAN_INTERACTION_EVENTS) {
      window.removeEventListener(name, onInteraction);
    }
  };

  const send = () => {
    if (isIgnoredDevice()) return;
    void trackAnalyticsEvent({ type: 'page_visit' });
  };

  function onInteraction() {
    if (fired || document.visibilityState !== 'visible') return;
    fired = true;
    stopListening();
    const wait = Math.max(0, MIN_TIME_ON_PAGE_MS - (Date.now() - startedAt));
    window.setTimeout(send, wait);
  }

  for (const name of HUMAN_INTERACTION_EVENTS) {
    window.addEventListener(name, onInteraction, { passive: true });
  }
}
