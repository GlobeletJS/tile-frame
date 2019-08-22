export const params = Object.freeze({
  // URL of a Mapbox Style document
  style: "./macrostrat-grouped.json", //sandwich.json",

  // Token, for expanding Mapbox shorthand URLs
  token: "pk.eyJ1IjoiamhlbWJkIiwiYSI6ImNqcHpueHpyZjBlMjAzeG9kNG9oNzI2NTYifQ.K7fqhk2Z2YZ8NIV94M-5nA",
  
  // Number of zoom levels
  maxZoom: 20,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 512,
  
  // Size of map to display, in pixels
  width: 1024,
  height: 1024,

  // Initial center and zoom
  center: [0.21875, 0.40625],
  zoom: 5,
});
