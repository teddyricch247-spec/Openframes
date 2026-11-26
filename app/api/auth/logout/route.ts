import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getAdminCookieOptions,
  verifySameOriginRequest,
} from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!verifySameOriginRequest(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...getAdminCookieOptions(),
    maxAge: 0,
  });
  return response;
}
