import { Game, State } from "./tichu";

export class Bot {
    static exchange = {
        random: (game: Game, place: number) => (state: State) => {
            const self = state.table[place];
            setTimeout(() => game.exchange(place, self.cards.slice(0, 3)), 100);
        },
        basic: (_state: State) => {
            throw new Error("not implemented yet");
        },
        swiss: (_state: State) => {
            throw new Error("not implemented yet");
        },
    };

    static running = {
        pass: (game: Game, place: number) => (state: State) => {
            if (state.current !== place) return;
            setTimeout(() => game.play(place, []), 100);
        },
        randomIfEmpty: (game: Game, place: number) => (state: State) => {
            if (state.current !== place) return;
            if (state.stack.length !== 0) {
                setTimeout(() => game.play(place, []), 100);
                return;
            }; 
            const self = state.table[place];
            setTimeout(() => game.play(place, [ self.cards[0] ]), 100);
        },
    }

    static autopass(game: Game, place: number) {
        const name = `autopass-${place}`;
        game.join(name, place);
        const logic = {
            exchange: this.exchange.random(game, place),
            running: this.running.randomIfEmpty(game, place),
        };
        // @ts-ignore
        game.event.addEventListener("update", ({ detail }) => {
            logic[detail.status](detail);
        });
    }
}
