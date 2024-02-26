const COLORS = [ "s", "r", "g", "b" ] as const;
const SYMBOLS = [ "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A" ] as const;
const SYMBOL_TO_POINTS = { T: 10, K: 10, D: 25 } as const;
const TICHU_TO_POINTS = { unknown: 0, none: 0, normal: 100, grand: 200 } as const;

const SYMBOL_TO_VALUE = {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 4,
    "6": 5,
    "7": 6,
    "8": 7,
    "9": 8,
    "T": 9,
    "J": 10,
    "Q": 11,
    "K": 12,
    "A": 13,
    "D": 14,
    "H": -1,
    "P": -1,
} as const;

const prefix = <S extends string>(color: S) => SYMBOLS.map((char) => `${color}${char}`) as unknown as `${S}${typeof SYMBOLS[number]}`[];

const DECK = [
    "x1", "xD", "xP", "xH",
    ...COLORS.flatMap(prefix),
] as const;

const CARDS = [
    ...DECK,
    ...prefix("x"),
] as const;

export type CardId = typeof CARDS[number];
export type TichuType = keyof typeof TICHU_TO_POINTS;

type GameStatus = "waiting"
    | "announcing"
    | "exchange"
    | "running"
    | "ended";

type CombinationType = "empty"
    | "single"
    | "pair"
    | "triple"
    | "full_house"
    | "stair"
    | "bomb"
    | "straight_bomb"
    | "straight"
    | "none";

export interface Player {
    name: string;
    place: number;
    cards: CardId[];
    tricks: CardId[];
    tichu: TichuType;
    exchange: CardId[];
}

export interface State {
    status: GameStatus
    stack: Combination[];
    table: Player[];
    score: [ number, number ];
    ranking: number[];
    current: number;
    lastTrick: number;
}

interface CardObject {
    id: CardId;
    value: number;
    sort: number;
    points: number;
    isSpecial: boolean;
    isPhoenix: boolean;
};

export class Card {
    static get(id: CardId): CardObject {
        const isSpecial = id[0] === "x" && (id[1] === "H" || id[1] === "D");
        const isPhoenix = id[0] === "x" && (!isSpecial && id[1] !== "1");
        const points = isPhoenix
            ? -25
            : (SYMBOL_TO_POINTS[id[1]] ?? 0)
        return {
            id,
            value: SYMBOL_TO_VALUE[id[1]],
            sort: Card.sortValue(id),
            points,
            isSpecial,
            isPhoenix, 
        };
    }

    static isValid(id: CardId) {
        return CARDS_LOOKUP[id] !== undefined;
    }

    static normalize(id: CardId) {
        return CARDS_LOOKUP[id].isPhoenix
            ? "xP"
            : id;
    }

    static sort(id1: CardId, id2: CardId) {
        return CARDS_LOOKUP[id1].sort - CARDS_LOOKUP[id2].sort;
    }

    static sortValue(id: CardId) {
        switch (id) {
            case "xD": return 68;
            case "xP": return 67;
            case "xH": return 66;
            case "x1": return 65;
            default:
                const symbolSortValue = 13 - SYMBOL_TO_VALUE[id[1]];
                const colorSortValue = [ ...COLORS, "x"].indexOf(id[0]);
                return symbolSortValue * 5 + colorSortValue;
        }
    }

    static equal(id1: CardId, id2: CardId) {
        return Card.normalize(id1) === Card.normalize(id2);
    }

    static points(ids: CardId[]) {
        return ids
            .map(id => CARDS_LOOKUP[id])
            .map(({ points }) => points)
            .reduce((prev, curr) => prev + curr, 0);
    }

    static subtract(a: CardId[], b: CardId[]) {
        return a.filter(id => Card.indexOf(id, b) === -1);
    }

    static indexOf(id: CardId, ids: CardId[]) {
        for (let i = 0; i < ids.length; i++) {
            if (Card.equal(id, ids[i])) return i;
        }
        return -1;
    }

    static isSubset(subset: CardId[], set: CardId[]) {
        set = [ ...set ];
        for (const id of subset) {
            const index = Card.indexOf(id, set);
            if (index === -1) return false;
            set.splice(index, 1);
        }
        return true;
    }
}

const CARDS_LOOKUP = Object.fromEntries(CARDS.map(id => [ id, Card.get(id) ]));

export class Combination {
    cards: CardId[];
    type: CombinationType;
    value: number;
    private counts: number[];

    constructor(cards: CardId[]) {
        this.cards = cards;
        this.counts = Combination.getCounts(cards);
        this.type = this.getCombination();
        this.value = this.getValue();
    }

    static isCompatible(combination: Combination, stack: Combination[]) {
        if (stack.length === 0) return true;
        if (combination.type === "empty") return true;

        const last = stack.at(-1)!;
        if (combination.type === last.type
            && combination.cards.length === last.cards.length) return true;
        if (combination.isBomb() && last.type !== "straight_bomb") return true;
        if (combination.type === "straight_bomb"
            && last.type === "straight_bomb"
            && combination.cards.length >= last.cards.length) return true;

        return false;
    }


    static isPlayable(combination: Combination, stack: Combination[]) {
        // allows dog
        if (stack.length === 0) return true;

        const last = stack.at(-1)!;

        // longer straight bomb always higher
        if (combination.type === "straight_bomb"
            && last.type === "straight_bomb"
            && combination.cards.length > last.cards.length) return true;
        
        // straight bomb always higher than not straight bomb
        if (combination.type === "straight_bomb"
            && last.type !== "straight_bomb") return true;

        // bomb always higher than not bomb
        if (combination.type === "bomb"
            && !last.isBomb()) return true;
        
        // single phoenix always higher except dragon
        if (combination.type === "single"
            && combination.containsPhoenix()
            && last.cards[0] !== "xD") return true;
        
        // single card on phoenix
        if (
            combination.type === "single"
            && last.containsPhoenix()
        ) {
            if (stack.length === 1) return combination.value > 1;
            return combination.value > stack.at(-2)!.value;
        }

        // otherwise use value
        return combination.value > last.value;
    }

    static getCounts(cards: CardId[]) {
        const out = Object.fromEntries([ 1, ...SYMBOLS ].map(symbol => [ symbol, 0 ]));
        cards
            .map(card => card[1])
            .filter(symbol => out[symbol] !== undefined)
            .forEach(symbol => out[symbol]++);
        return Object.values(out);
    }

    getCombination(): CombinationType {
        const countsSorted = Object.values(this.counts).sort().reverse();

        switch (this.cards.length) {
            case 0: return "empty";
            case 1: return "single";
            case 2: 
                if (countsSorted[0] === 2) return "pair";
            case 3: 
                if (countsSorted[0] === 3) return "triple";
            case 4:
                if (countsSorted[0] === 4 && !this.containsPhoenix())
                    return "bomb";
            case 5:
                if (countsSorted[0] === 3 && countsSorted[1] === 2)
                    return "full_house";
        }

        if (this.containsSpecial()) return "none";

        const joinedCounts = this.counts.join("");

        if (/^0*2{2,}0*$/.test(joinedCounts)) return "stair";
        if (/^0*1{5,}0*$/.test(joinedCounts)) {
            return this.isSameColor()
                ? "straight_bomb"
                : "straight";
        }

        return "none";
    }

    getValue() {
        if (this.type === "single"
            && this.containsPhoenix()) return -1;
        
        switch(this.type) {
            case "empty":
            case "none":
                return -1;
            case "single":
            case "pair":
            case "triple":
            case "bomb":
                return CARDS_LOOKUP[this.cards[0]].value;
            case "full_house":
                return this.counts.indexOf(3);
            case "straight":
            case "straight_bomb":
                return this.counts.indexOf(1);
            case "stair":
                return this.counts.indexOf(2);
        }
    }

    containsSpecial() {
        return this.cards.some(card => CARDS_LOOKUP[card].isSpecial);
    }

    containsPhoenix() {
        return this.cards.some(card => CARDS_LOOKUP[card].isPhoenix);
    }

    isBomb() {
        return this.type === "bomb" || this.type === "straight_bomb";
    }

    isSameColor() {
        return this.cards
            .map(card => card[0])
            .every((color, _, array) => color === array[0][0] && color !== "x");
    }
}

export class Game {
    private state: State;
    event: EventTarget;

    constructor() {
        this.event = new EventTarget();
        this.state = {
            status: "waiting",
            stack: [],
            table: [],
            score: [ 0, 0 ],
            ranking: [],
            current: -1,
            lastTrick: -1,
        };
    }

    join(name: string, place: number) {
        if (this.state.status !== "waiting") return "cannot join";
        if (this.state.table.filter(player => player !== undefined).some(player => player.name === name)) return "name taken";
        if (this.isValidPlace(place)) return "place taken";
        this.state.table[place] = {
            name,
            place,
            cards: [],
            tricks: [],
            tichu: "none",
            exchange: [],
        };
        if (this.state.table.filter(player => player !== undefined).length === 4) setTimeout(() => this.start(), 0);
        return "OK";
    }

    tichu(place: number, _type: TichuType) {
        if (!this.isValidPlace(place)) return "invalid place";
        // if (this.state.status !== "announcing") return 
    }

    exchange(place: number, cards: CardId[]) {
        if (!this.isValidPlace(place)) return "invalid place";
        if (this.state.status !== "exchange") return "cannot exchange currently";
        if (!cards.every(Card.isValid)) return "invalid card(s)";
        if (cards.length !== 3) return "wrong number of cards";
        const player = this.state.table[place];
        if (!Card.isSubset(cards, player.cards)) return "do not have cards";
        player.exchange = cards;
        if (this.state.table.map(({ exchange }) => exchange).every(({ length }) => length === 3)) {
            for (const player of this.state.table) {
                player.cards = Card.subtract(player.cards, player.exchange);
                player.exchange
                    .reverse()
                    .map((id, i) => this.state.table[(player.place + i) % 4].cards.push(id));
            }
            this.state.status = "running";
            this.update();
        }
        return "OK";
    }

    play(place: number, cards: CardId[]) {
        if (!this.isValidPlace(place)) return "invalid place";
        if (this.state.status !== "running") return "cannot play currently";
        if (!cards.every(Card.isValid)) return "invalid card(s)";
        const player = this.state.table[place];
        if (!Card.isSubset(cards, player.cards)) return "do not have cards";
        const combination = new Combination(cards);
        if (combination.type === "none") return "not a playable combination";
        if (!combination.isBomb() && this.state.current !== player.place) return "not a bomb";
        if (!Combination.isCompatible(combination, this.state.stack)) return "not compatible";
        if (combination.type === "empty") {
            // fold
            this.setCurrent(this.state.current + 1);
            if (this.state.current === this.state.lastTrick) this.trick(this.state.table[this.state.current]);

            this.update();
            return "OK";
        }
        // play
        if (!Combination.isPlayable(combination, this.state.stack)) return "not high enough";


        if (this.state.stack[0]?.cards[0] === "xD") {
            // dog
            this.trick(this.state.table[(this.state.current + 2) % 4]);

            this.update();
            return "OK";
        }
        
        this.state.stack.push(combination);
        player.cards = Card.subtract(player.cards, combination.cards);
        if (player.cards.length === 0) this.finish(player);

        this.state.lastTrick = player.place;
        this.setCurrent(player.place + 1);
        
        this.update();
        return "OK";
    }

    leave(place: number) {
        if (!this.isValidPlace(place)) return "invalid place";
        this.state.status = "waiting";
        delete this.state.table[place];
        this.state.ranking = [];
        this.state.current = -1;
        this.state.lastTrick = -1;
        return "OK";
    }

    private update() {
        console.log(`push update (${this.state.current})`);
        this.event.dispatchEvent(new CustomEvent("update", { detail: { ...this.state } }));
    }

    private start() {
        console.log("start");
        const deck = [ ...DECK ];
        for (let i = 0; deck.length; i++) {
            const index = Math.floor(Math.random() * deck.length);
            this.state.table[i % 4].cards.push(deck[index]);
            deck.splice(index, 1);
        }
        let first: number;
        for (let i = 0; i < 4; i++) {
            if (!this.state.table[i].cards.includes("x1")) continue;
            first = i;
            break;
        }
        this.state.status = "exchange";
        this.state.current = first!;
        this.update();
    }

    private end() {
        this.state.status = "ended";
        const [ firstTeam, secondTeam ] = this.state.ranking.map(place => place % 2);

        const rankedPlayers = this.state.ranking.map(place => this.state.table[place]);
        
        rankedPlayers.forEach((player, i) => this.state.score[player.place % 2]
            += TICHU_TO_POINTS[player.tichu] * (i === 0 ? 1 : -1));

        if (firstTeam === secondTeam) {
            // double win
            this.state.score[firstTeam] += 200;
            return;
        }

        // non double win
        const firstPlayer = rankedPlayers[0];
        const lastPlayer = rankedPlayers.at(-1)!;
        
        // tricks of last
        firstPlayer.tricks.push(...lastPlayer.tricks);
        lastPlayer.tricks = [];
        
        // cards of last
        const oppositeTeam = +!(lastPlayer.place % 2);
        this.state.table[oppositeTeam].tricks.push(...lastPlayer.cards);
        lastPlayer.cards = [];
        
        this.state.table
            .map(({ cards }) => cards)
            .map(Card.points)
            .forEach((points, place) => this.state.score[place % 2] += points);

        if (this.state.score.some(score => score >= 1000)) {
            this.update();
            return;
        }

        this.start();
    }

    private trick(player: Player) {
        player.tricks.push(...this.state.stack.flatMap(({ cards }) => cards));
        this.state.stack = [];
        this.setCurrent(player.place);
        this.state.lastTrick = -1;
    }

    private finish(player: Player) {
        this.state.ranking.push(player.place);
        if (this.state.ranking.length !== 3) return;
        const last = [ 1, 2, 3, 4 ].filter(e => this.state.ranking.indexOf(e) !== -1)[0];
        this.state.ranking.push(last);
        this.end();
    }

    private isValidPlace(player: number) {
        return this.state.table[player] !== undefined;
    }

    private setCurrent(value: number) {
        this.state.current = value;
        this.state.current %= 4;
        while (this.state.table[this.state.current].cards.length === 0) {
            this.state.current++;        
            this.state.current %= 4;
        }
    }
}
