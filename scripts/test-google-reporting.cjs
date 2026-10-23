const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('docs/google-reporting-free/apps-script-analytics-search-console.gs','utf8');
function setup(response){const writes=[],calls=[],ctx={console:{warn(){}},AnalyticsData:{Properties:{runReport:(request,property)=>{calls.push({request,property});if(response instanceof Error)throw response;return response;}}}};vm.createContext(ctx);vm.runInContext(source,ctx);ctx.replaceRowsForDates_=(sheet,dates,rows)=>writes.push({sheet,dates,rows:JSON.parse(JSON.stringify(rows))});return {ctx,writes,calls};}
const cfg={SITE_DOMAIN:'andreagiaquinto.it',GA4_PROPERTY_ID:'554694086',LANDING_PATH:'/lezioni-autocad/'};
const row=(page,event,count,key)=>({dimensionValues:[{value:page},{value:event}],metricValues:[{value:String(count)},{value:String(key)}]});
test('Site report reads both lead events and the funnel independently from lesson campaign scope',()=>{
 const {ctx,writes,calls}=setup({rowCount:2,rows:[row('/preventivo/','service_quote_success',3,3),row('/lezioni-autocad/','generate_lead',2,2)]});ctx.collectSiteMeasurement_('2026-10-21',cfg);
 const request=JSON.parse(JSON.stringify(calls[0].request));assert.deepEqual(request.dimensions,[{name:'pagePath'},{name:'eventName'}]);assert.ok(!JSON.stringify(request).includes('landingPage'));assert.ok(!JSON.stringify(request).includes('QueryString'));assert.match(JSON.stringify(request),/service_quote_success/);assert.match(JSON.stringify(request),/generate_lead/);assert.equal(calls[0].property,'properties/554694086');
 assert.deepEqual(writes[0].rows,[['2026-10-21','/preventivo/','service_quote_success',3,3],['2026-10-21','/lezioni-autocad/','generate_lead',2,2]]);assert.equal(writes[1].rows[0][1],'OK');
});
test('Failed site reads retain prior event data and record an error, not a zero',()=>{
 const {ctx,writes}=setup(new Error('API unavailable'));ctx.ensureSiteSheet_=()=>{};ctx.dateOffset_=()=> '2026-10-21';ctx.collectSiteMeasurementRolling_(1,cfg);
 assert.equal(writes.length,1);assert.equal(writes[0].sheet,'GA4_Site_Status');assert.equal(writes[0].rows[0][1],'ERRORE');
 ctx.rowsForDate_=(name)=>name==='GA4_Site_Status'?writes[0].rows:[];const summary=[];ctx.addSiteMeasurementSummary_(summary,'now','2026-10-21');assert.equal(summary.length,1);assert.equal(summary[0][4],'Non disponibili');
});
test('Empty successful read, partial response and thresholded data remain distinguishable',()=>{
 const empty=setup({rows:[]});empty.ctx.collectSiteMeasurement_('2026-10-21',cfg);assert.deepEqual(empty.writes[0].rows,[]);assert.equal(empty.writes[1].rows[0][1],'OK');
 const partial=setup({rowCount:2,rows:[row('/','form_start',1,0)]});assert.throws(()=>partial.ctx.collectSiteMeasurement_('2026-10-21',cfg),/incompleta/);assert.equal(partial.writes.length,0);
 const limited=setup({metadata:{subjectToThresholding:true},rows:[]});limited.ctx.collectSiteMeasurement_('2026-10-21',cfg);assert.equal(limited.writes[1].rows[0][1],'LIMITATO');
});
test('Daily summary separates service leads, lesson leads, and quote interactions',()=>{
 const {ctx}=setup({});ctx.rowsForDate_=(name)=>name==='GA4_Site_Status'?[['2026-10-21','OK','Verified']]:[['2026-10-21','/preventivo/index.html','service_quote_success',2,2],['2026-10-21','/','service_quote_success',1,1],['2026-10-21','/lezioni-autocad/','generate_lead',4,4],['2026-10-21','/preventivo/','form_start',9,0]];const rows=[];ctx.addSiteMeasurementSummary_(rows,'now','2026-10-21');assert.equal(rows[0][4],3);assert.equal(rows[1][4],4);assert.equal(rows.find(r=>r[3]==='form_start')[4],9);
});

test('Native Sheet dates are normalized without duplicate rows on repeated collection',()=>{
 const {ctx}=setup({rows:[]});
 const header=['Date','Status','Note'];
 let data=[header,[new Date('2026-10-21T22:00:00Z'),'OK','Existing']];
 let textDates=false;
 const sh={getLastRow:()=>data.length,getLastColumn:()=>3,getMaxRows:()=>1000,setFrozenRows(){},
  getDataRange:()=>({getValues:()=>data.map(r=>r.slice())}),
  getRange(row,col,height,width){return {
   getValues:()=>data.slice(row-1,row-1+height).map(r=>r.slice(col-1,col-1+width)),
   setNumberFormat(format){assert.equal(format,'@');textDates=true;},
   clearContent(){data=data.slice(0,row-1);},
   setValues(rows){rows.forEach((r,i)=>{data[row-1+i]??=[];r.forEach((v,j)=>{if(col+j===1)assert.ok(textDates);data[row-1+i][col-1+j]=v;});});}
  };}};
 ctx.SpreadsheetApp={openById:()=>({getSheetByName:()=>sh,getSpreadsheetTimeZone:()=> 'Europe/Rome'})};
 ctx.Utilities={formatDate:(value,tz,fmt)=>{assert.equal(tz,'Europe/Rome');assert.equal(fmt,'yyyy-MM-dd');return '2026-10-22';}};
 ctx.ensureSiteSheet_('GA4_Site_Status',header);
 assert.equal(data[1][0],'2026-10-22');
 // Use the actual storage helpers rather than the API-call test spy.
 const storage={...ctx};vm.createContext(storage);vm.runInContext(source,storage);
 for(let i=0;i<2;i++)storage.replaceRowsForDates_('GA4_Site_Status',['2026-10-22'],[['2026-10-22','OK','Updated']]);
 assert.equal(data.length,2);
 assert.equal(storage.rowsForDate_('GA4_Site_Status','2026-10-22').length,1);
});
