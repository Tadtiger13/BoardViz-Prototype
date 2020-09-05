// Primary js file for mobile.html, the mobile interface
// Contains rendering and interaction functions for the board
// and sets up the socket connection and page content


// ---- Variables ---- //

// Determines whether we log the time of selections, etc
var testMode = "off";

// The module to be found
// Note that this value MUST be null unless we are actively testing "board"
var testModule = null;

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

var hardcodedHitboxes = {
    0: {
        ref: "ZU4",
        box: [336.02,318.95,552.64,380.84]
    },
    140: {
        ref: "F1",
        box: [179.29,269.03,202.25,306.97]
    },
    157: {
        ref: "T1",
        box: [206.24,279.01,224.21,298.98]
    },
    433: {
        ref: "RESET1.3",
        box: [173.80,161.22, 186.78,171.20]
    }
}

// ---- Functions ---- //

// Handles modules being selected for the board
// Note that we pass in a highlight mode, instead of just reading it live from serverSettings,
// because we don't want it to change mid-blink
function boardModulesSelected(modules, mode) {
    highlightedModules = [];
    for (var refId of modules) {
        refId = parseInt(refId);
        highlightedModules.push(refId);
    }

    var annoDiv = document.getElementById("anno");
    var layoutDiv = document.getElementById("layout-div");
    annoDiv.classList.add("hidden");
    layoutDiv.classList.add("hidden");

    // Rest of code now obsolete
    drawBoardHighlights(highlightedModules, mode);
    return;

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
                    if (mode == "layout") {
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

    // To support video production, we're adding a green box around the components we're using in the demo
    // We're clicking on ZU4 (id=0), F1 (id=140), and T1 (id=157)
    // All other features of the mobile page are disabled
    for (let moduleId in hardcodedHitboxes) {
        var box = hardcodedHitboxes[moduleId].box;
        ctx.strokeStyle = "#0f0";
        ctx.lineWidth = 1;
        let padding = 0;
        ctx.strokeRect(box[0] - padding, box[1] - padding, box[2] - box[0] + 2 * padding, box[3] - box[1] + 2 * padding);
    }

    // Check if we've highlighted any of the hardcoded components to give feedback on click
    for (let moduleId of modules) {
        if (moduleId in hardcodedHitboxes) {
            drawBoardHighlight(hardcodedHitboxes[moduleId].box, ctx, "box");
        }
    }

    // Rest of code is obsolete
    return;


    if (modules.length > 0) {
        for (var mod of modules) {
            // Because we now use moduleId instead of the old pcbId, we need to convert to pcbid,
            // and then get the hitbox info from the old schematicComponents hardcoded info
            // Note: currently broken
            var pcbId = moduleArray[mod];
            if (!pcbId ||!(pcbId in schematicComponents)) {
                continue;
            }
            var box = schematicComponents[pcbId].boardBox;

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

    // Size and position the div
    var layoutDiv = document.getElementById("layout-div");
    // layoutDiv.style.top = (boardCanvas.bg.getBoundingClientRect().top) + "px";
    layoutDiv.style.top = 0;
    // layoutDiv.style.right = (window.innerWidth - boardCanvas.bg.getBoundingClientRect().right) + "px";
    layoutDiv.style.right = 0;

    // The layout box should never be more than a third of the mobile screen
    var sideLength = Math.min(200, window.innerWidth / 3, window.innerHeight / 3);
    layoutDiv.style.width = sideLength + "px";
    layoutDiv.style.height = sideLength + "px";

    // Zoom and pan to module
    allcanvas.front.transform.zoom = PBI_ZOOM;
    allcanvas.back.transform.zoom = PBI_ZOOM;

    var module = pcbdata.modules[refId];

    var panx = -(module.bbox.pos[0] * allcanvas.front.transform.s + allcanvas.front.transform.x);
    var pany = -(module.bbox.pos[1] * allcanvas.front.transform.s + allcanvas.front.transform.y);

    panx += sideLength / PBI_ZOOM;
    pany += sideLength / PBI_ZOOM;

    allcanvas.front.transform.panx = panx;
    allcanvas.front.transform.pany = pany;
    allcanvas.back.transform.panx = panx;
    allcanvas.back.transform.pany = pany;

    drawHighlights();
    resizeAll();
}

function showAnnotations() {
    var annoDiv = document.getElementById("anno");

    if (serverSettings.annotation !== "none" && highlightedModules.length > 0) {
        // If multiple modules are ever going to be used, it will be for pins and not multi-selection,
        // so it's ok to just show annotations for the first module
        var refId = highlightedModules[0];

        if (serverSettings.annotation.includes("on")) {
            // display on board
            var boardBox = schematicComponents[refId].boardBox;
            var upperRightCorner = canvasToDocumentCoords(boardBox[2], boardBox[1], boardCanvas);
            annoDiv.style.left = upperRightCorner.x + "px";
            annoDiv.style.top = (upperRightCorner.y - 30) + "px";
            annoDiv.style.right = "auto";
        } else {
            // display off board
            annoDiv.style.left = "";
            // annoDiv.style.bottom = (window.innerHeight - boardCanvas.bg.getBoundingClientRect().bottom) + "px";
            annoDiv.style.bottom = 0;
            annoDiv.style.top = "";
            // annoDiv.style.right = (window.innerWidth - boardCanvas.bg.getBoundingClientRect().right) + "px";
            annoDiv.style.right = 0;
        }

        if (schematicComponents[refId].annotation.length > 0) {
            // Only display the annotation if it actually exists

            if (serverSettings.annotation.includes("max")) {
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
        }
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

    // Again, we're now in video mode
    // The only thing to check is if we're in the hardcoded boxes
    for (let moduleId in hardcodedHitboxes) {
        if (isClickInBoxes(coords, [hardcodedHitboxes[moduleId].box])) {
            socket.emit("highlight", [moduleId]);
            return;
        }
    }

    // If we hit none of those, a click counts as a deselect
    socket.emit("highlight", []);

    // Rest of the code is now obsolete
    return;

    var clickHitNothing = true;

    if (serverSettings.test.includes("board") && testModule !== null) {
        // User is trying to find a component on the board
        // Check if the user clicked inside the padded hitbox
        var hitbox = schematicComponents[testModule].boardHitbox;
        hitbox[0] -= TEST_HITBOX_PADDING;
        hitbox[1] -= TEST_HITBOX_PADDING;
        hitbox[2] += TEST_HITBOX_PADDING;
        hitbox[3] += TEST_HITBOX_PADDING;
        if (isClickInBoxes(coords, hitbox)) {
            // We're in the padded hitbox, so exit early (don't evaluate other modules being clicked)
            socket.emit("test", "found", refId);
            return;
        }
    }

    for (var refId in schematicComponents) {
        if (isClickInBoxes(coords, [schematicComponents[refId].boardHitbox])) {
            clickHitNothing = false;
            
            if (serverSettings.test.includes("board")) {
                // User will be trying to find a component on the board
                if (testModule !== null) {
                    if (refId == testModule) {
                        socket.emit("test", "found", refId);
                    } else {
                        socket.emit("test", "miss", refId);
                    }
                }
            } else if (serverSettings.test.includes("schematic")) {
                // We're selecting a component for the user to find on the schematic
                socket.emit("test", "set", refId);
            } else {
                // Test mode is off, simply selecting
                socket.emit("highlight", [refId]);
            }

            // If we've clicked something on the board, we should exit immediately
            // to avoid sending duplicate events
            return;
        }
    }

    if (clickHitNothing) {
        if (testModule !== null) {
            // If we're in the middle of a test, log that we clicked nothing
            socket.emit("test", "miss", null);
        } else {
            // Otherwise, deselect the current module
            socket.emit("highlight", []);
        }
    }
}


// ---- Page Setup ---- //

window.onload = () => {
    // Click listeners for layout canvas
    // initLayoutClickHandlers();

    initBoardCanvas();

    allcanvas.front.transform.zoom = PBI_ZOOM;
    // Trigger layout render
    resizeAll();
}

window.onresize = () => {
    showAnnotations();
    if (highlightedModules.length > 0) {
        showLayout(highlightedModules[0]);
    }
}


var socket = io();

socket.on("highlight", (modules) => {
    boardModulesSelected(modules, serverSettings.highlight);
});

socket.on("settings", (newSettings) => {
    serverSettings = newSettings;

    boardModulesSelected(highlightedModules, serverSettings.highlight);
    // showAnnotations();
});

socket.on("test", (type, value) => {
    if (serverSettings.test === "off") {
        // Ignore errant test events
        return;
    }

    switch (type) {
        case "set":
            if (!(value in schematicComponents)) {
                // Somehow we've tried to test an invalid value
                socket.emit("test", "cancel", null);
                return;
            }

            // Treat any "set" like a "highlight" so everyone can see the selection
            boardModulesSelected([value], serverSettings.highlight);

            if (serverSettings.test.includes("board")) {
                // The user must find a module on the board
                testModule = value;

                if (serverSettings.test.includes("off")) {
                    // We don't get to use boardviz, cancel the highlight
                    boardModulesSelected([], serverSettings.highlight);
                }
            }
            break;

        case "found":
            if (serverSettings.test.includes("board")) {
                // The user found the module on the board
                testModule = null;
            }
            break;

        case "cancel":
            testModule = null;
            break; 
    }
});
