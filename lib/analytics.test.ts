import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAnalyticsSummary,
  detectDeviceType,
  resolveVisitorCountry,
  type AnalyticsEvent,
} from './analytics';

function makeEvent(overrides: Partial<AnalyticsEvent> & Pick<AnalyticsEvent, 'id' | 'type' | 'timestamp' | 'visitorId'>): AnalyticsEvent {
  return {
    countryCode: 'US',
    countryName: 'United States',
    timezone: 'America/New_York',
    device: 'Desktop',
    referrer: 'direct',
    ...overrides,
  };
}

test('resolveVisitorCountry prioritizes CDN header over timezone and accept-language', () => {
  const result = resolveVisitorCountry({
    headerCountry: 'DE',
    timezone: 'America/New_York',
    acceptLanguage: 'en-US,en;q=0.9',
  });
  assert.equal(result.countryCode, 'DE');
  assert.equal(result.countryName, 'Germany');
});

test('resolveVisitorCountry falls back cleanly to timezone and accept-language', () => {
  const byTz = resolveVisitorCountry({
    headerCountry: null,
    timezone: 'Europe/London',
    acceptLanguage: null,
  });
  assert.equal(byTz.countryCode, 'GB');
  assert.equal(byTz.countryName, 'United Kingdom');

  const byLang = resolveVisitorCountry({
    headerCountry: null,
    timezone: 'UTC',
    acceptLanguage: 'fr-FR,fr;q=0.9',
  });
  assert.equal(byLang.countryCode, 'FR');
  assert.equal(byLang.countryName, 'France');
});

test('computeAnalyticsSummary handles empty event array safely without NaN', () => {
  const summary = computeAnalyticsSummary([]);
  assert.equal(summary.totalVisits, 0);
  assert.equal(summary.uniqueVisitors, 0);
  assert.equal(summary.crucialButtonClicks, 0);
  assert.equal(summary.checkoutOpens, 0);
  assert.equal(summary.ctaClickRate, 0);
  assert.equal(summary.countryBreakdown.length, 0);
  assert.equal(summary.daily.length, 90);
  assert.ok(summary.daily.every((d) => d.newVisitors === 0 && d.buttonClicks === 0));
});

test('computeAnalyticsSummary calculates visits, clicks, and click rates accurately', () => {
  const events: AnalyticsEvent[] = [
    makeEvent({
      id: '1',
      type: 'page_visit',
      timestamp: '2026-11-22T10:00:00Z',
      visitorId: 'v1',
      referrer: 'x.com',
    }),
    makeEvent({
      id: '2',
      type: 'page_visit',
      timestamp: '2026-11-22T11:00:00Z',
      visitorId: 'v2',
      countryCode: 'GB',
      countryName: 'United Kingdom',
      timezone: 'Europe/London',
      device: 'Mobile',
    }),
    makeEvent({
      id: '3',
      type: 'cta_click',
      timestamp: '2026-11-22T10:01:00Z',
      visitorId: 'v1',
      referrer: 'x.com',
      buttonId: 'hero_get_guide',
      buttonLabel: 'Hero CTA: Get the Guide — $17',
    }),
  ];

  const summary = computeAnalyticsSummary(events);
  assert.equal(summary.totalVisits, 2);
  assert.equal(summary.uniqueVisitors, 2);
  assert.equal(summary.crucialButtonClicks, 1);
  assert.equal(summary.checkoutOpens, 1);
  assert.equal(summary.ctaClickRate, 50);
  assert.equal(summary.countriesCount, 2);
  assert.equal(summary.countryBreakdown[0].countryCode, 'US');
  assert.equal(summary.countryBreakdown[0].ctaClicks, 1);
});

test('detectDeviceType identifies desktop, mobile, and tablet user agents', () => {
  assert.equal(detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile'), 'Mobile');
  assert.equal(detectDeviceType('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) Tablet'), 'Tablet');
  assert.equal(detectDeviceType('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'Desktop');
});

test('computeAnalyticsSummary never counts a single visitorId twice in page visits', () => {
  const duplicateVisits: AnalyticsEvent[] = [
    makeEvent({
      id: 'dup-1',
      type: 'page_visit',
      timestamp: '2026-11-26T09:00:00Z',
      visitorId: 'vis-repeat-user',
      device: 'Mobile',
    }),
    makeEvent({
      id: 'dup-2',
      type: 'page_visit',
      timestamp: '2026-11-26T09:05:00Z',
      visitorId: 'vis-repeat-user',
      device: 'Mobile',
    }),
  ];

  const summary = computeAnalyticsSummary(duplicateVisits);
  assert.equal(summary.totalVisits, 1);
  assert.equal(summary.uniqueVisitors, 1);
  assert.equal(summary.countryBreakdown[0].visits, 1);
});

test('daily buckets fill empty days with zeros and split activity by day', () => {
  const events: AnalyticsEvent[] = [
    makeEvent({ id: 'd1', type: 'page_visit', timestamp: '2026-11-20T08:00:00Z', visitorId: 'a' }),
    makeEvent({ id: 'd2', type: 'page_visit', timestamp: '2026-11-22T09:00:00Z', visitorId: 'b' }),
    makeEvent({ id: 'd3', type: 'page_visit', timestamp: '2026-11-22T10:00:00Z', visitorId: 'c' }),
    makeEvent({
      id: 'd4',
      type: 'cta_click',
      timestamp: '2026-11-22T10:01:00Z',
      visitorId: 'c',
      buttonId: 'hero_get_guide',
    }),
    makeEvent({
      id: 'd5',
      type: 'cta_click',
      timestamp: '2026-11-22T10:02:00Z',
      visitorId: 'c',
      buttonId: 'video_placeholder_preview',
    }),
  ];

  const summary = computeAnalyticsSummary(events, {
    timeZone: 'UTC',
    nowMs: Date.parse('2026-11-22T20:00:00Z'),
    days: 3,
  });

  assert.deepEqual(
    summary.daily.map((d) => d.date),
    ['2026-11-20', '2026-11-21', '2026-11-22']
  );
  assert.deepEqual(
    summary.daily.map((d) => d.newVisitors),
    [1, 0, 2]
  );
  assert.deepEqual(
    summary.daily.map((d) => d.activeVisitors),
    [1, 0, 2]
  );
  assert.equal(summary.daily[2].buttonClicks, 2);
  assert.equal(summary.daily[2].checkoutOpens, 1);
  assert.equal(summary.daily[1].buttonClicks, 0);
});

test('daily buckets respect the requested time zone', () => {
  const events: AnalyticsEvent[] = [
    // 03:00 UTC on Nov 22 is still Nov 21 evening in Los Angeles
    makeEvent({ id: 'tz1', type: 'page_visit', timestamp: '2026-11-22T03:00:00Z', visitorId: 'tz-a' }),
  ];

  const nowMs = Date.parse('2026-11-22T20:00:00Z');
  const utc = computeAnalyticsSummary(events, { timeZone: 'UTC', nowMs, days: 2 });
  const la = computeAnalyticsSummary(events, { timeZone: 'America/Los_Angeles', nowMs, days: 2 });

  assert.deepEqual(
    utc.daily.map((d) => d.newVisitors),
    [0, 1]
  );
  assert.deepEqual(
    la.daily.map((d) => d.newVisitors),
    [1, 0]
  );
  assert.equal(la.timeZone, 'America/Los_Angeles');
});

test('an invalid time zone falls back to UTC instead of throwing', () => {
  const summary = computeAnalyticsSummary([], { timeZone: 'Not/AZone', days: 2 });
  assert.equal(summary.timeZone, 'UTC');
  assert.equal(summary.daily.length, 2);
});
