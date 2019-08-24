export const params = Object.freeze({
  endpoint: "http://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",

  // Number of zoom levels
  maxZoom: 23,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 256,
  
  // Size of map to display, in pixels
  width: 1024,
  height: 768,

  // Initial position of the map
  center: [0.5, 0.375],
  zoom: 2,
});
