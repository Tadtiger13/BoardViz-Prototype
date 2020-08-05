// TODO nice comment

var buttons = {
    "viewmode": {
        "fullscreen": document.getElementById("btn-vm1"),
        "peek-by-inset": document.getElementById("btn-vm2"),
        "side-by-side": document.getElementById("btn-vm3")
    },
    "highlight": {
        "box": document.getElementById("btn-bm1"),
        "circle": document.getElementById("btn-bm2"),
        "crosshair": document.getElementById("btn-bm3"),
        "layout": document.getElementById("btn-bm4")
    },
    "annotation": {
        "on min": document.getElementById("btn-as1"),
        "off min": document.getElementById("btn-as2"),
        "on max": document.getElementById("btn-as3"),
        "off max": document.getElementById("btn-as4"),
        "none": document.getElementById("btn-as5")
    },
    "test": {
        "board": document.getElementById("btn-panel-board"),
        "schematic": document.getElementById("btn-panel-schematic"),
        "enabled": document.getElementById("btn-panel-enabled"),
        "disabled": document.getElementById("btn-panel-disabled")
    }
}

var socket = io();

var auto = false;

var testSelectionMode = "off";

// Can have values: "Ready", "Active", "Found", "Canceled", "Finished"
// Correspond to:   "Start", "Cancel", "Next",  "Next",     n/a
var testStatus = "Ready";

var testModule = null;


function viewModeSetting(mode) {
    serverSettings.viewmode = mode;
    socket.emit("settings", serverSettings);
}

function highlightSetting(mode) {
    serverSettings.highlight = mode;
    socket.emit("settings", serverSettings);
}

function annotationSetting(mode) {
    serverSettings.annotation = mode;
    socket.emit("settings", serverSettings);
}

function testSetting(mode) {
    if (mode === "off") {
        auto = false;
        document.getElementById("btn-tsr").classList.remove("selected");
    } else if (auto) {
        mode = mode.includes("board") ? "board" : "schematic";
        if (Math.floor(Math.random() * 2) == 0) {
            mode += " on";
        } else {
            mode += " off";
        }
    }

    serverSettings.test = mode;
    socket.emit("settings", serverSettings);
}

function autoTest() {
    auto = true;
    document.getElementById("btn-tsr").classList.add("selected");

    testSetting(serverSettings.test);
}

function testPanel(button) {
    switch (button) {
        case "off":
        case "auto":
        case "manual":
            socket.emit("selectionmode", button);
            break;

        case "board":
        case"schematic":
            var testMode = button + " " + (serverSettings.test.includes("on") ? "on" : "off");
            serverSettings.test = testMode;
            socket.emit("settings", serverSettings);
            break;

        case "enabled":
        case "disabled":
            var testMode = (serverSettings.test.includes("board") ? "board" : "schematic") + " ";
            testMode += (button === "enabled" ? "on" : "off");
            serverSettings.test = testMode;
            socket.emit("settings", serverSettings);
            break;

        case "action":
            switch (testStatus) {
                case "Ready":
                case "Found":
                case "Canceled":
                    socket.emit("test", "next", null);
                    break;
                case "Active":
                    socket.emit("test", "cancel", null);
                    break;
            }
            break;
    }

}

socket.on("settings", (newSettings) => {
    serverSettings = newSettings;

    // Deselect all buttons
    for (var buttonSet in buttons) {
        for (var button in buttons[buttonSet]) {
            buttons[buttonSet][button].classList = "";
        }
    }

    // Select correct buttons
    buttons["viewmode"][serverSettings.viewmode].classList.add("selected");
    buttons["highlight"][serverSettings.highlight].classList.add("selected");
    buttons["annotation"][serverSettings.annotation].classList.add("selected");

    if (serverSettings.test.includes("board")) {
        buttons["test"]["board"].classList.add("selected");
    } else {
        buttons["test"]["schematic"].classList.add("selected");
    }
    if (serverSettings.test.includes("on")) {
        buttons["test"]["enabled"].classList.add("selected");
    } else {
        buttons["test"]["disabled"].classList.add("selected");
    }
});

socket.on("selectionmode", (mode) => {
    document.getElementById("btn-test-" + testSelectionMode).classList.remove("selected");
    testSelectionMode = mode;
    document.getElementById("btn-test-" + testSelectionMode).classList.add("selected");

    var panel = document.getElementById("testpanel");
    var boardvizButtons = document.getElementById("testpanel-manual");
    var status = document.getElementById("testpanel-status");

    switch (testSelectionMode) {
        case "off":
            panel.classList.add("hidden");
            testStatus = "Off";
            break;

        case "auto":
            panel.classList.remove("hidden");
            boardvizButtons.classList.add("hidden");
            testStatus = "Ready";
            break;

        case "manual":
            panel.classList.remove("hidden");
            boardvizButtons.classList.remove("hidden");
            testStatus = "Ready";
            break;
    }

    status.innerHTML = testStatus;
    document.getElementById("btn-panel-action").innerHTML = "Start";
});

socket.on("test", (type, value) => {
    var status = document.getElementById("testpanel-status");
    var button = document.getElementById("btn-panel-action");
    var statusString = status.innerHTML;
    var buttonString = button.innerHTML;
    switch (type) {
        case "set":
            testStatus = "Active";
            statusString = "Active: Finding " + schematicComponents[value].name + " with BoardViz " +
                (serverSettings.test.includes("on") ? "enabled" : "disabled");
            buttonString = "Cancel";
            testModule = value;
            break;
        case "found":
            testStatus = "Found";
            statusString = "Found: " + schematicComponents[testModule].name;
            buttonString = "Next";
            testModule = null;
            break;
        case "cancel":
            testStatus = "Canceled";
            statusString = "Canceled: Didn't find " + schematicComponents[testModule].name;
            buttonString = "Next";
            testModule = null;
            break;
        case "done":
            testStatus = "Finished";
            statusString = "Finished test";
            buttonString = "N/A"
            break;
    }
    status.innerHTML = statusString;
    button.innerHTML = buttonString;
});
