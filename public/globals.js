// Global constants used by render.js, main.js, and mobile.js


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
        boxes: [[570,423,601,438]],
        boardBox: [224,154,242,162]
    },
    66: {
        name: "Z1",
        boxes: [[84,393,105,417]],
        boardBox: [131,105,154,117]
    },
    72: {
        name: "RN2",
        boxes: [[524, 57,551, 86],
                [534,486,566,506],
                [534,452,566,474],
                [482,387,500,416]],
        boardBox: [225,100,240,122]
    },
    75: {
        name: "C8",
        boxes: [[154,460,184,490]],
        boardBox: [134, 92,150,100]
    },
    78: {
        name: "C7",
        boxes: [[122,448,154,470]],
        boardBox: [215,246,223,264]
    },
    89: {
        name: "D3",
        boxes: [[250,280,270,298]],
        boardBox: [139,55,150,85]
    }
};
