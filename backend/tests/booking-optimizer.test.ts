import { describe, expect, it } from 'vitest';
import { BookingInputError, findMinimumBundles } from '../src/algorithms/booking-optimizer';

const asMap = (r: ReturnType<typeof findMinimumBundles>) => Object.fromEntries(r.bundles.map((b) => [b.size, b.quantity]));

describe('findMinimumBundles - assessment examples', () => {
  it('[1,3,4] for 6 -> 2 bundles: 3 x 2', () => {
    const r = findMinimumBundles([1, 3, 4], 6);
    expect(r.possible).toBe(true);
    expect(r.totalBundles).toBe(2);
    expect(asMap(r)).toEqual({ 3: 2 });
  });

  it('[2,5] for 11 -> 4 bundles: 5 x 1, 2 x 3', () => {
    const r = findMinimumBundles([2, 5], 11);
    expect(r.totalBundles).toBe(4);
    expect(asMap(r)).toEqual({ 5: 1, 2: 3 });
  });

  it('[6,9,20] for 44 -> 4 bundles: 20 x 1, 9 x 2, 6 x 1', () => {
    const r = findMinimumBundles([6, 9, 20], 44);
    expect(r.totalBundles).toBe(4);
    expect(asMap(r)).toEqual({ 20: 1, 9: 2, 6: 1 });
  });

  it('[4,6] for 7 -> not possible', () => {
    const r = findMinimumBundles([4, 6], 7);
    expect(r).toEqual({ possible: false, groupSize: 7, totalBundles: 0, bundles: [], totalSeats: 0 });
  });
});

describe('findMinimumBundles - other cases', () => {
  it('group size equal to a single bundle', () => {
    const r = findMinimumBundles([5, 8], 8);
    expect(r.totalBundles).toBe(1);
    expect(asMap(r)).toEqual({ 8: 1 });
  });

  it('multiple identical bundles', () => {
    const r = findMinimumBundles([5], 25);
    expect(r.totalBundles).toBe(5);
    expect(asMap(r)).toEqual({ 5: 5 });
  });

  it('beats the greedy choice (greedy on [1,3,4] for 6 would use 4+1+1)', () => {
    expect(findMinimumBundles([1, 3, 4], 6).totalBundles).toBe(2);
  });

  it('reconstruction always sums to the group size', () => {
    for (const [sizes, group] of [[[3, 7, 11], 50], [[2, 5], 11], [[6, 9, 20], 44], [[7, 13], 1000]] as const) {
      const r = findMinimumBundles([...sizes], group);
      if (r.possible) {
        expect(r.bundles.reduce((s, b) => s + b.size * b.quantity, 0)).toBe(group);
        expect(r.bundles.reduce((s, b) => s + b.quantity, 0)).toBe(r.totalBundles);
        expect(r.totalSeats).toBe(group);
      }
    }
  });

  it('handles the maximum group size', () => {
    const r = findMinimumBundles([500, 1], 10_000);
    expect(r.totalBundles).toBe(20);
  });

  it('rejects invalid group sizes', () => {
    for (const g of [0, -1, 10_001, 2.5, NaN]) {
      expect(() => findMinimumBundles([2, 5], g)).toThrow(BookingInputError);
    }
  });

  it('rejects invalid bundle sizes', () => {
    expect(() => findMinimumBundles([], 5)).toThrow(BookingInputError);
    expect(() => findMinimumBundles([0, 5], 5)).toThrow(BookingInputError);
    expect(() => findMinimumBundles([501], 5)).toThrow(BookingInputError);
    expect(() => findMinimumBundles([2.5], 5)).toThrow(BookingInputError);
    expect(() => findMinimumBundles([2, 2], 5)).toThrow(BookingInputError);
    expect(() => findMinimumBundles(Array.from({ length: 11 }, (_, i) => i + 1), 5)).toThrow(BookingInputError);
  });
});
