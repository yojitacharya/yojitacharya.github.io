var startTime = 0;
var elapsedTime = 0;
var mode = 'stopped'; // Initialize mode to a descriptive value
var intervalId = null;

window.onload = function() {
  document.getElementById("start-stopwatch").addEventListener("click", toggleStopwatch, false);
  document.getElementById("reset-stopwatch").addEventListener("click", resetStopwatch, false);
}

function toggleStopwatch() {
  if (mode === 'stopped') {
    startStopwatch();
  } else {
    stopStopwatch();
  }
}

function startStopwatch() {
  mode = 'running';
  startTime = performance.now();
  intervalId = setInterval(updateStopwatch, 10); // Update every 10ms
}

function stopStopwatch() {
  mode = 'stopped';
  clearInterval(intervalId);
}

function updateStopwatch() {
  elapsedTime = performance.now() - startTime;
  var hours = Math.floor(elapsedTime / 3600000);
  var minutes = Math.floor((elapsedTime % 3600000) / 60000);
  var seconds = Math.floor((elapsedTime % 60000) / 1000);
  var milliseconds = elapsedTime % 1000;
  var time = pad(hours) + " : " + pad(minutes) + " : " + pad(seconds) + " : " + pad(milliseconds);
  document.getElementById("stopwatch-display").innerText = time;
}

function resetStopwatch() {
  mode = 'stopped';
  startTime = 0;
  elapsedTime = 0;
  clearInterval(intervalId);
  document.getElementById("stopwatch-display").innerText = "00 : 00 : 00 : 000";
}

function pad(number) {
  return (number < 10 ? "0" : "") + number;
}