// JS for mobile page (board simulator)
// Mostly drawn from IBOM's render.js

// ------ Constants ------- //

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
        zoom: 2
    },
    pointerStates: {},
    anotherPointerTapped: false,
    layer: "D",
    bg: document.getElementById("board-bg"),
    highlight: document.getElementById("board-hl"),
    img: new Image()
};

var highlightedModules = [];

// ------------------------ //

// ------ Functions  ------ //

function drawBoardHighlights(modules) {
    var layoutDiv = document.getElementById("layout-div");
    layoutDiv.classList.add("hidden");

    highlightedModules = [];

    var canvas = boardCanvas.highlight;
    prepareCanvas(canvas, false, boardCanvas.transform);
    clearCanvas(canvas);
    var ctx = canvas.getContext("2d");
    if (modules.length > 0) {
        for (var i in modules) {
            highlightedModules.push(parseInt(modules[i]));

            var box = schematicComponents[modules[i]].boardBox;
            switch (boardHighlightMode) {
                case 1:
                    // Just highlight the bounding box
                    drawBoardHighlight(box, ctx, "box");
                    break;
                case 2:
                    drawBoardHighlight(box, ctx, "box");
                    drawBoardHighlight(box, ctx, "circle");
                    break;
                case 3:
                    drawBoardHighlight(box, ctx, "box");
                    drawBoardHighlight(box, ctx, "crosshair");
                    break;
                case 4:
                    drawBoardHighlight(box, ctx, "box");
                    layoutDiv.classList.remove("hidden");
                    showLayout(modules[i]);
                    break;
            }
        }
    }

    showAnnotations();
}

function drawBoardHighlight(box, ctx, type) {
    switch (type) {
        case "box":
            ctx.beginPath();
            ctx.rect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
            ctx.fillStyle = HIGHLIGHT_FILL;
            ctx.strokeStyle = HIGHLIGHT_STROKE;
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            break;
        case "circle":
            var center = { x: (box[0] + box[2]) / 2, y: (box[1] + box[3]) / 2 };
            ctx.beginPath();
            ctx.arc(center.x, center.y, HL_CIRCLE_RADIUS, 0, 2 * Math.PI);
            ctx.strokeStyle = HIGHLIGHT_STROKE;
            ctx.lineWidth = 2;
            ctx.stroke();
            break;
        case "crosshair":
            // Divided by two because the canvas is currently twice as wide as the board img
            // TODO figure out how that should be displayed
            var width = boardCanvas.highlight.width / 2;
            var height = boardCanvas.highlight.height / 2;
            var boxW = box[2] - box[0];
            var boxH = box[3] - box[1];

            ctx.fillStyle = HIGHLIGHT_FILL;

            ctx.fillRect(box[0], 0, boxW, box[1]);
            ctx.fillRect(0, box[1], box[0], boxH);
            ctx.fillRect(box[0], box[3], boxW, height - box[3]);
            ctx.fillRect(box[2], box[1], width - box[2], boxH);

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
    bg.width *= ratio;
    bg.height *= ratio;
    hl.width *= ratio;
    hl.height *= ratio;

    boardCanvas.img.onload = function () {
        drawCanvasImg(boardCanvas, 0, 0);
    };
    boardCanvas.img.src = "./arduinouno.jpg";

    hl.addEventListener("click", (e) => {
        var coords = getMousePos(boardCanvas, e);

        console.log(`canvas:  (${coords.x},${coords.y})`);
        console.log(`client:  (${e.clientX},${e.clientY})`);
        var cc = canvasToDocumentCoords(coords.x, coords.y, boardCanvas);
        console.log(`convert: (${cc.x},${cc.y})`)

        var clickHitNothing = true;

        for (var refId in schematicComponents) {
            if (isClickInBoxes(coords, [schematicComponents[refId].boardBox])) {
                socket.emit("modules selected", [refId]);
                clickHitNothing = false;
            }
        }

        if (clickHitNothing) {
            socket.emit("modules selected", []);
        }
    })
}

// ------------------------ //


window.onload = () => {
    // Click listeners
    // initRender();

    initBoardCanvas();

    // Trigger layout render
    allcanvas.front.transform.zoom = PBI_ZOOM;
    resizeAll();
}


var socket = io();
socket.on("modules selected", (modules) => {
    drawBoardHighlights(modules);
    highlightedModules = modules;
});
socket.on("setting highlight", (mode) => {
    boardHighlightMode = mode;
    drawBoardHighlights(highlightedModules);
});
socket.on("setting annotation", (mode) => {
    annotationMode = mode;
    showAnnotations();
});
