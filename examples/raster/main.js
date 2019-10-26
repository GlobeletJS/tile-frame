'use strict';

import { initRasterCache } from 'tile-rack';
import * as tileFrame from "../../src/index.js";
import { params } from "./mapbox-satellite.js";
import * as projection from "./proj-mercator.js";
import * as mapOverlay from 'map-overlay';

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

  // Handle a supplied bounding box
  var westDeg = document.getElementById("west");
  var eastDeg = document.getElementById("east");
  var northDeg = document.getElementById("north");
  var southDeg = document.getElementById("south");
  var bboxSet = document.getElementById("bboxSet");
  bboxSet.addEventListener("click", function(click) {
    var topLeft = [westDeg.value / degrees, northDeg.value / degrees];
    var btRight = [eastDeg.value / degrees, southDeg.value / degrees];
    var p1 = [], p2 = [];
    projection.lonLatToXY(p1, topLeft);
    projection.lonLatToXY(p2, btRight);
    map.fitBoundingBox(p1, p2);
    boxQC.draw([p1, p2], true);
  }, false);

  // Setup panning controls
  var up = document.getElementById("up");
  up.addEventListener("click", function(click) { move(0, 0, -1); }, false);
  var down = document.getElementById("down");
  down.addEventListener("click", function(click) { move(0, 0, 1); }, false);
  var left = document.getElementById("left");
  left.addEventListener("click", function(click) { move(0, -1, 0); }, false);
  var right = document.getElementById("right");
  right.addEventListener("click", function(click) { move(0, 1, 0); }, false);

  // Setup zoom controls
  var zoomIn = document.getElementById("zoomIn");
  zoomIn.addEventListener("click", function(click) { move(1, 0, 0); }, false);
  var zoomOut = document.getElementById("zoomOut");
  zoomOut.addEventListener("click", function(click) { move(-1, 0, 0); }, false);

  function move(dz, dx, dy) {
    map.move(dz, dx, dy);
    boxQC.reset();
  }

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
