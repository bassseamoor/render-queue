// Fireplace Studio — world/camera.js. See README.md for ownership and replacement boundaries.
import { clamp } from '../core/math.js';
import { settings } from '../core/settings.js';
import { S } from '../core/state.js';

const CAMS_DEF = [
  { n:"reference",  eye:[-4.0,1.45,-3.0], tgt:[3.0,1.02,1.0],    fov:70, vig:0.30 },
  { n:"fireside",   eye:[1.4,1.05,0.9],   tgt:[4.5,0.75,-0.9],   fov:42, vig:0.38 },
  { n:"lakeside",   eye:[1.0,1.60,2.4],   tgt:[0.2,1.20,60.0],   fov:32, vig:0.22 },
  { n:"daybed",     eye:[-3.5,1.20,2.75], tgt:[3.6,0.88,0.3],    fov:52, vig:0.32 },
  { n:"deck",       eye:[4.3,1.70,9.5],   tgt:[3.5,1.10,50.0],   fov:50, vig:0.26 },
  { n:"ember macro",eye:[2.75,0.85,0.45], tgt:[4.55,0.62,-0.9],  fov:35, vig:0.42 },
  { n:"hearth low", eye:[2.55,0.40,0.05], tgt:[4.52,0.92,-0.92], fov:48, vig:0.40 },
  { n:"firebox detail",eye:[3.15,1.32,0.42],tgt:[4.55,0.78,-0.90], fov:33, vig:0.42 },
  { n:"cozy wide",  eye:[-0.7,1.30,2.55], tgt:[4.35,0.88,-0.75],  fov:58, vig:0.32 },
];
function cameraAt(te){
  const A = CAMS_DEF[clamp(settings.camera|0,0,CAMS_DEF.length-1)];
  let ex=A.eye[0],ey=A.eye[1],ez=A.eye[2], tx=A.tgt[0],ty=A.tgt[1],tz=A.tgt[2];
  const mo=settings.motion|0;
  if (mo===1){ ex+=Math.sin(te*0.10+S.camPhase)*0.14; ey+=Math.sin(te*0.073+S.camPhase*1.7)*0.06; }
  else if (mo===2){ const k=0.5-0.5*Math.cos(te*2*Math.PI/50+S.camPhase); const dx=tx-ex,dy=ty-ey,dz=tz-ez; ex+=dx*0.16*k; ey+=dy*0.16*k; ez+=dz*0.16*k; }
  else { ex+=Math.sin(te*0.05)*0.015; }
  tx+=Math.sin(te*0.09+S.camPhase)*0.03;
  return { eye:[ex,ey,ez], tgt:[tx,ty,tz], fov:A.fov, vig:(A.vig!=null?A.vig:0.32) };
}

export { cameraAt };
