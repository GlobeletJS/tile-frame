'use strict';

import * as tileKiln from 'tile-kiln';
import { initCache } from 'tile-rack';
import * as tileFrame from "../../src/index.js";
import { params } from "./macrostrat.js";
import { initTouch } from 'touch-sampler';
import { initSelector } from "./selection.js";

export function main() {
  // Get the map container div
  const mapDiv = document.getElementById("map");

  // Setup 2D map
  const factory = tileKiln.init({
    size: params.tileSize,
    style: params.style,
    token: params.token,
  });
  const cache = initCache(params.tileSize, factory);
  params.getTile = cache.retrieve;
  params.context = document.getElementById("rasterCanvas").getContext("2d");
  const map = tileFrame.init(params);

  // Set up mouse tracking
  const cursor = initTouch(mapDiv);

  // Setup panning controls
  var up = document.getElementById("up");
  up.addEventListener("click", function(click) { map.move(0, 0, -1); }, false);
  var down = document.getElementById("down");
  down.addEventListener("click", function(click) { map.move(0, 0, 1); }, false);
  var left = document.getElementById("left");
  left.addEventListener("click", function(click) { map.move(0, -1, 0); }, false);
  var right = document.getElementById("right");
  right.addEventListener("click", function(click) { map.move(0, 1, 0); }, false);

  // Setup zoom controls
  var zoomIn = document.getElementById("zoomIn");
  zoomIn.addEventListener("click", function(click) { map.move(1, 0, 0); }, false);
  var zoomOut = document.getElementById("zoomOut");
  zoomOut.addEventListener("click", function(click) { map.move(-1, 0, 0); }, false);

  // Track loading status and cursor position
  var loaded = document.getElementById("completion");
  var tooltip = document.getElementById("tooltip");

  // Set up toggle for Burwell polygon visibility
  var burwellVisibility = true;
  var burwellLayers = [];
  factory.promise.then(api => {
    burwellLayers = api.style.layers
      .filter(layer => layer.source === "burwell")
      .map(l => l.id);
  });
  var toggleBurwell = document.getElementById("toggleBurwell");
  toggleBurwell.addEventListener("click", function(click) {
    burwellVisibility = !burwellVisibility;
    setVisibility(burwellLayers, burwellVisibility);
    map.reset();
  }, false);

  function setVisibility(layers, visibility) {
    const setter = (visibility)
      ? factory.showLayer
      : factory.hideLayer;
    layers.forEach( layer => setter(layer) );
    cache.process( tile => { tile.rendered = false; } );
  }

  // Get ready to print out feature info
  const selector = initSelector(params.tileSize, map);
  var info = document.getElementById("info");

  // Start animation loop
  requestAnimationFrame(checkRender);
  function checkRender(time) {
    map.drawTiles();
    var numTiles = cache.trim(map.tileDistance, 1.5);
    factory.sortTasks(cache.getPriority);

    // Report loading status
//    var percent = map.loaded() * 100;
//    loaded.innerHTML = (percent < 100)
//      ? "Loading: " + percent.toFixed(0) + "%"
//      : "Complete! 100%";
//
//    // Find the well nearest to the cursor
//    var box = mapDiv.getBoundingClientRect();
//    var x = cursor.x() - box.left;
//    var y = cursor.y() - box.top;
//    var selected = selector(x, y, 5, "burwell", "burwell_fill");
//
//    info.innerHTML = "Tiles in cache: " + numTiles + "<br>";
//
//    info.innerHTML += (selected && selected.properties)
//      ? "<pre>" + JSON.stringify(selected.properties, null, 2) + "</pre>"
//      : "";

    requestAnimationFrame(checkRender);
  }
}
