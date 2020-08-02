// Primary js file for mobile.html, the mobile interface
// Contains rendering and interaction functions for the board
// and sets up the socket connection and page content


// ---- Variables ---- //

const BLINK_INTERVAL_MS = 500;
const BLINK_TOTAL_MS = 3000;

// Determines which highlight mode is used on the board
// 1 = box, 2 = circle, 3 = crosshair, 4 = layout display
var boardHighlightMode = 1;

// Determines which annotation style is used on the board
// Two words: "on"/"off" the board, and "min/max" information
var annotationMode = "off min";

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

// See main.js for details -- TODO move to render.js
var highlightedModules = [];

// True if a new module has just been selected, so we don't multi-blink
var currentlyBlinking = false;

// True if blinking on, false if blinking off
var blinkStateOn = true;

// ---- Functions ---- //

function boardModulesSelected(modules, mode) {
    highlightedModules = [];
    for (var mod of modules) {
        highlightedModules.push(parseInt(mod));
    }

    var layoutDiv = document.getElementById("layout-div");
    if (mode == 4 && highlightedModules.length > 0) {
        layoutDiv.classList.remove("hidden");
        showLayout(highlightedModules[0]);
    } else {
        layoutDiv.classList.add("hidden");
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
                case 1:
                    // Just highlight the bounding box
                    if (blinkStateOn) {
                        drawBoardHighlight(box, ctx, "box");
                    }
                    break;
                case 2:
                    // drawBoardHighlight(box, ctx, "box");
                    if (blinkStateOn) {
                        drawBoardHighlight(box, ctx, "circle");
                    }
                    break;
                case 3:
                    drawBoardHighlight(box, ctx, "box");
                    drawBoardHighlight(box, ctx, "crosshair");
                    break;
                case 4:
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
    var rn2Anno = document.getElementById("anno-rn2");

    // Hide sample annotation
    rn2Anno.classList.add("hidden");

    for (var refId of highlightedModules) {
        if (refId == 72) {
            // Show sample annotation
            rn2Anno.classList.remove("hidden");
            switch (annotationMode) {
                case "on min":
                    console.log("annotation on min");
                    // break;
                case "on max":
                    console.log("annotation on max");
                    var boardBox = schematicComponents[refId].boardBox;
                    console.log(boardBox);
                    var upperRightCorner = canvasToDocumentCoords(boardBox[2], boardBox[1], boardCanvas);
                    rn2Anno.style.left = upperRightCorner.x + "px";
                    rn2Anno.style.top = (upperRightCorner.y - 30) + "px";
                    rn2Anno.style.right = "auto";
                    break;
                case "off min":
                    console.log("annotation off min");
                    // break;
                case "off max":
                    console.log("annotation off max");
                    rn2Anno.style.left = "";
                    rn2Anno.style.bottom = "";
                    rn2Anno.style.top = "";
                    rn2Anno.style.right = "";
                    break;
            }
        }
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

    hl.addEventListener("click", (e) => {
        var coords = getMousePos(boardCanvas, e);

        console.log(`canvas:  (${coords.x.toFixed(2)},${coords.y.toFixed(2)})`);

        var clickHitNothing = true;

        for (var refId in schematicComponents) {
            if (isClickInBoxes(coords, [schematicComponents[refId].boardHitbox])) {
                socket.emit("modules selected", [refId]);
                clickHitNothing = false;
            }
        }

        if (clickHitNothing) {
            socket.emit("modules selected", []);
        }
    })
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
socket.on("modules selected", (modules) => {
    boardModulesSelected(modules, boardHighlightMode);
});
socket.on("setting highlight", (mode) => {
    boardHighlightMode = mode;
    boardModulesSelected(highlightedModules, boardHighlightMode);
});
socket.on("setting annotation", (mode) => {
    annotationMode = mode;
    showAnnotations();
});
