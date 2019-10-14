function setParams(userParams) {
  const params = {};

  params.tileSize = userParams.tileSize || 512;

  // Get canvas context, and set width/height parameters
  if (userParams.context) {
    params.context = userParams.context;
    params.width = userParams.width || params.context.canvas.width;
    params.height = userParams.height || params.context.canvas.height;
  } else {
    params.context = document.createElement("canvas").getContext("2d");
    params.width = userParams.width || 1024;
    params.height = userParams.height || 1024;
  }

  // Compute number of tiles in each direction.
  params.nx = Math.floor(params.width / params.tileSize);
  params.ny = Math.floor(params.height / params.tileSize);
  if (params.nx * params.tileSize !== params.width ||
      params.ny * params.tileSize !== params.height ) {
    console.log("width, height, tileSize = " +
        params.width + ", " + params.height + ", " + params.tileSize);
    return console.log("ERROR: width, height are not multiples of tileSize!!");
  }
  console.log("map size: " + params.width + "x" + params.height);

  // Define a min zoom (if not supplied), such that there are always enough
  // tiles to cover the grid without repeating
  params.minZoom = (userParams.minZoom === undefined)
    ? Math.floor( Math.min(Math.log2(params.nx), Math.log2(params.ny)) )
    : Math.max(0, Math.floor(userParams.minZoom));
  // Make sure any supplied max zoom is an integer larger than minZoom
  params.maxZoom = (userParams.maxZoom === undefined)
    ? 22
    : Math.max(params.minZoom, Math.floor(userParams.maxZoom));
  // Make sure initial zoom is an integer within range
  params.zoom = (userParams.zoom === undefined)
    ? params.minZoom
    : Math.floor(userParams.zoom);
  params.zoom = Math.min(Math.max(params.minZoom, params.zoom), params.maxZoom);

  // Set the initial center of the map
  params.center = userParams.center || [0.5, 0.5], // X, Y in map coordinates
  params.center[0] = Math.min(Math.max(0.0, params.center[0]), 1.0);
  params.center[1] = Math.min(Math.max(0.0, params.center[1]), 1.0);

  return params;
}

// TODO: verify code for non-Mercator projections. Assumes x is periodic
function initTileCoords( params ) {
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

function initRenderer(params) {
  const context = params.context;
  const size = params.tileSize;

  // Resize drawingbuffer to fit the specified number of tiles
  context.canvas.width = params.width;
  context.canvas.height = params.height;

  return {
    draw,
    clear,
  };

  function clear() {
    return context.clearRect(0, 0, params.width, params.height);
  }

  function draw(tilebox, ix, iy) {
    context.drawImage(
        tilebox.tile.img,  // Image to read, and paint to the canvas
        tilebox.sx,        // First x-pixel in tile to read
        tilebox.sy,        // First y-pixel in tile to read
        tilebox.sw,        // Number of pixels to read in x
        tilebox.sw,        // Number of pixels to read in y
        ix * size,         // First x-pixel in canvas to paint
        iy * size,         // First y-pixel in canvas to paint
        size,              // Number of pixels to paint in x
        size               // Number of pixels to paint in y
        );
    return;
  }
}

// Creates a distance metric function that indicates, for a given tile
// specified by z, x, y indices, how far away it is from the current grid
function initTileMetric(params, getZXY) {
  const zxy = [];

  return function(z, x, y) {
    getZXY(zxy, 0, 0);  // Get indices of the tile at the top left corner
    let nTiles = 2 ** zxy[0];

    // Find edges of tile and map, in units of tiles at current map zoom
    var zoomFac = 2 ** (zxy[0] - z);
    var tile = {
      x1: x * zoomFac,
      x2: (x + 1) * zoomFac,
      y1: y * zoomFac,
      y2: (y + 1) * zoomFac,
    };
    var map = {
      x1: zxy[1],
      x2: zxy[1] + params.nx + 1, // Note: may extend across antimeridian!
      y1: zxy[2],
      y2: zxy[2] + params.ny + 1, // Note: may extend across a pole!
    };

    // Find horizontal distance between current tile and edges of current map
    //  hdist < 0: part of input tile is within map
    //  hdist = 0: tile edge touches edge of map
    //  hdist = n: tile edge is n tiles away from edge of map,
    //             where a "tile" is measured at map zoom level

    // Note: need to be careful with distances crossing an antimeridian or pole
    var xdist = Math.min(
        // Test for non-intersection with tile in raw position
        Math.max(map.x1 - tile.x2, tile.x1 - map.x2),
        // Re-test with tile shifted across antimeridian 
        Math.max(map.x1 - (tile.x2 + nTiles), (tile.x1 + nTiles) - map.x2)
        );
    var ydist = Math.min(
        // Test for non-intersection with tile in raw position
        Math.max(map.y1 - tile.y2, tile.y1 - map.y2),
        // Re-test with tile shifted across pole 
        Math.max(map.y1 - (tile.y2 + nTiles), (tile.y1 + nTiles) - map.y2)
        );
    // Use the largest distance
    var hdist = Math.max(xdist, ydist);

    // Adjust for zoom difference
    return hdist - 1.0 + 1.0 / zoomFac;
  }
}

function init(userParams) {
  const params = setParams(userParams);
  const getTile = userParams.getTile;
  if (!params) return;

  const coords = initTileCoords(params);
  const renderer = initRenderer(params);

  const oneTileComplete = 1. / params.nx / params.ny;
  var complete = 0.0;

  const boxes = Array.from(Array(params.ny), () => []);

  return {
    canvas: params.context.canvas,

    // Report status or data
    loaded: () => complete,
    getTilePos,
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

  function getTilePos(mapXY) {
    // Get indices to the tile box
    let fx = mapXY[0] / params.tileSize;
    let fy = mapXY[1] / params.tileSize;
    let ix = Math.floor(fx);
    let iy = Math.floor(fy);

    // Get the tile box itself
    let box = (boxes[iy]) ? boxes[iy][ix] : undefined;
    if (!box) return;

    // Compute position and scaling within the tile
    let x = (fx - ix) * box.sw + box.sx;
    let y = (fy - iy) * box.sw + box.sy;
    let frac = box.sw / params.tileSize; // Fraction of the tile being used

    // Return the tile along with the projected position and scaling info
    return { x, y, frac, tile: box.tile };
  }

  function reset() {
    boxes.forEach(row => { row.length = 0; });
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

export { init };
