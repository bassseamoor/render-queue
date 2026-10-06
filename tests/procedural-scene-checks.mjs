import assert from 'node:assert/strict';
import * as THREE from '../procedural-studio/three.module.js';
import {createAssetScene} from '../procedural-studio/scene.mjs';
import {normalizePlacement} from '../procedural-studio/world-plugin.mjs';
import {FAMILIES,recipe} from '../procedural-studio/core.mjs';
import {softwareViewport} from '../procedural-studio/software.mjs';
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}})}, {get:(t,k)=>t[k]||(()=>{})});const canvas={width:0,height:0,getContext:()=>ctx,getBoundingClientRect:()=>({width:500,height:400}),toDataURL:()=>''};
for(const f of FAMILIES){const r=recipe(f.id),scene=createAssetScene(THREE,r),frame=scene.update(2,'low');assert(scene.root.isGroup);assert(scene.root.children.every(m=>m.isInstancedMesh));assert.equal(scene.root.children.reduce((n,m)=>n+m.count,0),frame.objects.length);for(const mesh of scene.root.children)assert([...mesh.instanceMatrix.array].every(Number.isFinite));const before=scene.root.children.length;scene.update(3,'low');assert(scene.root.children.length<=before+1);scene.dispose();assert.equal(scene.root.children.length,0);const cpu=softwareViewport(canvas,r);assert(cpu.draw(2,'low').objects.length>0);cpu.setView({yaw:1,projection:'orthographic'});cpu.draw(3);cpu.dispose();}
assert.throws(()=>normalizePlacement({schema:'moor.procedural-placement',version:1,position:[0,NaN,0],recipe:recipe()}));assert.throws(()=>normalizePlacement({schema:'moor.procedural-placement',version:1,position:[0,Infinity,0],recipe:recipe()}));console.log('Actual Three.js scene matrices, shared instancing/disposal, software cameras and placement validation: 30 families passed.');
