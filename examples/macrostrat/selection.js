import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

export function initSelector(size, map) {
  // This closure just stores the tile size and a link to the map

  return function(mapX, mapY, threshold, source, layer) {
    // Get the tile at the [mapX, mapY] position, along with the
    // x/y projected to tile coordinates
    var box = map.getTilePos([mapX, mapY]);
    if (!box) return;

    // Get a link to the features from the requested layer
    var layers = box.tile.sources[source];
    if (!layers) return;
    // TODO: Make sure it's a vector source?
    var data = layers[layer];
    if (!data || data.features.length < 1) return;
    var features = data.features;

    // Get type of features in data. ASSUMES all same type
    var type = features[0].geometry.type;

    var feature;
    switch (type) {
      case "Point":
        // Scale the threshold by frac to make it a displayed distance
        // rather than a distance in local tile coordinates
        feature = findNearest(box.x, box.y, threshold * box.frac, features);
        break;
      case "Polygon":
      case "MultiPolygon":
        var pt = [box.x, box.y];
        feature = features.find(poly => booleanPointInPolygon(pt, poly));
        break;
      default:
        return; // Unknown feature type!
    }

    if (!feature) return; // No actual feature selected

    // Make a deep copy of the feature (not just a link to the original)
    feature = JSON.parse(JSON.stringify(feature));

    if (type === "Point") {
      // Transform the feature coordinates from tile coordinates back to 
      //  global map coordinates.  TODO: Make this work for Polygons?
      var coords = feature.geometry.coordinates;
      var numTiles = 2 ** box.tile.z;
      coords[0] = (box.tile.x + coords[0] / size) / numTiles;
      coords[1] = (box.tile.y + coords[1] / size) / numTiles;
    }

    return feature;
  }
}

function findNearest(x, y, threshold, features) {
  var minDistance = Infinity;
  var minIndex = 0;

  features.forEach(checkDistance);

  function checkDistance(feature, index) {
    var p = feature.geometry.coordinates;
    var distance = Math.sqrt( (p[0] - x)**2 + (p[1] - y)**2 );
    if (distance < minDistance) {
      minDistance = distance;
      minIndex = index;
    }
  }

  if (minDistance > threshold) return;
  return features[minIndex];
}
