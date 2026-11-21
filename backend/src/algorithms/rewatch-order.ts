/**
 * Algorithm 1 - Rewatch order.
 *
 * Movies are nodes of a directed graph; an edge movie -> prerequisite means
 * "prerequisite must be watched first". A depth-first search with three
 * visitation states (Unvisited / Visiting / Visited) both detects cycles and,
 * through post-order emission, yields a topological order.
 * Implemented from scratch - no graph libraries.
 */

/** movie id -> ids of its direct prerequisites */
export type PrerequisiteGraph = Map<string, string[]>;

enum VisitState {
  Unvisited = 0,
  Visiting = 1,
  Visited = 2,
}

export class CircularDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super('Circular movie dependency detected.');
    this.name = 'CircularDependencyError';
  }
}

/**
 * Returns every transitive prerequisite of `targetId`, each exactly once,
 * ordered so that every movie appears after all of its own prerequisites.
 * The target itself is never included.
 * Throws CircularDependencyError if a cycle is reachable from the target.
 */
export function getRewatchOrder(graph: PrerequisiteGraph, targetId: string): string[] {
  const state = new Map<string, VisitState>();
  const path: string[] = []; // current DFS path, used to report the cycle
  const postOrder: string[] = [];

  const visit = (id: string): void => {
    const current = state.get(id) ?? VisitState.Unvisited;
    if (current === VisitState.Visited) return; // shared prerequisite already emitted
    if (current === VisitState.Visiting) {
      throw new CircularDependencyError([...path.slice(path.indexOf(id)), id]);
    }

    state.set(id, VisitState.Visiting);
    path.push(id);
    for (const prerequisiteId of graph.get(id) ?? []) {
      visit(prerequisiteId);
    }
    path.pop();
    state.set(id, VisitState.Visited);
    postOrder.push(id); // all prerequisites were emitted before this point
  };

  visit(targetId);
  // The target finishes last in post-order; drop it.
  return postOrder.filter((id) => id !== targetId);
}

/** True when a cycle is reachable from `startId`. */
export function hasCycleFrom(graph: PrerequisiteGraph, startId: string): boolean {
  try {
    getRewatchOrder(graph, startId);
    return false;
  } catch (error) {
    if (error instanceof CircularDependencyError) return true;
    throw error;
  }
}
