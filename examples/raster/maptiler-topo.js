export const params = Object.freeze({
  // URL of a Mapbox Style document
  style: "./maptiler-topo-style.json",

  // Number of zoom levels
  maxZoom: 20,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 512,
  
  // Size of map to display, in pixels
  width: 1024,
  height: 1024,
});
