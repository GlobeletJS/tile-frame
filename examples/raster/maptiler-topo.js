export const params = Object.freeze({
  endpoint: "https://api.maptiler.com/maps/topo/{z}/{x}/{y}.png?key=x3YrAI3d568DC0IrcVDs",

  // Number of zoom levels
  maxZoom: 20,
  
  // Width of a tile in pixels (ASSUMES square tiles)
  tileSize: 512,
  
  // Size of map to display, in pixels
  width: 1024,
  height: 1024,

  // Initial position of the map
  center: [0.5, 0.5],
  zoom: 1,
});
