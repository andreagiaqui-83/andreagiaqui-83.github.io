/* Single domain-wide configuration. Keep IDs empty until the real Google property is connected.
   Do not install a GTM Google tag in parallel with this direct gtag integration. */
window.AG_MEASUREMENT = Object.freeze({
  ga4Id: '',
  adsId: '',
  adsLeadLabel: '',
  // 'ga4_import' is the default: import generate_lead into Ads once.
  // Set 'direct' only if the GA4 import is NOT a primary Ads conversion.
  conversionMode: 'ga4_import',
  consentVersion: 1,
  consentMaxAgeDays: 180
});
