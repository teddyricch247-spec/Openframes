import crypto from 'node:crypto';
import {
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
}

const VALID_EVENT_TYPES: ReadonlySet<string> = new Set(['page_visit', 'cta_click']);

const FINGERPRINT_PREFIX = 'fp:';

// PostgREST returns at most 1000 rows per request by default, so read in pages.
const PAGE_SIZE = 1000;
const MAX_EVENTS = 20000;

/**
 * Reads the Supabase anon/publishable key from the environment.
 * SUPABASE_ANON_KEY is the primary name; common aliases are accepted so a
 * differently-named variable in the hosting dashboard doesn't silently break saving.
 */
function getAnonKey(): string | undefined {
  const raw =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  const key = raw.trim();
  return key || undefined;
}

/** apikey/Authorization headers. New-style `sb_...` keys are not JWTs, so they must NOT be sent as a Bearer token. */
function getAuthHeaders(anonKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: anonKey };
  if (!anonKey.startsWith('sb_')) {
    headers.Authorization = `Bearer ${anonKey}`;
  }
  return headers;
}

function unauthorizedMessage(): string {
  return getAnonKey()
    ? 'Supabase rejected the request (401). SUPABASE_ANON_KEY is set but invalid or disabled. Copy a current anon/publishable key from Supabase > Project Settings > API Keys, update it in your hosting environment variables and redeploy. Events are NOT being saved until then.'
    : 'Supabase rejected the request (401). Add SUPABASE_ANON_KEY to your hosting environment variables and redeploy. Events are NOT being saved until then.';
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
    // The fingerprint lives in `metadata` for page visits so no schema change is needed.
    metadata: event.fingerprint ? `${FINGERPRINT_PREFIX}${event.fingerprint}` : event.metadata ?? null,
  };
}

function fromRow(row: SupabaseEventRow): AnalyticsEvent {
  const isFingerprint = typeof row.metadata === 'string' && row.metadata.startsWith(FINGERPRINT_PREFIX);
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
    metadata: isFingerprint ? undefined : row.metadata ?? undefined,
    fingerprint: isFingerprint ? row.metadata!.slice(FINGERPRINT_PREFIX.length) : undefined,
  };
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
      events: [],
      syncInfo: {
        projectUrl: SUPABASE_PROJECT_URL,
        restUrl: SUPABASE_REST_URL,
        storageUrl: SUPABASE_STORAGE_URL,
        mode: 'local-fallback',
        message: 'Waiting for the first Supabase request.',
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
  const anonKey = getAnonKey();
  if (anonKey) {
    Object.assign(headers, getAuthHeaders(anonKey));
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
  const anonKey = getAnonKey();
  if (!anonKey) return false;
  try {
    const res = await fetch(
      `${SUPABASE_STORAGE_URL}/object/${SUPABASE_STORAGE_BUCKET}/${SUPABASE_PUBLIC_SNAPSHOT_PATH}`,
      {
        method: 'POST',
        headers: {
          ...getAuthHeaders(anonKey),
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

function fetchEventsPage(offset: number): Promise<Response> {
  const url =
    `${SUPABASE_REST_URL}/${SUPABASE_ANALYTICS_TABLE}` +
    `?select=*&order=timestamp.desc&limit=${PAGE_SIZE}&offset=${offset}`;
  return fetch(url, {
    method: 'GET',
    headers: getSupabaseHeaders(),
    cache: 'no-store',
    signal: AbortSignal.timeout(3500),
  });
}

export async function getAllAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const local = getLocalStore();

  // 1. Try Supabase PostgREST table first
  try {
    const res = await fetchEventsPage(0);

    if (res.ok) {
      const rows = (await res.json()) as SupabaseEventRow[];

      // Keep paging while full pages come back (up to MAX_EVENTS)
      while (rows.length > 0 && rows.length % PAGE_SIZE === 0 && rows.length < MAX_EVENTS) {
        const next = await fetchEventsPage(rows.length);
        if (!next.ok) break;
        const page = (await next.json()) as SupabaseEventRow[];
        if (page.length === 0) break;
        rows.push(...page);
      }

      const mapped = rows.filter((row) => VALID_EVENT_TYPES.has(row.type)).map(fromRow);
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
          local.events = stored.filter((e) => VALID_EVENT_TYPES.has(e.type));
          setSyncStatus(
            'supabase-public-storage',
            'Reading a public Supabase Storage snapshot. Add SUPABASE_ANON_KEY so new events are saved.'
          );
          return local.events;
        }
      }

      setSyncStatus('local-fallback', unauthorizedMessage());
      return local.events;
    }

    setSyncStatus(
      'local-fallback',
      `Supabase REST returned ${res.status}. Run the setup SQL in the Supabase SQL Editor.`
    );
  } catch {
    setSyncStatus(
      'local-fallback',
      'Supabase endpoint unreachable. Showing only events held in server memory.'
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
    } else if (res.status === 401) {
      setSyncStatus('local-fallback', unauthorizedMessage());
    }
  } catch {
    // Graceful local store retention when Supabase is not reachable
  }

  return event;
}

/** True when a page visit from the same IP + browser traits was already recorded. */
export async function hasPageVisitWithFingerprint(fingerprint: string): Promise<boolean> {
  const store = getLocalStore();
  if (store.events.some((e) => e.type === 'page_visit' && e.fingerprint === fingerprint)) {
    return true;
  }

  try {
    const params = new URLSearchParams({
      select: 'id',
      type: 'eq.page_visit',
      metadata: `eq.${FINGERPRINT_PREFIX}${fingerprint}`,
      limit: '1',
    });
    const res = await fetch(`${SUPABASE_REST_URL}/${SUPABASE_ANALYTICS_TABLE}?${params.toString()}`, {
      method: 'GET',
      headers: getSupabaseHeaders(),
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const rows = (await res.json()) as Array<{ id: string }>;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

export async function resetAnalyticsStore(): Promise<AnalyticsEvent[]> {
  const store = getLocalStore();
  store.events = [];

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
      setSyncStatus('supabase-rest', 'Cleared all events from Supabase.');
      void syncSnapshotToPublicStorage(store.events);
    } else if (delRes.status === 401) {
      setSyncStatus('local-fallback', unauthorizedMessage());
    }
  } catch {
    // Local store cleared regardless
  }

  return store.events;
}

export async function verifySupabaseAdminIdTable(
  username: string,
  password: string
): Promise<boolean> {
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) return false;
  const anonKey = getAnonKey();
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
