import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAnalyticsSummary,
  detectDeviceType,
  resolveVisitorCountry,
  type AnalyticsEvent,
} from './analytics';

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
  assert.equal(summary.completedConversions, 0);
  assert.equal(summary.ctaClickRate, 0);
  assert.equal(summary.overallConversionRate, 0);
  assert.equal(summary.checkoutCompletionRate, 0);
  assert.equal(summary.countryBreakdown.length, 0);
});

test('computeAnalyticsSummary calculates visits, clicks, conversion rates, and revenue accurately', () => {
  const events: AnalyticsEvent[] = [
    {
      id: '1',
      type: 'page_visit',
      timestamp: '2026-11-22T10:00:00Z',
      visitorId: 'v1',
      countryCode: 'US',
      countryName: 'United States',
      timezone: 'America/New_York',
      device: 'Desktop',
      referrer: 'x.com',
    },
    {
      id: '2',
      type: 'page_visit',
      timestamp: '2026-11-22T11:00:00Z',
      visitorId: 'v2',
      countryCode: 'GB',
      countryName: 'United Kingdom',
      timezone: 'Europe/London',
      device: 'Mobile',
      referrer: 'direct',
    },
    {
      id: '3',
      type: 'cta_click',
      timestamp: '2026-11-22T10:01:00Z',
      visitorId: 'v1',
      countryCode: 'US',
      countryName: 'United States',
      timezone: 'America/New_York',
      device: 'Desktop',
      referrer: 'x.com',
      buttonId: 'hero_get_guide',
      buttonLabel: 'Hero CTA: Get the Guide — $17',
    },
    {
      id: '4',
      type: 'checkout_submit',
      timestamp: '2026-11-22T10:02:00Z',
      visitorId: 'v1',
      countryCode: 'US',
      countryName: 'United States',
      timezone: 'America/New_York',
      device: 'Desktop',
      referrer: 'x.com',
      buttonId: 'hero_get_guide',
      revenueUsd: 17,
    },
  ];

  const summary = computeAnalyticsSummary(events);
  assert.equal(summary.totalVisits, 2);
  assert.equal(summary.uniqueVisitors, 2);
  assert.equal(summary.crucialButtonClicks, 1);
  assert.equal(summary.checkoutOpens, 1);
  assert.equal(summary.completedConversions, 1);
  assert.equal(summary.estimatedRevenueUsd, 17);
  assert.equal(summary.ctaClickRate, 50);
  assert.equal(summary.overallConversionRate, 50);
  assert.equal(summary.checkoutCompletionRate, 100);
  assert.equal(summary.countriesCount, 2);
  assert.equal(summary.countryBreakdown[0].countryCode, 'US');
  assert.equal(summary.countryBreakdown[0].conversionRate, 100);
});

test('detectDeviceType identifies desktop, mobile, and tablet user agents', () => {
  assert.equal(detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile'), 'Mobile');
  assert.equal(detectDeviceType('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) Tablet'), 'Tablet');
  assert.equal(detectDeviceType('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'Desktop');
});

test('computeAnalyticsSummary never counts a single visitorId twice in page visits', () => {
  const duplicateVisits: AnalyticsEvent[] = [
    {
      id: 'dup-1',
      type: 'page_visit',
      timestamp: '2026-11-26T09:00:00Z',
      visitorId: 'vis-repeat-user',
      countryCode: 'US',
      countryName: 'United States',
      timezone: 'America/New_York',
      device: 'Mobile',
      referrer: 'direct',
    },
    {
      id: 'dup-2',
      type: 'page_visit',
      timestamp: '2026-11-26T09:05:00Z',
      visitorId: 'vis-repeat-user',
      countryCode: 'US',
      countryName: 'United States',
      timezone: 'America/New_York',
      device: 'Mobile',
      referrer: 'direct',
    },
  ];

  const summary = computeAnalyticsSummary(duplicateVisits);
  assert.equal(summary.totalVisits, 1);
  assert.equal(summary.uniqueVisitors, 1);
  assert.equal(summary.countryBreakdown[0].visits, 1);
});
