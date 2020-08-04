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
        "off": document.getElementById("btn-ts1"),
        "board off": document.getElementById("btn-ts2"),
        "schematic off": document.getElementById("btn-ts3"),
        "board on": document.getElementById("btn-ts4"),
        "schematic on": document.getElementById("btn-ts5")
    }
}

var socket = io();

var auto = false;

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
    buttons["test"][serverSettings.test].classList.add("selected");
});
