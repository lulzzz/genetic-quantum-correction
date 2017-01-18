/*jslint todo:true, devel:true */
/*global $, document*/
//------------------------------------------------------------------------------
// QUANTUM ERROR CORRECTION CODE
//------------------------------------------------------------------------------
// INPUT: A 8*8 grid of values or game over
// OUTPUT: A list of 10 numbers describing grid movements

// Game mechanics
// TODO: Implement game over high score save
// TODO: Create a historical 3D view of the propagation and merging of clusters
// TODO: redisplay using threeJS
// TODO: Switch to class code
// TODO: Implement TDD
// TODO: X and Y are switched
// Display
// TODO: Persist gametype display
// TODO: Display first selected cell with bold
// TODO: Prune null cluster to free css color classes
// AI
// TODO: Implement self playing AI
// TODO: Implement a js eval textarea field where you can test your AI
// TODO: Each error creates a -/+ polarity when two common polarities touch they switch
// TODO: List connected clusters with flood fill
// TODO: Height of the center of the cluster, that gives a score to the cluster
// TODO: Use genetic algorithm to guide towards best solving patterns
// Network
// TODO: Migrate the error generation part to avoid cheating
// TODO: Create a highscore chart


// GLOBAL VARIABLES
var gridSize = 8;
var secs = 0;
var d = 10;
var clusterNum = 0;
var type = "Number";
var score = 0;
var errorRate = 5;
var gameOver = false;

// INITIALIZE CLUSTERS & ANYONS ARRAY
var anyons = [];
var clusters = [];
var clusterList = [];


//------------------------GAME LOGIC--------------------------------------------
// RESET CLUSTER GRID AND ANYONS
function resetAnyons() {
    "use strict";
    var secs, x, y;
    clusterList = [];
    for (secs = 0; secs < 50; secs += 1) {
        anyons[secs] = [];
        for (x = 0; x < gridSize; x += 1) {
            anyons[secs][x] = [];
            clusters[x] = [];
            for (y = 0; y < gridSize; y += 1) {
                anyons[secs][x][y] = 0;
            }
        }
    }
}


// GENERATE NOISE
function generateError() {
    "use strict";
    var x1, y1, x2, y2, r, a, aa, num, clusterOld, x, y;
    // Pick a random square
    x1 = Math.floor(Math.random() * gridSize);
    y1 = Math.floor(Math.random() * gridSize);
    r = 2 * (Math.floor(Math.random() * 100) % 2) - 1;
    a = Math.floor(Math.random() * 9) + 1;
    aa = 10 - a;
    num = 0;

    // Random neighbour
    if (Math.random() < 0.5) {
        if (x1 === 0 || x1 === gridSize - 1) {
            x2 = x1 + (x1 === 0) - (x1 === (gridSize - 1));
        } else {
            x2 = x1 + r;
        }
        y2 = y1;
    } else {
        x2 = x1;
        if (y1 === 0 || y1 === gridSize - 1) {
            y2 = y1 + (y1 === 0) - (y1 === (gridSize - 1));
        } else {
            y2 = y1 + r;
        }
    }

    // Add new error to new cluster
    if (anyons[secs % 50][x1][y1] === 0 && anyons[secs % 50][x2][y2] === 0) {
        anyons[secs % 50][x1][y1] = a;
        anyons[secs % 50][x2][y2] = aa;
        clusterNum += 1;
        clusters[x1][y1] = clusterNum;
        clusters[x2][y2] = clusterNum;
        num += 1;

        // Add new error to existing cluster
    } else if (anyons[secs % 50][x1][y1] === 0 && anyons[secs % 50][x2][y2] > 0) {
        anyons[secs % 50][x1][y1] = (a + anyons[secs % 50][x1][y1]) % d;
        anyons[secs % 50][x2][y2] = (aa + anyons[secs % 50][x2][y2]) % d;
        clusters[x1][y1] = clusters[x2][y2];
        clusters[x2][y2] = clusters[x2][y2] * (anyons[secs % 50][x2][y2] > 0);
        num += 1;
    } else if (anyons[secs % 50][x1][y1] > 0 && anyons[secs % 50][x2][y2] === 0) {
        anyons[secs % 50][x1][y1] = (a + anyons[secs % 50][x1][y1]) % d;
        anyons[secs % 50][x2][y2] = (aa + anyons[secs % 50][x2][y2]) % d;
        clusters[x2][y2] = clusters[x1][y1];
        clusters[x1][y1] = clusters[x1][y1] * (anyons[secs % 50][x1][y1] > 0);
        num += 1;

        // Merge with existing cluster or merge clusters
    } else if (anyons[secs % 50][x1][y1] > 0 && anyons[secs % 50][x2][y2] > 0) {
        clusterOld = clusters[x2][y2];
        for (y = 0; y < gridSize; y += 1) {
            for (x = 0; x < gridSize; x += 1) {
                if (clusters[x][y] === clusterOld) {
                    clusters[x][y] = clusters[x1][y1];
                }
            }
        }
        anyons[secs % 50][x1][y1] = (a + anyons[secs % 50][x1][y1]) % d;
        anyons[secs % 50][x2][y2] = (aa + anyons[secs % 50][x2][y2]) % d;
        clusters[x1][y1] = clusters[x1][y1] * (anyons[secs % 50][x1][y1] > 0);
        clusters[x2][y2] = clusters[x2][y2] * (anyons[secs % 50][x2][y2] > 0);
        // these are counted less towards num
        num += 0.1;
    }
    return [x1, y1, x2, y2, num];
}


// GENERATE NOISE
function generateNoise() {
    "use strict";
    var num, errorList, error;
    num = 0;
    errorList = [];
    while (num < 6) {
        error = generateError();
        errorList.push(error[0], error[1], error[2], error[3]);
        num += error[4];
    }
    return errorList;
}


// CHECK SPANNERS
function checkSpanners() {
    "use strict";
    var spanners, x, y;
    spanners = 0;
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            spanners += (clusters[x][0] === clusters[y][gridSize - 1]) * clusters[x][0];
            spanners += (clusters[0][x] === clusters[gridSize - 1][y]) * clusters[0][x];
        }
    }
    if (spanners > 0) {
        return true;
    }
}


// COUNT ANYONS
function countAnyons() {
    "use strict";
    var count, x, y;
    count = 0;
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            if (anyons[secs % 50][x][y] !== 0) {
                count += 1;
            }
        }
    }
    return count;
}


// COUNT MOVES
function countMoves() {
    "use strict";
    var x, y;
    secs += 1;
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            anyons[secs % 50][x][y] = anyons[(secs - 1) % 50][x][y];
        }
    }
    return secs;
}


// ORDERED CLUSTER LIST
function generateClusterList() {
    "use strict";
    var clust, x, y;
    clusterList = [];
    for (clust = 0; clust < clusterNum + 1; clust += 1) {
        clusterList[clust] = [];
        for (x = 0; x < gridSize; x += 1) {
            for (y = 0; y < gridSize; y += 1) {
                if (clusters[x][y] === clust && clusters[x][y] !== 0) {
                    clusterList[clust].push([x, y]);
                }
            }
        }
    }
    clusterList.sort(function (a, b) {
        return b.length - a.length;
    });
}


// MOVES
function move(x1, y1, x2, y2) {
    "use strict";
    var oldCluster, x, y, newVal;
    countMoves();
    console.log("Move from [" + x1 + ", " + y1 + "][" + clusters[x1][y1] + "] to [" + x2 + ", " + y2 + "][" + clusters[x2][y2] + "]");
    newVal = (anyons[secs % 50][x1][y1] + anyons[secs % 50][x2][y2]) % d;
    anyons[secs % 50][x1][y1] = 0;
    anyons[secs % 50][x2][y2] = newVal;

    // link clusters or move to empty cell
    if (clusters[x2][y2] !== undefined) {
        oldCluster = clusters[x1][y1];
        for (x = 0; x < gridSize; x += 1) {
            for (y = 0; y < gridSize; y += 1) {
                if (clusters[x][y] === oldCluster) {
                    clusters[x][y] = clusters[x2][y2];
                }
            }
        }
    } else {
        clusters[x2][y2] = clusters[x1][y1];
        clusters[x1][y1] = undefined;
    }

    // check for spanners
    if (checkSpanners() === true) {
        gameOver = true;
        alert('GAME OVER!');

    } else {
        // empty anyons array
        if (countAnyons() === 0) {
            while ((secs % errorRate) > 0) {
                countMoves();
            }
        }
        // generate noise
        if (secs % errorRate === 0) {
            generateNoise();
        }
    }
    return newVal;
}


//------------------------DISPLAY-----------------------------------------------
// INIT GRID
function initGrid() {
    "use strict";
    var x, y, row, rowData;
    for (y = 0; y < gridSize; y += 1) {
        row = $('<tr></tr>');
        for (x = 0; x < gridSize; x += 1) {
            rowData = $('<td></td>');
            row.append(rowData);
        }
        $('#grid tbody').append(row);
    }
}


// RESET GRID
function resetGrid() {
    "use strict";
    var x, y, cell, $cell;
    for (x = 0; x < gridSize; x += 1) {
        for (y = 0; y < gridSize; y += 1) {
            cell = $('#grid tbody')[0].rows[x].cells[y];
            $cell = $(cell);
            $cell.html(" ");
            $cell.removeClass();
        }
    }
}


// UPDATE CELL
function updateCell(x, y, val) {
    "use strict";
    var cell, $cell;
    cell = $('#grid tbody')[0].rows[x].cells[y];
    $cell = $(cell);
    if (val === 0) {
        $cell.html("");
        $cell.removeClass();
    } else {
        $cell.html(val);
        $cell.removeClass();
        $cell.addClass('group' + clusters[x][y]);
    }
}


// DRAW GRID
function displayGrid() {
    "use strict";
    var x, y;
    for (y = 0; y < gridSize; y += 1) {
        for (x = 0; x < gridSize; x += 1) {
            if (anyons[secs % 50][x][y] !== 0) {
                switch (type) {
                case "Number":
                    updateCell(x, y, anyons[secs % 50][x][y]);
                    break;
                case "Phi":
                    if (anyons[secs % 50][x][y] === 5) {
                        updateCell(x, y, "V");
                    } else {
                        updateCell(x, y, "#");
                    }
                    break;
                case "Cluster":
                    updateCell(x, y, clusters[x][y]);
                    break;
                }
            }
        }
    }
}


//------------------------HELPERS-----------------------------------------------
// GET ADJACENT CELLS
function adjacentCells(x, y) {
    "use strict";
    var cells;
    cells = [];
    // get up
    if (x > 1) {
        cells.push([x - 1, y]);
    }
    // get down
    if (x < gridSize - 1) {
        cells.push([x + 1, y]);
    }
    // get left
    if (y > 1) {
        cells.push([x, y - 1]);
    }
    // get right
    if (y < gridSize - 1) {
        cells.push([x, y + 1]);
    }
    console.log(cells.toString());
    return cells;
}


// FILTER BLANK CELLS
function filterBlankCells(cells) {
    "use strict";
    var fullCells, i;
    fullCells = [];
    for (i = 0; i < cells.length; i += 1) {
        if (anyons[secs % 50][cells[i][0]][cells[i][1]] !== 0) {
            fullCells.push(cells[i]);
        }
    }
    console.log(fullCells.toString());
    return fullCells;
}


// GET ADJACENT CLUSTER
function adjacentCluster(x, y) {
    "use strict";
    var cluster, queue, current;
    cluster = [];
    queue = [];
    // until queue is empty
    while (queue.length > 0) {
        // get last item in queue
        current = queue.pop();

        // save it in cluster
        cluster.push(current);
        // add adjacent cells
        queue.push(adjacentCells(current[x], current[y]));
    }
    return cluster;
}


// HIGHLIGHT CELLS
function highlightCells(cells) {
    "use strict";
    var i, x, y, cell, $cell;
    for (i = 0; i < cells.length; i += 1) {
        x = cells[i][0];
        y = cells[i][1];
        cell = $('#grid tbody')[0].rows[x].cells[y];
        $cell = $(cell);
        $cell.toggleClass('highlight');
    }
}


//------------------------CONTROLS----------------------------------------------
// CLUSTER THREAT LEVEL
function threatLevel(cluster) {
    "use strict";
    var threatX, threatY;
    cluster.sort(function (a, b) {
        return a[0] - b[0];
    });
    threatX = cluster[cluster.length - 1][0] - cluster[0][0];
    cluster.sort(function (a, b) {
        return a[1] - b[1];
    });
    threatY = cluster[cluster.length - 1][1] - cluster[0][1];
    return threatX + threatY;
}


// DISPLAY CLUSTERS
function displayClusters() {
    "use strict";
    var x, row;
    $('#clusters tbody').empty();
    for (x = 0; x < clusterList.length; x += 1) {
        row = "";
        row += "<tr>";
        row += "<td>" + x + "</td>";
        row += "<td>" + clusterList[x].length + "</td>";
        row += "<td>" + threatLevel(clusterList[x]) + "</td>";
        row += "<td>" + clusterList[x].toString() + "</td>";
        row += "</tr>";
        $('#clusters tbody').append(row);
    }
}


//------------------------MAIN--------------------------------------------------
// NEW GAME
function newGame() {
    "use strict";
    secs = 0;
    clusterNum = 0;
    score = 0;
    resetAnyons();
    resetGrid();
    generateNoise();
    if (checkSpanners()) {
        newGame();
    }
    displayGrid();
}


$(document).ready(function () {
    "use strict";
    var dragging, fromX, fromY, x, y, newVal;
    initGrid();
    newGame();

    // Player moves
    dragging = false;
    $("#grid tbody td").click(function () {
        y = parseInt($(this).index(), 10);
        x = parseInt($(this).parent().index(), 10);
        // Start move
        if (dragging === false) {
            fromX = x;
            fromY = y;
            dragging = true;
        } else if (dragging === true && fromX === x && fromY === y) {
            dragging = false;
        } else if (dragging === true && (
                (fromX + 1 === x && fromY === y) ||
                (fromX - 1 === x && fromY === y) ||
                (fromX === x && fromY + 1 === y) ||
                (fromX === x && fromY - 1 === y)
            )
                ) {
            newVal = move(fromX, fromY, x, y);
            updateCell(fromX, fromY, 0);
            updateCell(x, y, newVal);
            dragging = false;

        } else {
            console.log("Movement error...");
            dragging = false;
        }
        displayGrid();
    });

    // Debug position
    $("#grid tbody td").hover(function () {
        y = parseInt($(this).index(), 10);
        x = parseInt($(this).parent().index(), 10);
        var cells;
        $("#coord").html("[" + x + ", " + y + "]");
        cells = adjacentCells(x, y);
        cells = filterBlankCells(cells);
        highlightCells(cells);
    });


    // Controls
    $("#newgame").click(function () {
        newGame();
    });
    $("#error").click(function () {
        generateError();
        displayGrid();
    });
    $("input[name='gametype']").change(function () {
        type = $(this).val();
        console.log(type);
        displayGrid();
    });
});