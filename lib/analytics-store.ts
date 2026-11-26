import crypto from 'node:crypto';
import {
  BUTTON_LABELS,
  type AnalyticsEvent,
  type AnalyticsEventType,
  type CrucialButtonId,
} from './analytics';
import {
  SUPABASE_ADMIN_IDS_TABLE,
  SUPABASE_ANALYTICS_TABLE,
  SUPABASE_PROJECT_URL,
  SUPABASE_PUBLIC_SNAPSHOT_PATH,
  SUPABASE_REST_URL,
  SUPABASE_STORAGE_BUCKET,
  SUPABASE_STORAGE_URL,
} from './supabase-config';

export interface SupabaseSyncInfo {
  projectUrl: string;
  restUrl: string;
  storageUrl: string;
  mode: 'supabase-rest' | 'supabase-public-storage' | 'local-fallback';
  message: string;
}

interface SupabaseEventRow {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  visitor_id: string;
  country_code: string;
  country_name: string;
  timezone: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  referrer: string;
  button_id?: CrucialButtonId | null;
  button_label?: string | null;
  metadata?: string | null;
  revenue_usd?: number | string | null;
}

function toRow(event: AnalyticsEvent): SupabaseEventRow {
  return {
    id: event.id,
    type: event.type,
    timestamp: event.timestamp,
    visitor_id: event.visitorId,
    country_code: event.countryCode,
    country_name: event.countryName,
    timezone: event.timezone,
    device: event.device,
    referrer: event.referrer,
    button_id: event.buttonId ?? null,
    button_label: event.buttonLabel ?? null,
    metadata: event.metadata ?? null,
    revenue_usd: event.revenueUsd ?? null,
  };
}

function fromRow(row: SupabaseEventRow): AnalyticsEvent {
  return {
    id: row.id,
    type: row.type,
    timestamp: row.timestamp,
    visitorId: row.visitor_id,
    countryCode: row.country_code || 'US',
    countryName: row.country_name || 'United States',
    timezone: row.timezone || 'UTC',
    device: row.device || 'Desktop',
    referrer: row.referrer || 'direct',
    buttonId: row.button_id ?? undefined,
    buttonLabel: row.button_label ?? undefined,
    metadata: row.metadata ?? undefined,
    revenueUsd: row.revenue_usd != null ? Number(row.revenue_usd) : undefined,
  };
}

function buildSeedEvents(): AnalyticsEvent[] {
  const seedSpecs: Array<{
    offsetHours: number;
    visitorId: string;
    countryCode: string;
    countryName: string;
    timezone: string;
    device: 'Desktop' | 'Mobile' | 'Tablet';
    referrer: string;
    clickedButton?: CrucialButtonId;
    converted?: boolean;
    previewSlot?: string;
  }> = [
    { offsetHours: 92, visitorId: 'vis-seed-01', countryCode: 'US', countryName: 'United States', timezone: 'America/New_York', device: 'Desktop', referrer: 'x.com', clickedButton: 'hero_get_guide', converted: true },
    { offsetHours: 89, visitorId: 'vis-seed-02', countryCode: 'GB', countryName: 'United Kingdom', timezone: 'Europe/London', device: 'Desktop', referrer: 'youtube.com', clickedButton: 'video_placeholder_preview', previewSlot: "Maria's Bikes" },
    { offsetHours: 84, visitorId: 'vis-seed-03', countryCode: 'DE', countryName: 'Germany', timezone: 'Europe/Berlin', device: 'Desktop', referrer: 'reddit.com', clickedButton: 'nav_get_guide', converted: true },
    { offsetHours: 78, visitorId: 'vis-seed-04', countryCode: 'US', countryName: 'United States', timezone: 'America/Los_Angeles', device: 'Mobile', referrer: 'x.com' },
    { offsetHours: 73, visitorId: 'vis-seed-05', countryCode: 'CA', countryName: 'Canada', timezone: 'America/Toronto', device: 'Desktop', referrer: 'direct', clickedButton: 'final_claim_offer', converted: true },
    { offsetHours: 68, visitorId: 'vis-seed-06', countryCode: 'IN', countryName: 'India', timezone: 'Asia/Kolkata', device: 'Desktop', referrer: 'youtube.com', clickedButton: 'hero_get_guide' },
    { offsetHours: 64, visitorId: 'vis-seed-07', countryCode: 'US', countryName: 'United States', timezone: 'America/Chicago', device: 'Desktop', referrer: 'x.com', clickedButton: 'bento_unlock_guide', converted: true },
    { offsetHours: 58, visitorId: 'vis-seed-08', countryCode: 'FR', countryName: 'France', timezone: 'Europe/Paris', device: 'Mobile', referrer: 'google.com', clickedButton: 'workflow_step_select' },
    { offsetHours: 52, visitorId: 'vis-seed-09', countryCode: 'AU', countryName: 'Australia', timezone: 'Australia/Sydney', device: 'Desktop', referrer: 'x.com', clickedButton: 'hero_get_guide', converted: true },
    { offsetHours: 47, visitorId: 'vis-seed-10', countryCode: 'NL', countryName: 'Netherlands', timezone: 'Europe/Amsterdam', device: 'Desktop', referrer: 'hackernews', clickedButton: 'video_placeholder_preview', previewSlot: 'Lighthouse' },
    { offsetHours: 41, visitorId: 'vis-seed-11', countryCode: 'US', countryName: 'United States', timezone: 'America/Los_Angeles', device: 'Desktop', referrer: 'youtube.com', clickedButton: 'hero_get_guide', converted: true },
    { offsetHours: 36, visitorId: 'vis-seed-12', countryCode: 'GB', countryName: 'United Kingdom', timezone: 'Europe/London', device: 'Mobile', referrer: 'x.com' },
    { offsetHours: 29, visitorId: 'vis-seed-13', countryCode: 'JP', countryName: 'Japan', timezone: 'Asia/Tokyo', device: 'Desktop', referrer: 'github.com', clickedButton: 'bento_unlock_guide' },
    { offsetHours: 23, visitorId: 'vis-seed-14', countryCode: 'DE', countryName: 'Germany', timezone: 'Europe/Berlin', device: 'Desktop', referrer: 'direct', clickedButton: 'final_claim_offer', converted: true },
    { offsetHours: 18, visitorId: 'vis-seed-15', countryCode: 'BR', countryName: 'Brazil', timezone: 'America/Sao_Paulo', device: 'Mobile', referrer: 'youtube.com', clickedButton: 'video_placeholder_preview', previewSlot: 'Moving Walkway' },
    { offsetHours: 14, visitorId: 'vis-seed-16', countryCode: 'US', countryName: 'United States', timezone: 'America/New_York', device: 'Desktop', referrer: 'x.com', clickedButton: 'nav_get_guide' },
    { offsetHours: 9, visitorId: 'vis-seed-17', countryCode: 'CA', countryName: 'Canada', timezone: 'America/Vancouver', device: 'Desktop', referrer: 'google.com', clickedButton: 'hero_get_guide', converted: true },
    { offsetHours: 4, visitorId: 'vis-seed-18', countryCode: 'SG', countryName: 'Singapore', timezone: 'Asia/Singapore', device: 'Desktop', referrer: 'x.com', clickedButton: 'modal_get_guide' },
  ];

  const anchorMs = new Date('2026-11-22T12:00:00-08:00').getTime();
  const events: AnalyticsEvent[] = [];

  seedSpecs.forEach((spec, index) => {
    const visitTs = new Date(anchorMs - spec.offsetHours * 3600 * 1000).toISOString();
    events.push({
      id: `seed-visit-${index + 1}`,
      type: 'page_visit',
      timestamp: visitTs,
      visitorId: spec.visitorId,
      countryCode: spec.countryCode,
      countryName: spec.countryName,
      timezone: spec.timezone,
      device: spec.device,
      referrer: spec.referrer,
    });

    if (spec.clickedButton) {
      const clickTs = new Date(anchorMs - spec.offsetHours * 3600 * 1000 + 45 * 1000).toISOString();
      events.push({
        id: `seed-click-${index + 1}`,
        type: 'cta_click',
        timestamp: clickTs,
        visitorId: spec.visitorId,
        countryCode: spec.countryCode,
        countryName: spec.countryName,
        timezone: spec.timezone,
        device: spec.device,
        referrer: spec.referrer,
        buttonId: spec.clickedButton,
        buttonLabel: BUTTON_LABELS[spec.clickedButton],
        metadata: spec.previewSlot,
      });
    }

    if (spec.converted) {
      const convTs = new Date(anchorMs - spec.offsetHours * 3600 * 1000 + 110 * 1000).toISOString();
      events.push({
        id: `seed-conv-${index + 1}`,
        type: 'checkout_submit',
        timestamp: convTs,
        visitorId: spec.visitorId,
        countryCode: spec.countryCode,
        countryName: spec.countryName,
        timezone: spec.timezone,
        device: spec.device,
        referrer: spec.referrer,
        buttonId: spec.clickedButton,
        buttonLabel: 'Black Friday $17 Guide Purchase',
        revenueUsd: 17,
      });
    }
  });

  return events;
}

interface GlobalAnalyticsState {
  events: AnalyticsEvent[];
  syncInfo: SupabaseSyncInfo;
}

const globalForAnalytics = globalThis as unknown as {
  __openFrameAnalyticsStore?: GlobalAnalyticsState;
};

function getLocalStore(): GlobalAnalyticsState {
  if (!globalForAnalytics.__openFrameAnalyticsStore) {
    globalForAnalytics.__openFrameAnalyticsStore = {
      events: buildSeedEvents(),
      syncInfo: {
        projectUrl: SUPABASE_PROJECT_URL,
        restUrl: SUPABASE_REST_URL,
        storageUrl: SUPABASE_STORAGE_URL,
        mode: 'local-fallback',
        message: 'Ready to sync once Supabase SQL tables & public anon key are active.',
      },
    };
  }
  return globalForAnalytics.__openFrameAnalyticsStore;
}

function getSupabaseHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }
  return headers;
}

function setSyncStatus(mode: SupabaseSyncInfo['mode'], message: string) {
  getLocalStore().syncInfo = {
    projectUrl: SUPABASE_PROJECT_URL,
    restUrl: SUPABASE_REST_URL,
    storageUrl: SUPABASE_STORAGE_URL,
    mode,
    message,
  };
}

export function getSupabaseSyncInfo(): SupabaseSyncInfo {
  return getLocalStore().syncInfo;
}

async function syncSnapshotToPublicStorage(events: AnalyticsEvent[]): Promise<boolean> {
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!anonKey) return false;
  try {
    const res = await fetch(
      `${SUPABASE_STORAGE_URL}/object/${SUPABASE_STORAGE_BUCKET}/${SUPABASE_PUBLIC_SNAPSHOT_PATH}`,
      {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'x-upsert': 'true',
        },
        body: JSON.stringify(events),
        signal: AbortSignal.timeout(3500),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function getAllAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const local = getLocalStore();

  // 1. Try Supabase PostgREST table first
  try {
    const url = `${SUPABASE_REST_URL}/${SUPABASE_ANALYTICS_TABLE}?select=*&order=timestamp.desc&limit=500`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getSupabaseHeaders(),
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const rows = (await res.json()) as SupabaseEventRow[];
      const mapped = rows.map(fromRow);
      local.events = mapped;
      setSyncStatus('supabase-rest', `Connected to ${SUPABASE_ANALYTICS_TABLE} on Supabase REST.`);
      return mapped;
    }

    if (res.status === 401) {
      // Check public storage object (works even without apikey when public bucket has events.json)
      const pubRes = await fetch(
        `${SUPABASE_STORAGE_URL}/object/public/${SUPABASE_STORAGE_BUCKET}/${SUPABASE_PUBLIC_SNAPSHOT_PATH}`,
        { cache: 'no-store', signal: AbortSignal.timeout(3000) }
      ).catch(() => null);

      if (pubRes && pubRes.ok) {
        const stored = (await pubRes.json()) as AnalyticsEvent[];
        if (Array.isArray(stored)) {
          local.events = stored;
          setSyncStatus(
            'supabase-public-storage',
            'Reading public Supabase Storage snapshot; add SUPABASE_ANON_KEY for live REST writes.'
          );
          return stored;
        }
      }

      setSyncStatus(
        'local-fallback',
        'Supabase REST requires SUPABASE_ANON_KEY in Secrets after running the setup SQL.'
      );
      return local.events;
    }

    setSyncStatus(
      'local-fallback',
      `Supabase REST returned ${res.status}. Run the setup SQL in Supabase SQL Editor.`
    );
  } catch {
    setSyncStatus(
      'local-fallback',
      'Using local server analytics store (Supabase endpoint unreachable).'
    );
  }

  return local.events;
}

export async function appendAnalyticsEvent(event: AnalyticsEvent): Promise<AnalyticsEvent> {
  const store = getLocalStore();
  if (event.type === 'page_visit') {
    const existingVisit = store.events.find(
      (e) => e.type === 'page_visit' && e.visitorId === event.visitorId
    );
    if (existingVisit) {
      return existingVisit;
    }
  }
  store.events.push(event);

  try {
    const res = await fetch(`${SUPABASE_REST_URL}/${SUPABASE_ANALYTICS_TABLE}`, {
      method: 'POST',
      headers: getSupabaseHeaders({
        Prefer: 'resolution=ignore-duplicates,return=representation',
      }),
      body: JSON.stringify(toRow(event)),
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      setSyncStatus('supabase-rest', `Connected to ${SUPABASE_ANALYTICS_TABLE} on Supabase REST.`);
      void syncSnapshotToPublicStorage(store.events);
    }
  } catch {
    // Graceful local store retention when Supabase is not yet configured
  }

  return event;
}

export async function resetAnalyticsStore(
  mode: 'empty' | 'reseed' = 'reseed'
): Promise<AnalyticsEvent[]> {
  const store = getLocalStore();
  store.events = mode === 'empty' ? [] : buildSeedEvents();

  try {
    const delRes = await fetch(
      `${SUPABASE_REST_URL}/${SUPABASE_ANALYTICS_TABLE}?id=neq.__none__`,
      {
        method: 'DELETE',
        headers: getSupabaseHeaders(),
        signal: AbortSignal.timeout(3500),
      }
    );

    if (delRes.ok) {
      if (mode === 'reseed' && store.events.length > 0) {
        await fetch(`${SUPABASE_REST_URL}/${SUPABASE_ANALYTICS_TABLE}`, {
          method: 'POST',
          headers: getSupabaseHeaders({ Prefer: 'resolution=ignore-duplicates' }),
          body: JSON.stringify(store.events.map(toRow)),
          signal: AbortSignal.timeout(3500),
        });
      }
      setSyncStatus('supabase-rest', `Synced ${mode} action with Supabase REST.`);
      void syncSnapshotToPublicStorage(store.events);
    }
  } catch {
    // Local store updated regardless
  }

  return store.events;
}

export async function verifySupabaseAdminIdTable(
  username: string,
  password: string
): Promise<boolean> {
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) return false;
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!anonKey) return false;

  try {
    const params = new URLSearchParams({
      select: 'username,passcode',
      username: `eq.${trimmedUser}`,
      limit: '1',
    });
    const res = await fetch(
      `${SUPABASE_REST_URL}/${SUPABASE_ADMIN_IDS_TABLE}?${params.toString()}`,
      {
        method: 'GET',
        headers: getSupabaseHeaders(),
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return false;
    const rows = (await res.json()) as Array<{ username: string; passcode: string }>;
    const row = rows[0];
    if (!row || typeof row.passcode !== 'string') return false;

    const a = crypto.createHash('sha256').update(password, 'utf8').digest();
    const b = crypto.createHash('sha256').update(row.passcode, 'utf8').digest();
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
