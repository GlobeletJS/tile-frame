'use strict';

import * as tileKiln from 'tilekiln';
import * as tileRack from 'tile-rack';
import * as tileFrame from "../../dist/tile-frame.bundle.js";
import { params } from "./mapbox-streets.js";
//import { params } from "./mapbox-ukiyo-e.js";
import * as projection from "./proj-mercator.js";
import * as mapOverlay from 'map-overlay';

const degrees = 180.0 / Math.PI;

export function main() {
  // Setup 2D map
  const display = document.getElementById("rasterCanvas").getContext("2d");
  const factory = tileKiln.init({
    size: params.tileSize,
    style: params.style,
    token: params.token,
  });
  const cache = tileRack.init(params.tileSize, factory);
  const map = tileFrame.init(params, display, cache);

  // Set up bounding box QC overlay
  const overlay = document.getElementById("vectorCanvas");
  const boxQC = mapOverlay.init(overlay, map, params.width, params.height);
  boxQC.p1 = [];
  boxQC.p2 = [];
  boxQC.visible = false;

  // Handle a supplied bounding box
  var westDeg = document.getElementById("west");
  var eastDeg = document.getElementById("east");
  var northDeg = document.getElementById("north");
  var southDeg = document.getElementById("south");
  var bboxSet = document.getElementById("bboxSet");
  bboxSet.addEventListener("click", function(click) {
    var topLeft = [westDeg.value / degrees, northDeg.value / degrees];
    var btRight = [eastDeg.value / degrees, southDeg.value / degrees];
    projection.lonLatToXY(boxQC.p1, topLeft); 
    projection.lonLatToXY(boxQC.p2, btRight);
    map.fitBoundingBox(boxQC.p1, boxQC.p2);
    boxQC.draw([boxQC.p1, boxQC.p2], true);
    boxQC.visible = true;
  }, false);
  var bboxClear = document.getElementById("bboxClear");
  bboxClear.addEventListener("click", function(click) {
    boxQC.reset();
    boxQC.visible = false;
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
    if (boxQC.visible) boxQC.draw([boxQC.p1, boxQC.p2], true);
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
