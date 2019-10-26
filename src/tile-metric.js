export function initTileMetric(params, getZXY) {
  const zxy = [];

  return function(tile) {
    // Get distances of the tile from the current map
    let dist = getDiffs(tile);
    
    // Use the largest horizontal distance, and adjust for zoom difference
    return Math.max(dist.dx, dist.dy) - 1.0 + 1.0 / 2 ** dist.dz;
  }

  function getDiffs(tile) {
    // Store coordinates of the corners of the map
    getZXY(zxy, 0, 0);
    let mb = {
      x1: zxy[1],
      x2: zxy[1] + params.nx + 1, // Note: may extend across antimeridian!
      y1: zxy[2],
      y2: zxy[2] + params.ny + 1,
    };

    // Store tile corners. Convert x, y to equivalent values at MAP zoom level
    let dz = zxy[0] - tile.z;
    let zoomFac = 2 ** dz;
    let tb = {
      x1: tile.x * zoomFac,
      x2: (tile.x + 1) * zoomFac,
      y1: tile.y * zoomFac,
      y2: (tile.y + 1) * zoomFac,
    };

    // Find horizontal distance between current tile and edges of current map
    //  hdist < 0: part of input tile is within map
    //  hdist = 0: tile edge touches edge of map
    //  hdist = n: tile edge is n tiles away from edge of map,
    let nTiles = 2 ** zxy[0];
    let dx = Math.min( // Be careful with the antimeridian
      // Test for non-intersection with tile in raw position
      Math.max(mb.x1 - tb.x2, tb.x1 - mb.x2),
      // Re-test with tile shifted across antimeridian
      Math.max(mb.x1 - (tb.x2 + nTiles), tb.x1 + nTiles - mb.x2)
    );
    let dy = Math.max(mb.y1 - tb.y2, tb.y1 - mb.y2);

    return { dz, dx, dy };
  }
}
