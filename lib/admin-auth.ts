import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'openframe_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

// Server-side credential verification hashes (never imported by client components)
// Expected defaults match Admin / Admin@99 unless overridden via env vars.
const DEFAULT_ADMIN_USERNAME_SHA256 = crypto
  .createHash('sha256')
  .update('Admin', 'utf8')
  .digest();
const DEFAULT_ADMIN_PASSWORD_SHA256 = crypto
  .createHash('sha256')
  .update('Admin@99', 'utf8')
  .digest();

const globalForAuth = globalThis as unknown as {
  __openFrameSessionSecret?: string;
};

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (!globalForAuth.__openFrameSessionSecret) {
    globalForAuth.__openFrameSessionSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalForAuth.__openFrameSessionSecret;
}

function sha256Buffer(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) {
    return false;
  }

  const expectedUserHash = process.env.ADMIN_USERNAME
    ? sha256Buffer(process.env.ADMIN_USERNAME)
    : DEFAULT_ADMIN_USERNAME_SHA256;
  const expectedPassHash = process.env.ADMIN_PASSWORD
    ? sha256Buffer(process.env.ADMIN_PASSWORD)
    : DEFAULT_ADMIN_PASSWORD_SHA256;

  const actualUserHash = sha256Buffer(trimmedUser);
  const actualPassHash = sha256Buffer(password);

  const userMatch = crypto.timingSafeEqual(actualUserHash, expectedUserHash);
  const passMatch = crypto.timingSafeEqual(actualPassHash, expectedPassHash);
  return userMatch && passMatch;
}

export interface AdminSessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

export function createAdminSessionToken(
  username: string,
  nowMs: number = Date.now()
): string {
  const payload: AdminSessionPayload = {
    sub: username,
    iat: nowMs,
    exp: nowMs + SESSION_TTL_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string | undefined | null,
  nowMs: number = Date.now()
): AdminSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as AdminSessionPayload;
    if (!decoded || typeof decoded.sub !== 'string' || typeof decoded.exp !== 'number') {
      return null;
    }
    if (decoded.exp <= nowMs) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function getServerAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    partitioned: true,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function verifySameOriginRequest(req: NextRequest): boolean {
  const originHeader = req.headers.get('origin');
  if (!originHeader) {
    return true;
  }
  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!forwardedHost) {
    return false;
  }
  try {
    const parsedOrigin = new URL(originHeader);
    return parsedOrigin.host.toLowerCase() === forwardedHost.toLowerCase();
  } catch {
    return false;
  }
}
