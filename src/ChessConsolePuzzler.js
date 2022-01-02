
import {ChessConsole} from "../lib/chess-console/ChessConsole.js"

export const consoleMessageTopics = {
    newGame: "game/new", // if a new game was startet
    initGame: "game/init", // after a page reload and when a new game was started
    gameOver: "game/over",
    moveRequest: "game/moveRequest",
    legalMove: "game/move/legal",
    illegalMove: "game/move/illegal",
    moveUndone: "game/move/undone", // mainly for sound
    load: "game/load"
}

export class ChessPuzzler extends ChessConsole {

    provideSolution(solution) {
        this.wrongMove = false;
        this.wrongIndex = -1;
        this.solution = solution;
        this.moves = [];
        for (let m of solution) {
            this.moves.push(m);
        }
        if (!this.resetAdded) {
            this.$btnReset = $(`<button type="button" title="Reset" class="btn btn-icon btn-light reset"><i class="fas fa-sync-alt" aria-hidden="true"></i></button>`)
            this.componentContainers.controlButtons.appendChild(this.$btnReset[0]);

            this.$btnReset.click(() => {
                this.resetSolution();
                this.initGame({
                    playerColor: this.props.playerColor,
                    pgn: this.props.pgn
                });
            })
            this.resetAdded = true;
        }
        if (this.sol === undefined) {
            this.sol = document.createElement("div");
            this.sol.className = "solution";
            this.componentContainers.controlButtons.appendChild(this.sol);
        } else {
            this.clearSolutionRows();
        }
        
        
        
    }
    clearSolutionRows() {
        var solRows = this.componentContainers.controlButtons.getElementsByClassName("solution");
        if (solRows !== undefined && solRows.length > 0) {
            solRows[0].innerHTML = "";
        }
    }
    resetSolution() {
        
        this.clearSolutionRows();

        if (this.solution !== undefined && this.solution.length > 0) {
            this.moves = [];
            for (let m of this.solution) {
                this.moves.push(m);
            }
        }
        this.wrongMove = false;
        this.wrongIndex = -1;
        this.componentContainers.notifications.style.display = "none"
    }
    undoSolution() {

        var solRows = this.sol.getElementsByClassName("sol-line");
        if (solRows !== undefined && solRows.length > 0) {
            var row = solRows[solRows.length - 1];
            row.parentNode.removeChild(row);
        }

        var clearWrong = false;
        if (this.solution !== undefined && this.solution.length > 0) {
            if (this.solution.length > this.moves.length) {
                if (this.wrongIndex === this.moves.length) {
                    clearWrong = true;
                }
                this.moves.push(this.solution[this.moves.length]);
                
            }
            if (!this.wrongMove) {
                if (this.wrongIndex === this.moves.length) {
                    clearWrong = true;
                }
                if (this.solution.length > this.moves.length) {
                    this.moves.push(this.solution[this.moves.length]);
                }
            }
        }
        if (clearWrong) {
            this.wrongMove = false;
            this.wrongIndex = -1;
        }
        this.componentContainers.notifications.style.display = "none"
    }
    puzzleComplete() {
        if (this.solution !== undefined && this.solution.length > 0) {
            if (this.moves.length === 0 && !this.wrongMove) {
                return true;
            }
        }
        return false;
    }

    solutionToMove(m) {
        if (m.to !== undefined) {
            return m;
        }
        var move = {
            "san": m,
            "to": m.toString().replace(/[KQBNRx+#]/g, ""),
        };
        console.log(`got move: ${JSON.stringify(move)}`);
        return move;
    }
    moveText(move) {
        if (move.san !== undefined) {
            return move.san;
        }
        var str = "";
        if (move.from !== undefined) {
            str += `${move.from}-`
        }
        if (move.to !== undefined) {
            str += `${move.to}`
        }
        return str;
    }
    showComplete() {
        console.log("Puzzle Complete");
        this.componentContainers.notifications.style.display = "block"
        var elements = this.componentContainers.notifications.getElementsByClassName("gameState");
        elements[0].innerHTML = `Puzzle Complete!`
    }
    nextMove() {
        const playerToMove = this.playerToMove()
        if (playerToMove) {
            
            if (this.moves !== undefined && this.moves.length > 0 && !this.wrongMove) {
                var solution = this.moves.shift();
                var checkMove = this.solutionToMove(solution);
                console.log(`correct move: ${JSON.stringify(solution)}`);
                if (solution === "*" || solution === "1-0" || solution == "0-1") {
                    return this.showComplete();
                }

                if (playerToMove.props.local) {
                    console.log(`Wait for local player`);
                    this.messageBroker.publish(consoleMessageTopics.moveRequest, {playerToMove: playerToMove})
                    setTimeout(() => {
                        playerToMove.moveRequest(this.state.chess.fen(), (move) => {
                            var wrong = false;
                            if (move.san !== undefined && checkMove.san !== undefined) {
                                if (move.san !== checkMove.san) {
                                    wrong = true;
                                }
                            }
                            else if (move.to !== checkMove.to) {
                                wrong = true;
                                
                            } else if (solution.from !== undefined) {
                                if (move.from !== checkMove.from) {
                                    wrong = true;
                                }   
                            }
                            if (wrong) {
                                this.wrongMove = true;
                                this.wrongIndex = this.moves.length;
                                console.log(`player move = ${JSON.stringify(move)}`);
                                console.log(`correct move = ${JSON.stringify(checkMove)}`);
                                
                                const div = document.createElement("div");
                                div.className = "sol-line m-1";
                                div.innerHTML = `<i class="fas fa-times-circle iconWrong"></i></i> ${this.moveText(move)}`;
                                this.sol.appendChild(div);

                            } else {
                                const div = document.createElement("div");
                                div.className = "sol-line m-1";
                                div.innerHTML = `<i class="fas fa-check-circle iconCorrect"></i></i> ${this.moveText(move)}`;
                                this.sol.appendChild(div);
                            }
                            console.log(`player correct move = ${!wrong}`);
                            return this.handleMoveResponse(move)
                        })
                    })
                }
                else {
                    console.log(`Moving not local player`);
                    return this.handleMoveResponse(solution);
                }
            }
            else if (this.puzzleComplete()) {
                this.showComplete();
            }
            else {
                
                this.messageBroker.publish(consoleMessageTopics.moveRequest, {playerToMove: playerToMove})
                setTimeout(() => {
                    playerToMove.moveRequest(this.state.chess.fen(), (move) => {
                        return this.handleMoveResponse(move)
                    })
                })
            }            
        }
    }

    undoMove() {
        this.state.chess.undo()
        if (this.playerToMove() !== this.player) {
            this.state.chess.undo()
        }
        if (this.state.plyViewed > this.state.chess.plyCount()) {
            this.state.plyViewed = this.state.chess.plyCount()
        }
        this.messageBroker.publish(consoleMessageTopics.moveUndone)
        this.undoSolution();
        this.nextMove()
    }
}