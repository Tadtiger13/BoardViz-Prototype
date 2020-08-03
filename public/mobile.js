// Primary js file for mobile.html, the mobile interface
// Contains rendering and interaction functions for the board
// and sets up the socket connection and page content


// ---- Variables ---- //

const BLINK_INTERVAL_MS = 500;
const BLINK_TOTAL_MS = 3000;

// TODO move all settings to one variable
// See main.js for details -- TODO move to render.js
var highlightedModules = [];

// Determines which highlight mode is used on the board
// "box", "circle", "crosshair", "layout"
var boardHighlightMode = "box";

// Determines which annotation style is used on the board
// Two words: "on"/"off" the board, and "min/max" information
var annotationMode = "off min";

// Determines whether we log the time of selections, etc
var testMode = "off";

// True if we're in find-on-board mode and a component has been selected (but not yet found)
var currentlyTesting = false;

// A layerdict that holds image and transform information for the canvas
var boardCanvas = {
    transform: {
        x: 0,
        y: 0,
        s: 1,
        panx: 0,
        pany: 0,
        zoom: 1
    },
    pointerStates: {},
    anotherPointerTapped: false,
    layer: "D",
    bg: document.getElementById("board-bg"),
    highlight: document.getElementById("board-hl"),
    img: new Image()
};

// True if a new module has just been selected, so we don't multi-blink
var currentlyBlinking = false;

// True if blinking on, false if blinking off
var blinkStateOn = true;

// ---- Functions ---- //

function boardModulesSelected(modules, mode, settingTest) {
    highlightedModules = [];
    for (var refId of modules) {
        refId = parseInt(refId);
        // Only highlight modules that are part of the demo set
        if (refId in schematicComponents) {
            highlightedModules.push(refId);
        }
    }

    var annoDiv = document.getElementById("anno");
    var layoutDiv = document.getElementById("layout-div");
    annoDiv.classList.add("hidden");
    layoutDiv.classList.add("hidden");

    if (testMode === "find-on-board" && settingTest) {
        // We're starting a test, even if another one is currently in progress
        // (we allow highlightedModules to be updated)
        console.log("Test: Find " + schematicComponents[highlightedModules[0]].name + " on board");
        currentlyTesting = true;
    }
    if (currentlyTesting) {
        // If we're in the middle of a test, we don't want to render anything
        return;
    }

    if (mode == "layout" && highlightedModules.length > 0) {
        layoutDiv.classList.remove("hidden");
        showLayout(highlightedModules[0]);
    }

    if (!currentlyBlinking) {
        blinkStateOn = true;
        drawBoardHighlights(highlightedModules, mode);

        if (highlightedModules.length > 0) {
            currentlyBlinking = true;
            var counter = 0;
            var intervalCode = setInterval(() => {
                blinkStateOn = !blinkStateOn;
                if (counter * BLINK_INTERVAL_MS > BLINK_TOTAL_MS) {
                    clearInterval(intervalCode);
                    currentlyBlinking = false;
                    if (mode == 4) {
                        blinkStateOn = false;
                    } else {
                        blinkStateOn = true;
                    }
                }
                drawBoardHighlights(highlightedModules, mode);
                counter++;
            }, BLINK_INTERVAL_MS);
        }
    }

    showAnnotations();
}

function drawBoardHighlights(modules, mode) {
    var canvas = boardCanvas.highlight;
    prepareCanvas(canvas, false, boardCanvas.transform);
    clearCanvas(canvas);
    var ctx = canvas.getContext("2d");
    if (modules.length > 0) {
        for (var mod of modules) {
            var box = schematicComponents[mod].boardBox;
            switch (mode) {
                case "box":
                    // Just highlight the bounding box
                    if (blinkStateOn) {
                        drawBoardHighlight(box, ctx, "box");
                    }
                    break;
                case "circle":
                    // drawBoardHighlight(box, ctx, "box");
                    if (blinkStateOn) {
                        drawBoardHighlight(box, ctx, "circle");
                    }
                    break;
                case "crosshair":
                    drawBoardHighlight(box, ctx, "box");
                    drawBoardHighlight(box, ctx, "crosshair");
                    break;
                case "layout":
                    if (blinkStateOn) {
                        drawBoardHighlight(box, ctx, "box");
                    }
                    break;
            }
        }
    }
}

function drawBoardHighlight(box, ctx, type) {
    var style = getComputedStyle(topmostdiv);

    ctx.fillStyle = style.getPropertyValue("--board-highlight-fill-color");
    ctx.strokeStyle = style.getPropertyValue("--board-highlight-line-color");
    ctx.lineWidth = style.getPropertyValue("--board-highlight-line-width");

    switch (type) {
        case "box":
            ctx.beginPath();
            ctx.rect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
            ctx.fill();
            ctx.stroke();
            break;
        case "circle":
            var center = { x: (box[0] + box[2]) / 2, y: (box[1] + box[3]) / 2 };
            ctx.beginPath();
            ctx.arc(center.x, center.y, style.getPropertyValue("--board-highlight-circle-radius"), 0, 2 * Math.PI);
            ctx.stroke();
            break;
        case "crosshair":
            var width = boardCanvas.highlight.width;
            var height = boardCanvas.highlight.height;

            var midX = (box[0] + box[2]) / 2;
            var midY = (box[1] + box[3]) / 2;

            ctx.beginPath();

            ctx.moveTo(midX, 0);
            ctx.lineTo(midX, box[1]);
            ctx.moveTo(midX, box[3]);
            ctx.lineTo(midX, height);

            ctx.moveTo(0, midY);
            ctx.lineTo(box[0], midY);
            ctx.moveTo(box[2], midY);
            ctx.lineTo(width, midY);

            ctx.stroke();

            break;
    }
}

function showLayout(refId) {
    resizeAll();  // this is required to properly initialize transform.s/x/y

    // Zoom and pan to module
    allcanvas.front.transform.zoom = PBI_ZOOM;
    allcanvas.back.transform.zoom = PBI_ZOOM;

    var module = pcbdata.modules[refId];

    var panx = -(module.bbox.pos[0] * allcanvas.front.transform.s + allcanvas.front.transform.x);
    var pany = -(module.bbox.pos[1] * allcanvas.front.transform.s + allcanvas.front.transform.y);

    panx += 200 / PBI_ZOOM;  // 200 comes from the fixed pixel width of the canvas
    pany += 200 / PBI_ZOOM;  // this is determined by the CSS rule for #layout-div.peek

    allcanvas.front.transform.panx = panx;
    allcanvas.front.transform.pany = pany;
    allcanvas.back.transform.panx = panx;
    allcanvas.back.transform.pany = pany;

    drawHighlights();
    resizeAll();
}

function showAnnotations() {
    var annoDiv = document.getElementById("anno");

    if (highlightedModules.length > 0) {
        // If multiple modules are ever going to be used, it will be for pins and not multi-selection,
        // so it's ok to just show annotations for the first module
        var refId = highlightedModules[0];

        if (annotationMode.includes("on")) {
            // display on board
            var boardBox = schematicComponents[refId].boardBox;
            console.log(boardBox);
            var upperRightCorner = canvasToDocumentCoords(boardBox[2], boardBox[1], boardCanvas);
            annoDiv.style.left = upperRightCorner.x + "px";
            annoDiv.style.top = (upperRightCorner.y - 30) + "px";
            annoDiv.style.right = "auto";
        } else {
            // display off board
            annoDiv.style.left = "";
            annoDiv.style.bottom = "";
            annoDiv.style.top = "";
            annoDiv.style.right = "";
        }

        if (annotationMode.includes("max")) {
            // show full annotation
            var annotationList = schematicComponents[refId].annotation;
            var annotationText = annotationList[0];
            for (var i = 1; i < annotationList.length; i++) {
                annotationText += "<br />" + annotationList[i];
            }
            annoDiv.innerHTML = annotationText;
        } else {
            // show short annotation
            annoDiv.innerHTML = schematicComponents[refId].annotation[0];
        }

        // Show annotation div
        annoDiv.classList.remove("hidden");
    } else {
        // Hide annotation div
        annoDiv.classList.add("hidden");
    }
}

function initBoardCanvas() {
    var bg = boardCanvas.bg;
    var hl = boardCanvas.highlight;

    var ratio = window.devicePixelRatio || 1;

    // Increase the canvas dimensions by the pixel ratio (display size controlled by CSS)
    // TODO maybe cancel this part
    // bg.width *= ratio;
    // bg.height *= ratio;
    // hl.width *= ratio;
    // hl.height *= ratio;

    boardCanvas.img.onload = function () {
        drawCanvasImg(boardCanvas, 100, 100, "#f4f4f4");
    };
    boardCanvas.img.src = "./images/arduinouno.jpg";

    hl.addEventListener("click", boardClickListener);
}

function boardClickListener(e) {
    var coords = getMousePos(boardCanvas, e);

    console.log(`canvas:  (${coords.x.toFixed(2)},${coords.y.toFixed(2)})`);

    var clickHitNothing = true;

    for (var refId in schematicComponents) {
        if (isClickInBoxes(coords, [schematicComponents[refId].boardHitbox])) {
            if (testMode === "find-on-board") {
                if (currentlyTesting) {
                    if (refId == highlightedModules[0]) {
                        console.log("Found it");
                        // We've found the right component
                        socket.emit("modules selected", [refId], "test found");
                        currentlyTesting = false;

                        // avoid deselecting everything
                        clickHitNothing = false;
                    } else {
                        // Clicked the wrong thing
                        socket.emit("test click miss", refId);

                        // Avoid double-logging
                        clickHitNothing = false;
                    }
                }
            } else if (testMode === "find-on-schematic") {
                socket.emit("modules selected", [refId], "test set");
                clickHitNothing = false;
            } else {
                socket.emit("modules selected", [refId]);
                clickHitNothing = false;
            }
        }
    }

    if (clickHitNothing) {
        if (currentlyTesting) {
            // If we're in the middle of a test, log that we clicked nothing instead of deselecting
            socket.emit("test click miss", null);
        } else {
            // Otherwise, deselect the current module
            socket.emit("modules selected", []);
        }
    }
}


// ---- Page Setup ---- //

window.onload = () => {
    // Click listeners for layout canvas
    // initLayoutCanvas();

    initBoardCanvas();

    allcanvas.front.transform.zoom = PBI_ZOOM;
    // Trigger layout render
    resizeAll();
}


var socket = io();
socket.on("modules selected", (modules, msg) => {
    boardModulesSelected(modules, boardHighlightMode, msg === "test set");
});
socket.on("setting highlight", (mode) => {
    boardHighlightMode = mode;
    boardModulesSelected(highlightedModules, boardHighlightMode);
});
socket.on("setting annotation", (mode) => {
    annotationMode = mode;
    showAnnotations();
});
socket.on("setting test", (mode) => {
    testMode = mode;
    if (mode === "off") {
        // Off serves as cancel
        currentlyTesting = false;
    }
});
