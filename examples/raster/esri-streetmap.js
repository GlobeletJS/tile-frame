export const params = Object.freeze({
  // URL of a Mapbox Style document
  style: "./esri-streetmap-style.json",

  // Number of zoom levels
  maxZoom: 23,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 256,
  
  // Size of map to display, in pixels
  width: 1024,
  height: 768,
});
