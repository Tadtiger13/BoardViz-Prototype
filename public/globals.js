// Global constants used by render.js, main.js, and mobile.js,
// as well as logging functionality

// Used as proxy to get styles for layout, schematic, and board from CSS 'properties'
const topmostdiv = document.getElementById("display");

// Default zoom level of peek-by-inset
const PBI_ZOOM = 2.5;

// extra padding for board components in test mode
const TEST_HITBOX_PADDING = 2.5;

// Prototype elements (hardcoded)
// Z1, RN2, C7, C8, C6, D3
// TODO improve accuracy/aesthetic of boxes
// TODO separate highlight and hitbox boxes for board
var schematicComponents = {
    44: {
        name: "C2",
        boxes: [[755.62,131.76,783.56,150.97]],
        boardBox: [230.91,264.13,246.49,273.77],
        boardHitbox: [226.46,257.45,250.95,276.74],
        annotation: []
    },
    57: {
        name: "C4",
        boxes: [[710.21,293.31,736.84,312.52]],
        boardBox: [323.66,176.58,342.20,185.48],
        boardHitbox: [321.43,173.61,346.66,186.97],
        annotation: []
    },
    58: {
        name: "F1",
        boxes: [[104.62,347.45,130.82,363.17]],
        boardBox: [178.98,270.06,201.98,307.16],
        boardHitbox: [175.27,264.87,206.43,310.13],
        annotation: []
    },
    59: {
        name: "C7",
        boxes: [[120.78,460.54,149.16,479.75]],
        boardBox: [324.78, 255.23, 341.84, 262.65],
        boardHitbox: [320.33, 250.77, 348.52, 262.65],
        annotation: ["100nF", "+/-20%", "16V", "X7R", "CAPACITOR", "0402", "C0402C104Z4VAC7867"]
    },
    62: {
        name: "C1",
        boxes: [[181.90,106.00,208.97,124.78]],
        boardBox: [271.72,345.74,280.62,363.55],
        boardHitbox: [269.49,342.77,282.85,367.26],
        annotation: []
    },
    64: {
        name: "C5",
        boxes: [[479.24,324.75,498.01,351.82]],
        boardBox: [325.14,264.13,341.46,272.29],
        boardHitbox: [324.40,263.39,342.20,272.29],
        annotation: []
    },
    66: {
        name: "Z1",
        boxes: [[85.85,409.02,104.62,434.34]],
        boardBox: [232.04, 207.00, 252.07, 215.90],
        boardHitbox: [227.59, 203.29, 258.75, 216.65],
        annotation: ["Vbr: 8kV", "VARISTOR", "0603", "PGB1010604"]
    },
    67: {
        name: "Z2",
        boxes: [[112.48,409.02,131.25,434.34]],
        boardBox: [232.40,242.61,252.43,250.03],
        boardHitbox: [230.17,239.65,253.91,251.52],
        annotation: []
    },
    72: {
        name: "RN2",
        boxes: [[479.68,112.55,503.69,137.88],
                [491.46,494.59,517.66,510.75],
                [490.59,462.72,517.66,477.56],
                [532.94,325.62,545.61,357.49]],
        boardBox: [326.26, 201.81, 340.36, 221.84],
        boardHitbox: [320.33, 199.58, 347.04, 222.58],
        annotation: ["1K", "5%", "ARRAY CHIP RESISTOR", "1206", "CAY16-102J4LF"]
    },
    74: {
        name: "C6",
        boxes: [[543.86,434.78,558.27,454.42]],
        boardBox: [423.82,379.87,439.40,388.77],
        boardHitbox: [420.85,378.39,443.11,390.26],
        annotation: ["100nF", "+/-20%", "16V", "X7R", "CAPACITOR", "0402", "C0402C104Z4VAC7867"]
    },
    75: {
        name: "C8",
        boxes: [[150.90,466.65,163.13,486.30]],
        boardBox: [232.78, 192.16, 250.59, 201.06],
        boardHitbox: [229.07, 187.71, 257.26, 203.29],
        annotation: ["1uF", "-20%/+80%", "10V", "X5R", "CAPACITOR", "0603", "CL10A105KP8NNNC"]
    },
    78: {
        name: "C3",
        boxes: [[505.00,195.95,518.10,215.59]],
        boardBox: [315.14, 345.74, 323.30, 364.29],
        boardHitbox: [311.43, 340.55, 328.49, 368.74],
        annotation: []
    },
    79: {
        name: "R1",
        boxes: [[226.87,364.48,241.28,388.49]],
        boardBox: [271.72,266.35,288.78,274.52],
        boardHitbox: [271.72,266.35,288.78,273.77],
        annotation: []
    },
    80: {
        name: "C9",
        boxes: [[195.87,383.69,213.78,395.04]],
        boardBox: [252.43,265.61,271.72,274.52],
        boardHitbox: [253.17,265.61,270.98,275.26],
        annotation: []
    },
    81: {
        name: "C11",
        boxes: [[195.87,357.93,214.65,369.28]],
        boardBox: [290.27,265.61,307.33,274.52],
        boardHitbox: [291.01,266.35,308.07,274.52],
        annotation: []
    },
    83: {
        name: "U5",
        boxes: [[305.92,96.38,343.42,127.26],
                [421.17,116.78,459.77,146.01]],
        boardBox: [263.56,316.81,297.69,336.10],
        boardHitbox: [259.85,313.84,299.91,338.32],
        annotation: []
    },
    85: {
        name: "Y2",
        boxes: [[497.48,374.12,521.71,391.67]],
        boardBox: [401.56, 289.35, 423.82, 304.94],
        boardHitbox: [400.82, 288.61, 426.04, 304.94],
        annotation: []
    },
    86: {
        name: "U2",
        boxes: [[427.24,181.30,486.24,223.77]],
        boardBox: [285.82,347.97,309.56,365.03],
        boardHitbox: [284.33,345.74,311.78,366.52],
        annotation: []
    },
    88: {
        name: "D2",
        boxes: [[551.87,337.92,560.69,351.15]],
        boardBox: [514.33,263.39,528.43,295.29],
        boardHitbox: [510.62,260.42,531.40,298.26],
        annotation: []
    },
    89: {
        name: "D3",
        boxes: [[243.05,312.00,251.32,325.24]],
        boardBox: [237.97, 155.81, 250.59, 186.23],
        boardHitbox: [235.75, 152.10, 253.56, 189.19],
        annotation: ["Vr: 100V", "Vf: 1V", "Imax: 150mA", "DIODE", "1206", "CD1206-S01575"]
    }
};

var serverSettings = {
    // Determines what display mode is used for the schematic/layout
    // "side-by-side", "fullscreen", "peek-by-inset"
    viewmode: "side-by-side",

    // Determines which highlight mode is used on the board
    // "box", "circle", "crosshair", "layout"
    highlight: "box",

    // Determines which annotation style is used on the board
    // "[on/off] [min/max]", "none"
    annotation: "on min",

    // Determines which test mode is in use
    // "off", "[board/schematic] [on/off]"
    test: "off",

    // Determines whether the sounds play or not in test mode
    // "off" or "on"
    sound: "on",
};



























