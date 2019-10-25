import { setParams      } from "./params.js";
import { initTileCoords } from "./coords.js";
import { initRenderer   } from "./renderer.js";
import { initGrid       } from "./grid.js";
import { initTileMetric } from "./tilemetric.js";

export function init(userParams) {
  const params = setParams(userParams);
  if (!params) return;

  const coords = initTileCoords(params);
  const renderer = initRenderer(params);
  const grid = initGrid(params, coords, renderer);

  return {
    canvas: params.context.canvas,

    // Report status or data
    loaded: grid.loaded,
    getTilePos,
    // Methods to clear or update the canvas
    reset: grid.reset,
    clear,
    drawTiles: grid.drawTiles,

    // Coordinate methods to set the position and zoom of the map
    move:       (dz, dx, dy) => { if (coords.move(dz, dx, dy))       clear(); },
    fitBoundingBox: (p1, p2) => { if (coords.fitBoundingBox(p1, p2)) clear(); },
    setCenterZoom:    (c, z) => { if (coords.setCenterZoom(c, z))    clear(); },

    // Methods to convert coordinates, or report conversion parameters
    toLocal:       coords.toLocal,
    xyToMapPixels: coords.xyToMapPixels,
    getScale:      coords.getScale,

    // Metric to evaluate distance of a tile from the current grid
    tileDistance: initTileMetric(params, coords.getZXY),
  };

  function getTilePos(mapXY) {
    // Get indices to the tile box
    let fx = mapXY[0] / params.tileSize;
    let fy = mapXY[1] / params.tileSize;
    let ix = Math.floor(fx);
    let iy = Math.floor(fy);

    // Get the tile box itself
    let box = grid.getBox(ix, iy);
    if (!box) return;

    // Compute position and scaling within the tile
    let x = (fx - ix) * box.sw + box.sx;
    let y = (fy - iy) * box.sw + box.sy;
    let frac = box.sw / params.tileSize; // Fraction of the tile being used

    // Return the tile along with the projected position and scaling info
    return { x, y, frac, tile: box.tile };
  }

  function clear() { // TODO: Do we ever need grid.reset without clear?
    grid.reset();
    renderer.clear();
  }
}
