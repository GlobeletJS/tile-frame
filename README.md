# tile-frame

Manage a grid of map tiles on an HTML Canvas

For a given (or computed) position and zoom, requests the appropriate tiles
from a supplied tile cache, and draws them on the canvas.

The supplied tile cache may return a parent of the requested tile, if the 
requested zoom is not ready. tile-frame will stretch these lower-resolution 
tiles to cover the relevant area at the requested scale.
The low-resolution tiles will be replaced at a subsequent call to drawTiles(),
if the cache has been updated.

This behavior, making use of whatever tiles are already loaded, allows the 
tile-frame to update the canvas *synchronously*. It is therefore suitable
for managing tiled image textures, as part of the rendering pipeline in
an animation.

For 3D animations, tile-frame's included clipmap manager can manage a range
of resolutions around the camera position. The lower resolution layers, which
cover a larger area, can then be used to render the more distant parts of the 
scene.

## Examples
- [Simple raster tiles example](https://globeletjs.github.io/tile-frame/examples/raster/index.html)
- [Vector tiles example](https://globeletjs.github.io/tile-frame/examples/vector/index.html) 
  (using [tile-kiln](https://github.com/GlobeletJS/tile-kiln) for rendering)
- [Interactive vector tiles example](https://globeletjs.github.io/tile-frame/examples/macrostrat/index.html) with JSON querying

## Installation
tile-frame is provided as an ESM module import.
```javascript
import * as tileFrame from 'tile-frame';
```

## Initialization
tileFrame.init takes a parameters object with the following properties:
- getTile: (REQUIRED) A tile cache retrieve method, which must have an API 
  as described below
- tileSize: size in pixels of the supplied *square* tiles. Default: 512
- context: 2D rendering context ([CanvasRenderingContext2D] object) for the 
  target canvas. If not supplied, tile-frame will create its own canvas
- width, height: pixel size of the displayed map. MUST be multiple of tileSize.
  Default: dimensions of the drawingbuffer of the supplied context.canvas
- minZoom: minimum allowed zoom. Default: 
  min( log2(width/tileSize), log2(height/tileSize) )
- maxZoom: maximum allowed zoom. Default: 22
- center: [x,y] of the map center in map coordinates. Default: [0.5, 0.5]
- zoom: initial zoom of the map. Default: minZoom

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
  - `canvas`: A back-link to the canvas on which the map is rendered
  - `loaded()`: Returns the loading status (between 0 and 1) of the tiles in the
  grid. If some of the tiles on the map are drawn with a stretched parent tile, 
  those tiles are not counted as done.
  - `getTilePos(mapXY)`: Looks up the tile at the specified MAP position,
  where `mapXY` is a 2-element array specifying x- and y-distances in pixels
  from the top left corner of the current map.
  The returned object has the following properties:
    - `x`: the pixel distance of the supplied map position from the left edge
    of the tile
    - `y`: the pixel distance of the supplied map position from the top edge of
    the tile
    - `frac`: The fraction of the tile being used for the current rendering.
    (will be < 1 if the tile is a lower-resolution tile being stretched)
    - `tile`: the tile itself
- Methods to clear or update the canvas
  - `reset()`: Clear the tile boxes at every grid point, forcing the tiles to be
  re-requested from the tile cache at the next call to drawTiles
  - `clear()`: Execute reset(), and clears the canvas
  - `drawTiles()`: method to draw tiles on the canvas (no arguments). Returns
  a (Boolean) flag indicating whether the canvas has changed
- Coordinate methods to set the position and zoom of the map
  - `move(dz, dx, dy)`: Pan or zoom by the supplied *integer* coordinate deltas
  - `fitBoundingBox(p1, p2)`: Find the smallest map that encloses the box
  specified by top left corner p1 and bottom right corner p2.
  - `setCenterZoom([centerX, centerY], zoom)`: Center the map at the supplied
  coordinates, and set the zoom. Note: all values will be adjusted to the
  nearest integer tile coordinates
- Methods to convert coordinates, or report conversion parameters
  - `toLocal(local, global)`: Convert the supplied global map [x,y] coordinate
  to the map's local coordinate system
  - `xyToMapPixels(pixels, global)`: Convert supplied global map [x,y] to
  pixel indices from the top left corner of the map
  - `getScale(i)`: Returns the current scaling from global to local coordinates,
  for the supplied coordinate (0 for x-scale, 1 for y-scale)
- `tileDistance(tile)`: For the given tile, returns a measure of the "distance" 
  of that tile from the current grid (based on the tile.z, .x, .y indices)

## Clipmap array for Level of Detail (LOD) management
When rendering a tilted map, the input resolution requirements can vary from 
one part of the scene to another. Points on the map close to the viewpoint 
need high resolution map data, but such high resolution is unnecessary for 
far-away parts of the scene.

These varying resolution requirements can be managed by a discrete
[Level of Detail] approach. For texture data, [Tanner et al] proposed
**clipmaps**: an array of textures at different resolutions. The textures are
all **clipped** to the same size *in pixels*, rather than to the same
dimensions in physical space. This means that the lower-resolution maps will
cover a larger area, so that rendering can fall back to the lower-res maps
for the far-away parts of the scene.

[Level of Detail]: https://en.wikipedia.org/wiki/Level_of_detail
[Tanner et al]: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.103.3067&rep=rep1&type=pdf

### Clipmaps initialization
To implement a basic clipmap array in tile-frame, import as follows:
```javascript
import { initClipMaps } from 'tile-frame';
```
and initialize as follows:
```javascript
const clipmaps = initClipMaps(mapParams, nLod);
```
where the parameters are:
- mapParams: an object as described above for tileFrame.init. Note that any
  supplied context will be ignored&mdash;initClipMaps generates its own
  canvases, one for each level of detail
- nLod: the desired number of discrete resolutions

### Clipmaps API
The clipmaps API is similar to the main module, but the properties and methods
are consolidated into one value or operation applied across all levels of
detail (LODs).

Specifically, the returned object has the following properties and methods:
- `textures`: an array of objects, one for each LOD, **in order of increasing 
  resolution.** Each texture has the following properties:
  - `canvas`: an HTML Canvas element containing the rendered image
  - `camPos`: a 2-element array containing the [x, y] coordinates of the camera
  within the current texture, where the coordinates for the current texture
  range from [0, 0] at top left to [1, 1] at bottom right
  - `scale`: a 2-element array containing the scaling of the x- and y-axes
  relative to the global map
  - `changed`: a (Boolean) flag indicating whether this LOD was updated in the
  last draw call
- `loaded()`: Returns the average loading status of all LODs
- `getTilePos(globalXY)`: Converts the supplied `globalXY` to the local map XY
  of each texture, and chooses the highest-resolution LOD that encloses the
  supplied point. Returns an object from this LOD with x, y, frac, and tile 
  properties as described above for the `getTilePos` method of the main module
- `reset()`: clears the tile boxes for all LODs
- `drawTiles()`: Executes `drawTiles()` for all LODs, setting the `changed`
  flag for the relevant elements of the textures array
- `setCenterZoom(center, zoom)`: Sets increasing zoom levels for each LOD,
  incrementing by 1 for each LOD, with the highest-resolution LOD (the last
  one in the array) set at the supplied `zoom` value. Centers all LODs at 
  the supplied coordinates. **Note**: values will be rounded to the nearest 
  integer tile coordinates *in each LOD*&mdash;rounding errors may be 
  different across LODs.
- `tileDistance(tile)`: For the given tile, returns a measure of the distance
  of that tile from the current grids. Uses the minimum value across all LODs
