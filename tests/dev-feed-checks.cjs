const assert=require('node:assert/strict');
const fs=require('node:fs');
const Core=require('../dev-feed-core.js');

const ledger=JSON.parse(fs.readFileSync('dev-feed-ledger.json','utf8'));
const v=Core.validateLedger(ledger);
assert.equal(v.ok,true,v.errors.join('; '));

const summary=Core.summarize(ledger);
assert(summary.counts.total>=5,'bootstrap ledger unexpectedly small');

const trajectory=summary.items.find(x=>x.id==='trajectory');
assert(trajectory,'Trajectory missing from Dev Feed ledger');
assert(trajectory.state.gap.includes('artifact-exists-not-in-pulse'),'historical/current visibility gap should remain until owner-visible completion is appended');

const html=fs.readFileSync('dev-feed.html','utf8');
for(const needle of [
  'Intake','Build','Release','Attention','Repository',
  'api.github.com/repos/bassseamoor/render-queue',
  'pulse-slice-release-ledger.json',
  'funnel-maintenance-status.json',
  'dev-feed/events',
  'setInterval(()=>load().catch(()=>{}),15000'
]) assert(html.includes(needle),'Dev Feed page missing '+needle);

const schema=JSON.parse(fs.readFileSync('dev-feed/event-schema.json','utf8'));
assert.equal(schema.schema,'moor.dev-feed-event');
for(const stage of Core.STAGES)assert(schema.stages.includes(stage),'event schema missing stage '+stage);

const extensions=fs.readFileSync('pulse-component-extensions.js','utf8');
for(const id of ['"id":"dev-feed"','"id":"trajectory-ledger"'])assert(extensions.includes(id),'Pulse extension registry missing '+id);

const build=fs.readFileSync('build_pulse_v2.py','utf8');
for(const id of ["'dev-feed': {","'trajectory-ledger': {"])assert(build.includes(id),'Pulse rebuild preservation missing '+id);

const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json','utf8'));
assert(manifest.items&&manifest.items['dev-feed'],'Pulse manifest missing Dev Feed');
assert(manifest.items&&manifest.items['trajectory-ledger'],'Pulse manifest missing Trajectory');

const funnel=fs.readFileSync('FUNNEL.md','utf8');
assert(funnel.includes('## Owner observability'),'Funnel public contract missing owner observability rule');
assert(funnel.includes('/dev-feed/events/'),'Funnel public contract missing parallel event path');

const pr=Core.githubPullToEvent({number:7,title:'Test PR',updated_at:'2026-10-07T00:00:00Z',user:{login:'worker'},html_url:'https://example.com/pr/7'});
assert.equal(pr.stage,'building');
const commit=Core.githubCommitToEvent({sha:'abcdef1234567890',commit:{message:'ship thing',author:{date:'2026-10-07T00:00:01Z'}},author:{login:'worker'},html_url:'https://example.com/c'});
assert.equal(commit.stage,'main');

console.log('PASS: Dev Feed validates append-only semantic events, multi-stream live trackers, Pulse registration, Trajectory visibility tracking, and owner-observability contract.');
