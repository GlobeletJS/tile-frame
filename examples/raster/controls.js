import * as projection from "./proj-mercator.js";

const degrees = 180.0 / Math.PI;

export function initControls(map, boxQC) {
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
}
