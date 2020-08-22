# Reads in a .sch and a cache.lib file from EEschema and writes
# components and their bounding boxes to a .json file

import sys

class Pin:
    def __init__(self, name, num, pos, end):
        # pin name, eg. GND
        self.name = name

        # pin num, eg. 2 or +
        self.num = num

        # (x, y) position
        self.pos = pos

        # (x, y) endpoint
        self.end = end
#  class Pin

class CacheComponent:
    def __init__(self, name, bbox, pins):
        # Symbol name in cache.lib
        self.name = name

        # (x1, y1, x2, y2) bounding box of symbol (relative to 0,0)
        self.bbox = bbox

        # list of Pins
        self.pins = pins

    # applies a rotation matrix r = (a, b, c, d) to a point p = (x, y)
    def calcRotate(self, p, r):
        return (p[0] * r[0] + p[1] * r[1], p[0] * r[2] + p[1] * r[3])

    # calculates the bounding box of an actual component given its position
    # and its rotation matrix r = (a, b, c, d)
    def calcBbox(self, x, y, r):
        minX = self.bbox[0]
        minY = self.bbox[1]
        maxX = self.bbox[2]
        maxY = self.bbox[3]

        # Apply the rotation matrix to .sch coordinates
        minPoint = self.calcRotate((minX, minY), r)
        maxPoint = self.calcRotate((maxX, maxY), r)

        # Apply to given coordinate position
        return (x + minPoint[0], y + minPoint[1], x + maxPoint[0], y + maxPoint[1])

    # calculates the pin list positions for an actual component given
    # position and rotation matrix r = (a, b, c, d)
    def calcPins(self, x, y, r):
        newlist = list()
        for pin in self.pins:
            name = pin.name
            num = pin.num

            pinPos = self.calcRotate((pin.pos[0], pin.pos[1]), r)
            pinEnd = self.calcRotate((pin.end[0], pin.end[1]), r)

            pos = (x + pinPos[0], y + pinPos[1])
            end = (x + pinEnd[0], y + pinEnd[1])

            newlist.append(Pin(name, num, pos, end))

        return newlist
#  class CacheComponent

class Component:
    def __init__(self, ref, tstamp, libcomp, pos, rot, bbox, pins):
        # Component reference, eg. C8
        self.ref = ref

        # tstamp unique identifier, eg. 5848FE1E
        self.tstamp = tstamp

        # Symbol name in cache.lib, eg. arduino_Uno_Rev3-02-TH-eagle-import:C-EU0603-RND
        self.libcomp = libcomp

        # (x,y) position, eg. (3100, 7200)
        self.pos = pos

        # (a, b, c, d) rotation matrix, eg. (0, 1, -1, 0)
        self.rot = rot

        # (x1, y1, x2, y2) bounding box, eg. (3020, 7100, 3180, 7400)
        self.bbox = bbox

        # list of Pins
        self.pins = pins

    def toJsonString(self, offset=''):
        pinString = offset + '  "pins": [\n'
        strlist = list()
        for pin in self.pins:
            strlist.append((
                '{o}    {{\n'
                '{o}      "name": "{pin.name}",\n'
                '{o}      "num": "{pin.num}",\n'
                '{o}      "pos": ["{pin.pos[0]}","{pin.pos[1]}"],\n'
                '{o}      "end": ["{pin.end[0]}","{pin.end[1]}"]\n'
                '{o}    }}'
            ).format(o=offset, pin=pin))

        pinString = (
            '{o}  "pins": [\n'
            '{pindata}\n'
            '{o}  ]'
        ).format(o=offset, pindata=",\n".join(strlist))

        return ('{o}{{\n'
                '{o}  "ref": "{ref}",\n'
                '{o}  "tstamp": "{tstamp}",\n'
                '{o}  "libcomp": "{libcomp}",\n'
                '{o}  "pos": {{\n'
                '{o}    "x": "{pos[0]}",\n'
                '{o}    "y": "{pos[1]}"\n'
                '{o}  }},\n'
                '{o}  "rot": [\n'
                '{o}    "{rot[0]}",\n'
                '{o}    "{rot[1]}",\n'
                '{o}    "{rot[2]}",\n'
                '{o}    "{rot[3]}"\n'
                '{o}  ],\n'
                '{o}  "bbox": [\n'
                '{o}    "{bbox[0]}",\n'
                '{o}    "{bbox[1]}",\n'
                '{o}    "{bbox[2]}",\n'
                '{o}    "{bbox[3]}"\n'
                '{o}  ],\n'
                '{pinstr}\n'
                '{o}}}').format(o=offset, ref=self.ref, tstamp=self.tstamp,
                                libcomp=self.libcomp, pos=self.pos,
                                rot=self.rot, bbox=self.bbox, pinstr=pinString)
#  class Component


def readHeader(schfile):
    line = schfile.readline()

    if not line.startswith("EESchema Schematic File"):
        # Unexpected file format
        return None

    while line:
        if line.startswith("$Descr"):
            tokens = line.split()
            return (int(tokens[2]), int(tokens[3]))
        else:
            line = schfile.readline()

    # Never found a $Descr
    return None
#  readHeader()


def nextComponent(schfile, componentDict):
    line = schfile.readline()

    # Get to next component
    while line:
        if line.startswith("$Comp"):
            break
        else:
            line = schfile.readline()

    if not line:
        # Reached EOF
        return None

    lineL = schfile.readline().split()
    lineU = schfile.readline().split()

    line = schfile.readline()  # update this now so that we can use it later
    lineP = line.split()

    if lineL[0] != "L" or lineU[0] != "U" or lineP[0] != "P":
        # Unexpected file format
        sys.exit("Invalid component in .sch file")

    # for some reason, ':' is used in .sch and '_' is used in .lib
    libcomp = lineL[1].replace(":", "_")
    cacheComp = componentDict[libcomp]

    pos = (int(lineP[1]), int(lineP[2]))

    # Skip field lines and redundant position line
    while line:
        if line.startswith("\t"):
            break
        else:
            line = schfile.readline()

    # Get rotation info
    rotline = schfile.readline().split()
    # Note: the spec guarantees that these values are either -1, 0, or 1
    rot = (int(rotline[0]), int(rotline[1]), int(rotline[2]), int(rotline[3]))
    
    bbox = cacheComp.calcBbox(pos[0], pos[1], rot)
    pins = cacheComp.calcPins(pos[0], pos[1], rot)

    # Fast forward to the end of the component
    while line:
        if line.startswith("$EndComp"):
            break
        else:
            line = schfile.readline()

    return Component(lineL[2], lineU[3], libcomp, pos, rot, bbox, pins)
#  nextComponent()


def parseDraw(libfile, name):
    # values for bbox
    minX = 1000
    minY = 1000
    maxX = -1000
    maxY = -1000

    # values for pins
    pins = list()

    # Fast forward to next DRAW
    line = libfile.readline()
    while line:
        if line.startswith("DRAW"):
            break
        else:
            line = libfile.readline()

    # Get the first data line
    line = libfile.readline()

    while not line.startswith("ENDDRAW"):
        tokens = line.split()
        if tokens[0] == "A" or tokens[0] == "C":
            # arc or circle
            x = int(tokens[1])
            y = int(tokens[2])
            r = int(tokens[3])

            minX = min(minX, x - r)
            minY = min(minY, y - r)
            maxX = max(maxX, x + r)
            maxY = max(maxY, y + r)
        elif tokens[0] == "X":
            # pin

            # Get data needed for bbox
            x = int(tokens[3])
            y = int(tokens[4])
            minX = min(minX, x)
            minY = min(minY, y)
            maxX = max(maxX, x)
            maxY = max(maxY, y)

            # Get remaining data for pin list
            pname = tokens[1]
            pnum = tokens[2]
            plen = int(tokens[5])
            orientation = tokens[6]

            # Recall that in .lib files, y increases up and x increases right
            if (orientation == "U"):
                end = (x, y + plen)
            elif (orientation == "D"):
                end = (x, y - plen)
            elif (orientation == "L"):
                end = (x - plen, y)
            else:  # "R"
                end = (x + plen, y)

            pins.append(Pin(pname, pnum, (x, y), end))
        elif tokens[0] == "S":
            # rect
            x1 = int(tokens[1])
            y1 = int(tokens[2])
            x2 = int(tokens[3])
            y2 = int(tokens[4])

            minX = min(minX, x1)
            minY = min(minY, y1)
            maxX = max(maxX, x2)
            maxY = max(maxY, y2)
        elif tokens[0] == "P" or tokens[0] == "B":
            # polygon or bezier curve
            n = int(tokens[1])
            for i in range(0, n):
                x = int(tokens[2 * i + 5])
                y = int(tokens[2 * i + 6])
                minX = min(minX, x)
                minY = min(minY, y)
                maxX = max(maxX, x)
                maxY = max(maxY, y)

        line = libfile.readline()

    return CacheComponent(name, (minX, minY, maxX, maxY), pins)
#  parseDraw()


def readCacheLib(libfile):
    cacheDict = {}

    line = libfile.readline()

    if not line.startswith("EESchema-LIBRARY"):
        # Unexpected file format
        return None

    while line:
        if line.startswith("DEF"):
            name = line.split()[1]
            cacheDict[name] = parseDraw(libfile, name)

        line = libfile.readline()

    return cacheDict
#  readCacheLib()


def readSchematicFile(schfilepath, libfilepath, outfilepath):
    # Tuple of the xy dimensions, in milli-inches
    schematicDimensions = ()

    # List of all Components in the schfile
    schematicComponents = list()

    # Map of libcomp to CacheComponent for all components in libfile
    cacheComponents = dict()

    with open(schfilepath) as schfile:
        with open(libfilepath) as libfile:
            # Get size information from header (also checks file format is valid)
            schematicDimensions = readHeader(schfile)
            if schematicDimensions is None:
                # Error occurred
                sys.exit("Invalid sch file")

            # Populate cacheComponents for nextComponent()
            cacheComponents = readCacheLib(libfile)
            if cacheComponents is None:
                # Error occurred
                sys.exit("Invalid lib file")

            # Read all the components from the file
            comp = nextComponent(schfile, cacheComponents)
            while comp is not None:
                schematicComponents.append(comp)
                comp = nextComponent(schfile, cacheComponents)

            # Write everything to a json file
            with open(outfilepath, "w") as outfile:
                # Write header
                outfile.write((
                    '{{\n'
                    '  "dimensions": {{\n'
                    '    "x": {schdim[0]},\n'
                    '    "y": {schdim[1]}\n'
                    '  }},\n'
                    '  "components": [\n'
                ).format(schdim=schematicDimensions))

                # Write components
                strlist = list()
                for comp in schematicComponents:
                    strlist.append(comp.toJsonString("    "))
                outfile.write(",\n".join(strlist))

                outfile.write("\n  ]\n}\n")

                outfile.close()

            libfile.close()

        schfile.close()
#  readSchematicFile()


# EXECUTION

readSchematicFile("./arduino_Uno_Rev3-02-TH.sch", "./arduino_Uno_Rev3-02-TH-cache.lib", "./schematicComponents.json")

