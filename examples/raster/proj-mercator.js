// Maximum latitude for Web Mercator: 85.0113 degrees. Beware rounding!
const maxMercLat = 2.0 * Math.atan( Math.exp(Math.PI) ) - Math.PI / 2.0;

export function getShaderParams(params, geodetic) {
  // Input geodetic is an array containing longitude, latitude, altitude

  // Clip latitude to map boundaries
  var clipLat = Math.min(Math.max(-maxMercLat, geodetic[1]), maxMercLat);

  // camera exp(Y), for converting delta latitude to delta Y
  params[0] = Math.tan( 0.25 * Math.PI + 0.5 * clipLat );

  // Difference of clipping
  params[1] = geodetic[1] - clipLat;
  return;
}

export function lonLatToXY(projected, geodetic) {
  // Input geodetic is a pointer to a 2- (or 3?)-element array, containing
  // longitude and latitude of a point on the ellipsoid surface
  // Output projected is a pointer to a 2-element array containing
  // the projected X/Y coordinates

  projected[0] = lonToX( geodetic[0] );
  projected[1] = latToY( geodetic[1] );
  return;
}

function lonToX(lon) {
  // Convert input longitude in radians to a Web Mercator x-coordinate
  // where x = 0 at lon = -PI, x = 1 at lon = +PI
  return 0.5 + 0.5 * lon / Math.PI;
}

function latToY(lat) {
  // Convert input latitude in radians to a Web Mercator y-coordinate
  // where y = 0 at lat = 85.05113 deg, y = 1 at lat = -85.05113 deg
  var clipLat = Math.min(Math.max(-maxMercLat, lat), maxMercLat);
  var y = 0.5 - 0.5 / Math.PI * // Note sign flip;
  Math.log( Math.tan(Math.PI / 4.0 + clipLat / 2.0) );
  // Clip range to [0,1], since y does not wrap around
  return Math.min(Math.max(0.0, y), 1.0);
}
