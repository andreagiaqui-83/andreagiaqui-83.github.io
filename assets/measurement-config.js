/* Single domain-wide configuration. GA4 ID supplied by the site owner; Google Ads remains inactive.
   Do not install a GTM Google tag in parallel with this direct gtag integration. */
window.AG_MEASUREMENT = Object.freeze({
  ga4Id: 'G-SQ7LJ1FVVY',
  adsId: '',
  adsLeadLabel: '',
  // 'ga4_import' is the default: import generate_lead into Ads once.
  // Set 'direct' only if the GA4 import is NOT a primary Ads conversion.
  conversionMode: 'ga4_import',
  consentVersion: 2,
  consentMaxAgeDays: 180
});
