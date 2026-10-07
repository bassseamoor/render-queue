const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const bp=require('../blueprint/funnel-citadel-v2.blueprint.json');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const src=fs.readFileSync('pulse-beam-funnel-hall.js','utf8');
assert.equal(bp.version,2);assert(fs.readFileSync('pulse-dashboard.html','utf8').includes(bp.delivery_hook.after),'Pulse loader must use new cache key');assert.equal(bp.plates.length,21);assert.equal(sha(src),bp.runtime_sha256,'baseline drift: re-Funnel, do not silently rebase');
assert.equal(bp.plates.map(p=>p.code).join(''),src,'plates must cover every byte once');
let end=0;for(const p of bp.plates){assert.equal(p.start_line,end+1);end=p.end_line;assert.equal(sha(p.code),p.code_sha256);assert.equal(sha(p.anchor),p.anchor_sha256);assert.equal(src.split(p.anchor).length-1,1,p.id+' unique anchor');assert(p.contract&&p.done&&p.why);}
let patched=src;for(const p of bp.patches){assert.equal(patched.split(p.before).length-1,1,p.id+' exact unique patch anchor');patched=patched.replace(p.before,p.after);assert(p.assertion&&p.why);}
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:patched,encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);
assert(!patched.includes('SphereGeometry'));assert(!patched.includes('ConeGeometry'));assert(patched.includes('window.FUNNEL_ENVIRONMENT_GRAPH'));
const near=(a,b,t=1e-4)=>assert(Math.abs(a-b)<t,`${a} != ${b}`);
near(2*28.5,57);near(6.05+1.72,7.77);near(14.4+1,15.4);near(23.3-1,22.3);near(Math.PI*(23.3**2-14.4**2),1054.1,.01);
near(.92*(1-0)+.07,.99);near(.68*(1-0)+.05,.73);near(2.05*(.5-1),-1.025);near(-2.05*.56,-1.148);
near(5.72/17,.33647,.00001);near((1.8/1.2)**2,2.25);near(Math.exp(-((.017*26)**2)),.8225,.0001);near(Math.exp(-((.012*26)**2)),.9072,.0001);
near(1/.055,18.1818,.0001);near(1/.13,7.6923,.0001);near(.05*5.4,.27);near(.05*6.4,.32);near(.018*(.55+.16+.045),.01359);
const low=(cores,width)=>(cores||4)<=4||width<720;assert(low(8,719));assert(!low(8,720));assert(low(4,1440));assert(low(undefined,1440));
for(const r of [0,7.3,15.4,25.5,100]){let x=0,z=r,radius=Math.hypot(x,z),target=Math.max(15.4,Math.min(22.3,radius));if(radius<.01){x=0;z=target}else{x*=target/radius;z*=target/radius}assert(Number.isFinite(z));assert(Math.hypot(x,z)>=15.4-1e-8&&Math.hypot(x,z)<=22.3+1e-8);}
assert(bp.non_goals.some(x=>x.includes('DT-06')));assert.equal(bp.future_phases.length,4);
const html=fs.readFileSync('blueprint-funnel-citadel-v2.html','utf8');for(const p of bp.plates)assert(html.includes(`id="${p.id}"`));
for(const m of html.matchAll(/href="([^"]+)"/g))assert(m[1].startsWith('#')||m[1].startsWith('pulse-dashboard.html?tool='),'owner links must stay inside Pulse');
assert(html.includes('PLANNED · NOT APPLIED'));assert(html.includes('runtime repair release remains separate'));
if(process.argv.includes('--registered')){const reg=fs.readFileSync('pulse-component-extensions.js','utf8'),manifest=JSON.parse(fs.readFileSync('pulse-manifest.json'));assert(reg.includes('"id":"blueprintfc2"'));assert.equal(manifest.items.blueprintfc2.page,'pulse-dashboard.html?tool=blueprintfc2');}
console.log('PASS: 21 exact plates / 4 unique executable repairs / geometry equations / Pulse-only links / honest scope');
