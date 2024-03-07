import { describe, expect, test } from '@jest/globals';
import { Combination } from './tichu';

describe('combinations', () => {
    const x1 = new Combination([ "x1" ]);
    const xH = new Combination([ "xH" ]);
    const xP = new Combination([ "xP" ]);
    const xD = new Combination([ "xD" ]);
    const s2 = new Combination([ "s2" ]);
    const sA = new Combination([ "sA" ]);
    const xA_sA = new Combination([ "xA", "sA" ]);
    const r3_g3_b3 = new Combination([ "r3", "g3", "b3" ]);
    const x4_r4_g4_b4 = new Combination([ "x4", "r4", "g4", "b4" ]);
    const s4_r4_g4_b4 = new Combination([ "s4", "r4", "g4", "b4" ]);
    const r2_g2_r5_g5_b5 = new Combination([ "r2", "g2", "r5", "g5", "b5" ]);
    const r2_g2_r5_g5_b6 = new Combination([ "r2", "g2", "r5", "g5", "b6" ])
    const rA_rK_gA_gK = new Combination([ "rA", "rK", "gA", "gK" ]);
    const rA_rQ_gA_gQ = new Combination([ "rA", "rQ", "gA", "gQ" ]);
    const x1__sA = new Combination([ "x1", "s2", "r3", "g4", "b5", "s6", "r7", "g8", "b9", "sT", "rJ", "gQ", "bK", "sA" ]);
    const x1_s2_s3_s4_s5 = new Combination([ "x1", "s2", "s3", "s4", "s5" ]);
    const s2_s3_s4_s5_g6 = new Combination([ "s2", "s3", "s4", "s5", "g6" ]);
    const s2_s3_s4_s5_s6_s7 = new Combination([ "s2", "s3", "s4", "s5", "s6", "s7" ]);
    const s2_s3_s4_s5_s6_s7_s8 = new Combination([ "s2", "s3", "s4", "s5", "s6", "s7", "s8" ]);
    
    test('detetect combination type', () => {
        expect(xH).toMatchObject({
            type: "single",
            value: -1,
        });
        expect(x1).toMatchObject({
            type: "single",
            value: 0,
        });
        expect(xA_sA).toMatchObject({
            type: "pair",
            value: 13,
        });
        expect(r3_g3_b3).toMatchObject({
            type: "triple",
            value: 2,
        });
        expect(x4_r4_g4_b4).toMatchObject({
            type: "none",
            value: -1,
        });
        expect(s4_r4_g4_b4).toMatchObject({
            type: "bomb",
            value: 3,
        });
        expect(r2_g2_r5_g5_b5).toMatchObject({
            type: "full_house",
            value: 4,
        });
        expect(r2_g2_r5_g5_b6).toMatchObject({
            type: "none",
            value: -1,
        });
        expect(rA_rK_gA_gK).toMatchObject({
            type: "stair",
            value: 12,
        });
        expect(rA_rQ_gA_gQ).toMatchObject({
            type: "none",
            value: -1,
        });
        expect(x1__sA).toMatchObject({
            type: "straight",
            value: 0,
        });
        expect(x1_s2_s3_s4_s5).toMatchObject({
            type: "straight",
            value: 0,
        });
        expect(s2_s3_s4_s5_s6_s7).toMatchObject({
            type: "straight_bomb",
            value: 1,
        });
    });

    describe("playable", () => {
        test("single card", () => {
            expect(Combination.isPlayable(s2, [ x1 ])).toEqual(true);
            expect(Combination.isPlayable(s2, [ x1, xP ])).toEqual(true);
            expect(Combination.isPlayable(sA, [ sA ])).toEqual(false);
        });

        test("mah jong", () => {
            expect(Combination.isPlayable(x1, [])).toEqual(true);
            expect(Combination.isPlayable(x1, [ s2 ])).toEqual(false);
        });

        test("dog", () => {
            expect(Combination.isPlayable(xH, [])).toEqual(true);
            expect(Combination.isPlayable(xH, [ s2 ])).toEqual(false);
        });

        test("phoenix", () => {
            expect(Combination.isPlayable(xP, [ sA ])).toEqual(true);
            expect(Combination.isPlayable(xP, [ xD ])).toEqual(false);
        });

        test("dragon", () => {
            expect(Combination.isPlayable(xD, [ sA ])).toEqual(true);
            expect(Combination.isPlayable(xD, [ sA, xP ])).toEqual(true);
            expect(Combination.isPlayable(xD, [ xA_sA ])).toEqual(false);
        });

        test("straight", () => {
            expect(Combination.isPlayable(x1_s2_s3_s4_s5, [ s2_s3_s4_s5_g6 ])).toEqual(false);
            expect(Combination.isPlayable(s2_s3_s4_s5_g6, [ x1_s2_s3_s4_s5 ])).toEqual(true);
        });

        test("bomb", () => {
            expect(Combination.isPlayable(s4_r4_g4_b4, [ x1__sA ])).toEqual(true);
            expect(Combination.isPlayable(s4_r4_g4_b4, [ s2_s3_s4_s5_s6_s7 ])).toEqual(false);
        });

        test("straight bomb", () => {
            expect(Combination.isPlayable(s2_s3_s4_s5_s6_s7, [ s4_r4_g4_b4 ])).toEqual(true);
            expect(Combination.isPlayable(s2_s3_s4_s5_s6_s7, [ s2_s3_s4_s5_s6_s7_s8 ])).toEqual(false);
            expect(Combination.isPlayable(s2_s3_s4_s5_s6_s7_s8, [ s2_s3_s4_s5_s6_s7 ])).toEqual(true);
            expect(Combination.isPlayable(s2_s3_s4_s5_s6_s7_s8, [ s2_s3_s4_s5_s6_s7_s8 ])).toEqual(false);
        });

    });
});
