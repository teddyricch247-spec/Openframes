'use client';

import type { AnalyticsEventType, CrucialButtonId } from './analytics';

const VISITOR_STORAGE_KEY = 'openframe_visitor_id';
const VISIT_RECORDED_KEY = 'openframe_visit_recorded';
const VISITOR_COOKIE_NAME = 'openframe_vid';
const VISIT_RECORDED_COOKIE_NAME = 'openframe_counted';

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

  const visitorId =
    existing ||
    `vis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

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

export async function trackAnalyticsEvent(payload: {
  type: AnalyticsEventType;
  buttonId?: CrucialButtonId;
  metadata?: string;
  revenueUsd?: number;
}): Promise<void> {
  if (typeof window === 'undefined') return;

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
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: payload.type,
        visitorId,
        timezone,
        referrer,
        buttonId: payload.buttonId,
        metadata: payload.metadata,
        revenueUsd: payload.revenueUsd,
      }),
      keepalive: true,
    });
  } catch {
    // Non-blocking analytics beacon
  }
}
