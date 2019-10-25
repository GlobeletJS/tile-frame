import { initBoundingBox } from "./bounding-box.js";

export function initTileCoords( params ) {
  // TODO: verify code for non-Mercator projections. Assumes x is periodic

  var zoom, nTiles, xTile0, yTile0;
  const origin = new Float64Array(2);
  const scale = new Float64Array(2);

  // Set initial values
  setCenterZoom(params.center, params.zoom);

  return {
    // Methods to report info about current map state
    getScale: (i) => scale[i],
    getZXY,

    // Methods to compute positions within current map
    toLocal,
    xyToMapPixels,

    // Methods to update map state
    setCenterZoom,
    fitBoundingBox: initBoundingBox(params, setCenterZoom),
    move,
  };

  function getZXY(zxy, ix, iy) {
    // Report the ZXY of a given tile within the grid
    zxy[0] = zoom;
    zxy[1] = wrap(xTile0 + ix, nTiles);
    zxy[2] = wrap(yTile0 + iy, nTiles);
  }

  function toLocal(local, global) {
    // TODO: wrapping is problematic
    local[0] = wrap(global[0] - origin[0], 1.0) * scale[0];
    local[1] = (global[1] - origin[1]) * scale[1];
  }

  function xyToMapPixels(local, global) {
    toLocal(local, global);
    local[0] *= params.width;
    local[1] *= params.height;
  }

  function setCenterZoom(center, zNew) {
    // 1. Make sure the supplied zoom is within range and an integer
    zNew = Math.min(Math.max(params.minZoom, zNew), params.maxZoom);
    zNew = Math.floor(zNew); // TODO: should this be Math.round() ?
    var nTnew = 2 ** zNew; // Number of tiles at this zoom level

    // 2. Find the integer tile numbers of the top left corner of the rectangle
    //    whose center will be within 1/2 tile of (centerX, centerY)
    var x0new = Math.round(center[0] * nTnew - params.nx / 2.0);
    x0new = wrap(x0new, nTnew); // in case we crossed the antimeridian

    var y0new = Math.round(center[1] * nTnew - params.ny / 2.0);
    y0new = Math.min(Math.max(0, y0new), nTnew - params.ny); // Don't cross pole

    // 3. Return a flag indicating whether map parameters were updated
    return updateTransform(zNew, x0new, y0new);
  }

  function move(dz, dx, dy) {
    var dzi = Math.round(dz);
    var dxi = Math.round(dx);
    var dyi = Math.round(dy);

    // Panning first
    var x0new = wrap(xTile0 + dxi, nTiles);
    var y0new = wrap(yTile0 + dyi, nTiles);

    var zNew = zoom;
    while (dzi > 0 && zNew < params.maxZoom) {  // Zoom in
      zNew++;
      x0new = Math.floor(2 * x0new + params.nx / 2.0);
      y0new = Math.floor(2 * y0new + params.ny / 2.0);
      dzi--;
    }
    while (dzi < 0 && zNew > params.minZoom) {  // Zoom out
      zNew--;
      x0new = wrap( Math.ceil( (x0new - params.nx / 2.0) / 2 ), 2 ** zNew );
      y0new = wrap( Math.ceil( (y0new - params.ny / 2.0) / 2 ), 2 ** zNew );
      dzi++;
    }

    return updateTransform(zNew, x0new, y0new);
  }

  function updateTransform(zNew, x0new, y0new) {
    if (zNew === zoom && x0new === xTile0 && y0new === yTile0) return false;

    zoom = zNew;
    xTile0 = x0new;
    yTile0 = y0new;

    nTiles = 2 ** zoom;
    origin[0] = xTile0 / nTiles;
    origin[1] = yTile0 / nTiles;
    scale[0] = nTiles / params.nx; // Problematic if < 1 ?
    scale[1] = nTiles / params.ny;

    return true;
  }
}

function wrap(x, xmax) {
  while (x < 0) x += xmax;
  while (x >= xmax) x -= xmax;
  return x;
}
