export function setParams(userParams, context) {
  const params = {
    tileSize: userParams.tileSize || 512,
    width: userParams.width || context.canvas.width,
    height: userParams.height || context.canvas.height,
    center: userParams.center || [0.5, 0.5], // X, Y in map coordinates
  };

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

  params.center[0] = Math.min(Math.max(0.0, params.center[0]), 1.0);
  params.center[1] = Math.min(Math.max(0.0, params.center[1]), 1.0);

  return params;
}
