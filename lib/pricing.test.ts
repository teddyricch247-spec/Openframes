import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLACK_FRIDAY_END_ISO,
  BLACK_FRIDAY_PRICE_USD,
  REGULAR_PRICE_USD,
  calculateBlackFridayPricing,
  formatPadTwo,
  getCountdownToBlackFriday,
  parseEndTimestampMs,
  validateCheckoutForm,
} from './pricing';
import {
  GUIDE_MODULES,
  WORKFLOW_STEPS,
  filterCurriculumItems,
  getTotalWorkflowMinutes,
} from './guide-data';

test('Black Friday pricing applies $17 sale price and $30 savings before local deadline', () => {
  const beforeEnd = new Date(2026, 10, 26, 12, 0, 0).getTime();
  const pricing = calculateBlackFridayPricing(beforeEnd, BLACK_FRIDAY_END_ISO);

  assert.equal(pricing.regularPrice, REGULAR_PRICE_USD);
  assert.equal(pricing.salePrice, BLACK_FRIDAY_PRICE_USD);
  assert.equal(pricing.isSaleActive, true);
  assert.equal(pricing.effectivePrice, 17);
  assert.equal(pricing.savingsAmount, 30);
  assert.equal(pricing.discountPercent, 64);
});

test('Black Friday pricing reverts to $47 after user local Black Friday deadline', () => {
  const afterLocalEnd = new Date(2026, 10, 28, 0, 5, 0).getTime();
  const pricing = calculateBlackFridayPricing(afterLocalEnd, BLACK_FRIDAY_END_ISO);

  assert.equal(pricing.isSaleActive, false);
  assert.equal(pricing.effectivePrice, 47);
  assert.equal(pricing.savingsAmount, 0);
  assert.equal(pricing.discountPercent, 0);
});

test('Countdown resolves deadline in user local time and breaks down accurately', () => {
  const expectedLocalEnd = new Date(2026, 10, 27, 23, 59, 59, 999).getTime();
  assert.equal(parseEndTimestampMs(BLACK_FRIDAY_END_ISO), expectedLocalEnd);

  const exactOneDayBeforeLocal = new Date(2026, 10, 26, 23, 59, 59, 999).getTime();
  const countdown = getCountdownToBlackFriday(exactOneDayBeforeLocal, BLACK_FRIDAY_END_ISO);

  assert.equal(countdown.isExpired, false);
  assert.equal(countdown.days, 1);
  assert.equal(countdown.hours, 0);
  assert.equal(countdown.minutes, 0);
  assert.equal(countdown.seconds, 0);

  const expired = getCountdownToBlackFriday(
    new Date(2026, 10, 28, 10, 0, 0).getTime(),
    BLACK_FRIDAY_END_ISO
  );
  assert.equal(expired.isExpired, true);
  assert.equal(expired.days, 0);
  assert.equal(formatPadTwo(5), '05');
});

test('Checkout form validation rejects empty or malformed inputs', () => {
  const emptyResult = validateCheckoutForm({ fullName: '', email: '' });
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.errors.fullName);
  assert.ok(emptyResult.errors.email);

  const badEmail = validateCheckoutForm({ fullName: 'Alex Rivera', email: 'not-an-email' });
  assert.equal(badEmail.valid, false);
  assert.equal(badEmail.errors.fullName, undefined);
  assert.ok(badEmail.errors.email);

  const valid = validateCheckoutForm({ fullName: 'Alex Rivera', email: 'alex@example.com' });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('20-minute workflow breakdown sums strictly to 20 minutes', () => {
  assert.equal(getTotalWorkflowMinutes(WORKFLOW_STEPS), 20);
});

test('Curriculum filter tabs return matching subsets and full list for all', () => {
  const all = filterCurriculumItems(GUIDE_MODULES, 'all');
  assert.equal(all.length, GUIDE_MODULES.length);

  const openSourceOnly = filterCurriculumItems(GUIDE_MODULES, 'open-source');
  assert.ok(openSourceOnly.length > 0);
  assert.ok(openSourceOnly.every((item) => item.category === 'open-source'));

  const workflowOnly = filterCurriculumItems(GUIDE_MODULES, 'workflow');
  assert.ok(workflowOnly.length > 0);
  assert.ok(workflowOnly.every((item) => item.category === 'workflow'));
});
