// Fireplace Studio — ui/compatibility.js. See README.md for ownership and replacement boundaries.
import { canvas } from '../renderer/context.js';
import { applySeedString, redress, remixSeed, resetRender, setParamLive } from '../core/controller.js';
import { randomSeedString, settingsSeedString } from '../core/seeds.js';
import { CAMS, DECKS, FIRES, FLOORS, GRAINS, MOTIONS, RUGS, STONES, TIMES, WATERS, WEATHERS, WOODS, settings } from '../core/settings.js';
import { dress } from '../world/dressing.js';
import { getLifeDebug, getLifeHash } from '../world/life.js';
import { FPFrames } from '../world/artwork.js';
import { SeedConsole } from './seed-console.js';

function installCompatibility(){
window.FPFrames=FPFrames;
window.FramesModule=FPFrames;
window.SeedConsole=SeedConsole;
window.__renderCanvas=canvas;
window.__renderReset=resetRender;
window.__fpSetSeed=applySeedString;
window.__fpGetSeed=settingsSeedString;
window.__fpGetSettings=()=>settings;
window.__fpSetParam=setParamLive;
window.__fpRandomSeed=randomSeedString;
window.__fpRemixSeed=remixSeed;
window.__fpDress=dress;
window.__fpRedress=redress;
window.__lifeDbg=getLifeDebug;
window.__lifeHash=getLifeHash;
window.__fpLabels={STONES,FLOORS,WOODS,RUGS,WEATHERS,TIMES,WATERS,CAMS,MOTIONS,FIRES,DECKS,GRAINS};
}

export { installCompatibility };
