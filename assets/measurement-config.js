/* Single domain-wide configuration. GA4 ID supplied by the site owner; no separate Ads tag.
   Do not install a GTM Google tag in parallel with this direct gtag integration. */
window.AG_MEASUREMENT = Object.freeze({
  ga4Id: 'G-SQ7LJ1FVVY',
  adsId: '',
  adsLeadLabel: '',
  // GA4 import: generate_lead for lessons; service_quote_success for services.
  // Import each relevant event once; clicks remain secondary interactions.
  // Set 'direct' only if the GA4 import is NOT a primary Ads conversion.
  conversionMode: 'ga4_import',
  consentVersion: 2,
  consentMaxAgeDays: 180
});
