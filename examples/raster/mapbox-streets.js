export const params = Object.freeze({
  // URL of a Mapbox Style document
  endpoint: "https://api.mapbox.com/styles/v1/jhembd/cjuolqfz607ws1fmt0d8my92y/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA",

  // Number of zoom levels
  maxZoom: 20,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 256,
  
  // Size of map to display, in pixels
  width: 1024,
  height: 768,

  // Initial position of the map
  center: [0.5, 0.375],
  zoom: 2,
});
