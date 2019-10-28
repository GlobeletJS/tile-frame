'use strict';

import { params } from "./mapbox-satellite.js";
import { initRasterCache } from 'tile-rack';
import * as tileFrame from "../../src/index.js";
import * as mapOverlay from 'map-overlay';
import { initControls } from "./controls.js";

const degrees = 180.0 / Math.PI;

function getURL(z, x, y) {
  return params.endpoint.replace(/{z}/, z).replace(/{y}/, y).replace(/{x}/, x);
}

export function main() {
  // Setup 2D map
  const cache = initRasterCache(params.tileSize, getURL);
  params.getTile = cache.retrieve;
  params.context = document.getElementById("rasterCanvas").getContext("2d");
  const map = tileFrame.init(params);

  const overlay = document.getElementById("vectorCanvas");
  const boxQC = mapOverlay.init(overlay, map, params.width, params.height);

  initControls(map, boxQC);

  // Track loading status
  var loaded = document.getElementById("completion");
  // Start animation loop
  requestAnimationFrame(checkRender);
  function checkRender(time) {
    map.drawTiles();
    var percent = map.loaded() * 100;
    if (percent < 100) {
      loaded.innerHTML = "Loading: " + percent.toFixed(0) + "%";
    } else {
      loaded.innerHTML = "Complete! " + percent.toFixed(0) + "%";
    }
    requestAnimationFrame(checkRender);
  }
}
