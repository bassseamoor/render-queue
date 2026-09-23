import {clamp,phase,mix,hash} from './assets.mjs';
export const VERSION='1.0.0';
export const FPS=24,DURATION=90,DEFAULT_SEED='VV1-7C41A2';
export const SHOTS=[
 [0,4,'Before the sorting','farm'],[4,9,'The first lift','farm'],[9,13,'A crate and a journey','yard'],[13,17,'Arrival at the grading hall','yard'],
 [17,22,'Two destinations','factory'],[22,27,'One among many','factory'],[27,32,'The left turn','factory'],[32,37,'The soft landing','factory'],
 [37,40,'The other route','store'],[40,44,'Happy on the shelf','store'],[44,47,'Back in the box','factory'],[47,52,'Only a thought','factory'],
 [52,58,'Chosen with care','factory'],[58,61,'Into the daylight','yard'],[61,66,'A place in the box','pack'],[66,72,'The road home','road'],
 [72,78,'A destination','house'],[78,81,'Welcomed inside','house'],[81,87,'At the table','dinner'],[87,90,'Vita Verde','dinner']
].map(([start,end,title,world],i)=>({id:i+1,start,end,title,world}));
export function shotAt(t){t=clamp(t,0,DURATION-1e-6);return SHOTS.find(s=>t>=s.start&&t<s.end);}
export function settings(input={}){
 const seed=String(input.seed||DEFAULT_SEED).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48)||DEFAULT_SEED;
 return {seed,store:['grocer','market','hall'].includes(input.store)?input.store:'grocer',house:['cottage','brick','timber'].includes(input.house)?input.house:'cottage',format:input.format==='portrait'?'portrait':'wide',quality:['balanced','high','ultra'].includes(input.quality)?input.quality:'high',grain:clamp(Number(input.grain)||0,0,1),sound:input.sound!==false&&input.sound!=='false'};
}
export function storyState(time){
 const t=clamp(time,0,90),shot=shotAt(t),u=clamp((t-shot.start)/(shot.end-shot.start));let owner,mood='hope';
 if(t<5.3)owner='soil';else if(t<9)owner='hand';else if(t<17)owner='harvest-crate';else if(t<29)owner='main-belt';else if(t<33)owner='left-belt';else if(t<34.6)owner='fall';else if(t<54.6)owner='collection-box';else if(t<64)owner='hand';else if(t<81)owner='delivery-box';else owner='plate';
 if(t>=23&&t<34.6)mood='worry';if(t>=34.6&&t<53)mood='sad';if(t>=81)mood='cooked';
 return {t,shot,u,owner,mood,heroId:'hero-carrot-001',heroSeed:'VV-HERO-001',heroBend:1.25,route:'left',bubble:t>=47&&t<52,heroAtStore:false};
}
export function lanePoint(distance,side=0){
 if(distance<=2.3)return [side*.16,.785,-2+distance];
 const p=clamp((distance-2.3)/2.2),x=(side<0?-1:1)*1.10*phase(p,0,.68);return [x,.785,.3+p*2.2];
}
export function buildManifest(config){return {schemaVersion:1,engine:'vita-verde',engineVersion:VERSION,settings:settings(config),duration:90,fps:24,hero:{id:'hero-carrot-001',seed:'VV-HERO-001',bend:1.25},shots:SHOTS,unit:'metre',handedness:'right',up:'Y',frameInterval:'[0,2160)'};}
