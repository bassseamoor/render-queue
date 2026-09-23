// Fireplace Studio — world/artwork-state.js. See README.md for ownership and replacement boundaries.
import { FPFrames } from './artwork.js';
import { gl } from '../renderer/context.js';

const artwork = { wall: FPFrames.create(gl), mantle: FPFrames.create(gl), frames: [], mantleFrames: [] };
FPFrames.loadAtlas(artwork.wall, "art/fireplace-frames.jpg");
FPFrames.loadAtlas(artwork.mantle, "art/fireplace-frames.jpg");

export { artwork };
