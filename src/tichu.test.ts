import { describe, expect, test } from '@jest/globals';
import { Combination } from './tichu';

describe('combinations', () => {
  test('should detetect combinations', () => {
    expect(new Combination([])).toMatchObject({
        type: "empty",
        value: -1,
    });
    expect(new Combination([ "xH" ])).toMatchObject({
        type: "single",
        value: -1,
    });
    expect(new Combination([ "x1" ])).toMatchObject({
        type: "single",
        value: 0,
    });
    expect(new Combination([ "xA", "sA" ])).toMatchObject({
        type: "pair",
        value: 13,
    });
    expect(new Combination([ "r3", "g3", "b3" ])).toMatchObject({
        type: "triple",
        value: 2,
    });
    expect(new Combination([ "x4", "r4", "g4", "b4" ])).toMatchObject({
        type: "none",
        value: -1,
    });
    expect(new Combination([ "s4", "r4", "g4", "b4" ])).toMatchObject({
        type: "bomb",
        value: 3,
    });
    expect(new Combination([ "r2", "g2", "r5", "g5", "b5" ])).toMatchObject({
        type: "full_house",
        value: 4,
    });
    expect(new Combination([ "r2", "g2", "r5", "g5", "b6" ])).toMatchObject({
        type: "none",
        value: -1,
    });
    expect(new Combination([ "rA", "rK", "gA", "gK" ])).toMatchObject({
        type: "stair",
        value: 12,
    });
    expect(new Combination([ "rA", "rQ", "gA", "gQ" ])).toMatchObject({
        type: "none",
        value: -1,
    });
    expect(new Combination([ "x1", "s2", "r3", "g4", "b5", "s6", "r7", "g8", "b9", "sT", "rJ", "gQ", "bK", "sA" ])).toMatchObject({
        type: "straight",
        value: 0,
    });
    expect(new Combination([ "x1", "s2", "s3", "s4", "s5" ])).toMatchObject({
        type: "straight",
        value: 0,
    });
    expect(new Combination([ "s2", "s3", "s4", "s5", "s6", "s7" ])).toMatchObject({
        type: "straight_bomb",
        value: 1,
    });
  });
});

