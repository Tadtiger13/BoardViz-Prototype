// Primary js file for main.html, the computer interface
// Contains rendering and interaction functions for schematic
// and sets up the socket connection and page content


// ---- Variables ---- //

// imported schematic data
var schematicData;

// Keeps track of the currently highlighted modules for use by
// drawHighlights() and drawSchematicHighlights() in render.js
var highlightedModules = [];

// Determines whether we log the time of selections, etc
var testMode;

// True if we're in find-on-schematic mode and a component has been selected but not yet found
var currentlyTesting = false;

// TODO comment this
var testModule = null;

// Tracks which screen is currently being displayed in fullscreen mode
var fullscreenShowLayout = false;

// checked by some functions in render.js, so we initialize it here
var highlightedNet = null;

// Socket for communicating with server and mobile page
var socket = io();

var showHighlightsFlag = false;

// Holds svg of schematic and its highlights
var schematicCanvas = {
    transform: {
      x: 0,
      y: 0,
      s: 1,
      panx: 0,
      pany: 0,
      zoom: 2, // Start zoomed in for better aesthetics
    },
    pointerStates: {},
    anotherPointerTapped: false,
    layer: "S",
    bg: document.getElementById("schematic-bg"),
    highlight: document.getElementById("schematic-hl"),
    img: new Image()
}

// Audio to give feedback during test mode
var successSound = new Audio("./sounds/win7tada.m4a");
var failureSound = new Audio("./sounds/win7nope.m4a");


// ---- Functions ---- //

function initSchematicCanvas() {
    addMouseHandlers(document.getElementById("schematiccanvas"), schematicCanvas);

    var bg = schematicCanvas.bg;
    var hl = schematicCanvas.highlight;

    var ratio = window.devicePixelRatio || 1;

    // Increase the canvas dimensions by the pixel ratio (display size controlled by CSS)
    bg.width *= ratio;
    bg.height *= ratio;
    hl.width *= ratio;
    hl.height *= ratio;

    schematicCanvas.img.onload = function () {
        drawCanvasImg(schematicCanvas, 0, 0);
    };
    schematicCanvas.img.src = "./images/sch-03-kicad.svg";
}

function drawSchematicHighlights() {
    var style = getComputedStyle(topmostdiv);

    var canvas = schematicCanvas.highlight;
    prepareCanvas(canvas, false, schematicCanvas.transform);
    clearCanvas(canvas);
    var ctx = canvas.getContext("2d");
    if (highlightedModules.length > 0) {
        for (var i in highlightedModules) {
            var boxes = schematicComponents[highlightedModules[i]].boxes;
            for (var j in boxes) {
                var box = boxes[j];
                ctx.beginPath();
                ctx.rect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
                ctx.fillStyle = style.getPropertyValue("--schematic-highlight-fill-color");
                ctx.strokeStyle = style.getPropertyValue("--schematic-highlight-line-color");
                ctx.fill();
                ctx.stroke();
            }
        }
    }
}

function modulesSelected(modules, source) {
    if (modules.length == 0) {
        // We just want to deselect
        socket.emit("modules selected", []);
    } else {
        if (serverSettings.test.includes("board")) {
            // We're selecting a component for the user to find on the board
            socket.emit("test", "set", modules[0]);
        } else if (serverSettings.test.includes("schematic")) {
            // User will be trying to find a component on the schematic/layout
            if (testModule !== null && modules[0] == testModule) {
                if (source === "schematic") {
                    socket.emit("test", "found", modules[0]);
                } else {
                    showHighlightsFlag = true;
                    socket.emit("modules selected", modules);
                }
            }
        } else {
            // Test mode is off, simply selecting
            socket.emit("modules selected", [modules]);
        }
    }
}

function highlightModules(modules, flipFullscreen) {
    highlightedModules = [];
    for (var refId of modules) {
        refId = parseInt(refId);
        // Only highlight modules that are part of the demo set
        if (refId in schematicComponents) {
            highlightedModules.push(refId);
        }
    }

    if (serverSettings.viewmode === "fullscreen" && flipFullscreen && highlightedModules.length > 0) {
        swapFullscreen();
    }

    if (serverSettings.viewmode === "peek-by-inset") {
        peekLayout();
    }

    drawHighlights();
    drawSchematicHighlights();
}

function peekLayout() {
    var layoutDiv = document.getElementById("layout-div");
    if (highlightedModules.length > 0) {
        // We're going to pretend there is only one highlightedModule
        var boxes = schematicComponents[highlightedModules[0]].boxes;
        var targetBox;
        if (boxes.length == 4) {
            // Hardcoded RN2
            targetBox = boxes[3];
        } else {
            targetBox = boxes[0];
        }

        // TODO in actual version, need to adapt to position of box
        var upperRightCorner = canvasToDocumentCoords(targetBox[2], targetBox[1], schematicCanvas);
        layoutDiv.style.left = upperRightCorner.x + "px";
        layoutDiv.style.top = (upperRightCorner.y - 200) + "px";

        layoutDiv.classList.remove("hidden");

        resizeAll();  // this is required to properly initialize transform.s/x/y

        // Zoom and pan to module
        allcanvas.front.transform.zoom = PBI_ZOOM;
        allcanvas.back.transform.zoom = PBI_ZOOM;

        var module = pcbdata.modules[highlightedModules[0]];

        var panx = -(module.bbox.pos[0] * allcanvas.front.transform.s + allcanvas.front.transform.x);
        var pany = -(module.bbox.pos[1] * allcanvas.front.transform.s + allcanvas.front.transform.y);

        panx += 200 / PBI_ZOOM;  // 200 comes from the fixed pixel width of the canvas
        pany += 200 / PBI_ZOOM;  // this is determined by the CSS rule for #layout-div.peek

        allcanvas.front.transform.panx = panx;
        allcanvas.front.transform.pany = pany;
        allcanvas.back.transform.panx = panx;
        allcanvas.back.transform.pany = pany;

        resizeAll();
    } else {
        layoutDiv.classList.add("hidden");
    }
}

function initSwapButton() {
    var swapButton = document.getElementById("swap-icon");
    swapButton.addEventListener("click", swapFullscreen);
}

function swapFullscreen() {
    var schematicDiv = document.getElementById("schematic-div");
    var layoutDiv = document.getElementById("layout-div");

    if (fullscreenShowLayout) {
        schematicDiv.classList.remove("hidden");
        layoutDiv.classList.add("hidden");
    } else {
        schematicDiv.classList.add("hidden");
        layoutDiv.classList.remove("hidden");
    }

    fullscreenShowLayout = !fullscreenShowLayout;

    // Refresh layout
    resizeAll();
}

function setViewmode(mode) {
    if (mode !== serverSettings.viewmode) {
        serverSettings.viewmode = mode;
        socket.emit("settings", serverSettings);
    }
}

function updateViewmode() {
    var fullscreenButton = document.getElementById("btn-fsn");
    var peekByInsetButton = document.getElementById("btn-pbi");
    var sideBySideButton = document.getElementById("btn-sbs");

    // fullscreenButton.classList = "";
    // peekByInsetButton.classList = "";
    // sideBySideButton.classList = "";

    var schematicDiv = document.getElementById("schematic-div");
    var layoutDiv = document.getElementById("layout-div");

    schematicDiv.classList = "";
    layoutDiv.classList = "";

    var swapButton = document.getElementById("swap-icon");
    swapButton.classList = "";

    switch (serverSettings.viewmode) {
        case "fullscreen":
            // fullscreenButton.classList.add("selected");

            schematicDiv.classList.add("fullscreen");
            layoutDiv.classList.add("fullscreen");
            layoutDiv.classList.add("hidden");
            fullscreenShowLayout = false;

            break;
        case "peek-by-inset":
            // peekByInsetButton.classList.add("selected");

            schematicDiv.classList.add("fullscreen");
            layoutDiv.classList.add("peek");
            layoutDiv.classList.add("hidden");

            swapButton.classList.add("hidden");

            break;
        default:  // "side-by-side"
            // sideBySideButton.classList.add("selected");

            schematicDiv.classList.add("split");
            layoutDiv.classList.add("split");

            swapButton.classList.add("hidden");

            break;
    }

    resetAllTransform();
    resizeAll();
    highlightModules(highlightedModules, false);
}


// ---- Page Setup ---- //

socket.on("modules selected", (modules) => {
    highlightModules(modules, true);
});

socket.on("settings", (newSettings) => {
    serverSettings = newSettings;

    updateViewmode();

    if (serverSettings.test === "off") {
        var statusSpan = document.getElementById("teststatus");
        statusSpan.innerHTML = "Off";
        statusSpan.style.color = "";
    }
});

socket.on("test", (type, value) => {
    if (serverSettings.test === "off") {
        // Ignore errant test events
        return;
    }

    var statusSpan = document.getElementById("teststatus");

    switch (type) {
        case "set":
            if (!(value in schematicComponents)) {
                // Somehow we've tried to test an invalid value
                socket.emit("test", "cancel", null);
                return;
            }

            // Treat any "set" like a "modules selected" so everyone can see the selection
            highlightModules([value], false);

            if (serverSettings.test.includes("schematic")) {
                // The user must find a module on the schematic/layout
                testModule = value;

                if (serverSettings.test.includes("off")) {
                    // We don't get to use boardviz, cancel highlight
                    highlightModules([], false);
                }
            }

            statusSpan.innerHTML = "Active";
            statusSpan.style.color = "#007bff"; // highlight blue

            if (serverSettings.test.includes("schematic")) {
                showHighlightsFlag = false;
            }

            break;

        case "miss":
            if (serverSettings.sound == "on") {
                failureSound.play();
            }
            break;

        case "found":
            if (serverSettings.test.includes("schematic")) {
                // The user found the module on the schematic/layout
                // TODO refresh display
                testModule = null;
            }

            statusSpan.innerHTML = "Found";
            statusSpan.style.color = "#00aa00"; // green

            if (serverSettings.sound == "on") {
                successSound.play();
            }

            break;

        case "cancel":
            testModule = null;
            statusSpan.innerHTML = "Canceled";
            statusSpan.style.color = "#d04040"; // red
            break; 
    }
});

function selectModuleByName(name) {
    if (name === null) {
        socket.emit("modules selected", []);
        console.log("Deselecting modules");
        return;
    }
    for (var i in schematicComponents) {
        if (schematicComponents[i].name == name) {
            socket.emit("modules selected", [i]);
            console.log("Module found");
            return;
        }
    }
    console.log("Module not found");
}

function selectModuleById(id) {
    if (id === null) {
        socket.emit("modules selected", []);
        console.log("Deselecting modules");
        return;
    }
    if (id in schematicComponents) {
        socket.emit("modules selected", [id]);
        console.log("Module found");
        return;
    }
    console.log("Module not found");
}

function highlightAll() {
    modules = []
    for (var refId in schematicComponents) {
        modules.push(refId)
    }
    socket.emit("modules selected", modules)
}

function compBbox(comp) {
    var x1 = parseInt(comp.bbox[0]) / 10;
    var x2 = parseInt(comp.bbox[2]) / 10;
    var y1 = parseInt(comp.bbox[1]) / 10;
    var y2 = parseInt(comp.bbox[3]) / 10;
    
    return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
}

function initSchematicData(data) {
    for (let refId in pcbdata.modules) {
        let refName = pcbdata.modules[refId].ref;

        let boxes = [];
        for (let datacomp of data.components) {
            if (datacomp.ref == refName) {
                boxes.push(compBbox(datacomp));
            }
        }
        if (refId in schematicComponents) {
            schematicComponents[refId].boxes = boxes;
        }
    }
}

window.onload = () => {
    // Get schematic component data
    fetch("http://" + window.location.host + "/schematicdata")
        .then((res) => res.json())
        .then((data) => {
            
            // Wait for rest of init until we've gotten back the schematic data
            initUtils();

            initSchematicData(data);

            initLayoutCanvas();

            initSchematicCanvas();

            initSwapButton();

            // Initiates actual render
            updateViewmode();
        })
        .catch((e) => console.log(e));
}
window.onresize = resizeAll;