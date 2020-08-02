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


// Server setting vars
var serverModules = [];
var serverViewmode = "side-by-side";
var serverHighlight = "box";
var serverAnnotation = "on min";
var serverTest = "off";

// Test state
var currentlyTesting = false;
var testStart = 0;

function currentTimeMS() {
  return (new Date()).getTime();
}


logger.info("Server started up at " + (new Date).toString());

io.on("connection", (socket) => {
  // Send the current settings to any new connection
  io.emit("modules selected", serverModules);
  io.emit("setting viewmode", serverViewmode);
  io.emit("setting highlight", serverHighlight);
  io.emit("setting annotation", serverAnnotation);
  io.emit("setting test", serverTest);

  // Echo any message received to all sockets
  // TODO maybe consolidate single setting event
  socket.on("modules selected", (modules, msg) => {
    serverModules = modules;
    io.emit("modules selected", modules, msg);

    var testTarget = serverTest === "find-on-board" ? "board" : "schematic";

    if (msg === "test set") {
      testStart = currentTimeMS();
      logger.info(`Test: Find module ${modules[0]} on ${testTarget}`);
      currentlyTesting = true;
    } else if (msg === "test found") {
      var testTime = currentTimeMS() - testStart;
      logger.info(`Test: Module ${modules[0]} found on ${testTarget} in ${testTime} ms`);
      currentlyTesting = false;
    }
  });
  socket.on("setting viewmode", (mode) => {
    serverViewmode = mode;
    io.emit("setting viewmode", mode);
  });
  socket.on("setting highlight", (mode) => {
    serverHighlight = mode;
    io.emit("setting highlight", mode);
  });
  socket.on("setting annotation", (mode) => {
    serverAnnotation = mode;
    io.emit("setting annotation", mode);
  });
  socket.on("setting test", (mode) => {
    serverTest = mode;
    io.emit("setting test", mode);

    // Any time we change test mode we should clear the selected modules
    io.emit("modules selected", []);

    if (currentlyTesting) {
      // We're canceling an ongoing test
      logger.info(`Test canceled after ${currentTimeMS() - testStart} ms`);
      currentlyTesting = false;
    }
  });
  socket.on("test click miss", (module) => {
    if (currentlyTesting) {
      if (module) {
        logger.info(`Clicked incorrect module ${module} after ${currentTimeMS() - testStart} ms`);
      } else {
        logger.info(`Clicked nothing after ${currentTimeMS() - testStart} ms`);
      }
    }
  });
});