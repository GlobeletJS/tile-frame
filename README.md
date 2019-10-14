# tile-frame

Manage a grid of map tiles on an HTML Canvas

For a given (or computed) position and zoom, requests the appropriate tiles
from a supplied tile cache, and draws them on the canvas.

The supplied tile cache may return a parent of the requested tile, if the 
requested zoom is not ready. tile-frame will stretch these lower-resolution 
tiles to cover the relevant area at the requested scale.
The low-resolution tiles will be replaced at a subsequent call to drawTiles(),
if the cache has been updated.

## Examples
- [Simple raster tiles example](https://globeletjs.github.io/tile-frame/examples/raster/index.html)
- [Vector tiles example](https://globeletjs.github.io/tile-frame/examples/vector/index.html) 
  (using [tile-kiln](https://github.com/GlobeletJS/tile-kiln) for rendering)
- [Interactive vector tiles example](https://globeletjs.github.io/tile-frame/examples/macrostrat/index.html) with JSON querying

## Initialization
tileFrame.init takes a parameters object with the following properties:
- getTile: (REQUIRED) A tile cache retrieve method, which must have an API 
  as described below
- context: 2D rendering context ([CanvasRenderingContext2D] object) for the 
  target canvas. If not supplied, tile-frame will create its own canvas
- tileSize: size in pixels of the supplied *square* tiles. Default: 512
- width, height: pixel size of the displayed map. MUST be multiple of tileSize.
  Default: dimensions of the drawingbuffer of the supplied context.canvas
- center: [x,y] of the map center in map coordinates. Default: [0.5, 0.5]
- maxZoom: maximum allowed zoom. Default: 22
- minZoom: minimum allowed zoom. Default: 
  min( log2(width/tileSize), log2(height/tileSize) )

### API of the supplied tile cache method
The supplied function must take one argument: a three-element array containing
the [z, x, y] indices of a requested tile.
The supplied function must return a "tile box" object with the following 
properties:
- tile: the tile object itself, which has the following sub-properties:
  - z, x, y: The indices of the actual tile (may be different from requested
  values, if the cache returned a parent tile)
  - img: a [CanvasImageSource] containing the tile image
- sx, sy: pixel indices of the top-left corner of the portion of the tile
  to be used (analogous to sx, sy in [Canvas2D.drawImage])
- sw: Width (and height) of the *square* portion of the tile to be used
  (analogous to sWidth, sHeight in [Canvas2D.drawImage])

NOTE: The cache MUST return the tile *synchronously*.

[CanvasRenderingContext2D]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
[CanvasImageSource]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasImageSource
[Canvas2D.drawImage]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage

## tile-frame API
Initialization returns an object with the following properties and methods:
- Properties exposing status or data
  - canvas: A back-link to the canvas on which the map is rendered
  - loaded(): Returns the loading status (between 0 and 1) of the tiles in the
  grid. If some of the tiles on the map are drawn with a stretched parent tile, 
  those tiles are not counted as done.
  - boxes: Link to the tile boxes at each grid position
- Methods to clear or update the canvas
  - reset(): Clear the tile boxes at every grid point, forcing the tiles to be
  re-requested from the tile cache at the next call to drawTiles
  - clear(): Execute reset(), and clears the canvas
  - drawTiles(): method to draw tiles on the canvas (no arguments). Returns
  a (Boolean) flag indicating whether the canvas has changed
- Coordinate methods to set the position and zoom of the map
  - move(dz, dx, dy): Pan or zoom by the supplied *integer* coordinate deltas
  - fitBoundingBox(p1, p2): Find the smallest map that encloses the box
  specified by top left corner p1 and bottom right corner p2.
  - setCenterZoom([centerX, centerY], zoom): Center the map at the supplied
  coordinates, and set the zoom. Note: all values will be adjusted to the
  nearest integer tile coordinates
- Methods to convert coordinates, or report conversion parameters
  - toLocal(local, global): Convert the supplied global map [x,y] coordinate
  to the map's local coordinate system
  - xyToMapPixels(pixels, global): Convert supplied global map [x,y] to
  pixel indices from the top left corner of the map
  - getScale(i): Returns the current scaling from global to local coordinates,
  for the supplied coordinate (0 for x-scale, 1 for y-scale)
- tileDistance(z, x, y): For the given z, x, y indices of a tile, returns a
  measure of the "distance" of that tile from the current grid.
