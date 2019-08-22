// Creates a distance metric function that indicates, for a given tile
// specified by z, x, y indices, how far away it is from the current grid
export function initTileMetric(params, getZXY) {
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
    }
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
