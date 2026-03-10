
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
        this.cellsTable = new Array(this.sideLength).fill(null).map(el => new Array(this.sideLength).fill(null));
        this.status = "playing";      // 'playing' | 'won' | 'lost'
        this.flaggedCorrectlyCount = 0;
        this.bombsCount = 0;
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

    getCellData(i, j) {
        return this.cellsTable[i][j];
    }

    toggleFlagCell(i, j) {
        const currentCell = this.cellsTable[i][j];
        currentCell.toggleFlag();
        this.#updateFlaggedData(currentCell);
        this.#checkGameWin();
    }

    revealCell(i, j) {
        const currentCell = this.cellsTable[i][j];
        if (currentCell.isBomb) {
            this.status = 'lost';
            return;
        }
        currentCell.neighborBombs = this.#countSurroundingsBombs(i, j);
        currentCell.reveal();
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

    #countSurroundingsBombs(i, j) {
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

    #updateFlaggedData(cell) {
        if (cell.isFlagged && cell.isBomb) {
            this.flaggedCorrectlyCount += 1;
        } else if (!cell.isFlagged && cell.isBomb) {
            this.flaggedCorrectlyCount -= 1;
        }
    }

    #checkGameWin() {
        if (this.bombsCount == this.flaggedCorrectlyCount) {
            this.status = 'win';
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
        this.cellsElements = new Array(sideLength).fill(null).map(el => new Array(sideLength).fill(null))
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
        this.rootElement.appendChild(gridElement);
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
    }

    checkGameStatus() {
        if (this.gridModel.status == "lost") {
            const bombsPositions = this.gridModel.getBombsPositions();
            this.view.playBombRevealAnimation(bombsPositions);
        }
        else if (this.gridModel.status == "win") {
            alert('Win');
        }

    }

    handleReveal(i, j) {
        if (this.gridModel.status != "playing") return;
        this.gridModel.revealCell(i, j);
        this.syncCellWithView(i, j);
        this.checkGameStatus();
    }

    handleToggleflag(i, j) {
        if (this.gridModel.status != "playing") return;
        this.gridModel.toggleFlagCell(i, j);
        this.syncCellWithView(i, j);
        this.checkGameStatus();
    }

    syncCellWithView(i, j) {
        const cellData = this.gridModel.getCellData(i, j);
        this.view.renderCell(cellData);
    }
}

const app = document.getElementById('app');

const SIZE = 10;

app.style.setProperty("--side", SIZE)
const grid = new Grid(SIZE);
const gameView = new GameView(app);
const gameController = new GameController(grid, gameView);