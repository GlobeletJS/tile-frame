import { init } from "./main.js";

export function initClipMaps(mapParams, nLod) {
  // Create an array of maps, to be maintained at different resolutions
  // or "levels of detail" (LOD)
  const frames = Array.from(Array(nLod), () => init(mapParams));

  // Isolate the canvas data for return, and add texture coordinate info
  const textures = frames.map(frame => {
    return {
      canvas: frame.canvas,
      camPos: new Float64Array(2), // Camera position within canvas
      scale: new Float64Array(2),  // Scale of canvas relative to world map
      changed: true, // Flags whether the canvas has changed since last check
    };
  });

  // Return methods to query and update the array as one map
  return {
    textures,
    loaded: () => frames.reduce((sum, f) => sum + f.loaded() / nLod, 0),
    getTilePos,

    reset: () => frames.forEach(f => f.reset()),
    drawTiles,

    setCenterZoom,
    tileDistance: (tile) => Math.min(...frames.map(f => f.tileDistance(tile))),
  };

  function getTilePos(globalXY) {
    let tilePos, mapXY = [];

    // Get the highest resolution tile possible:
    //  start from last level, drop down to lower zooms as needed
    let level = nLod;
    while(level > 0 && !tilePos) {
      level--;
      frames[level].xyToMapPixels(mapXY, globalXY);
      tilePos = frames[level].getTilePos(mapXY);
    }
    return tilePos;
  }

  function drawTiles() {
    frames.forEach((frame, i) => { textures[i].changed = frame.drawTiles(); });
  }

  function setCenterZoom(center, zoom) {
    frames.forEach( (frame, index) => {
      // Set increasing zoom levels, up to last map with z = zoom
      let z = zoom - nLod + index + 1;
      frame.setCenterZoom(center, z);

      // Update texture coordinate transform parameters
      let texture = textures[index];
      frame.toLocal(texture.camPos, center);
      texture.scale[0] = frame.getScale(0);
      texture.scale[1] = frame.getScale(1);
    });
  }
}
