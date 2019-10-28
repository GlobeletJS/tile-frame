'use strict';

import { params } from "./mapbox-streets.js";
import * as tileKiln from 'tile-kiln';
import { cacheTileKiln } from 'tile-rack';
import * as tileFrame from "../../src/index.js";
import * as mapOverlay from 'map-overlay';
import { initControls } from "./controls.js";

export function main() {
  // Setup 2D map
  const factory = tileKiln.init({
    size: params.tileSize,
    style: params.style,
    token: params.token,
  });
  const cache = cacheTileKiln(params.tileSize, factory);
  params.getTile = cache.retrieve;
  params.context = document.getElementById("rasterCanvas").getContext("2d");
  const map = tileFrame.init(params);

  // Set up bounding box QC overlay
  const overlay = document.getElementById("vectorCanvas");
  const boxQC = mapOverlay.init(overlay, map, params.width, params.height);

  initControls(map, boxQC);

  // Track loading status
  var loaded = document.getElementById("completion");
  // Start animation loop
  requestAnimationFrame(checkRender);
  function checkRender(time) {
    map.drawTiles();
    cache.trim(map.tileDistance, 2.0);
    factory.sortTasks(cache.getPriority);

    var percent = map.loaded() * 100;
    if (percent < 100) {
      loaded.innerHTML = "Loading: " + percent.toFixed(0) + "%";
    } else {
      loaded.innerHTML = "Complete! " + percent.toFixed(0) + "%";
    }
    requestAnimationFrame(checkRender);
  }
}
