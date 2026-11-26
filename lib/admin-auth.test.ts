import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAdminSessionToken,
  verifyAdminCredentials,
  verifyAdminSessionToken,
} from './admin-auth';

test('verifyAdminCredentials accepts configured Admin username and password', () => {
  assert.equal(verifyAdminCredentials('Admin', 'Admin@99'), true);
  assert.equal(verifyAdminCredentials(' Admin ', 'Admin@99'), true);
});

test('verifyAdminCredentials rejects invalid username, password, or empty strings', () => {
  assert.equal(verifyAdminCredentials('admin', 'Admin@99'), false);
  assert.equal(verifyAdminCredentials('Admin', 'wrong'), false);
  assert.equal(verifyAdminCredentials('', ''), false);
});

test('createAdminSessionToken and verifyAdminSessionToken validate unexpired signed tokens', () => {
  const now = 1_795_700_000_000;
  const token = createAdminSessionToken('Admin', now);
  const payload = verifyAdminSessionToken(token, now + 60_000);
  assert.ok(payload);
  assert.equal(payload.sub, 'Admin');
});

test('verifyAdminSessionToken rejects tampered or expired tokens', () => {
  const now = 1_795_700_000_000;
  const token = createAdminSessionToken('Admin', now);
  const tampered = `${token.slice(0, -4)}xxxx`;

  assert.equal(verifyAdminSessionToken(tampered, now + 1000), null);
  assert.equal(verifyAdminSessionToken(token, now + 10 * 3600 * 1000), null);
  assert.equal(verifyAdminSessionToken('invalid-token', now), null);
});
