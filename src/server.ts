import { Server } from "socket.io"
import { Game } from "./tichu";
import { Bot } from "./bot";

const io = new Server(3000);

const game = new Game();

Bot.autopass(game, 1);
Bot.autopass(game, 2);
Bot.autopass(game, 3);

io.on("connection", socket => {
    let place: number;

    console.log("connection")
    
    socket.on("join", ([ user, p ], callback) => {
        // @ts-ignore
        game.event.addEventListener("update", ({ detail }) => { 
            socket.emit("update", detail) });
        const res = game.join(user, p);
        callback(res);
        if (res !== "OK") return;
        place = p;
    });

    socket.on("tichu", (type, callback) => {
        callback(game.tichu(place, type));
    });

    socket.on("exchange", (cards, callback) => {
        callback(game.exchange(place, cards));
    });

    socket.on("play", (cards, callback) => {
        callback(game.play(place, cards));
    });

    socket.on("disconnect", () => {
        if (place !== undefined) game.leave(place);
    });
});


