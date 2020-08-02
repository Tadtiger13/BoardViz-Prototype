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
        boardBox: [324.78,255.23,341.84,262.65],
        boardHitbox: [320.33,250.77,348.52,262.65]
    },
    66: {
        name: "Z1",
        boxes: [[84,393,105,417]],
        boardBox: [232.04,207.00,252.07,215.90],
        boardHitbox: [227.59,203.29,258.75,216.65]
    },
    72: {
        name: "RN2",
        boxes: [[524, 57,551, 86],
                [534,486,566,506],
                [534,452,566,474],
                [482,387,500,416]],
        boardBox: [326.26,201.81,340.36,221.84],
        boardHitbox: [320.33,199.58,347.04,222.58]
    },
    75: {
        name: "C8",
        boxes: [[154,460,184,490]],
        boardBox: [232.78,192.16,250.59,201.06],
        boardHitbox: [229.07,187.71,257.26,203.29]
    },
    78: {
        name: "C7",
        boxes: [[122,448,154,470]],
        boardBox: [315.14,345.74,323.30,364.29],
        boardHitbox: [311.43,340.55,328.49,368.74]
    },
    89: {
        name: "D3",
        boxes: [[250,280,270,298]],
        boardBox: [237.97,155.81,250.59,186.23],
        boardHitbox: [235.75,152.10,253.56,189.19]
    }
};