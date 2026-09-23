import assert from 'node:assert/strict';
import { Valley } from '../roadtrip-world.js';
import { hash } from '../roadtrip-materials.js';

let samples=0,maxGrade=0,maxPositionSeam=0,maxNormalSeam=0;
for(const seed of ['9A71C3','000000','FFFFFF','14FA30','777777']){
 const v=Object.create(Valley.prototype);v.n=hash(seed);v.phase=(v.n%10000)*.001;v.last=0;
 for(let z=-400;z<10000;z+=17.5){
  const y=v.roadY(z),grade=Math.abs(v.roadY(z+.1)-v.roadY(z-.1))/.2;maxGrade=Math.max(maxGrade,grade);
  for(const offset of [-3.5,-1.65,0,1.65,3.5]){
   assert.ok(Math.abs(v.heightAt(v.roadX(z)+offset,z)-(y-.07))<1e-8,'Terrain intrudes into the driving surface');samples++;
  }
 }
 for(const boundary of [0,7,18,50]){
 const a=v.buildTerrain(boundary),b=v.buildTerrain(boundary+1),pa=a.getAttribute('position'),pb=b.getAttribute('position'),na=a.getAttribute('normal'),nb=b.getAttribute('normal');
 const endZ=pa.getZ(pa.count-1);let firstEnd=pa.count-1;while(firstEnd>0&&pa.getZ(firstEnd-1)===endZ)firstEnd--;const columns=pa.count-firstEnd;
 for(let i=0;i<columns;i++){
  const j=firstEnd+i;maxPositionSeam=Math.max(maxPositionSeam,Math.abs(pa.getX(j)-pb.getX(i)),Math.abs(pa.getY(j)-pb.getY(i)));
  assert.equal(pa.getZ(j),pb.getZ(i)+128,'Longitudinal seam mismatch');
  maxNormalSeam=Math.max(maxNormalSeam,Math.abs(na.getX(j)-nb.getX(i)),Math.abs(na.getY(j)-nb.getY(i)),Math.abs(na.getZ(j)-nb.getZ(i)));
 }
 a.dispose();b.dispose();
 }
}
assert.equal(maxPositionSeam,0,'Chunk boundaries do not meet');assert.equal(maxNormalSeam,0,'Chunk lighting normals do not match');assert.ok(maxGrade<.08,'Road grade is too steep');
console.log(JSON.stringify({seeds:5,roadClearanceSamples:samples,maxGrade,maxPositionSeam,maxNormalSeam},null,2));
