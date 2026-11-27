import { redirect } from 'next/navigation';
import AdminDashboardClient from '@/components/AdminDashboardClient';
import { getServerAdminSession } from '@/lib/admin-auth';
import { computeAnalyticsSummary } from '@/lib/analytics';
import { getAllAnalyticsEvents, getSupabaseSyncInfo } from '@/lib/analytics-store';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getServerAdminSession();
  if (!session) {
    redirect('/login');
  }

  const events = await getAllAnalyticsEvents();
  const initialSummary = computeAnalyticsSummary(events);
  const supabaseSync = getSupabaseSyncInfo();

  return (
    <AdminDashboardClient
      initialSummary={initialSummary}
      sessionUsername={session.sub}
      initialSupabaseSync={supabaseSync}
    />
  );
}
