document.geoRight = -118.67;
document.geoLeft = -116.4;
document.geoTop = 35.0;
document.geoBottom = 36.4;
document.geoWidth = document.geoRight - document.geoLeft;
document.geoHeight = document.geoBottom - document.geoTop;
document.quakes = quakes.reverse();
document.canvasWidth = 0;
document.canvasHeight = 0;

document.translateX = function(geoX) {
  return document.canvasWidth * (geoX - document.geoLeft) / document.geoWidth;
}

document.translateY = function(geoY) {
  return document.canvasHeight * (geoY - document.geoTop) / document.geoHeight;
}
  
document.addEventListener('readystatechange', function(stateChangeEvent) {
  if (stateChangeEvent.target.readyState !== 'interactive') {
    return;
  }

  document.getElementById('start').onclick = function() {
    var canvasContainer = document.getElementById("canvasContainer");
    var positionInfo = canvasContainer.getBoundingClientRect();
    document.canvasWidth = positionInfo.width;
    document.canvasHeight = positionInfo.height;

    var canvas = document.createElement('canvas');
    canvas.id = "canvas";
    canvas.width = document.canvasWidth;
    canvas.height = document.canvasHeight;
    canvasContainer.appendChild(canvas);
    var context = canvas.getContext("2d");

    // Draw PCA determined fault lines
    context.beginPath();
    context.lineWidth = "2";
    context.strokeStyle = "green";
    context.moveTo(document.translateX(-117.90551869), document.translateY(36.13485794));
    context.lineTo(document.translateX(-117.32375728), document.translateY(35.47592193));
    context.stroke();
    context.beginPath();
    context.moveTo(document.translateX(-117.90551869), document.translateY(35.47592193));
    context.lineTo(document.translateX(-117.32375728), document.translateY(36.13485794));
    context.stroke();

    var quakeInfo = document.getElementById("quakeInfo");
    var percent = document.getElementById("percent");
    var progress = document.getElementById("progress");
    var dotCounter = 0;
    var previousTime = null;
    var delay = 1;
    var endTime = document.quakes[document.quakes.length - 1][1];
    var startTime = document.quakes[0][1];
    var timeScale = endTime - document.quakes[0][1];
    (function addDot() {
      setTimeout(function() {
        // document.quakes.length 1725
        if (dotCounter++ < document.quakes.length - 1) {
          var quake = document.quakes[dotCounter];
          var qx = document.translateX(quake[2]);
          var qy = document.translateY(quake[3]);

          quakeInfo.value = "M " + quake[0].toFixed(2) + " " + new Date(quake[1]);

          context.beginPath();
          var magnitude = quake[0];
          context.arc(qx, qy, magnitude, 0, Math.PI * 2);
          var magColorComponent =  Math.round(magnitude * 11).toString();
          if (magColorComponent.length < 2)
            magColorComponent = "0" + magColorComponent;
          var magColor = "#FF" + magColorComponent + "00";
          context.strokeStyle = magColor;
          context.fillStyle = magColor;
          context.stroke();
          context.fill();
          if (previousTime) {
            delay = (quake[1] - previousTime) / 50000;
          }
          if (dotCounter && dotCounter % 5 == 0) {
            var perc = Math.round(100.0 * (quake[1] - startTime) / timeScale);
            percent.value = perc;
            progress.value = perc;
          }
          previousTime = quake[1];
          addDot();
        }
      }, delay);
    })();

    // for (var i = 0; i < document.quakes.length; i++) {
    //   var quake = document.quakes[i];
    //   var qx = document.translateX(quake[2]);
    //   var qy = document.translateY(quake[3]);

    //   context.beginPath();
    //   var magnitude = quake[0];
    //   context.arc(qx, qy, magnitude, 0, Math.PI * 2);
    //   var magColorComponent =  Math.round(magnitude * 11).toString();
    //   if (magColorComponent.length < 2)
    //     magColorComponent = "0" + magColorComponent;
    //   var magColor = "#FF" + magColorComponent + "00";
    //   context.strokeStyle = magColor;
    //   context.fillStyle = magColor;
    //   context.stroke();
    //   context.fill();
    // }
  }
});
