export function initRenderer(context, params) {
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
