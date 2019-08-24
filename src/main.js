import { setParams      } from "./params.js";
import { initTileCoords } from "./coords.js";
import { initRenderer   } from "./renderer.js";
import { initTileMetric } from "./tilemetric.js";

export function init(userParams, context, getTile) {
  const params = setParams(userParams, context);
  if (!params) return;

  const coords = initTileCoords(params);
  const renderer = initRenderer(context, params);

  const oneTileComplete = 1. / params.nx / params.ny;
  var complete = 0.0;

  const boxes = []; //Array(params.ny).fill([]);
  reset();

  return {
    // Report status or data
    loaded: () => complete,
    boxes,
    // Methods to clear or update the canvas
    reset,
    clear,
    drawTiles,

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

  function reset() {
    //boxes.fill([]); // Doesn't work... not sure why not
    for (let iy = 0; iy < params.ny; iy++) {
      boxes[iy] = [];
    }
    complete = 0.0;
  }
  function clear() { // TODO: Do we ever need reset without clear?
    reset();
    renderer.clear();
  }

  function drawTiles() {
    var updated = false;
    if (complete === 1.0) return updated; // Map is complete, no change!
    const zxy = [];

    for (let iy = 0; iy < params.ny; iy++) {
      var row = boxes[iy];
      for (let ix = 0; ix < params.nx; ix++) {
        coords.getZXY(zxy, ix, iy);
        var currentZ = (row[ix]) 
          ? row[ix].tile.z
          : undefined;
        if (currentZ === zxy[0]) continue; // This tile already done

        var newbox = getTile( zxy );
        if (!newbox) continue; // No image available for this tile
        if (newbox.tile.z === currentZ) continue; // Tile already written

        row[ix] = newbox;
        renderer.draw(newbox, ix, iy);
        updated = true;

        if (newbox.tile.z === zxy[0]) complete += oneTileComplete;
      }
    }
    return updated;
  }
}
