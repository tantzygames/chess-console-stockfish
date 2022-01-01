import {ChessConsole} from "./lib/chess-console/ChessConsole.js"
import {ChessPuzzler} from "./src/ChessConsolePuzzler.js"
import {LocalPlayer} from "./lib/chess-console/players/LocalPlayer.js"
import {Board} from "./lib/chess-console/components/Board/Board.js"
import {GameStateOutput} from "./lib/chess-console/components/GameStateOutput.js"
import {History} from "./lib/chess-console/components/History.js"
import {CapturedPieces} from "./lib/chess-console/components/CapturedPieces.js"
import {HistoryControl} from "./lib/chess-console/components/HistoryControl.js"
import {Persistence} from "./lib/chess-console/components/Persistence.js"
import {Sound} from "./lib/chess-console/components/Sound.js"

import {StockfishGameControl} from "./src/chess-console-stockfish/StockfishGameControl.js"
//import {StockfishPlayer} from "./src/chess-console-stockfish/StockfishPlayer.js"
import {PuzzlePlayer} from "./src/PuzzlePlayer.js"
import {StockfishStateView} from "./src/chess-console-stockfish/StockfishStateView.js"
import {I18n} from "./lib/cm-web-modules/i18n/I18n.js"
//import {INPUT_EVENT_TYPE, COLOR, Chessboard, MARKER_TYPE, BORDER_TYPE} from "./lib/cm-chessboard/Chessboard.js"
import {BORDER_TYPE} from "./lib/cm-chessboard/Chessboard.js"

const i18n = new I18n()
i18n.load({
    de: {
        playerName: "Spieler"
    },
    en: {
        playerName: "Player"
    }
})
const chessConsole = new ChessPuzzler(
    document.getElementById("console-container"),
    {name: i18n.t("playerName"), type: LocalPlayer, props: {
            local: true,
        }
    },
    {
        name: "Stockfish", type: PuzzlePlayer, props: {
            worker: "./lib/stockfish-v10-niklasf.js",
            book: "./assets/books/openings.bin",
            level: 1,
            debug: true
        }
    },
    {
        figuresSpriteFile: "./assets/images/chessboard-sprite-staunty.svg"
    })
    
    
const board = new Board(chessConsole, {
    style: {
        cssClass: "green",
        borderType: BORDER_TYPE.frame,
    }
}).initialization.then(() => {
    new Persistence(chessConsole, {
        savePrefix: "Stockfish"
    }).load()
})


new History(chessConsole)
new HistoryControl(chessConsole)
new CapturedPieces(chessConsole)
new StockfishGameControl(chessConsole, {
    player: chessConsole.opponent
})
new StockfishStateView(chessConsole, chessConsole.opponent )
new GameStateOutput(chessConsole)
new Sound(chessConsole, {
    soundSpriteFile: "./assets/sounds/chess_console_sounds.mp3"
})

var fen = "";
var pgn = "";
var col = "w";

document.getElementById("fenButton").addEventListener("click", () => {
    fen = document.getElementById("fenInput").value
    pgn = 
`[SetUp "1"]
[FEN "${fen}"]`

    col = "w";
    if (fen.includes(" b ")) {
        col = "b"
    }
    console.log(`Player ${col}`);
    chessConsole.initGame({
        playerColor: col,
        pgn: pgn
    })
})


function solutionToMoves(solution) {
    var moves = [];
    for (var m of solution) {
        var move = {
            "from": m.substring(0, 2),
            "to": m.substring(2, 4),
        };
        if (m.length > 4) {
            if (m.substring(4) === /[qrnb]/g) {
                move.promotion = m.substring(4);
            }
        }
        console.log(`got move: ${JSON.stringify(move)}`);
        moves.push(move);
    }
    return moves;
}
document.getElementById("lichessButton").addEventListener("click", () => {
    
    fen = "";

    jQuery.get('https://lichess.org/api/puzzle/daily', function(data, status) {
        console.log(`data: ${JSON.stringify(data)}\nStatus: ${status}`);
        if (status === "success") {
            console.log(JSON.stringify(data));
            pgn = `[PlyCount "${data.puzzle.initialPly}"]\n\n${data.game.pgn}`;
            console.log(pgn);

            var solution = solutionToMoves(data.puzzle.solution);
            console.log(`Solution: ${solution}`);
            chessConsole.provideSolution(solution);

            var history = data.game.pgn.split(" ");
            col = "w";
            var colText = "white";
            if (history.length % 2 == 1) {
                col = "b";
                colText = "black";
            }
            console.log(`Player ${col}`);
            chessConsole.opponent.name = `Find the best move for ${colText}`;
            chessConsole.initGame({
                playerColor: col,
                pgn: pgn
            })
        }
    });

    
})

function chessComFormat(string) {
    
    string = string.replaceAll("...", ".");
    string = string.replaceAll("..", ".");
    string = string.replaceAll("\r\n\r\n", "\n");
    string = string.replaceAll("\r\n", "\n");
    return string;
}
function pgnMoves(string) {
    var strings = string.split("\n");
    var string = strings[strings.length - 1];
    if (string == "*") {
        string = strings[strings.length - 2];
    }
    var moves = string.split(" ");
    var solution = [];
    for (var i = 0; i < moves.length; i++) {
        var index = moves[i].indexOf(".")
        if (index > -1) {
            moves[i] = moves[i].substring(index + 1);
        }
        if (moves[i] !== "" && moves[i] !== "*") {
            solution.push(moves[i]);
        }
    }
    return solution;
}
document.getElementById("chesscomButton").addEventListener("click", () => {

    jQuery.get('https://api.chess.com/pub/puzzle', function(data, status) {
        console.log(`data: ${JSON.stringify(data)}\nStatus: ${status}`);
        if (status === "success") {
            console.log(JSON.stringify(data));
            fen = data.fen;
            var fullPgn = chessComFormat(data.pgn);
            var solution = pgnMoves(fullPgn);
            console.log(`Solution: ${solution}`);
            chessConsole.provideSolution(solution);

            pgn = `[SetUp "1"]\n[FEN "${fen}"]`

            col = "w";
            var colText = "white";
            if (fen.includes(" b ")) {
                col = "b";
                colText = "black";
            }
            console.log(`Player ${col}`);
            chessConsole.opponent.name = `Find the best move for ${colText}`;
            chessConsole.initGame({
                playerColor: col,
                pgn: pgn
            })
        }
    });
})
document.getElementById("chesscomRandom").addEventListener("click", () => {

    jQuery.get('https://api.chess.com/pub/puzzle/random', function(data, status) {
        console.log(`data: ${JSON.stringify(data)}\nStatus: ${status}`);
        if (status === "success") {
            console.log(JSON.stringify(data));
            fen = data.fen;
            var fullPgn = chessComFormat(data.pgn);
            var solution = pgnMoves(fullPgn);
            console.log(`Solution: ${solution}`);
            chessConsole.provideSolution(solution);
            
            pgn = `[SetUp "1"]\n[FEN "${fen}"]`
            
            col = "w";
            var colText = "white";
            if (fen.includes(" b ")) {
                col = "b";
                colText = "black";
            }
            console.log(`Player ${col}`);
            chessConsole.opponent.name = `Find the best move for ${colText}`;
            chessConsole.initGame({
                playerColor: col,
                pgn: pgn
            })
        }
    });
})

document.getElementById("resetButton").addEventListener("click", () => {
    
    if (pgn === "") {
        return;
    }
    chessConsole.resetSolution();
    chessConsole.initGame({
        playerColor: col,
        pgn: pgn
    })  
})

document.getElementById("testButton").addEventListener("click", () => {
    
    fen = "2K5/1P6/k6p/3n4/6p1/8/8/8 b - - 1 56"
    pgn = `[SetUp "1"]\n[FEN "${fen}"]`

    var moves = `56.Nb6+ 57.Kc7 Nd7 58.Kxd7 Kxb7 *`

    console.log(fen);
    console.log(pgn);
    var solution = pgnMoves(moves);
    console.log(`Solution: ${solution}`);
    chessConsole.provideSolution(solution);

    col = "w"
    var colText = "white";
    if (fen.includes(" b ")) {
        col = "b";
        colText = "black";
    }
    console.log(`Player ${col}`);
    chessConsole.opponent.name = `Find the best move for ${colText}`;
    chessConsole.initGame({
        playerColor: col,
        pgn: pgn
    })
    
})