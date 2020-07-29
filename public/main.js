// Primary js file for main.html, the computer interface
// Contains rendering and interaction functions for schematic
// and sets up the socket connection and page content


// ---- Variables ---- //

// Keeps track of the currently highlighted modules for use by
// drawHighlights() and drawSchematicHighlights() in render.js
var highlightedModules = [];

// Dictionary from refId to its highlight function
// This exists to support grouped components
// Currently unused
var moduleIndexToHandler = {};

// checked by some functions in render.js, so we initialize it here
var highlightedNet = null;

// Tracks which view mode is currently in use
var viewMode;

// Tracks which screen is currently being displayed in fullscreen mode
var fullscreenShowLayout = false;

// Socket for communicating with server and mobile page
var socket = io();


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
        drawCanvasImg(schematicCanvas);
    };
    schematicCanvas.img.src = "./images/sch-01.svg";
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

function modulesSelected(modules) {
    socket.emit("modules selected", modules);
}

function highlightModules(modules) {
    highlightedModules = [];
    for (var refId of modules) {
        refId = parseInt(refId);
        // Only highlight modules that are part of the demo set
        if (refId in schematicComponents) {
            highlightedModules.push(refId);
        }
    }

    if (viewMode === "peek-by-inset") {
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
    swapButton.addEventListener("click", () => {
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
    });
}

function setViewMode(mode) {
    var fullscreenButton = document.getElementById("btn-fsn");
    var peekByInsetButton = document.getElementById("btn-pbi");
    var sideBySideButton = document.getElementById("btn-sbs");

    fullscreenButton.classList = "";
    peekByInsetButton.classList = "";
    sideBySideButton.classList = "";

    var schematicDiv = document.getElementById("schematic-div");
    var layoutDiv = document.getElementById("layout-div");

    schematicDiv.classList = "";
    layoutDiv.classList = "";

    var swapButton = document.getElementById("swap-icon");
    swapButton.classList = "";

    switch (mode) {
        case "fullscreen":
            viewMode = "fullscreen";

            fullscreenButton.classList.add("selected");

            schematicDiv.classList.add("fullscreen");
            layoutDiv.classList.add("fullscreen");
            layoutDiv.classList.add("hidden");
            fullscreenShowLayout = false;

            break;
        case "peek-by-inset":
            viewMode = "peek-by-inset";

            peekByInsetButton.classList.add("selected");

            schematicDiv.classList.add("fullscreen");
            layoutDiv.classList.add("peek");
            layoutDiv.classList.add("hidden");

            swapButton.classList.add("hidden");

            break;
        default:  // "side-by-side"
            viewMode = "side-by-side";

            sideBySideButton.classList.add("selected");

            schematicDiv.classList.add("split");
            layoutDiv.classList.add("split");

            swapButton.classList.add("hidden");

            break;
    }

    resetAllTransform();
    resizeAll();
    highlightModules(highlightedModules);
}


// ---- Page Setup ---- //

socket.on("modules selected", (modules) => {
    highlightModules(modules);
});
socket.on("setting viewmode", (mode) => {
    setViewMode(mode);
})

window.onload = () => {
    initUtils();

    initLayoutCanvas();

    initSchematicCanvas();

    initSwapButton();

    // Initiates actual render
    setViewMode("side-by-side");
}
window.onresize = resizeAll;