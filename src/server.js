const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const winston = require("winston");

app.use(express.static("public"));
http.listen(3000);

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
var serverTest = "off"; // TODO remove

var serverSettings = {
  viewmode: "side-by-side",   // "side-by-side", "fullscreen", "peek-by-inset"
  highlight: "box",           // "box", "circle", "crosshair", "layout"
  annotation: "on min",       // "[on/off] [min/max]", "none"
  test: "off"                 // "off", "[board/schematic] [on/off]"
};

// Test state
var testModule = null;
var currentlyTesting = false; // TODO remove
var testStart = 0;


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
function handleTestEvent(type, value) {
  if (serverSettings.test === "off") {
    // Ignore errant test events
    return;
  }

  // Echo event to all sockets
  io.emit("test", type, value);

  switch (type) {
    case "set":
      // Make sure the module is highlighted for everyone
      io.emit("modules selected", [value]);
      
      testStart = currentTimeMS();
      testModule = value;
      var testString = (serverSettings.test.includes("board") ? "board" : "schematic") + " ";
      testString += (serverSettings.test.includes("on") ? "with" : "without") + " BoardViz";
      logWithTime(`Test: Find module ${value} on ${testString}`);
      break;

    case "miss":
      if (testModule !== null) {
        if (value !== null) {
          logWithTime(`Test: Clicked incorrect module ${module} after ${currentTimeMS() - testStart} ms`);
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
      logWithTime(`Test: Canceled after ${currentTimeMS() - testStart}`);
      testModule = null;
      break;
  }
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
  io.emit("setting test", serverTest);

  io.emit("settings", serverSettings);

  socket.on("modules selected", (modules) => {
    serverModules = modules;
    io.emit("modules selected", modules);
  });

  socket.on("settings", (newSettings) => {
    var oldTest = serverSettings.test;
    serverSettings = newSettings;
    io.emit("settings", serverSettings);

    if (oldTest !== serverSettings.test) {
      // Any time we change the test mode, we should deselect existing highlights
      io.emit("modules selected", []);

      if (testModule !== null) {
        // If we're changing the test mode during a test, cancel the test
        handleTestEvent("cancel", null);
      }
    }
  });

  socket.on("test", handleTestEvent);
});