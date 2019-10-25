export function initBoundingBox(params, setCenterZoom) {

  return function fitBoundingBox(p1, p2) {
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

    // Width/height of a tile: 1 / 2 ** zoom. Hence we need
    //  (numTiles - 1) / 2 ** zoom > boxSize in both X and Y
    var zoomX = Math.log2( (params.nx - 1) / boxWidth );
    var zoomY = Math.log2( (params.ny - 1) / boxHeight );

    // Compute the coordinates of the center of the box
    var centerX = (p1[0] + boxWidth / 2.0);
    if (centerX > 1) centerX -= 1;
    var centerY = 0.5 * (p1[1] + p2[1]);

    return setCenterZoom( [centerX, centerY], Math.min(zoomX, zoomY) );
  }
}
