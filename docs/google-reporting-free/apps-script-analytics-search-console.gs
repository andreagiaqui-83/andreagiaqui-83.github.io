const SPREADSHEET_ID = '1Zxf83wL3gAJRF2tw-Lz9gGghHMVW6qbUcuAjkezndu0';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Report Google gratuito')
    .addItem('Test connessioni', 'testConnections')
    .addItem('Esegui report ora', 'runDailyGoogleReporting')
    .addItem('Installa trigger giornaliero', 'installDailyTrigger')
    .addToUi();
}

function installDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'runDailyGoogleReporting')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('runDailyGoogleReporting')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  setDashboardStatus_('Report giornaliero', 'Trigger installato', 'Esecuzione automatica ogni mattina, fuso Europe/Rome');
}

function testConnections() {
  const cfg = getConfig_();
  const date = dateOffset_(-1, cfg.TIMEZONE || 'Europe/Rome');

  try {
    const r = ga4Run_([], ['activeUsers'], date, date, null, cfg);
    const users = r.rows && r.rows.length ? Number(r.rows[0].metricValues[0].value || 0) : 0;
    setDashboardStatus_('Google Analytics 4', 'OK', 'Connessione attiva. Active users ieri: ' + users);
  } catch (e) {
    setDashboardStatus_('Google Analytics 4', 'ERRORE', String(e.message || e));
    throw e;
  }

  try {
    const site = detectSearchConsoleSite_(cfg);
    setDashboardStatus_('Google Search Console', 'OK', 'Proprietà rilevata: ' + site);
  } catch (e) {
    setDashboardStatus_('Google Search Console', 'ERRORE', String(e.message || e));
    throw e;
  }

  SpreadsheetApp.getActive().toast('Connessioni Google verificate.', 'Report Google gratuito', 5);
}

function runDailyGoogleReporting() {
  const cfg = getConfig_();
  const tz = cfg.TIMEZONE || 'Europe/Rome';
  const reportDate = dateOffset_(-1, tz);

  collectGa4Daily_(reportDate, cfg);
  collectGa4Sources_(reportDate, cfg);
  collectSearchConsoleRolling_(3, cfg);
  buildDailyReport_(reportDate, cfg);

  setDashboardStatus_('Google Analytics 4', 'OK', 'Ultimo aggiornamento: ' + new Date());
  setDashboardStatus_('Google Search Console', 'OK', 'Ultimo aggiornamento: ' + new Date());
  setDashboardStatus_('Report giornaliero', 'Dati aggiornati', 'Data report: ' + reportDate);
}

function collectGa4Daily_(date, cfg) {
  const landingFilter = {
    filter: {
      fieldName: 'landingPagePlusQueryString',
      stringFilter: {matchType: 'BEGINS_WITH', value: cfg.LANDING_PATH, caseSensitive: false}
    }
  };

  const core = ga4Run_(
    [],
    ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'engagedSessions', 'engagementRate', 'userEngagementDuration', 'keyEvents'],
    date,
    date,
    landingFilter,
    cfg
  );

  const vals = core.rows && core.rows.length ? core.rows[0].metricValues.map(v => Number(v.value || 0)) : [0,0,0,0,0,0,0,0];
  const [activeUsers, newUsers, sessions, views, engagedSessions, engagementRate, engagementSeconds, keyEvents] = vals;

  let generateLead = 0;
  try {
    const leadFilter = {
      andGroup: {
        expressions: [
          {filter: {fieldName: 'eventName', stringFilter: {matchType: 'EXACT', value: 'generate_lead', caseSensitive: true}}},
          {filter: {fieldName: 'pagePathPlusQueryString', stringFilter: {matchType: 'BEGINS_WITH', value: cfg.LANDING_PATH, caseSensitive: false}}}
        ]
      }
    };
    const lead = ga4Run_(['eventName'], ['eventCount'], date, date, leadFilter, cfg);
    if (lead.rows && lead.rows.length) generateLead = Number(lead.rows[0].metricValues[0].value || 0);
  } catch (e) {
    console.warn('generate_lead report warning: ' + e);
  }

  const avgEngagementSec = sessions > 0 ? engagementSeconds / sessions : 0;
  replaceRowsForDates_('GA4_Daily', [date], [[
    date, cfg.LANDING_PATH, activeUsers, newUsers, sessions, views, engagedSessions,
    engagementRate, avgEngagementSec, keyEvents, generateLead
  ]]);
}

function collectGa4Sources_(date, cfg) {
  const dims = ['sessionSource', 'sessionMedium', 'sessionCampaignName', 'sessionDefaultChannelGroup'];
  const metrics = ['activeUsers', 'sessions', 'screenPageViews', 'engagedSessions', 'keyEvents'];
  const landingFilter = {
    filter: {
      fieldName: 'landingPagePlusQueryString',
      stringFilter: {matchType: 'BEGINS_WITH', value: cfg.LANDING_PATH, caseSensitive: false}
    }
  };

  const base = ga4Run_(dims, metrics, date, date, landingFilter, cfg);
  const leadMap = {};

  try {
    const leadFilter = {
      andGroup: {
        expressions: [
          {filter: {fieldName: 'eventName', stringFilter: {matchType: 'EXACT', value: 'generate_lead', caseSensitive: true}}},
          {filter: {fieldName: 'pagePathPlusQueryString', stringFilter: {matchType: 'BEGINS_WITH', value: cfg.LANDING_PATH, caseSensitive: false}}}
        ]
      }
    };
    const leadReport = ga4Run_(dims, ['eventCount'], date, date, leadFilter, cfg);
    (leadReport.rows || []).forEach(row => {
      const key = row.dimensionValues.map(v => v.value || '').join('||');
      leadMap[key] = Number(row.metricValues[0].value || 0);
    });
  } catch (e) {
    console.warn('Source generate_lead report warning: ' + e);
  }

  const rows = (base.rows || []).map(row => {
    const d = row.dimensionValues.map(v => v.value || '');
    const m = row.metricValues.map(v => Number(v.value || 0));
    const key = d.join('||');
    return [date, d[0], d[1], d[2], d[3], m[0], m[1], m[2], m[3], m[4], leadMap[key] || 0];
  });

  replaceRowsForDates_('GA4_Sources', [date], rows);
}

function collectSearchConsoleRolling_(days, cfg) {
  const tz = cfg.TIMEZONE || 'Europe/Rome';
  const endDate = dateOffset_(-1, tz);
  const startDate = dateOffset_(-days, tz);
  const site = detectSearchConsoleSite_(cfg);
  const landingUrl = 'https://' + cfg.SITE_DOMAIN + cfg.LANDING_PATH;

  const queryPayload = {
    startDate,
    endDate,
    dimensions: ['date', 'query'],
    dimensionFilterGroups: [{filters: [{dimension: 'page', operator: 'contains', expression: landingUrl}]}],
    rowLimit: 25000,
    dataState: 'all'
  };
  const queryData = gscQuery_(site, queryPayload);
  const queryRows = (queryData.rows || []).map(r => [r.keys[0], r.keys[1], r.clicks || 0, r.impressions || 0, r.ctr || 0, r.position || 0]);

  const pagePayload = {
    startDate,
    endDate,
    dimensions: ['date', 'page'],
    dimensionFilterGroups: [{filters: [{dimension: 'page', operator: 'contains', expression: landingUrl}]}],
    rowLimit: 25000,
    dataState: 'all'
  };
  const pageData = gscQuery_(site, pagePayload);
  const pageRows = (pageData.rows || []).map(r => [r.keys[0], r.keys[1], r.clicks || 0, r.impressions || 0, r.ctr || 0, r.position || 0]);

  const dates = [];
  for (let i = days; i >= 1; i--) dates.push(dateOffset_(-i, tz));
  replaceRowsForDates_('GSC_Queries', dates, queryRows);
  replaceRowsForDates_('GSC_Pages', dates, pageRows);
}

function buildDailyReport_(date, cfg) {
  const rows = [];
  const generatedAt = Utilities.formatDate(new Date(), cfg.TIMEZONE || 'Europe/Rome', 'yyyy-MM-dd HH:mm:ss');

  const ads = rowsForDate_('Ads_Daily', date);
  if (ads.length) {
    const r = ads[0];
    addReportRow_(rows, generatedAt, date, 'Google Ads', 'Impressioni', r[3], '');
    addReportRow_(rows, generatedAt, date, 'Google Ads', 'Clic', r[4], '');
    addReportRow_(rows, generatedAt, date, 'Google Ads', 'CTR', r[5], '');
    addReportRow_(rows, generatedAt, date, 'Google Ads', 'Costo €', r[6], '');
    addReportRow_(rows, generatedAt, date, 'Google Ads', 'CPC medio €', r[7], '');
    addReportRow_(rows, generatedAt, date, 'Google Ads', 'Conversioni', r[8], '');
    addReportRow_(rows, generatedAt, date, 'Google Ads', 'CPA €', r[10], '');
  } else {
    addReportRow_(rows, generatedAt, date, 'Google Ads', 'Stato dati', 'Non ancora disponibili', 'Lo script Google Ads deve essere attivo.');
  }

  const ga4 = rowsForDate_('GA4_Daily', date);
  if (ga4.length) {
    const r = ga4[0];
    addReportRow_(rows, generatedAt, date, 'GA4', 'Utenti attivi landing', r[2], '');
    addReportRow_(rows, generatedAt, date, 'GA4', 'Sessioni landing', r[4], '');
    addReportRow_(rows, generatedAt, date, 'GA4', 'Visualizzazioni landing', r[5], '');
    addReportRow_(rows, generatedAt, date, 'GA4', 'Engagement rate', r[7], '');
    addReportRow_(rows, generatedAt, date, 'GA4', 'generate_lead', r[10], '');
  }

  const gsc = rowsForDate_('GSC_Queries', date);
  if (gsc.length) {
    let clicks = 0, impressions = 0, top = null;
    gsc.forEach(r => {
      clicks += Number(r[2] || 0);
      impressions += Number(r[3] || 0);
      if (!top || Number(r[3] || 0) > Number(top[3] || 0)) top = r;
    });
    addReportRow_(rows, generatedAt, date, 'Search Console', 'Clic organici landing', clicks, '');
    addReportRow_(rows, generatedAt, date, 'Search Console', 'Impression organiche landing', impressions, '');
    if (top) addReportRow_(rows, generatedAt, date, 'Search Console', 'Query organica principale', top[1], 'Impression: ' + top[3] + ' | posizione: ' + top[5]);
  } else {
    addReportRow_(rows, generatedAt, date, 'Search Console', 'Stato dati', 'Non ancora disponibili', 'Search Console può avere 24-72 ore di ritardo.');
  }

  const adsDaily = getSheet_('Ads_Daily').getDataRange().getValues().slice(1);
  const start = cfg.CAMPAIGN_START;
  const end = date;
  const cumulative = adsDaily
    .filter(r => String(r[0]) >= start && String(r[0]) <= end)
    .reduce((sum, r) => sum + Number(r[6] || 0), 0);
  const totalBudget = Number(cfg.CAMPAIGN_TOTAL_BUDGET_EUR || 0);
  if (totalBudget > 0) {
    addReportRow_(rows, generatedAt, date, 'Budget', 'Spesa cumulata €', cumulative, '');
    addReportRow_(rows, generatedAt, date, 'Budget', 'Budget residuo €', Math.max(0, totalBudget - cumulative), 'Budget totale deciso dall\'utente: ' + totalBudget + ' €');
  }

  replaceRowsForDates_('Daily_Report', [date], rows, 1);
}

function ga4Run_(dimensions, metrics, startDate, endDate, dimensionFilter, cfg) {
  const request = {
    dateRanges: [{startDate, endDate}],
    dimensions: (dimensions || []).map(name => ({name})),
    metrics: (metrics || []).map(name => ({name}))
  };
  if (dimensionFilter) request.dimensionFilter = dimensionFilter;
  return AnalyticsData.Properties.runReport(request, 'properties/' + cfg.GA4_PROPERTY_ID);
}

function detectSearchConsoleSite_(cfg) {
  if (cfg.SEARCH_CONSOLE_SITE && cfg.SEARCH_CONSOLE_SITE !== 'AUTO') return cfg.SEARCH_CONSOLE_SITE;
  const data = gscFetch_('https://www.googleapis.com/webmasters/v3/sites', 'get');
  const entries = data.siteEntry || [];
  const domainProp = 'sc-domain:' + cfg.SITE_DOMAIN;
  const urlProp = 'https://' + cfg.SITE_DOMAIN + '/';
  const wwwProp = 'https://www.' + cfg.SITE_DOMAIN + '/';
  const match = entries.find(x => x.siteUrl === domainProp) || entries.find(x => x.siteUrl === urlProp) || entries.find(x => x.siteUrl === wwwProp);
  if (!match) throw new Error('Nessuna proprietà Search Console trovata per ' + cfg.SITE_DOMAIN + '. Verifica che il sito sia presente e verificato in Search Console.');
  return match.siteUrl;
}

function gscQuery_(site, payload) {
  const url = 'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(site) + '/searchAnalytics/query';
  return gscFetch_(url, 'post', payload);
}

function gscFetch_(url, method, payload) {
  const options = {
    method: method,
    muteHttpExceptions: true,
    headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}
  };
  if (payload) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }
  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const text = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('Search Console API HTTP ' + code + ': ' + text);
  return JSON.parse(text || '{}');
}

function getConfig_() {
  const sh = getSheet_('Config');
  const values = sh.getDataRange().getValues();
  const cfg = {};
  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || '').trim();
    if (key) cfg[key] = values[i][1];
  }
  return cfg;
}

function getSheet_(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Foglio mancante: ' + name);
  return sh;
}

function replaceRowsForDates_(sheetName, dates, newRows, dateColumnIndex) {
  const dateCol = typeof dateColumnIndex === 'number' ? dateColumnIndex : 0;
  const sh = getSheet_(sheetName);
  const data = sh.getDataRange().getValues();
  const header = data.length ? data[0] : [];
  const dateSet = new Set((dates || []).map(String));
  const keep = data.slice(1).filter(r => !dateSet.has(String(r[dateCol] || '')));
  const merged = keep.concat(newRows || []);

  const rowsToClear = Math.max(sh.getLastRow() - 1, 1);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, rowsToClear, sh.getLastColumn()).clearContent();
  if (merged.length) {
    const width = Math.max(header.length, sh.getLastColumn());
    const padded = merged.map(r => {
      const row = r.slice();
      while (row.length < width) row.push('');
      return row.slice(0, width);
    });
    sh.getRange(2, 1, padded.length, width).setValues(padded);
  }
}

function rowsForDate_(sheetName, date) {
  const data = getSheet_(sheetName).getDataRange().getValues();
  return data.slice(1).filter(r => String(r[0] || '') === String(date));
}

function addReportRow_(rows, generatedAt, reportDate, section, metric, value, note) {
  rows.push([generatedAt, reportDate, section, metric, value, note || '']);
}

function dateOffset_(days, tz) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
}

function setDashboardStatus_(component, status, note) {
  const sh = getSheet_('Dashboard');
  const values = sh.getDataRange().getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '') === component) {
      sh.getRange(i + 1, 2, 1, 2).setValues([[status, note || '']]);
      return;
    }
  }
}
