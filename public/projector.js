// Primary js file for projector.html, which is the projector output page


// ---- Variables ---- //

var socket = io();

projectorMode = true;


// ---- Functions ---- //

// Takes a pcbdata bbox (with pos, relpos, angle, and size)
// and returns a corresponding four-corners box []
function getBoxFromBBox(bbox) {
    var minX = bbox.relpos[0];
    var maxX = bbox.relpos[0] + bbox.size[0];
    var minY = bbox.relpos[1];
    var maxY = bbox.relpos[1] + bbox.size[1];
    var corners = [[minX, minY], [minX, maxY], [maxX, minY], [maxX, maxY]];

    var rotatedCorners = [];
    // Going to assume the rotations happen at right angles for now
    for (var corner of corners) {
        var rotated = rotateVector(corner, bbox.angle);
        rotated[0] += bbox.pos[0];
        rotated[1] += bbox.pos[1];
        rotatedCorners.push(rotated);
    }

    minX = Math.min(...rotatedCorners.map(pt => pt[0]));
    maxX = Math.max(...rotatedCorners.map(pt => pt[0]));
    minY = Math.min(...rotatedCorners.map(pt => pt[1]));
    maxY = Math.max(...rotatedCorners.map(pt => pt[1]));

    return [minX, minY, maxX, maxY];
}

function projectorHighlight() {
    if (moduleArray.length == 0) {
        // We haven't finished loading schematic data yet, so do nothing
        return;
    }

    // Clear the canvas and draw the pad highlights
    resizeAll();

    if (highlightedModules.length > 0) {
        // We have at least one component that will get highlighted
        // Crosshair will focus on the first one
        var pcbModuleId = moduleArray[highlightedModules[0]].pcbid;

        // Have to extract four corners from complicated pcbdata bbox
        var box = getBoxFromBBox(pcbdata.modules[pcbModuleId].bbox);

        var canvas = allcanvas.front.highlight;
        var ctx = canvas.getContext("2d");
        var style = getComputedStyle(topmostdiv);

        if (serverSettings.highlight == "crosshair") {
            ctx.fillStyle = style.getPropertyValue("--board-highlight-fill-color");
            ctx.strokeStyle = style.getPropertyValue("--board-highlight-line-color");
            ctx.lineWidth = style.getPropertyValue("--board-highlight-line-width");

            var width = canvas.width;
            var height = canvas.height;

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
        }
    }
}

function projectorZoom(zoom) {
    allcanvas.front.transform.zoom = zoom;
    projectorHighlight();
}


// ---- Execution ---- //

socket.on("highlight", (modules) => {
    highlightedModules = modules;
    projectorHighlight();
});

socket.on("settings", (newSettings, change) => {
    serverSettings = newSettings;
    if (change == "projectorScale") {
        projectorZoom(serverSettings.projectorScale);
    } else if (change == "highlight") {
        projectorHighlight();
    }
});

window.onload = () => {
    // Get schematic component data
    fetch("http://" + window.location.host + "/schematicdata")
        .then((res) => res.json())
        .then((data) => {
            // Only complete init when we've received the schematic data
            initUtils();

            initSchematicData(data);

            // Initiates actual render
            projectorHighlight();
        })
        .catch((e) => console.log(e));
}
window.onresize = projectorHighlight;

allcanvas.front.highlight.addEventListener("click", (e) => {
    var pt = getMousePos(allcanvas.front, e);
    console.log(`(${pt.x.toFixed(2)},${pt.y.toFixed(2)})`);
});
