import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCookieOptions,
  verifyAdminCredentials,
} from '@/lib/admin-auth';
import { verifySupabaseAdminIdTable } from '@/lib/analytics-store';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      username?: unknown;
      password?: unknown;
    };

    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const isLocalMatch = verifyAdminCredentials(username, password);
    const isSupabaseIdMatch = isLocalMatch
      ? false
      : await verifySupabaseAdminIdTable(username, password);

    if (!isLocalMatch && !isSupabaseIdMatch) {
      return NextResponse.json(
        { error: 'Invalid admin username or password.' },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken(username);
    const response = NextResponse.json({ ok: true, username }, { status: 200 });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: 'Malformed login request.' }, { status: 400 });
  }
}
