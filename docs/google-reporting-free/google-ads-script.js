const CONFIG = {
  SPREADSHEET_ID: '1Zxf83wL3gAJRF2tw-Lz9gGghHMVW6qbUcuAjkezndu0',
  CAMPAIGN_NAME: 'Lezioni AutoCAD Online - Ricerca - Manuale'
};

function main() {
  const tz = AdsApp.currentAccount().getTimeZone();
  const date = formatDateOffset_(-1, tz);

  writeCampaignDaily_(date);
  writeKeywordDaily_(date);
  writeSearchTermsDaily_(date);
  writeDeviceDaily_(date);
}

function writeCampaignDaily_(date) {
  const query = `
    SELECT
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.average_cpc,
      metrics.conversions,
      metrics.conversions_from_interactions_rate,
      metrics.cost_per_conversion,
      metrics.search_impression_share
    FROM campaign
    WHERE campaign.name = '${escapeGaql_(CONFIG.CAMPAIGN_NAME)}'
      AND segments.date = '${date}'
  `;

  const rows = [];
  const it = AdsApp.search(query);
  while (it.hasNext()) {
    const row = it.next();
    rows.push([
      date,
      row.campaign.name,
      row.campaign.status,
      num_(row.metrics.impressions),
      num_(row.metrics.clicks),
      num_(row.metrics.ctr),
      micros_(row.metrics.costMicros),
      micros_(row.metrics.averageCpc),
      num_(row.metrics.conversions),
      num_(row.metrics.conversionsFromInteractionsRate),
      micros_(row.metrics.costPerConversion),
      num_(row.metrics.searchImpressionShare)
    ]);
  }

  if (!rows.length) {
    rows.push([date, CONFIG.CAMPAIGN_NAME, 'NO_DATA', 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  replaceRowsForDate_('Ads_Daily', date, rows);
}

function writeKeywordDaily_(date) {
  const query = `
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM keyword_view
    WHERE campaign.name = '${escapeGaql_(CONFIG.CAMPAIGN_NAME)}'
      AND segments.date = '${date}'
  `;

  const rows = [];
  const it = AdsApp.search(query);
  while (it.hasNext()) {
    const row = it.next();
    rows.push([
      date,
      row.campaign.name,
      row.adGroup.name,
      row.adGroupCriterion.keyword.text,
      row.adGroupCriterion.keyword.matchType,
      row.adGroupCriterion.status,
      num_(row.metrics.impressions),
      num_(row.metrics.clicks),
      num_(row.metrics.ctr),
      micros_(row.metrics.costMicros),
      num_(row.metrics.conversions),
      micros_(row.metrics.costPerConversion)
    ]);
  }
  replaceRowsForDate_('Ads_Keywords', date, rows);
}

function writeSearchTermsDaily_(date) {
  const query = `
    SELECT
      campaign.name,
      ad_group.name,
      search_term_view.search_term,
      segments.keyword.info.text,
      segments.keyword.info.match_type,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM search_term_view
    WHERE campaign.name = '${escapeGaql_(CONFIG.CAMPAIGN_NAME)}'
      AND segments.date = '${date}'
  `;

  const rows = [];
  const it = AdsApp.search(query);
  while (it.hasNext()) {
    const row = it.next();
    const keyword = row.segments && row.segments.keyword && row.segments.keyword.info ? row.segments.keyword.info.text : '';
    const matchType = row.segments && row.segments.keyword && row.segments.keyword.info ? row.segments.keyword.info.matchType : '';
    rows.push([
      date,
      row.campaign.name,
      row.adGroup.name,
      row.searchTermView.searchTerm,
      keyword,
      matchType,
      num_(row.metrics.impressions),
      num_(row.metrics.clicks),
      num_(row.metrics.ctr),
      micros_(row.metrics.costMicros),
      num_(row.metrics.conversions),
      micros_(row.metrics.costPerConversion)
    ]);
  }
  replaceRowsForDate_('Ads_Search_Terms', date, rows);
}

function writeDeviceDaily_(date) {
  const query = `
    SELECT
      campaign.name,
      segments.device,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM campaign
    WHERE campaign.name = '${escapeGaql_(CONFIG.CAMPAIGN_NAME)}'
      AND segments.date = '${date}'
  `;

  const rows = [];
  const it = AdsApp.search(query);
  while (it.hasNext()) {
    const row = it.next();
    rows.push([
      date,
      row.campaign.name,
      row.segments.device,
      num_(row.metrics.impressions),
      num_(row.metrics.clicks),
      num_(row.metrics.ctr),
      micros_(row.metrics.costMicros),
      num_(row.metrics.conversions),
      micros_(row.metrics.costPerConversion)
    ]);
  }
  replaceRowsForDate_('Ads_Devices', date, rows);
}

function replaceRowsForDate_(sheetName, date, newRows) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Foglio mancante: ' + sheetName);

  const data = sh.getDataRange().getValues();
  const width = sh.getLastColumn();
  const keep = data.slice(1).filter(r => String(r[0] || '') !== String(date));
  const merged = keep.concat(newRows || []);

  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, width).clearContent();
  if (merged.length) {
    const padded = merged.map(r => {
      const x = r.slice();
      while (x.length < width) x.push('');
      return x.slice(0, width);
    });
    sh.getRange(2, 1, padded.length, width).setValues(padded);
  }
}

function formatDateOffset_(days, tz) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
}

function micros_(value) {
  return num_(value) / 1000000;
}

function num_(value) {
  const n = Number(value || 0);
  return isFinite(n) ? n : 0;
}

function escapeGaql_(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
