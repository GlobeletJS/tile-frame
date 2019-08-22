// TODO: verify code for non-Mercator projections. Assumes x is periodic
export function initTileCoords( params ) {
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
    fitBoundingBox,
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

  function setCenterZoom(center, newZoom) {
    // 0. Remember old values
    var oldZ = zoom;
    var oldX = xTile0;
    var oldY = yTile0;

    // 1. Make sure the supplied zoom is within range and an integer
    zoom = Math.min(Math.max(params.minZoom, newZoom), params.maxZoom);
    zoom = Math.floor(zoom); // TODO: should this be Math.round() ?
    nTiles = 2 ** zoom; // Number of tiles at this zoom level

    // 2. Find the integer tile numbers of the top left corner of the rectangle
    //    whose center will be within 1/2 tile of (centerX, centerY)
    xTile0 = Math.round(center[0] * nTiles - params.nx / 2.0);
    xTile0 = wrap(xTile0, nTiles); // in case we crossed the antimeridian

    yTile0 = Math.round(center[1] * nTiles - params.ny / 2.0);
    yTile0 = Math.min(Math.max(0, yTile0), nTiles - params.ny); // Don't cross pole

    // 3. Return a flag indicating whether map parameters were updated
    if (zoom === oldZ && xTile0 === oldX && yTile0 === oldY) return false;
    updateTransform();
    return true;
  }

  function fitBoundingBox(p1, p2) {
    // Inputs p1, p2 are 2D arrays containing pairs of X/Y coordinates
    // in the range [0,1] X [0,1] with (0,0) at the top left corner.
    // ASSUMES p2 is SouthEast of p1 although we may have p2[0] < p1[0]
    // if the box crosses the antimeridian (longitude = +/- PI)

    // Compute box width and height, with special handling for antimeridian
    var boxWidth = p2[0] - p1[0];
    if (boxWidth < 0) boxWidth += 1.0; // Crossing antimeridian
    var boxHeight = p2[1] - p1[1];
    if (boxHeight < 0) return false;

    // Calculate the maximum zoom level at which the bounding box will fit
    // within the map. Note: we want to be able to pan without having to change
    // zoom. Hence the bounding box must always fit within gridSize - 1.
    // (allows panning to where p1[0] is near the right edge of a tile.)

    // Width/height of a tile: 1 / 2 ** zoom. Hence we need
    //  (gridSize? - 1) / 2 ** zoom > boxSize in both X and Y.
    var zoomX = Math.log2( (params.nx - 1) / boxWidth );
    var zoomY = Math.log2( (params.ny - 1) / boxHeight );

    // Compute the coordinates of the center of the box
    var centerX = (p1[0] + boxWidth / 2.0);
    if (centerX > 1) centerX -= 1;
    var centerY = 0.5 * (p1[1] + p2[1]);

    return setCenterZoom( [centerX, centerY], Math.min(zoomX, zoomY) );
  }

  function move(dz, dx, dy) {
    var dzi = Math.round(dz);
    var dxi = Math.round(dx);
    var dyi = Math.round(dy);

    // Don't zoom beyond the limits of the API
    dzi = Math.min(Math.max(0 - zoom, dzi), params.maxZoom - zoom);

    var changed = (dzi || dxi || dyi);

    // Panning first
    xTile0 = wrap(xTile0 + dxi, nTiles);
    yTile0 = wrap(yTile0 + dyi, nTiles);

    while (dzi > 0) {  // Zoom in
      zoom++;
      xTile0 = Math.floor(2 * xTile0 + params.nx / 2.0);
      yTile0 = Math.floor(2 * yTile0 + params.ny / 2.0);
      dzi--;
    }
    while (dzi < 0) {  // Zoom out
      zoom--;
      xTile0 = wrap( Math.ceil( (xTile0 - params.nx / 2.0) / 2 ), nTiles );
      yTile0 = wrap( Math.ceil( (yTile0 - params.ny / 2.0) / 2 ), nTiles );
      dzi++;
    }

    updateTransform();
    return changed;
  }

  function updateTransform() {
    nTiles = 2 ** zoom;
    origin[0] = xTile0 / nTiles;
    origin[1] = yTile0 / nTiles;
    scale[0] = nTiles / params.nx; // Problematic if < 1 ?
    scale[1] = nTiles / params.ny;
  }
}

function wrap(x, xmax) {
  while (x < 0) x += xmax;
  while (x >= xmax) x -= xmax;
  return x;
}
