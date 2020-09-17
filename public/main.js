// Primary js file for main.html, the computer interface
// Contains rendering and interaction functions for schematic
// and sets up the socket connection and page content


// ---- Variables ---- //

// Determines whether we log the time of selections, etc
var testMode;

// TODO comment this
var testModule = null;

// Tracks which screen is currently being displayed in fullscreen mode
var fullscreenShowLayout = false;

// checked by some functions in render.js, so we initialize it here
var highlightedNet = null;

// Socket for communicating with server and mobile page
var socket = io();


var rightclickcomp = null;

// Populate only if we're on the main page (it will be ignored otherwise)
schematicCanvas = {
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
    if (moduleArray.length == 0) {
        // Haven't finished loading schematic data yet
        return;
    }
    var style = getComputedStyle(topmostdiv);

    var canvas = schematicCanvas.highlight;
    prepareCanvas(canvas, false, schematicCanvas.transform);
    clearCanvas(canvas);
    var ctx = canvas.getContext("2d");
    if (highlightedModules.length > 0) {
        for (var moduleId of highlightedModules) {
            var boxes = moduleArray[moduleId].schematicBboxes;
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
        socket.emit("highlight", []);
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
                    socket.emit("highlight", modules);
                }
            }
        } else {
            // Test mode is off, simply selecting
            socket.emit("highlight", modules);
        }
    }
}

function highlightModules(modules, flipFullscreen) {
    highlightedModules = [];
    for (var refId of modules) {
        refId = parseInt(refId);
        // No longer only highlight modules that are part of the demo set
        // if (refId in schematicComponents) {
        highlightedModules.push(refId);
        // }
    }

    if (serverSettings.viewmode === "fullscreen" && flipFullscreen && highlightedModules.length > 0) {
        swapFullscreen();
    }

    if (serverSettings.viewmode === "peek-by-inset") {
        peekLayout();
    }

    drawHighlights();
    drawSchematicHighlights();

    var multiclickmenu = document.getElementById("multi-click-menu");
    if (multiclickmenu) {
        multiclickmenu.classList.add("hidden");
    }
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
    var schematicDiv = document.getElementById("schematic-div");
    var layoutDiv = document.getElementById("layout-div");

    schematicDiv.classList = "";
    layoutDiv.classList = "";

    var swapButton = document.getElementById("swap-icon");
    swapButton.classList = "";

    switch (serverSettings.viewmode) {
        case "fullscreen":
            schematicDiv.classList.add("fullscreen");
            layoutDiv.classList.add("fullscreen");
            layoutDiv.classList.add("hidden");
            fullscreenShowLayout = false;
            break;
        case "peek-by-inset":
            schematicDiv.classList.add("fullscreen");
            layoutDiv.classList.add("peek");
            layoutDiv.classList.add("hidden");
            swapButton.classList.add("hidden");
            break;
        default:  // "side-by-side"
            schematicDiv.classList.add("split");
            layoutDiv.classList.add("split");
            swapButton.classList.add("hidden");
            break;
    }

    resetAllTransform();
    resizeAll();
    highlightModules(highlightedModules, false);
}

function scaleProjector(value) {
    var exp = value / 20.0;
    if (exp < -1 || exp > 1) {
        exp = 0;
    }
    serverSettings.projectorScale = Math.pow(10, exp);
    socket.emit("settings", serverSettings, "projectorScale");
}

function toggleDebugPanel(value) {
    var panel = document.getElementById("debug-panel");
    if (value) {
        panel.classList.remove("hidden");
    } else {
        panel.classList.add("hidden");
    }
    resizeAll();
}

var presetList = [4.96, 3.27, 1.83];
function initiateDebug(scene16) {
    if (debugpanelitems.length == 0) {
        // addPanel("PP_VYS_5V");
        setTimeout(() => {
            addPanel("PP_VSYS_5V");
            initiateDebug(true);
        }, 3000);
        return;
    }

    for (let item of debugpanelitems) {
        let net = item.netname.lastChild.value;
        item.netname.innerHTML = net;

        item.voltage.innerHTML = "&mdash; V";
        item.voltage.classList.remove("hidden");

        let lower = parseFloat(item.bounds.children[0].value);
        let upper = parseFloat(item.bounds.children[2].value);

        if (lower > upper) {
            let temp = upper;
            upper = lower;
            lower = temp;
        }
        if (!isNaN(lower) && !isNaN(upper)) {
            item.bounds.innerHTML = "Bounds: " + lower.toFixed(2) + "V-" + upper.toFixed(2) + "V";
            item.range.push(lower);
            item.range.push(upper);
        } else {
            item.bounds.classList.add("hidden");
            // item.range.push(3.5);
            // item.range.push(6.5);
        }
    }

    var counter = 0;
    let icode = setInterval(() => {
        if (counter < debugpanelitems.length) {
            let volt;
            if (scene16) {
                volt = 4.96;
            } else if (counter < presetList.length) {
                volt = presetList[counter];
            } else {
                volt = Math.floor(Math.random() * 600) / 100 + 2; // Picks num b/t 2.00 and 8.00
            }

            let item = debugpanelitems[counter];

            if (item.range.length > 0) {
                if (volt >= item.range[0] && volt <= item.range[1]) {
                    item.checkbox.classList.add("good");
                } else {
                    item.checkbox.classList.add("bad");
                    item.bounds.classList.add("bad");
                }
            } else {
                item.checkbox.classList.add("okay");
            }

            item.voltage.innerHTML = volt.toFixed(2) + " V";

            counter++;
        } else {
            clearInterval(icode);
        }
    }, 3000);
}


function debugModeChange(action) {
    switch (action) {
        case "start":
            serverSettings.debugMode = "on";
            initiateDebug(false);
            break;
        case "resume":
            serverSettings.debugMode = "on";
            break;
        case "pause":
            serverSettings.debugMode = "paused";
            break;
        case "end":
            serverSettings.debugMode = "off";
            break;
    }
    socket.emit("settings", serverSettings, "debugMode");
}

var dropdownShown = false;
function dropdownToggle(off) {
    var dropdown = document.getElementById("right-click-dropdown-list");
    var img = document.getElementById("right-click-chevron");
    if (off) {
        dropdownShown = true;
    } 

    dropdownShown = !dropdownShown;
    if (dropdownShown) {
        dropdown.classList.remove("hidden");
        img.src = "images/chevronup.png"
    } else {
        dropdown.classList.add("hidden")
        img.src = "images/chevrondown.png"
    }
}

function initToggle() {
    var dropdown = document.getElementById("right-click-dropdown-list");
    dropdown.addEventListener("click", evt => evt.stopPropagation());
}

function newPcbPad(pos, size, angle = -90, shape = "rect") {
    return {
        pos: pos,
        size: size,
        angle: angle,
        shape: shape,
        type: "smd",
        layers: ["F"],
        offset: [0, 0],
        path2d: null
    }
}

function addPcbPin(name, pad) {
    // Note: requires moduleArray to be initialized
    for (let moduleId in moduleArray) {
        let module = moduleArray[moduleId];
        if (module.parent == null) {
            continue;
        }
        let pinname = moduleArray[module.parent].ref + "." + module.num;
        if (pinname == name) {
            moduleArray[moduleId].pcbid = pcbdata.modules.length;
        }
    }
    
    pcbdata.modules.push({
        ref: name,
        pads: [pad],
        layer: "F",
        bbox: {
            angle: 0,
            pos: [0, 0],
            relpos: [0, 0],
            size: [0, 0]
        },
        drawings: []
    });
}

// Adds modules to pcbdata.modules for the pins selectable in the video
function initHardcodedPins() {
    addPcbPin("U1.3", newPcbPad([61.6458, 140.3096], [1.2192, 2.2352]));
    addPcbPin("PC1.+", newPcbPad([76.327, 148.476], [3, 1.4]));
    addPcbPin("D1.C", newPcbPad([74.59, 157.226], [2.4, 2.4]));
    addPcbPin("RN1.8", newPcbPad([78.065, 137.344], [0.5, 0.65]));
    addPcbPin("POWER1.8", 
        {
            angle: -0,
            drillshape: "circle",
            drillsize: [0.85, 0.85],
            layers: ["F", "B"],
            offset: [ 0, 0 ],
            path2d: null,
            pos: [96.52, 157.48],
            shape: "oval",
            size: [1.4224, 2.8448],
            type: "th"
        }
    );
    addPcbPin("RESET1.3", newPcbPad([52.95, 112.867], [1.6, 1.4]));
}



var debugpanelcount = 0;

var debugpanelitems = [];

function createTextField(name) {
    var input = document.createElement("input");
    input.setAttribute("type", "text");
    if (name) {
        input.value = name;
    }
    return input;
}

function addPanel(name) {
    var container = document.createElement("div");
    container.classList.add("debug-panel-item");

    var checkbox = document.createElement("div");
    checkbox.classList.add("debug-panel-checkbox");
    
    var netname = document.createElement("div");
    netname.classList.add("debug-panel-netname");
    netname.appendChild(createTextField(name));

    var voltage = document.createElement("div");
    voltage.classList.add("debug-panel-voltage");
    voltage.classList.add("hidden");

    var row = document.createElement("div");
    row.classList.add("debug-panel-row");
    row.appendChild(checkbox);
    row.appendChild(netname);
    row.appendChild(voltage);

    var bounds = document.createElement("div");
    bounds.classList.add("debug-panel-bounds");
    bounds.innerHTML = "Set bounds:&nbsp;"
    bounds.appendChild(createTextField());
    let span = document.createElement("span");
    span.innerHTML = "V-";
    bounds.appendChild(span);
    bounds.appendChild(createTextField());
    bounds.innerHTML += "V";

    debugpanelitems.push({
        checkbox: checkbox,
        netname: netname,
        voltage: voltage,
        bounds: bounds,
        range: []
    });

    container.appendChild(row);
    container.appendChild(bounds);

    document.getElementById("debug-panel-list").appendChild(container);
}


// ---- Page Setup ---- //

socket.on("highlight", (modules) => {
    if (modules != rightclickcomp) {
        document.getElementById("right-click-menu").classList.add("hidden");
    }
    highlightModules(modules, true);
    if (modules.length == 0) {
        document.getElementById("right-click-menu").classList.add("hidden");
        rightclickcomp = null;
        dropdownToggle(true);
    }
});

socket.on("settings", (newSettings, change) => {
    serverSettings = newSettings;

    updateViewmode();

    if (change == "projectorScale") {
        var scaleDisplay = document.getElementById("projectorscale-display");
        scaleDisplay.innerHTML = parseFloat(serverSettings.projectorScale).toFixed(2);
    } else if (change == "debugMode") {
        var startButton = document.getElementById("debug-panel-s-btn");
        var pauseButton = document.getElementById("debug-panel-p-btn");
        var resumeButton = document.getElementById("debug-panel-r-btn");
        var finishButton = document.getElementById("debug-panel-f-btn");

        switch (serverSettings.debugMode) {
            case "on":
                startButton.classList.add("hidden");
                pauseButton.classList.remove("hidden");
                resumeButton.classList.add("hidden");
                finishButton.classList.remove("hidden");
                break;
            case "paused":
                startButton.classList.add("hidden");
                pauseButton.classList.add("hidden");
                resumeButton.classList.remove("hidden");
                finishButton.classList.remove("hidden");
                break;
            case "off":
                startButton.classList.remove("hidden");
                pauseButton.classList.add("hidden");
                resumeButton.classList.add("hidden");
                finishButton.classList.add("hidden");
                break;
        }
    }

    // if (serverSettings.test === "off") {
    //     var statusSpan = document.getElementById("teststatus");
    //     statusSpan.innerHTML = "Off";
    //     statusSpan.style.color = "";
    // }
});

socket.on("test", (type, value) => {
    if (serverSettings.test === "off") {
        // Ignore errant test events
        return;
    }

    // var statusSpan = document.getElementById("teststatus");

    switch (type) {
        case "set":
            if (!(value in schematicComponents)) {
                // Somehow we've tried to test an invalid value
                socket.emit("test", "cancel", null);
                return;
            }

            // Treat any "set" like a "highlight" so everyone can see the selection
            highlightModules([value], false);

            if (serverSettings.test.includes("schematic")) {
                // The user must find a module on the schematic/layout
                testModule = value;

                if (serverSettings.test.includes("off")) {
                    // We don't get to use boardviz, cancel highlight
                    highlightModules([], false);
                }
            }

            // statusSpan.innerHTML = "Active";
            // statusSpan.style.color = "#007bff"; // highlight blue

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

            // statusSpan.innerHTML = "Found";
            // statusSpan.style.color = "#00aa00"; // green

            if (serverSettings.sound == "on") {
                successSound.play();
            }

            break;

        case "cancel":
            testModule = null;
            // statusSpan.innerHTML = "Canceled";
            // statusSpan.style.color = "#d04040"; // red
            break;
    }
});

function selectModuleByName(name) {
    if (name === null) {
        socket.emit("highlight", []);
        console.log("Deselecting modules");
        return;
    }
    for (let i in moduleArray) {
        if (moduleArray[i].ref == name) {
            socket.emit("highlight", [i]);
            console.log(`Module found (id=${i})`);
            return;
        }
    }
    console.log("Module not found");
}

function selectModuleById(id) {
    if (id === null) {
        socket.emit("highlight", []);
        console.log("Deselecting modules");
        return;
    }
    if (id in moduleArray) {
        socket.emit("highlight", [id]);
        console.log(`Module found (ref=${moduleArray[i].ref})`);
        return;
    }
    console.log("Module not found");
}

function multiSelectById(ids) {
    if (!ids || ids.length == 0) {
        socket.emit("highlight", []);
        console.log("Deselecting modules");
        return;
    }
    var modules = [];
    for (let id of ids) {
        if (id in moduleArray) {
            modules.push(id);
        }
    }
    socket.emit("highlight", modules);
}

function highlightAll() {
    modules = []
    for (var refId in moduleArray) {
        modules.push(refId)
    }
    socket.emit("highlight", modules)
}


window.onload = () => {
    // Get schematic component data
    fetch("http://" + window.location.host + "/schematicdata")
        .then((res) => res.json())
        .then((data) => {
            // Only complete init when we've received the schematic data
            initUtils();

            initSchematicData(data);

            initHardcodedPins();

            initLayoutClickHandlers();

            initSchematicCanvas();

            initSwapButton();

            initToggle();

            // Initiates actual render
            updateViewmode();
        })
        .catch((e) => console.log(e));
}
window.onresize = resizeAll;