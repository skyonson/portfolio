let field, fieldCTX;
const tileSize = 32;

// const dimensions = { x: 10, y: 10 };
// const dimensions = {
//     x: Math.floor(window.innerWidth / tileSize),
//     y: Math.floor(window.innerHeight / tileSize),
// };

// const numMines = Math.floor(dimensions.x * dimensions.y * 0.05);

let dimensions, numMines, score, game;

const checkFont = "20px sans-serif";
const mineTextColors = [
    "#2da3f1",
    "#57f848",
    "#e61212",
    "#6107c9",
    "#03ecfc",
    "#a15593",
    "#9e7627",
    "#490b19",
];

let tiles = {
    unCleared: new Image(),
    hovered: new Image(),
    cleared: new Image(),
    flagged: new Image(),
    mine: new Image(),
};

function fillRandom(num, arr, avoidIndex) {
    if (num > arr.length)
        throw new Error(
            "Cannot randomly fill more entries than elements in array"
        );
    while (arr.filter(Boolean).length < num) {
        let index = Math.floor(Math.random() * (arr.length + 1));

        if (!arr[index] && index != avoidIndex) {
            arr[index] = true;
        }
    }
}

class Minefield {
    constructor(dims, mines) {
        this.dimensions = dims;
        this.numMines = mines;
        this.mines = new Array(this.dimensions.x * this.dimensions.y);
        this.mines.fill(false);
        this.marked = new Array(this.dimensions.x * this.dimensions.y);
        this.marked.fill(false);
        this.checked = new Array(this.dimensions.x * this.dimensions.y);
        this.checked.fill(false);
        this.firstMove = true;
        this.isOver = false;
        this.timer = null;
    }
    gameOverDraw() {
        for (let i = 0; i < this.mines.length; i++) {
            if (this.mines[i] && !this.marked[i])
                fieldCTX.drawImage(
                    tiles.mine,
                    (i % dimensions.x) * tileSize,
                    Math.floor(i / dimensions.x) * tileSize
                );
        }
        this.isOver = true;
    }
    toggleMarkTile(x, y) {
        if (this.checked[this.getMinesIndex(x, y)]) return;
        this.marked[this.getMinesIndex(x, y)] =
            !this.marked[this.getMinesIndex(x, y)];
        this.drawMark(x, y);
        // score.innerText = `${this.marked.filter(Boolean).length} / ${this.numMines}`
        document.title = `${this.marked.filter(Boolean).length} / ${
            this.numMines
        }`;
    }
    drawMark(x, y) {
        fieldCTX.drawImage(
            this.marked[this.getMinesIndex(x, y)]
                ? tiles.flagged
                : tiles.unCleared,
            x * tileSize,
            y * tileSize
        );
    }
    revealTile(x, y) {
        if (this.firstMove) {
            fillRandom(this.numMines, this.mines, this.getMinesIndex(x, y));
            this.firstMove = false;
            this.timer = new Date();
        }

        if (
            this.checked[this.getMinesIndex(x, y)] ||
            this.marked[this.getMinesIndex(x, y)]
        )
            return;
        this.checked[this.getMinesIndex(x, y)] = true;
        if (this.checkMineNeighbors(x, y) == -1) this.gameOverDraw();
        else if (this.checkMineNeighbors(x, y) == 0) {
            fieldCTX.drawImage(tiles.cleared, x * tileSize, y * tileSize);
            if (x + 1 < this.dimensions.x) this.revealTile(x + 1, y);
            if (x - 1 >= 0) this.revealTile(x - 1, y);
            if (y + 1 < this.dimensions.y) this.revealTile(x, y + 1);
            if (y - 1 >= 0) this.revealTile(x, y - 1);

            if (x + 1 < this.dimensions.x && y + 1 < this.dimensions.y)
                this.revealTile(x + 1, y + 1);
            if (x - 1 >= 0 && y - 1 >= 0) this.revealTile(x - 1, y - 1);
            if (x - 1 >= 0 && y + 1 < this.dimensions.y)
                this.revealTile(x - 1, y + 1);
            if (x + 1 < this.dimensions.x && y - 1 >= 0)
                this.revealTile(x + 1, y - 1);
        } else {
            fieldCTX.drawImage(tiles.cleared, x * tileSize, y * tileSize);
            this.drawText(x, y, this.checkMineNeighbors(x, y));
        }
        if (
            this.checked.filter(Boolean).length ==
                this.dimensions.x * this.dimensions.y - this.numMines &&
            !this.isOver
        ) {
            fieldCTX.textBaseline = "middle";
            fieldCTX.textAlign = "center";
            fieldCTX.font = `${field.height / 6}px sans-serif`;
            fieldCTX.fillStyle = "#FF6666";
            fieldCTX.fillText("YOU WIN!", field.width / 2, field.height / 2);

            // alert("You Win!");
        }
    }
    drawText(x, y, number) {
        fieldCTX.font = checkFont;
        fieldCTX.textBaseline = "middle";
        fieldCTX.textAlign = "center";
        fieldCTX.fillStyle = mineTextColors[number - 1];
        fieldCTX.fillText(number, (x + 0.5) * tileSize, (y + 0.5) * tileSize);
    }
    checkMineNeighbors(x, y) {
        if (this.checkMine(x, y)) {
            return -1;
        } else {
            let num = 0;
            let toCheck = [
                [-1, -1],
                [-1, 0],
                [-1, 1],
                [0, -1],
                [0, 1],
                [1, -1],
                [1, 0],
                [1, 1],
            ];
            for (let i = 0; i < toCheck.length; i++) {
                num += this.checkMine(x + toCheck[i][0], y + toCheck[i][1])
                    ? 1
                    : 0;
            }
            return num;
        }
    }
    checkMine(x, y) {
        return this.getMinesIndex(x, y) < 0 ||
            this.getMinesIndex(x, y) > this.mines.length - 1 ||
            x < 0 ||
            x > this.dimensions.x - 1 ||
            y < 0 ||
            y > this.dimensions.y - 1
            ? false
            : this.mines[this.getMinesIndex(x, y)];
    }
    getMinesIndex(x, y) {
        return x + y * this.dimensions.x;
    }
}

function initialize() {
    if (!dimensions) {
        dimensions = {
            x: Math.floor(document.getElementById("boardWidth").value),
            y: Math.floor(document.getElementById("boardHeight").value),
        };
    }
    if (!numMines) {
        numMines = Math.floor(
            dimensions.x *
                dimensions.y *
                document.getElementById("minePercent").value
        );
    }

    document.getElementById("starter").style.display = "none";

    if (!document.getElementById("minefield")) {
        document.body.innerHTML += `<canvas
        id="minefield"
        class="minefield"
        oncontextmenu="return false;"
    ></canvas>`;
    }
    field = document.getElementById("minefield");
    fieldCTX = field.getContext("2d");

    tiles.unCleared.src = "assets/unClearedTile.png";
    tiles.hovered.src = "assets/hoveredTile.png";
    tiles.cleared.src = "assets/clearedTile.png";
    tiles.flagged.src = "assets/flaggedTile.png";
    tiles.mine.src = "assets/explodedTile.png";

    field.width = tileSize * dimensions.x;
    field.height = tileSize * dimensions.y;

    tiles.unCleared.onload = function () {
        for (let i = 0; i < dimensions.x * dimensions.y; i++) {
            fieldCTX.drawImage(
                tiles.unCleared,
                (i % dimensions.x) * tileSize,
                Math.floor(i / dimensions.x) * tileSize
            );
        }
    };
    game = new Minefield(dimensions, numMines);
    score = document.getElementById("remaining");
    document.title = `${game.marked.filter(Boolean).length} / ${game.numMines}`;
    field.onmousedown = getCursorPosition;
}

function getCursorPosition(e) {
    const rect = field.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / tileSize);
    const y = Math.floor((e.clientY - rect.top) / tileSize);
    if (game.isOver) initialize();
    else if (e.buttons == 1) {
        game.revealTile(x, y);
        e.preventDefault();
    } else if (e.buttons == 2) {
        game.toggleMarkTile(x, y);
        e.preventDefault();
    }
}
