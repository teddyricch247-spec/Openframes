import { NextRequest, NextResponse } from 'next/server';
import { getServerAdminSession, verifySameOriginRequest } from '@/lib/admin-auth';
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
  resetAnalyticsStore,
} from '@/lib/analytics-store';

export async function GET() {
  const session = await getServerAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await getAllAnalyticsEvents();
  const summary = computeAnalyticsSummary(events);
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
      buttonId?: CrucialButtonId;
      metadata?: string;
      revenueUsd?: number;
    };

    const eventType = body.type;
    if (
      eventType !== 'page_visit' &&
      eventType !== 'cta_click' &&
      eventType !== 'checkout_submit'
    ) {
      return NextResponse.json({ error: 'Invalid analytics event type' }, { status: 400 });
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

    const device = detectDeviceType(req.headers.get('user-agent'));
    const visitorId = (body.visitorId || `vis-${Date.now()}`).slice(0, 64);

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
      buttonLabel: body.buttonId
        ? BUTTON_LABELS[body.buttonId] ?? body.buttonId
        : eventType === 'checkout_submit'
        ? 'Black Friday $17 Guide Purchase'
        : undefined,
      metadata: body.metadata?.slice(0, 120),
      revenueUsd:
        eventType === 'checkout_submit' ? Number(body.revenueUsd ?? 17) : undefined,
    };

    await appendAnalyticsEvent(event);

    return NextResponse.json({ ok: true, event }, { status: 201 });
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

  const mode = req.nextUrl.searchParams.get('mode') === 'empty' ? 'empty' : 'reseed';
  const events = await resetAnalyticsStore(mode);
  const summary = computeAnalyticsSummary(events);
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
