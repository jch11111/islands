/*
islands.js
2/5/2015
curt hill
cs - recursive graph traversal
*/

var directionTypes = {
    perpendicular: 'perpendicular',
    diagonal: 'diagonal',
    all: 'all'
}

var constants = {
    directions: {
        up: {
            val: 'up',
            type: directionTypes.perpendicular
        },
        down: {
            val: 'down',
            type: directionTypes.perpendicular
        },
        left: {
            val: 'left',
            type: directionTypes.perpendicular
        },
        right: {
            val: 'right',
            type: directionTypes.perpendicular
        },
        ur: {
            val: 'ur',
            type: directionTypes.diagonal
        },
        ul: {
            val: 'ul',
            type: directionTypes.diagonal
        },
        lr: {
            val: 'lr',
            type: directionTypes.diagonal
        },
        ll: {
            val: 'll',
            type: directionTypes.diagonal
        }
    },
    nodeTypes: {
        unknown: 'unknown',
        lake: 'lake',
        island: 'island'
    }
};


var Node = function (x, y) {
    this.x = x;
    this.y = y;
    this.val = 0;  //0 = water, 1=land
    this.visited = false;  //has node already been visited in depth first search
    this.type = constants.nodeTypes.unknown;   //lake, island, or unknown
}

var DataGrid = function (x, y) {
    this.rows = x;  //1 based number of rows
    this.cols = y;  //1 based number of columns
    this.nodes = new Array();  //2 dimensional array of node objects 
    this.includeDiagonal = false;  //false - only horizaontal & vertical neighbors are considered adjacent for island grouping. true: diagonal land nodes are also adjacent
    
    var nodesY; // (2nd dimension of 2d array)

    //initialize 2d array
    for (var i = 0; i < this.rows; i++) {
        nodesY = new Array();
        for (var j = 0; j < this.cols; j++) {
            nodesY.push(new Node(i, j));
        }
        this.nodes.push(nodesY);
    }
};

DataGrid.prototype = {
    exists: function (x, y) {
        //x & y are zero based. this.rows & this.cols are 1 based
        //returns true if x and y are within the range for grid rows and columns
        return (x >= 0 && y >= 0 && x < this.rows && y < this.cols);
    },
    get: function (x, y) {
        //returns node at x, y. throws error is x or y are out of bounds
        if (!this.exists(x, y)) {
            throw new Error('There is not a node at ' + x + ',' + y);
        }
        return this.nodes[x][y];
    },
    next: function (node) {
        //returns next node on same row as input node. 
        //if input node is at end of row, returns first node at beginning of next row. 
        //if input node is at the last row and last column, returns null

        //returns next node in grid from upper left to lower right order or null when at the end
        var currX = node.x;
        var currY = node.y;

        //this is last node, so there is no next node
        if (currX === this.rows - 1 && currY === this.cols - 1) return null;

        //at last column, go to next row, first column
        if (currY === this.cols - 1) return this.nodes[currX + 1][0];

        //else, go to next column
        return this.nodes[currX][currY + 1];
    },
    hasNeighbor: function (node, direction, testCondition) {
        //direction constants.directions
        //testCondition is function with node as input parameter which returns true/false 
        var nbr = this.neighbor(node, direction);
        return (nbr === null) ? false : testCondition(nbr);
    },
    neighbor: function (node, direction) {
        //returns the neighbor of the input node in direction provided
        //direction is either constants.directions

        var valid = false;
        for (var dir in constants.directions) {
            if (constants.directions[dir].val === direction) valid = true;
        }

        if (!valid) throw new Error("'" + direction + "' is an invalid direction. Must be 'up', 'down', 'left', 'right', 'ur', 'ul', 'lr', 'll'");

        var offset_x = 0; //x offset of neighbor from input node
        var offset_y = 0; //y offset of neighbor from input node

        if (direction === constants.directions.up.val ||
            direction === constants.directions.ul.val ||
            direction === constants.directions.ur.val) { offset_x = -1; }
        if (direction === constants.directions.down.val ||
            direction === constants.directions.ll.val ||
            direction === constants.directions.lr.val) { offset_x = 1; }
        if (direction === constants.directions.left.val ||
            direction === constants.directions.ul.val ||
            direction === constants.directions.ll.val) { offset_y = -1; }
        if (direction === constants.directions.right.val ||
            direction === constants.directions.ur.val ||
            direction === constants.directions.lr.val) { offset_y = 1; }

        var nbr_x = node.x + offset_x;
        var nbr_y = node.y + offset_y;

        return this.exists(nbr_x, nbr_y) ? this.nodes[nbr_x][nbr_y] : null;

    },
    neighbors: function (node, directionType) {
        //returns an array of nodes which are neighbors of the input node
        //directionType is property of directionTypes object
        //directionType = perpendicular, returns neighbors above, below, left & right
        //directionType = all includes perpendicular and diagonal
        if (directionType != directionTypes.perpendicular && directionType != directionTypes.all) {
            throw new Error('Direction type must be \'' + directionTypes.perpendicular
            + ' or \'' + directionTypes.all + '\'');
        }

        var nbrs = new Array();

        for (var i in constants.directions) {
            var dir = constants.directions[i];
            if (directionType === directionTypes.perpendicular && dir.type === directionTypes.diagonal) continue;
            var nbr = this.neighbor(node, dir.val);

            if (nbr !== null) {
                nbrs.push(nbr);
            }
        }

        return nbrs;
    },
    resetNodes: function () {
        this.forEachNode(function (n) {
            n.visited = false;
            n.type = constants.nodeTypes.unknown;
        });
    },
    countIsles: function () {
        var includeNodeTest = function (node) { return node.val === 1; };
        var validGroupTest = function (grid, node) { return true; };
        var directionType = this.includeDiagonal ? directionTypes.all : directionTypes.perpendicular;
        return this.findGroups(includeNodeTest, validGroupTest, directionType, constants.nodeTypes.island);
    },
    countLakes: function () {
        var includeNodeTest = function (node) { return node.val === 0; };
        var validGroupTest = function (grid, node) { return grid.neighbors(node, directionTypes.perpendicular).length === 4; };
        var directionType = this.includeDiagonal ? directionTypes.perpendicular : directionTypes.all;
        return this.findGroups(includeNodeTest, validGroupTest, directionType, constants.nodeTypes.lake);
    },
    findGroups: function (includeNodeTest, validGroupTest, directionType, nodeType) {
        //count groupd of nodes based on some node condition. 
        //all of the nodes in groups touch eachother horizontally or vertically
        //directionType = perpendicular or all to include only perpendicular neighbors in group or all neighbors (perpendicular & diagonal)
        this.resetNodes();

        var groupCnt = 0;
        var thisGrid = this;
        this.forEachNode(
            function (node) {
                if (node.visited) return;
                node.visited = true;

                if (!includeNodeTest(node)) return;

                thisGrid.nodeCache = new Array();
                thisGrid.validGroup = true; //until proven otherwise
                
                //this = window here, so rely on thisGrid to get to this grid object
                thisGrid.addToGroup(node, includeNodeTest, validGroupTest, directionType); //recursively add all neighbors (and neighbors of neighbors) to this group
                
                if (!thisGrid.validGroup) return;
                groupCnt++;

                //console.log(thisGrid.nodeCache);
                //console.log(thisGrid.nodeCache.length);
                //console.log(thisGrid.validGroup);

                //set the node type for all the nodes in the group
                while (thisGrid.nodeCache.length > 0) {
                    var n = thisGrid.nodeCache.pop();
                    n.type = nodeType;
                }
            }
        );  //this.forEachNode(

        return groupCnt;
    },
    addToGroup: function (node, includeNodeTest, validGroupTest, directionType) {
        //recursively add all neighbors (& neighbors of neighbors) that meet includeNodeTest to the same island as the input node
        //includeNodeTest - (first class) function which returns true if the node is to be included
        //validGroupTest - (first class) function which returns false if some property of the node renders the entire group invalid
        //directionType - a property of directionTypes object indicates whether we consider only perpendicular nodes or all nodes when searching

        this.nodeCache.push(node);
        var neighbors = this.neighbors(node, directionType);  //neighbors is an array of nodes adjacent to the input node

        while (neighbors.length > 0) {
            var neighbor = neighbors.pop();
            if (!neighbor.visited) {
                neighbor.visited = true;
                if (includeNodeTest(neighbor)) this.addToGroup(neighbor, includeNodeTest, validGroupTest, directionType);
            }
        }
        if (!validGroupTest(this, node)) this.validGroup = false;
    },


    forEachNode: function (doThis) {
        //do something to every node in the graph
        var n = this.get(0, 0);
        while (n !== null) {
            doThis(n);
            n = this.next(n);
        }
    }
}

var GridUX = function (grid, landColor, waterColor) {
    this.grid = grid;
    this.landColor = landColor;
    this.waterColor = waterColor;
}

GridUX.prototype = {
    cellClick: function (cellName, rotation) {
        var cellNameXY = cellName.substr(1, cellName.length - 1);
        var xy = cellNameXY.split(',');
        var x = parseInt(xy[0]);
        var y = parseInt(xy[1]);
        var fill;
        var stroke;

        var node = this.grid.get(x, y);
        if (node.val === 0) {
            node.val = 1;
            fill = this.landColor;
            stroke = this.waterColor;
        } else {
            node.val = 0;
            fill = this.waterColor;
            stroke = this.landColor;
        }

        $('#count').html(this.grid.countIsles());
        $('#lakecount').html(this.grid.countLakes());

        this.drawEdges();

        $('canvas').animateLayer(cellName, {
            fillStyle: fill,
            strokeStyle: stroke
        });



    },
    drawGrid: function () {
        var size = 440 / this.grid.rows;
        var fill;
        var stroke;

        $('canvas').clearCanvas();
        $('canvas').removeLayers();

        for (var row = 1; row <= this.grid.rows; row++) {
            for (var col = 1; col <= this.grid.cols; col++) {
                var cellName = 'l' + (row - 1) + ',' + (col - 1);
                var currNode = this.grid.get(row - 1, col - 1);

                if (currNode.val === 1) {
                    fill = this.landColor;
                    stroke = this.waterColor;
                } else {
                    fill = this.waterColor;
                    stroke = this.landColor;
                }

                var multiplier = 0.7;

                //add new ux related properties on the fly
                currNode.width = size * multiplier;
                currNode.height = size * multiplier;
                currNode.xcoord = (col * size * multiplier);
                currNode.ycoord = (row * size * multiplier);

                var thisObj = this;
                $('canvas').drawRect({
                    layer: true,
                    name: cellName,
                    fillStyle: fill,
                    strokeStyle: stroke,
                    x: currNode.xcoord,
                    y: currNode.ycoord,
                    width: currNode.width,
                    height: currNode.height,
                    cornerRadius: size * .00,
                    click: function (layer) {
                        thisObj.cellClick(layer.name);
                    }
                });
            }
        }
        $('#count').html(this.grid.countIsles());
        $('#lakecount').html(this.grid.countLakes());
        this.drawEdges();
    },
    drawEdges: function () {
        var thisGrid = this.grid;
        thisGrid.forEachNode(
            function (n) {
                var layerName = 'layer_' + n.x + ',' + n.y;

                for (var i in constants.directions) {
                    var direction = constants.directions[i];

                    if (direction.type === directionTypes.diagonal) continue;  //edges are between perpendicular

                    var xoffset = n.width / 2;
                    var yoffset = n.height / 2;
                    var xlength = 0;
                    var ylength = 0;

                    if (direction.val === constants.directions.left.val || direction.val === constants.directions.right.val) {
                        ylength = n.height;
                    } else {
                        xlength = n.width;
                    }

                    xoffset = (direction.val === constants.directions.right.val) ? xoffset : -n.width / 2;
                    yoffset = (direction.val === constants.directions.down.val) ? yoffset : -n.height / 2;

                    var x1 = n.xcoord + xoffset;
                    var y1 = n.ycoord + yoffset;
                    var x2 = x1 + xlength;
                    var y2 = y1 + ylength;

                    var edgeColor = '#0f0';  //green border

                    $('canvas').removeLayer(layerName + direction.val);

                    if (n.val === 0) {
                        //water cells do not have edges
                        continue;
                    }

                    var val_1 = function (checkNode) { return (checkNode.val === 1); }
                    if (thisGrid.hasNeighbor(n, direction.val, val_1)) {
                        //if land with land neighbor, no edge 
                       continue;
                    }

                    var lakeNeighbor = function (checkNode) { return (checkNode.type === constants.nodeTypes.lake); }
                    if (thisGrid.hasNeighbor(n, direction.val, lakeNeighbor)) {
                        edgeColor = '#00f';  //blue border for lakes!
                    }

                    $('canvas').drawLine({
                        layer: true,
                        name: layerName + direction.val,
                        strokeStyle: edgeColor,
                        strokeWidth: 4,
                        x1: x1, y1: y1,
                        x2: x2, y2: y2
                    });
                }  //for (var i=0; i<this.grid.directions.length; i++) {
            } //function(n) {
        ); //thisGrid.forEachNode(
    }  //drawEdges: function () {
}

var MakeGrid = function (r, c) {
    var grid = new DataGrid(r, c);
    var landColor = '#eee';
    var waterColor = '#666'
    var ux = new GridUX(grid, landColor, waterColor);
    ux.drawGrid();
    this.clear = function () {
        //clear returns a closure with access to grid and ux
        return function () {
            grid = new DataGrid(r, c);
            grid.includeDiagonal = $('#diagonals').is(":checked");
            ux = new GridUX(grid, landColor, waterColor);
            ux.drawGrid();
        }
    }
    this.reverse = function () {
        //reverse returns a closure with access to grid and ux
        return function () {
            grid.forEachNode(
                function (node) {
                    node.val = (node.val === 1) ? 0 : 1;
                }
            );
            ux = new GridUX(grid, landColor, waterColor);
            ux.drawGrid();
        }
    }
    this.toggleDiagonal = function () {
        return function () {
            grid.includeDiagonal = $('#diagonals').is(":checked");
            ux = new GridUX(grid, landColor, waterColor);
            ux.drawGrid();
        }
    }
    this.getGrid = function () { return grid; }  //helpful for debugging, but remove if you want to keep grid private
}

var mg = new MakeGrid(8, 8);
var g = mg.getGrid();  //comment this out to keep grid object private

$('#clear').on('click', mg.clear());
$('#reverse').on('click', mg.reverse());
$('#diagonals').on('change', mg.toggleDiagonal());
$("#readme").click(function () {
    $("#dialog").dialog("open");
});


//$( elem ).prop( "checked" )

$(function () {
    var myPos;
    var atPos;
    if ($(window).width() <= 340) {
        myPos = "center top";
        atPos = "center bottom";
    } else {
        myPos = "right top";
        atPos = "right+20 bottom+10";
    }
    $("#dialog").dialog({
        position: { my: myPos, at: atPos, of: "#readme" },
        width: 350,
        autoOpen: false,
        show: {
            effect: "blind",
            duration: 400
        },
        hide: {
            effect: "blind",
            duration: 400
        }
    });

});