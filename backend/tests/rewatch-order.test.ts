import { describe, expect, it } from 'vitest';
import { CircularDependencyError, getRewatchOrder, hasCycleFrom, PrerequisiteGraph } from '../src/algorithms/rewatch-order';

const MCU: PrerequisiteGraph = new Map([
  ['ironman', []],
  ['tfa', []],
  ['avengers', ['ironman', 'tfa']],
  ['civilwar', ['avengers']],
  ['ragnarok', []],
  ['infinity', ['civilwar', 'ragnarok']],
  ['endgame', ['infinity']],
  ['doomsday', ['endgame']],
]);

function assertValidOrder(graph: PrerequisiteGraph, order: string[]) {
  order.forEach((id, index) => {
    for (const p of graph.get(id) ?? []) {
      if (order.includes(p)) expect(order.indexOf(p)).toBeLessThan(index);
    }
  });
}

describe('getRewatchOrder', () => {
  it('returns an empty list for a movie without prerequisites', () => {
    expect(getRewatchOrder(MCU, 'ragnarok')).toEqual([]);
  });

  it('returns a single prerequisite', () => {
    expect(getRewatchOrder(MCU, 'endgame').slice(-1)).toEqual(['infinity']);
    expect(getRewatchOrder(new Map([['a', ['b']], ['b', []]]), 'a')).toEqual(['b']);
  });

  it('handles multiple prerequisites (Civil War)', () => {
    const order = getRewatchOrder(MCU, 'civilwar');
    expect(order).toHaveLength(3);
    expect(new Set(order.slice(0, 2))).toEqual(new Set(['ironman', 'tfa']));
    expect(order[2]).toBe('avengers');
  });

  it('handles a deep chain and returns all 7 movies for Doomsday', () => {
    const order = getRewatchOrder(MCU, 'doomsday');
    expect(order).toHaveLength(7);
    expect(order).toEqual(['ironman', 'tfa', 'avengers', 'civilwar', 'ragnarok', 'infinity', 'endgame']);
    assertValidOrder(MCU, order);
  });

  it('excludes the target and never duplicates shared prerequisites', () => {
    const diamond: PrerequisiteGraph = new Map([
      ['top', ['left', 'right']],
      ['left', ['base']],
      ['right', ['base']],
      ['base', []],
    ]);
    const order = getRewatchOrder(diamond, 'top');
    expect(order).not.toContain('top');
    expect(new Set(order).size).toBe(order.length);
    expect(order).toEqual(['base', 'left', 'right']);
  });

  it('detects a direct cycle and a self-dependency', () => {
    expect(() => getRewatchOrder(new Map([['a', ['a']]]), 'a')).toThrow(CircularDependencyError);
    expect(() => getRewatchOrder(new Map([['a', ['b']], ['b', ['a']]]), 'a')).toThrow(CircularDependencyError);
  });

  it('detects the assessment cycle: Endgame as a prerequisite of Iron Man', () => {
    const proposed: PrerequisiteGraph = new Map(MCU);
    proposed.set('ironman', ['endgame']);
    expect(hasCycleFrom(proposed, 'ironman')).toBe(true);
    expect(hasCycleFrom(MCU, 'ironman')).toBe(false);
  });
});

describe('summary maths (as used by the service)', () => {
  it('counts watched movies and remaining runtime', () => {
    const movies = new Map([
      ['ironman', { runtime: 126, watched: true }],
      ['tfa', { runtime: 124, watched: false }],
      ['avengers', { runtime: 143, watched: false }],
    ]);
    const order = getRewatchOrder(new Map([['t', ['avengers']], ['avengers', ['ironman', 'tfa']], ['ironman', []], ['tfa', []]]), 't');
    const items = order.map((id) => movies.get(id)!);
    expect(items.filter((m) => m.watched)).toHaveLength(1);
    expect(items.filter((m) => !m.watched).reduce((s, m) => s + m.runtime, 0)).toBe(267);
  });
});
