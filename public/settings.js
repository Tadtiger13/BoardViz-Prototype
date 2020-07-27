// TODO nice comment

var socket = io();

function viewModeSetting(mode) {
    var btn1 = document.getElementById("btn-vm1");
    var btn2 = document.getElementById("btn-vm2");
    var btn3 = document.getElementById("btn-vm3");

    btn1.classList = "";
    btn2.classList = "";
    btn3.classList = "";

    switch (mode) {
        case 1:
            socket.emit("setting viewmode", "fullscreen");
            console.log("setting view mode to fullscreen");
            btn1.classList.add("selected");
            break;
        case 2:
            socket.emit("setting viewmode", "peek-by-inset");
            btn2.classList.add("selected");
            break;
        case 3:
            socket.emit("setting viewmode", "side-by-side");
            btn3.classList.add("selected");
            break;
    }
}

function highlightSetting(mode) {
    var btn1 = document.getElementById("btn-bm1");
    var btn2 = document.getElementById("btn-bm2");
    var btn3 = document.getElementById("btn-bm3");
    var btn4 = document.getElementById("btn-bm4");

    btn1.classList = "";
    btn2.classList = "";
    btn3.classList = "";
    btn4.classList = "";

    switch (mode) {
        case 1:
            socket.emit("setting highlight", 1);
            btn1.classList.add("selected");
            break;
        case 2:
            socket.emit("setting highlight", 2);
            btn2.classList.add("selected");
            break;
        case 3:
            socket.emit("setting highlight", 3);
            btn3.classList.add("selected");
            break;
        case 4:
            socket.emit("setting highlight", 4);
            btn4.classList.add("selected");
            break;
    }
}

function annotationSetting(mode) {
    var btn1 = document.getElementById("btn-as1");
    var btn2 = document.getElementById("btn-as2");
    var btn3 = document.getElementById("btn-as3");
    var btn4 = document.getElementById("btn-as4");

    btn1.classList = "";
    btn2.classList = "";
    btn3.classList = "";
    btn4.classList = "";

    switch (mode) {
        case 1:
            socket.emit("setting annotation", "on min");
            btn1.classList.add("selected");
            break;
        case 2:
            socket.emit("setting annotation", "off min");
            btn2.classList.add("selected");
            break;
        case 3:
            socket.emit("setting annotation", "on max");
            btn3.classList.add("selected");
            break;
        case 4:
            socket.emit("setting annotation", "off max");
            btn4.classList.add("selected");
            break;
    }
}

// Default to side-by-side, box, and on board min
viewModeSetting(3);
highlightSetting(1);
annotationSetting(1);
