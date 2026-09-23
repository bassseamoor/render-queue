// Fireplace Studio — studio.js. See README.md for ownership and replacement boundaries.
import { installCompatibility } from './ui/compatibility.js';
import { sizeCanvas, startLoop } from './core/clock.js';
import { applySeedString } from './core/controller.js';
import { randomSeedString } from './core/seeds.js';
import { showDiagnostics } from './ui/diagnostics.js';
import { mountControls, mountFullscreen } from './ui/controls.js';

async function startStudio(){
  installCompatibility();
  sizeCanvas();
  const m=window.location.search.match(/[?&]seed=([^&]*)/);
  const seed=m?decodeURIComponent(m[1]):null;
  applySeedString(seed&&seed.length?seed:randomSeedString());
  showDiagnostics();
  mountControls();
  mountFullscreen();
  if(new URLSearchParams(location.search).get('render')==='1'){
    const { startRenderMode }=await import('./export/controller.js');
    startRenderMode();
  }
  startLoop();
}

export { startStudio };
