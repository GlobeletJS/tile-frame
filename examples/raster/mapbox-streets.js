export const params = Object.freeze({
  // URL of a Mapbox Style document
  style: "./mapbox-streets-style.json",

  // Number of zoom levels
  maxZoom: 20,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 256,
  
  // Size of map to display, in pixels
  width: 1024,
  height: 768,
});
