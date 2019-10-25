export function initGrid(params, coords, renderer) {
  const boxes = Array.from(Array(params.ny), () => []);

  const oneTileComplete = 1. / params.nx / params.ny;
  var complete = 0.0;

  return {
    loaded: () => complete,
    getBox: (ix, iy) => (boxes[iy]) ? boxes[iy][ix] : undefined,
    drawTiles,
    reset,
  };

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

        var newbox = params.getTile( zxy );
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

  function reset() {
    boxes.forEach(row => { row.length = 0; });
    complete = 0.0;
  }
}
