// A skeleton tile factory for raster tiles
export function initTileFactory(endpoint) {

  return { create };

  function create(z, x, y) {
    var tileHref = tileURL(endpoint, z, x, y);
    const img = loadImage(tileHref, checkData);

    const tile = {
      z, x, y,
      img,
      cancel,
      canceled: false,
      rendered: false,
    };

    function checkData(err) {
      if (err) return console.log(err);
      tile.rendered = true;
    }

    function cancel() {
      img.src = "";
      tile.canceled = true;
    }

    return tile;
  }
}

function loadImage(href, callback) {
  const errMsg = "ERROR in loadImage for href " + href;

  const img = new Image();
  img.onerror = () => callback(errMsg);
  img.onload = checkImg;
  img.crossOrigin = "anonymous";
  img.src = href;

  return img;

  function checkImg() {
    return (img.complete && img.naturalWidth !== 0)
      ? callback(null)
      : callback(errMsg);
  }
}

function tileURL(endpoint, z, x, y) {
  return endpoint.replace(/{z}/, z).replace(/{y}/, y).replace(/{x}/, x);
}
