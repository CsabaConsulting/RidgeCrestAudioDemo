document.geoRight = -118.0; // -118.67;
document.geoLeft = -117.2 // -116.4;
document.geoTop = 35.3; // 35.0;
document.geoBottom = 36.2; // 36.4;
document.geoWidth = document.geoRight - document.geoLeft;
document.geoHeight = document.geoBottom - document.geoTop;
document.quakes = quakes.reverse();
document.canvasWidth = 0;
document.canvasHeight = 0;
document.magMin = 2.0;  // 2.45
document.magMax = 7.5;  // 7.1

document.translateX = function(geoX) {
  return document.canvasWidth * (geoX - document.geoLeft) / document.geoWidth;
}

document.translateY = function(geoY) {
  return document.canvasHeight * (geoY - document.geoTop) / document.geoHeight;
}

function RapidSoundsSample(context) {
  var ctx = this;
  var loader = new BufferLoader(context, ['sounds/m4a1cropshort.mp3'], onBufferLoaded);
  
  function onBufferLoaded(buffers) {
    console.log("buffer loaded!!!")
    ctx.buffers = buffers;
  };
  
  loader.load();
}
  
RapidSoundsSample.prototype.makeSource = function(buffer, volume) {
  var source = context.createBufferSource();
  var gain = context.createGain();
  gain.gain.value = volume;  // 0.2 == 20%
  source.buffer = buffer;
  source.connect(gain);
  // Use compressor to avoid dynamic overshoot
  var compressor = context.createDynamicsCompressor();
  compressor.threshold.value = 10;
  compressor.ratio.value = 20;
  compressor.reduction.value = -20;
  gain.connect(compressor);
  compressor.connect(context.destination);

  return source;
};

RapidSoundsSample.prototype.shootRound = function(volume) {
  var time = context.currentTime;
  // Make multiple sources using the same buffer and play in quick succession.
  var source = this.makeSource(this.buffers[0], volume);
  // source.playbackRate.value = 1 + Math.random() * random2;
  source[source.start ? 'start' : 'noteOn'](time);
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgbHex(h, s, l) {
  var r, g, b;

  if (s < 1e-3) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0)
        t += 1;
      if (t > 1)
        t -= 1;
      if (t < 1 / 6)
        return p + (q - p) * 6 * t;
      if (t < 1 / 2)
        return q;
      if (t < 2 / 3)
        return p + (q - p) * (2/3 - t) * 6;

      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  var dec2hex = function dec2hex(dec) {
    hex = dec.toString(16);
    if (hex.length <= 1) {
      hex = "0" + hex;
    }
    return hex;
  }

  return "#" + dec2hex(Math.round(r * 255)) + dec2hex(Math.round(g * 255)) + dec2hex(Math.round(b * 255));
}

document.addEventListener('readystatechange', function(stateChangeEvent) {
  if (stateChangeEvent.target.readyState !== 'interactive') {
    return;
  }

  var canvasContainer = document.getElementById("canvasContainer");
  var positionInfo = canvasContainer.getBoundingClientRect();
  document.canvasWidth = positionInfo.width;
  document.canvasHeight = positionInfo.height;

  var canvas = document.createElement('canvas');
  canvas.id = "canvas";
  canvas.width = document.canvasWidth;
  canvas.height = document.canvasHeight;
  canvasContainer.appendChild(canvas);
  var canvasContext = canvas.getContext("2d");

  // Draw PCA determined fault lines
  canvasContext.beginPath();
  canvasContext.lineWidth = "2";
  canvasContext.strokeStyle = "green";
  canvasContext.moveTo(document.translateX(-117.90551869), document.translateY(36.13485794));
  canvasContext.lineTo(document.translateX(-117.32375728), document.translateY(35.47592193));
  canvasContext.stroke();
  canvasContext.beginPath();
  canvasContext.moveTo(document.translateX(-117.90551869), document.translateY(35.47592193));
  canvasContext.lineTo(document.translateX(-117.32375728), document.translateY(36.13485794));
  canvasContext.stroke();

  for (x = 0; x < document.canvasWidth - 3; x += 3) {
    canvasContext.fillStyle = hslToRgbHex(x / document.canvasWidth, 0.9, 0.6);;
    canvasContext.fillRect(x, document.canvasHeight - 3, 3, 3);
  }

  var soundSample = new RapidSoundsSample(context);

  document.getElementById('start').onclick = function() {
    var quakeInfo = document.getElementById("quakeInfo");
    var percent = document.getElementById("percent");
    var progress = document.getElementById("progress");
    var dotCounter = 0;
    var previousTime = null;
    var lastPlayed = null;
    var delay = 1;
    var endTime = document.quakes[document.quakes.length - 1][1];
    var startTime = document.quakes[0][1];
    var timeScale = endTime - document.quakes[0][1];

    (function addDot() {
      setTimeout(function() {
        // document.quakes.length 1725
        if (dotCounter++ < document.quakes.length - 1) {
          var quake = document.quakes[dotCounter];
          var magnitude = quake[0];
          var quakeTime = quake[1];
          var qx = document.translateX(quake[2]);
          var qy = document.translateY(quake[3]);
          var magNormalized = (magnitude - document.magMin) / document.magMax;

          if (!lastPlayed || magnitude >= 3.5 && Date.now() - lastPlayed > 50) {
            lastPlayed = Date.now();
            soundSample.shootRound(magNormalized);
          }

          quakeInfo.value = "M " + magnitude.toFixed(2) + " " + new Date(quakeTime);

          canvasContext.beginPath();
          canvasContext.arc(qx, qy, magNormalized * 20, 0, Math.PI * 2);
          var magColor = hslToRgbHex(magNormalized, 0.9, 0.6);
          if (dotCounter < 100)
              console.log(magNormalized, magColor);
          canvasContext.strokeStyle = magColor;
          canvasContext.fillStyle = magColor;
          canvasContext.stroke();
          canvasContext.fill();
          if (previousTime) {
            delay = (quakeTime - previousTime) / 50000;
          }
          if (dotCounter && dotCounter % 5 == 0) {
            var perc = Math.round(100.0 * (quakeTime - startTime) / timeScale);
            percent.value = perc;
            progress.value = perc;
          }
          previousTime = quakeTime;
          addDot();
        }
      }, delay);
    })();
  }
});
