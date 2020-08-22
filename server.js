const express = require("express");
const app = express();
const winston = require("winston");

var schematicData = require("./parsing/schematicComponents.json")

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
app.get("/schematicdata", (req, res) => {
  res.send(schematicData);
});
app.use(express.static("public"));

const server = app.listen(3000);
const io = require("socket.io")(server);

// Logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    // output to 'test.log' and to console
    new winston.transports.File({ filename: "test.log", level: "info" }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Tracks number of active connections
var connectionCount = 0;

// Server setting vars
var serverModules = [];

// TODO WIP refactoring
var serverSettings = {
  viewmode: "side-by-side",       // "side-by-side", "fullscreen", "peek-by-inset"
  highlight: "box",               // "box", "circle", "crosshair", "layout"
  annotation: "on min",           // "[on/off] [min/max]", "none",
  annotationPosition: "onboard",  // "onboard", "offboard"
  test: "off",                    // "off", "[board/schematic] [on/off]"
  testTarget: "board",            // "board", "schematic"
  sound: "on",                    // "on", "off"
};

// Test state
var testModule = null;
var testStart = 0;

// "off", "auto", or "manual"
var testSelectionMode = "off";

// null when auto is off, or the index of the refId and enable/disable arrays when auto is on
var testAutoIndex = null;

var moduleArray = [44, 57, 58, 59, 62, 64, 66, 67, 72, 74, 75, 78, 79, 80, 81, 83, 85, 86, 88, 89];
var onOffArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];




// ---- Functions ---- //

function currentTimeMS() {
  return (new Date()).getTime();
}

function timeStamp() {
  return (new Date()).toLocaleString();
}

function logWithTime(msg) {
  logger.info(timeStamp() + ": " + msg);
}

// Handles receiving a "test" event from a socket
// type is "set", "miss", "found", or "cancel"
// value is the module refId or null
function handleTestEvent(type, value, fromAuto = false) {
  if (serverSettings.test === "off") {
    // Ignore errant test events
    return;
  }

  // Echo event to all sockets
  io.emit("test", type, value);

  switch (type) {
    case "set":
      if (testSelectionMode !== "manual" && !fromAuto) {
        // Ignore selections made manually when not in manual mode
        break;
      }

      // Make sure the module is highlighted for everyone
      // io.emit("modules selected", [value]);

      testStart = currentTimeMS();
      testModule = value;
      var testString = (serverSettings.test.includes("board") ? "board" : "schematic") + " ";
      testString += (serverSettings.test.includes("on") ? "with" : "without") + " BoardViz";
      logWithTime(`Test: Find module ${value} on ${testString}`);
      break;

    case "miss":
      if (testModule !== null) {
        if (value !== null) {
          logWithTime(`Test: Clicked incorrect module ${value} after ${currentTimeMS() - testStart} ms`);
        } else {
          logWithTime(`Test: Clicked non-module after ${currentTimeMS() - testStart} ms`);
        }
      }
      break;

    case "found":
      logWithTime(`Test: Module ${value} found in ${currentTimeMS() - testStart} ms`);
      testModule = null;

      // Make sure the module is highlighted for everyone
      io.emit("modules selected", [value]);

      break;

    case "cancel":
      logWithTime(`Test: Canceled after ${currentTimeMS() - testStart} ms`);
      testModule = null;
      break;

    // Auto Mode only
    case "next":
      if (testAutoIndex === null) {
        // We're not currently in auto mode
        break;
      }

      // Advancing to next test
      if (testAutoIndex >= 20) {
        // Let the settings page know we're done with the auto test
        io.emit("test", "done", null);
        testAutoIndex = null;
        logWithTime("Finished auto test");
      } else {
        // Set BoardViz to on/off for this test from the shuffled onOffArray
        var testMode = (serverSettings.test.includes("board") ? "board" : "schematic") + " ";
        testMode += (onOffArray[testAutoIndex] == 0 ? "off" : "on");
        serverSettings.test = testMode;
        io.emit("settings", serverSettings);

        // Get the next module to test from the shuffled moduleArray
        handleTestEvent("set", moduleArray[testAutoIndex], true);

        testAutoIndex++;
      }

      break;
  }
}

function turnOffTest() {
  // Any time we change the test mode, we should deselect existing highlights
  io.emit("modules selected", []);

  if (testModule !== null) {
    // If we're changing the test mode during a test, cancel the test
    handleTestEvent("cancel", null);
  }
}

// Fisher-Yates shuffle algorithm to randomize an array
// Credit to Mike Bostock: https://bost.ocks.org/mike/shuffle/
function shuffle(arr) {
  var m = arr.length, t, i;

  // While there remain elements to shuffle…
  while (m) {

    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = arr[m];
    arr[m] = arr[i];
    arr[i] = t;
  }

  return arr;
}


// ---- Server Execution ---- //

logWithTime("Server started up");

io.on("connection", (socket) => {
  connectionCount++;

  var clientIp = socket.request.connection.remoteAddress;
  logWithTime(`Connected to ${clientIp} (${connectionCount} active connections)`);

  socket.on("disconnect", () => {
    connectionCount--;
    logWithTime(`Disconnected ${clientIp} (${connectionCount} active connections remaining)`);
  })

  // Send the current settings to any new connection
  io.emit("modules selected", serverModules);
  io.emit("settings", serverSettings);
  io.emit("selectionmode", testSelectionMode);

  socket.on("modules selected", (modules) => {
    serverModules = modules;
    io.emit("modules selected", modules);
  });

  socket.on("settings", (newSettings) => {
    var oldTest = serverSettings.test;
    serverSettings = newSettings;
    io.emit("settings", serverSettings);

    if (oldTest !== serverSettings.test) {
      turnOffTest();
    }
  });

  socket.on("log", (msg) => {
    logWithTime(msg);
  });

  socket.on("test", handleTestEvent);

  socket.on("selectionmode", (mode) => {
    io.emit("selectionmode", mode);

    if (testSelectionMode !== mode) {
      // We're changing the test mode, so cancel any current test
      turnOffTest();
      if (testAutoIndex !== null) {
        logWithTime("Canceling auto test");
        testAutoIndex = null;
      }
    }

    testSelectionMode = mode;

    switch (testSelectionMode) {
      case "off":
        serverSettings.test = "off";
        io.emit("settings", serverSettings);
        break;

      case "auto":
        // We're setting up an automatic test run
        moduleArray = shuffle(moduleArray);
        onOffArray = shuffle(onOffArray);

        testAutoIndex = 0;

        if (serverSettings.test === "off") {
          // If test mode was off, default to Find on Board
          serverSettings.test = "board on";
          io.emit("settings", serverSettings);
        }

        logWithTime("Initialized auto test for find on " + (serverSettings.test.includes("board") ? "board" : "schematic"));

        break;

      case "manual":
        if (serverSettings.test === "off") {
          // If test mode was off, default to Find on Board
          serverSettings.test = "board on";
          io.emit("settings", serverSettings);
        }
        break;
    }
  });
});