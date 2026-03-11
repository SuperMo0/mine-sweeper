
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function initilizeGrid(width, height) {
    return new Array(width).fill(null).map(el => new Array(height).fill(null));
}
class Cell {
    constructor(isBomb, i, j) {
        this.i = i;
        this.j = j;
        this.isBomb = isBomb;
        this.isFlagged = false;
        this.isRevealed = false;
        this.neighborBombs = 0;
    }

    reveal() {
        if (!this.isRevealed) {
            this.isRevealed = true;
        }
    }
    toggleFlag() {
        if (!this.isRevealed) {
            this.isFlagged = !this.isFlagged
        }
    }
}

class Grid {
    constructor(sideLength) {
        this.sideLength = sideLength || 10;
        this.cellsTable = initilizeGrid(this.sideLength, this.sideLength);
        this.status = "playing";      // 'playing' | 'won' | 'lost'
        this.flaggedCount = 0;
        this.bombsCount = 0;
        this.revealedCount = 0;
        this.initiateGrid();
    }
    initiateGrid() {
        for (let i = 0; i < this.sideLength; i++) {
            for (let j = 0; j < this.sideLength; j++) {
                const isBomb = Math.random() < 0.1;
                const crntCell = new Cell(isBomb, i, j);
                this.bombsCount += isBomb;
                this.cellsTable[i][j] = crntCell;
            }
        }
    }

    toggleFlagCell(i, j) {
        const currentCell = this.cellsTable[i][j];
        currentCell.toggleFlag();
        currentCell.isFlagged ? this.flaggedCount += 1 : this.flaggedCount -= 1;
        return [currentCell];
    }

    revealCell(i, j) {
        const currentCell = this.cellsTable[i][j];
        if (currentCell.isBomb) {
            this.status = 'lost';
            return [];
        }
        const updatedCells = [];
        this.floodFill(i, j, updatedCells);
        this.revealedCount += updatedCells.length;
        this.checkGameWin();
        return updatedCells;
    }

    getBombsPositions() {
        const cells = [];
        for (const row of this.cellsTable) {
            for (const cell of row) {
                if (cell.isBomb) {
                    cells.push(cell);
                }
            }
        }
        return cells;
    }

    countSurroundingsBombs(i, j) {
        let count = 0;
        let nextI, nextJ;
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                nextI = i + di;
                nextJ = j + dj;
                if (nextI < 0 || nextI >= this.sideLength || nextJ < 0 || nextJ >= this.sideLength) {
                    continue;
                }
                if (this.cellsTable[nextI][nextJ].isBomb) {
                    count++;
                }
            }
        }
        return count;
    }

    checkGameWin() {
        if (this.revealedCount == this.sideLength ** 2 - this.bombsCount) {
            this.status = 'win';
        }
    }

    floodFill(i, j, updatedCells) {

        if (i < 0 || i >= this.sideLength || j < 0 || j >= this.sideLength) {
            return;
        }
        const currentCell = this.cellsTable[i][j];
        if (currentCell.isRevealed) {
            return;
        }
        currentCell.neighborBombs = this.countSurroundingsBombs(i, j);
        currentCell.reveal();
        updatedCells.push(currentCell);
        if (currentCell.neighborBombs != 0) {
            return;
        }
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                const nextI = i + di;
                const nextJ = j + dj;
                this.floodFill(nextI, nextJ, updatedCells);
            }
        }
    }
    getStats() {
        return {
            remainingFlagsCount: this.bombsCount - this.flaggedCount
        }
    }
}

class GameView {

    gridElement;
    cellsElements;
    rootElement;

    constructor(rootElement) {
        this.rootElement = rootElement;
    }

    buildGrid(sideLength) {
        this.cellsElements = initilizeGrid(sideLength, sideLength);
        const gridElement = document.createElement('div');
        gridElement.classList.add('grid');
        for (let i = 0; i < sideLength; i++) {
            for (let j = 0; j < sideLength; j++) {
                const cellElement = document.createElement('div');
                cellElement.classList.add('cell');
                cellElement.dataset.i = i;
                cellElement.dataset.j = j;
                this.cellsElements[i][j] = cellElement;
                gridElement.appendChild(cellElement);
            }
        }
        this.gridElement = gridElement;
        this.rootElement.querySelector('.grid-container').appendChild(gridElement);
    }

    onCellLeftClick(callback) {
        this.gridElement.addEventListener("click", (e) => {
            if (!e.target.classList.contains('cell')) return;
            const i = parseInt(e.target.dataset.i);
            const j = parseInt(e.target.dataset.j);
            callback(i, j);
        })
    }

    onCellRightClick(callback) {
        this.gridElement.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (!e.target.classList.contains('cell')) return;
            const i = parseInt(e.target.dataset.i);
            const j = parseInt(e.target.dataset.j);
            callback(i, j);
        })
    }
    renderCells(updatedCells) {
        for (const cell of updatedCells) {
            this.renderCell(cell);
        }
    }

    renderStats(stats) {
        this.rootElement.querySelector(".remaining-flags-count").textContent = stats.remainingFlagsCount;
    }


    renderCell(cellData) {
        const i = cellData.i;
        const j = cellData.j;
        const cellElement = this.cellsElements[i][j];
        if (cellData.isRevealed) {
            if (cellData.isBomb) {
                cellElement.textContent = "💣";
            }
            else {
                cellElement.textContent = cellData.neighborBombs;
            }
        }
        else if (cellData.isFlagged) {
            cellElement.textContent = "🚩";
        }
        else cellElement.textContent = "";
    }

    async playBombRevealAnimation(bombsArray) {
        for (const cell of bombsArray) {
            const i = cell.i;
            const j = cell.j;
            this.cellsElements[i][j].textContent = "💣";
            await sleep(100);
        }
    }
}

class GameController {
    constructor(gridModel, view) {
        this.gridModel = gridModel;
        this.view = view;

        this.view.buildGrid(gridModel.sideLength);

        this.view.onCellLeftClick(this.handleReveal.bind(this));
        this.view.onCellRightClick(this.handleToggleflag.bind(this));
        this.syncStatsWithView();

    }

    handleReveal(i, j) {
        if (this.gridModel.status != "playing") return;
        const updatedCells = this.gridModel.revealCell(i, j);
        this.decideNextMove(updatedCells);
    }

    handleToggleflag(i, j) {
        if (this.gridModel.status != "playing") return;
        const updatedCells = this.gridModel.toggleFlagCell(i, j);
        this.decideNextMove(updatedCells);
    }

    decideNextMove(updatedCells) {
        if (this.gridModel.status === "win") {
            this.handleGameWin();
        } else if (this.gridModel.status === "lost") {
            this.handleGameLost();
        } else {
            this.syncCellsWithView(updatedCells);
        }
        this.syncStatsWithView();
    }

    syncStatsWithView() {
        this.view.renderStats(this.gridModel.getStats());
    }
    handleGameLost() {
        const bombsPositions = this.gridModel.getBombsPositions();
        this.view.playBombRevealAnimation(bombsPositions);
    }
    handleGameWin() {
        alert("Congrats you won");
    }

    syncCellsWithView(updatedCells) {
        this.view.renderCells(updatedCells);
    }
}

const app = document.getElementById('app');

const SIZE = 10;

app.style.setProperty("--side", SIZE)
const grid = new Grid(SIZE);
const gameView = new GameView(app);
const gameController = new GameController(grid, gameView);