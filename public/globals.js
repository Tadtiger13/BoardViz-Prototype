// Global functions and constants used by render.js, main.js, and mobile.js

// ------ Constants  ------ //

const HIGHLIGHT_STROKE = "rgb(208, 64, 64)";
const HIGHLIGHT_FILL = "rgba(208, 64, 64, 0.25)";
const CROSSHAIR_FILL = "rgba(208, 64, 64, 0.5)";

const HL_CIRCLE_RADIUS = 20;

const PBI_ZOOM = 4;

// Prototype elements (hardcoded)
// Z1, RN2, C7, C8, C6, D3
// TODO improve accuracy/aesthetic of boxes
const schematicComponents = {
    59: {
        name: "C6",
        boxes: [[570,423,601,438]],
        boardBox: [224,154,242,162]
    },
    66: {
        name: "Z1",
        boxes: [[84,393,105,417]],
        boardBox: [131,105,154,117]
    },
    72: {
        name: "RN2",
        boxes: [[524, 57,551, 86],
                [534,486,566,506],
                [534,452,566,474],
                [482,387,500,416]],
        boardBox: [225,100,240,122]
    },
    75: {
        name: "C8",
        boxes: [[154,460,184,490]],
        boardBox: [134, 92,150,100]
    },
    78: {
        name: "C7",
        boxes: [[122,448,154,470]],
        boardBox: [215,246,223,264]
    },
    89: {
        name: "D3",
        boxes: [[250,280,270,298]],
        boardBox: [139,55,150,85]
    }
}

// ------------------------ //


// ------ Functions  ------ //
// WARNING: OVERWRITTEN BY ibom/render.js IF INCLUDED BEFORE

// Gets mouse pos in canvas coords for schematic and board canvas
function getMousePos(layerdict, evt) {
    var canvas = layerdict.bg;
    var transform = layerdict.transform;
    var zoomFactor = 1 / transform.zoom;
  
    var rect = canvas.getBoundingClientRect();  // abs. size of element
    var scaleX = canvas.width  / rect.width  * zoomFactor;  // relationship bitmap vs. element for X
    var scaleY = canvas.height / rect.height * zoomFactor;  // relationship bitmap vs. element for Y
  
    var x = (evt.clientX - rect.left) * scaleX - transform.panx;
    var y = (evt.clientY - rect.top)  * scaleY - transform.pany;
  
    return { x: x, y: y };
}

function drawCanvasImg(layerdict, x = 0, y = 0) {
    var canvas = layerdict.bg;
    prepareCanvas(canvas, false, layerdict.transform);
    clearCanvas(canvas);
    canvas.getContext("2d").drawImage(layerdict.img, x, y);
}

function prepareCanvas(canvas, flip, transform) {
    var ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(transform.zoom, transform.zoom);
    ctx.translate(transform.panx, transform.pany);
    if (flip) {
        ctx.scale(-1, 1);
      }
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.s, transform.s);
}

function clearCanvas(canvas, color = null) {
    var ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
}

function canvasToDocumentCoords(x, y, layerdict) {
    var canvas = layerdict.highlight;
    var transform = layerdict.transform;
    var zoomFactor = 1 / transform.zoom;
  
    var rect = canvas.getBoundingClientRect();  // abs. size of element
    var scaleX = canvas.width  / rect.width  * zoomFactor;  // relationship bitmap vs. element for X
    var scaleY = canvas.height / rect.height * zoomFactor;  // relationship bitmap vs. element for Y

    var docX = (x + transform.panx) / scaleX + rect.left;
    var docY = (y + transform.pany) / scaleY + rect.top;

    return { x: docX, y: docY };
}
