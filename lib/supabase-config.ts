// Hardcoded Supabase project endpoints as requested (server-side module)
export const SUPABASE_PROJECT_URL = 'https://oblzunlbkmifwbpqvzis.supabase.co';
export const SUPABASE_REST_URL = 'https://oblzunlbkmifwbpqvzis.supabase.co/rest/v1';
export const SUPABASE_AUTH_URL = 'https://oblzunlbkmifwbpqvzis.supabase.co/auth/v1';
export const SUPABASE_STORAGE_URL = 'https://oblzunlbkmifwbpqvzis.supabase.co/storage/v1';
export const SUPABASE_REALTIME_URL = 'wss://oblzunlbkmifwbpqvzis.supabase.co/realtime/v1';

// Unique openfram_-prefixed identifiers for shared Supabase project isolation
export const SUPABASE_ANALYTICS_TABLE = 'openfram_visitor_analytics';
export const SUPABASE_ADMIN_IDS_TABLE = 'openfram_admin_access_ids';
export const SUPABASE_STORAGE_BUCKET = 'openfram_analytics';
export const SUPABASE_PUBLIC_SNAPSHOT_PATH = 'openfram_events.json';

export const SUPABASE_SETUP_SQL = `-- Run this SQL in your Supabase SQL Editor (https://oblzunlbkmifwbpqvzis.supabase.co)
-- Unique "openfram_" names for safe isolation on a shared Supabase project

-- 1. Public analytics events table (unprotected public storage/table, no RLS)
CREATE TABLE IF NOT EXISTS public.openfram_visitor_analytics (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('page_visit', 'cta_click', 'checkout_submit')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visitor_id TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  country_name TEXT NOT NULL DEFAULT 'United States',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  device TEXT NOT NULL DEFAULT 'Desktop',
  referrer TEXT NOT NULL DEFAULT 'direct',
  button_id TEXT,
  button_label TEXT,
  metadata TEXT,
  revenue_usd NUMERIC(10, 2)
);

-- Enforce single page_visit per visitor_id so a person is never counted twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_openfram_unique_visitor_page_visit
  ON public.openfram_visitor_analytics (visitor_id)
  WHERE type = 'page_visit';

CREATE INDEX IF NOT EXISTS idx_openfram_visitor_analytics_timestamp
  ON public.openfram_visitor_analytics (timestamp DESC);

ALTER TABLE public.openfram_visitor_analytics DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.openfram_visitor_analytics TO anon, authenticated;

-- 2. Simple non-Auth Admin IDs table (no Supabase Auth users required)
CREATE TABLE IF NOT EXISTS public.openfram_admin_access_ids (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  passcode TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.openfram_admin_access_ids (username, passcode)
VALUES ('Admin', 'Admin@99')
ON CONFLICT (username) DO NOTHING;

ALTER TABLE public.openfram_admin_access_ids DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.openfram_admin_access_ids TO anon, authenticated;

-- 3. Public Storage bucket for unprotected JSON snapshot storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('openfram_analytics', 'openfram_analytics', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'openfram_public_analytics_bucket_access'
  ) THEN
    CREATE POLICY "openfram_public_analytics_bucket_access"
      ON storage.objects FOR ALL
      USING (bucket_id = 'openfram_analytics')
      WITH CHECK (bucket_id = 'openfram_analytics');
  END IF;
END $$;
`;
