const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));
http.listen(3000);

var serverModules = [];
var serverViewmode = "side-by-side";
var serverHighlight = 1;
var serverAnnotation = "on min";

io.on("connection", (socket) => {
  // Send the current settings to any new connection
  io.emit("modules selected", serverModules);
  io.emit("setting viewmode", serverViewmode);
  io.emit("setting highlight", serverHighlight);
  io.emit("setting annotation", serverAnnotation);

  // Echo any message received to all sockets
  socket.on("modules selected", (modules) => {
    serverModules = modules;
    io.emit("modules selected", modules);
  });
  socket.on("setting viewmode", (mode) => {
    serverViewmode = mode;
    io.emit("setting viewmode", mode);
  })
  socket.on("setting highlight", (mode) => {
    serverHighlight = mode;
    io.emit("setting highlight", mode);
  })
  socket.on("setting annotation", (mode) => {
    serverAnnotation = mode;
    io.emit("setting annotation", mode);
  })
});