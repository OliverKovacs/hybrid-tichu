import fs from "fs";
import path from "path";
import readline from "readline";
import { io } from "socket.io-client"
import chalk from "chalk";
import { Card, CardId, Player, State, TichuType } from "./tichu";

const THEME = JSON.parse(fs.readFileSync(path.join(__dirname, "../theme.json"), "utf-8"));
 
const rl = readline.createInterface(process.stdin, process.stdout);

// const host = "10.16.16.21";
const host = "localhost";
const port = 3000;
const socket = io(`ws://${host}:${port}`);

let place: number;

const formatGutter = (state: State, place: number) => place === state.current
    ? ">"
    : place === state.lastTrick ? "*" : "-";

const formatPlayerColor = (state: State, place: number) => place === state.current
    ? THEME.player.current
    : place === state.lastTrick ? THEME.player.lastTrick : THEME.player.default;

const formatPlayer = (state: State) => (player: Player) => {
    const color = chalk[formatPlayerColor(state, player.place)];
    return `${color(formatGutter(state, player.place))} [${color(player.cards.length)}] ${color(player.name)}`;
};

const formatPlayers = (state: State) => state.table
    .map(formatPlayer(state))
    .join("\n");

const formatCard = (card: CardId) => chalk[THEME.card.fg[card[0]]][THEME.card.bg[card[0]]](card);

const formatCards = (cards: CardId[]) => cards
    .sort(Card.sort)
    .map(formatCard)
    .join(" ");

const printState = (state: State) => {
    console.log(`${state.status} [${state.score.join(":")}]`)
    console.log(formatPlayers(state), "\n");
    console.log("stack:", formatCards(state.stack.at(-1)?.cards ?? []), "\n");
    console.log("cards:", formatCards(state.table[place].cards));
    console.log("================================================");
};

const fixCasing = (card: CardId) => `${card[0].toLowerCase()}${card[1].toUpperCase()}`;

const handler = (response: string) => {
    if (response !== "OK") console.error(response);
};

socket.on("update", printState);

const help = () => {
    console.log("h[elp]");
    console.log("j[oin] NAME PLACE");
    console.log("t[ichu] TYPE")
    console.log("e[xchange] LEFT MIDDLE RIGHT");
    console.log("p[lay] [CARD]...");
};

const join = ([ user, p ]) => {
    socket.emit("join", [ user, +p ], (response: string) => {
        handler(response);
        place = p;
    });
};

const play = (cards: CardId[]) => {
    socket.emit("play", cards.map(fixCasing), handler);
};

const tichu = (type: TichuType) => {
    socket.emit("tichu", type, handler);
};

const exchange = (cards: CardId[]) => {
    socket.emit("exchange", cards.map(fixCasing), handler);
};

const CMDS = {
    help, h: help,
    join, j: join,
    tichu, t: tichu,
    exchange, e: exchange,
    play, p: play,
}; 

const command = (input: string) => {
    const [ cmd, ...args ] = input.split(" ");
    if (!CMDS[cmd]) return help();
    CMDS[cmd](args);
};

const loop = () => {
    rl.question("", input => {
        command(input);
        loop();
    });
};
loop();
