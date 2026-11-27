import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerAdminSession, verifySameOriginRequest } from '@/lib/admin-auth';
import {
  IGNORE_DEVICE_COOKIE,
  isLikelyBotUserAgent,
  isValidVisitorId,
} from '@/lib/bot-detection';
import {
  BUTTON_LABELS,
  computeAnalyticsSummary,
  detectDeviceType,
  resolveVisitorCountry,
  type AnalyticsEvent,
  type AnalyticsEventType,
  type CrucialButtonId,
} from '@/lib/analytics';
import {
  appendAnalyticsEvent,
  getAllAnalyticsEvents,
  getSupabaseSyncInfo,
  hasPageVisitWithFingerprint,
  resetAnalyticsStore,
} from '@/lib/analytics-store';

/** One-way hash of IP + user agent + coarse browser traits. The raw IP is never stored. */
function buildFingerprint(req: NextRequest, hints: unknown): string {
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '';
  const userAgent = req.headers.get('user-agent') ?? '';
  const hintText = typeof hints === 'string' ? hints.slice(0, 80) : '';
  const salt = process.env.SESSION_SECRET || 'openframe-visitor-fingerprint';
  return crypto
    .createHash('sha256')
    .update(`${salt}|${ip}|${userAgent}|${hintText}`, 'utf8')
    .digest('hex')
    .slice(0, 24);
}

function ignored(reason: string) {
  return NextResponse.json({ ok: true, ignored: reason }, { status: 200 });
}

export async function GET(req: NextRequest) {
  const session = await getServerAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const timeZone = req.nextUrl.searchParams.get('tz') ?? undefined;
  const events = await getAllAnalyticsEvents();
  const summary = computeAnalyticsSummary(events, { timeZone });
  return NextResponse.json(
    {
      ...summary,
      supabaseSync: getSupabaseSyncInfo(),
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type?: AnalyticsEventType;
      visitorId?: string;
      timezone?: string;
      referrer?: string;
      hints?: string;
      buttonId?: CrucialButtonId;
      metadata?: string;
    };

    const eventType = body.type;
    if (eventType !== 'page_visit' && eventType !== 'cta_click') {
      return NextResponse.json({ error: 'Invalid analytics event type' }, { status: 400 });
    }

    // Never count the admin: not while logged in, and not from a browser that ever logged in.
    if (req.cookies.get(IGNORE_DEVICE_COOKIE)?.value === '1') {
      return ignored('admin-device');
    }
    if (await getServerAdminSession()) {
      return ignored('admin-session');
    }

    // Never count crawlers, link previews, monitors or scripts.
    const userAgent = req.headers.get('user-agent');
    if (isLikelyBotUserAgent(userAgent)) {
      return ignored('bot');
    }

    // The tracking client always sends a visitor id it generated. No id, no count.
    if (!isValidVisitorId(body.visitorId)) {
      return ignored('invalid-visitor');
    }

    const fingerprint = buildFingerprint(req, body.hints);
    if (eventType === 'page_visit' && (await hasPageVisitWithFingerprint(fingerprint))) {
      return ignored('already-counted');
    }

    const headerCountry =
      req.headers.get('cf-ipcountry') ??
      req.headers.get('x-vercel-ip-country') ??
      req.headers.get('x-appengine-country') ??
      req.headers.get('x-country-code');

    const { countryCode, countryName } = resolveVisitorCountry({
      headerCountry,
      timezone: body.timezone ?? null,
      acceptLanguage: req.headers.get('accept-language'),
    });

    const device = detectDeviceType(userAgent);
    const visitorId = body.visitorId;

    const event: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: eventType,
      timestamp: new Date().toISOString(),
      visitorId,
      countryCode,
      countryName,
      timezone: (body.timezone || 'UTC').slice(0, 64),
      device,
      referrer: (body.referrer || 'direct').slice(0, 120),
      buttonId: body.buttonId,
      buttonLabel: body.buttonId ? BUTTON_LABELS[body.buttonId] ?? body.buttonId : undefined,
      metadata: body.metadata?.slice(0, 120),
      fingerprint: eventType === 'page_visit' ? fingerprint : undefined,
    };

    await appendAnalyticsEvent(event);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Malformed analytics payload' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!verifySameOriginRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const timeZone = req.nextUrl.searchParams.get('tz') ?? undefined;
  const events = await resetAnalyticsStore();
  const summary = computeAnalyticsSummary(events, { timeZone });
  return NextResponse.json(
    {
      ...summary,
      supabaseSync: getSupabaseSyncInfo(),
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
