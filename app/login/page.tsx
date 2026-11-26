import { redirect } from 'next/navigation';
import LoginClient from '@/components/LoginClient';
import { getServerAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getServerAdminSession();
  if (session) {
    redirect('/admin');
  }

  return <LoginClient />;
}
