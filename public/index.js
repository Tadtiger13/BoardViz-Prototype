// TODO nice comment

var socket = io();

function viewModeSetting(mode) {
    socket.emit("setting viewmode", mode);
}

function highlightSetting(mode) {
    socket.emit("setting highlight", mode);
}

function annotationSetting(mode) {
    socket.emit("setting annotation", mode);
}

function testSetting(mode) {
    socket.emit("setting test", mode);
}

socket.on("setting viewmode", (mode) => {
    var btn1 = document.getElementById("btn-vm1");
    var btn2 = document.getElementById("btn-vm2");
    var btn3 = document.getElementById("btn-vm3");

    btn1.classList = "";
    btn2.classList = "";
    btn3.classList = "";

    switch (mode) {
        case "fullscreen":
            console.log("setting view mode to fullscreen");
            btn1.classList.add("selected");
            break;
        case "peek-by-inset":
            btn2.classList.add("selected");
            break;
        case "side-by-side":
            btn3.classList.add("selected");
            break;
    }
});

socket.on("setting highlight", (mode) => {
    var btn1 = document.getElementById("btn-bm1");
    var btn2 = document.getElementById("btn-bm2");
    var btn3 = document.getElementById("btn-bm3");
    var btn4 = document.getElementById("btn-bm4");

    btn1.classList = "";
    btn2.classList = "";
    btn3.classList = "";
    btn4.classList = "";

    switch (mode) {
        case "box":
            btn1.classList.add("selected");
            break;
        case "circle":
            btn2.classList.add("selected");
            break;
        case "crosshair":
            btn3.classList.add("selected");
            break;
        case "layout":
            btn4.classList.add("selected");
            break;
    }
});

socket.on("setting annotation", (mode) => {
    var btn1 = document.getElementById("btn-as1");
    var btn2 = document.getElementById("btn-as2");
    var btn3 = document.getElementById("btn-as3");
    var btn4 = document.getElementById("btn-as4");

    btn1.classList = "";
    btn2.classList = "";
    btn3.classList = "";
    btn4.classList = "";

    switch (mode) {
        case "on min":
            btn1.classList.add("selected");
            break;
        case "off min":
            btn2.classList.add("selected");
            break;
        case "on max":
            btn3.classList.add("selected");
            break;
        case "off max":
            btn4.classList.add("selected");
            break;
    }
});

socket.on("setting test", (mode) => {
    var btn1 = document.getElementById("btn-ts1");
    var btn2 = document.getElementById("btn-ts2");
    var btn3 = document.getElementById("btn-ts3");

    btn1.classList = "";
    btn2.classList = "";
    btn3.classList = "";

    switch (mode) {
        case "off":
            btn1.classList.add("selected");
            break;
        case "find-on-board":
            btn2.classList.add("selected");
            break;
        case "find-on-schematic":
            btn3.classList.add("selected");
            break;
    }
});
