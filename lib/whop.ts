// Whop embedded checkout settings.
// The price charged is defined by this plan inside Whop, not by the site.
export const WHOP_PLAN_ID = 'plan_sAwl4XRuK5cR9';

// Plain hosted checkout, used as the "open in a new tab" fallback.
export const WHOP_CHECKOUT_URL = `https://whop.com/checkout/${WHOP_PLAN_ID}`;

// Whop's official embed loader. It finds [data-whop-checkout-plan-id] elements and mounts the checkout.
export const WHOP_LOADER_SRC = 'https://js.whop.com/static/checkout/loader.js';

// URL hash that shows the payment page. Lets the browser Back button close it.
export const CHECKOUT_HASH = '#checkout';
