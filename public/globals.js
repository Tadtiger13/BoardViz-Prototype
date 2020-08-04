// Global constants used by render.js, main.js, and mobile.js,
// as well as logging functionality

// Used as proxy to get styles for layout, schematic, and board from CSS 'properties'
const topmostdiv = document.getElementById("display");

// Default zoom level of peek-by-inset
const PBI_ZOOM = 2.5;

// Prototype elements (hardcoded)
// Z1, RN2, C7, C8, C6, D3
// TODO improve accuracy/aesthetic of boxes
// TODO separate highlight and hitbox boxes for board
const schematicComponents = {
    59: {
        name: "C6",
        boxes: [[570, 423, 601, 438]],
        boardBox: [324.78, 255.23, 341.84, 262.65],
        boardHitbox: [320.33, 250.77, 348.52, 262.65],
        annotation: ["100nF", "+/-20%", "16V", "X7R", "CAPACITOR", "0402", "C0402C104Z4VAC7867"]
    },
    66: {
        name: "Z1",
        boxes: [[84, 393, 105, 417]],
        boardBox: [232.04, 207.00, 252.07, 215.90],
        boardHitbox: [227.59, 203.29, 258.75, 216.65],
        annotation: ["Vbr: 8kV", "VARISTOR", "0603", "PGB1010604"]
    },
    72: {
        name: "RN2",
        boxes: [[524, 57, 551, 86],
        [534, 486, 566, 506],
        [534, 452, 566, 474],
        [482, 387, 500, 416]],
        boardBox: [326.26, 201.81, 340.36, 221.84],
        boardHitbox: [320.33, 199.58, 347.04, 222.58],
        annotation: ["1K", "5%", "ARRAY CHIP RESISTOR", "1206", "CAY16-102J4LF"]
    },
    75: {
        name: "C8",
        boxes: [[154, 460, 184, 490]],
        boardBox: [232.78, 192.16, 250.59, 201.06],
        boardHitbox: [229.07, 187.71, 257.26, 203.29],
        annotation: ["1uF", "-20%/+80%", "10V", "X5R", "CAPACITOR", "0603", "CL10A105KP8NNNC"]
    },
    78: {
        name: "C7",
        boxes: [[122, 448, 154, 470]],
        boardBox: [315.14, 345.74, 323.30, 364.29],
        boardHitbox: [311.43, 340.55, 328.49, 368.74],
        annotation: ["100nF", "+/-20%", "16V", "X7R", "CAPACITOR", "0402", "C0402C104Z4VAC7867"]
    },
    89: {
        name: "D3",
        boxes: [[250, 280, 270, 298]],
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
    test: "off"
  };
