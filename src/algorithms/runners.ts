import type { Node, Edge, AlgorithmStep, AlgorithmId } from '../types';
import { MinHeap } from './heap';
import { buildAdjList, heuristic, reconstructPath, COST_FASTEST } from './graphUtils';

export type CostFn = (e: Edge) => number;
function nodeMap(nodes: Node[]): Map<string, Node> {
  return new Map(nodes.map(n => [n.id, n]));
}

// BFS - uniform flood fill
function* bfs(nodes: Node[], edges: Edge[], start: string, end: string, costFn: CostFn = COST_FASTEST): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges, costFn);
  const visited = new Set<string>();
  const prev = new Map<string, string>();
  const queue: string[] = [start];
  visited.add(start);

  while (queue.length) {
    const frontier = [...queue];
    const next: string[] = [];
    for (const cur of frontier) {
      if (cur === end) {
        yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
        return;
      }
      for (const nb of (adj.get(cur) || [])) {
        if (!visited.has(nb.to)) {
          visited.add(nb.to);
          prev.set(nb.to, cur);
          next.push(nb.to);
        }
      }
    }
    queue.splice(0, queue.length, ...next);
    yield { visited: [...visited], frontier: [...queue], path: [], done: false };
  }
  yield { visited: [...visited], frontier: [], path: [], done: true };
}

// DFS - wandering path
function* dfs(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const visited = new Set<string>();
  const prev = new Map<string, string>();
  const stack = [start];

  while (stack.length) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    yield { visited: [...visited], frontier: [...stack], path: [], done: false };
    if (cur === end) {
      yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
      return;
    }
    for (const nb of (adj.get(cur) || [])) {
      if (!visited.has(nb.to)) {
        prev.set(nb.to, cur);
        stack.push(nb.to);
      }
    }
  }
  yield { visited: [...visited], frontier: [], path: [], done: true };
}

// Dijkstra
function* dijkstra(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new MinHeap<string>();

  dist.set(start, 0);
  pq.push(0, start);

  while (pq.size) {
    const [d, cur] = pq.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const frontier: string[] = [];

    if (cur === end) {
      yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
      return;
    }

    for (const nb of (adj.get(cur) || [])) {
      const nd = d + nb.weight;
      if (nd < (dist.get(nb.to) ?? Infinity)) {
        dist.set(nb.to, nd);
        prev.set(nb.to, cur);
        pq.push(nd, nb.to);
        frontier.push(nb.to);
      }
    }
    yield { visited: [...visited], frontier, path: [], done: false };
  }
  yield { visited: [...visited], frontier: [], path: [], done: true };
}

// A*
function* astar(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;
  const g = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new MinHeap<string>();

  g.set(start, 0);
  pq.push(heuristic(nmap.get(start)!, endNode), start);

  while (pq.size) {
    const [, cur] = pq.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);

    if (cur === end) {
      yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
      return;
    }

    const frontier: string[] = [];
    for (const nb of (adj.get(cur) || [])) {
      const ng = (g.get(cur) ?? Infinity) + nb.weight;
      if (ng < (g.get(nb.to) ?? Infinity)) {
        g.set(nb.to, ng);
        prev.set(nb.to, cur);
        const h = heuristic(nmap.get(nb.to)!, endNode);
        pq.push(ng + h, nb.to);
        frontier.push(nb.to);
      }
    }
    yield { visited: [...visited], frontier, path: [], done: false };
  }
  yield { visited: [...visited], frontier: [], path: [], done: true };
}

// Greedy Best-First
function* greedy(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;
  const visited = new Set<string>();
  const prev = new Map<string, string>();
  const pq = new MinHeap<string>();

  pq.push(heuristic(nmap.get(start)!, endNode), start);

  while (pq.size) {
    const [, cur] = pq.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);

    if (cur === end) {
      yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
      return;
    }

    const frontier: string[] = [];
    for (const nb of (adj.get(cur) || [])) {
      if (!visited.has(nb.to)) {
        prev.set(nb.to, cur);
        pq.push(heuristic(nmap.get(nb.to)!, endNode), nb.to);
        frontier.push(nb.to);
      }
    }
    yield { visited: [...visited], frontier, path: [], done: false };
  }
  yield { visited: [...visited], frontier: [], path: [], done: true };
}

// Bidirectional BFS
function* bidirectional(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const visitedF = new Set([start]);
  const visitedB = new Set([end]);
  const prevF = new Map<string, string>();
  const prevB = new Map<string, string>();
  let qF = [start], qB = [end];
  let meetNode: string | null = null;

  while (qF.length || qB.length) {
    const nextF: string[] = [];
    for (const cur of qF) {
      for (const nb of (adj.get(cur) || [])) {
        if (!visitedF.has(nb.to)) {
          visitedF.add(nb.to);
          prevF.set(nb.to, cur);
          nextF.push(nb.to);
          if (visitedB.has(nb.to)) { meetNode = nb.to; break; }
        }
      }
      if (meetNode) break;
    }
    if (meetNode) break;

    const nextB: string[] = [];
    for (const cur of qB) {
      for (const nb of (adj.get(cur) || [])) {
        if (!visitedB.has(nb.to)) {
          visitedB.add(nb.to);
          prevB.set(nb.to, cur);
          nextB.push(nb.to);
          if (visitedF.has(nb.to)) { meetNode = nb.to; break; }
        }
      }
      if (meetNode) break;
    }

    qF = nextF;
    qB = nextB;

    yield {
      visited: [...visitedF, ...visitedB],
      frontier: [...qF, ...qB],
      path: [],
      done: false
    };

    if (meetNode) break;
  }

  if (meetNode) {
    const pathF = reconstructPath(prevF, meetNode);
    const pathB = reconstructPath(prevB, meetNode).reverse();
    const fullPath = [...pathF, ...pathB.slice(1)];
    yield { visited: [...visitedF, ...visitedB], frontier: [], path: fullPath, done: true };
  } else {
    yield { visited: [...visitedF, ...visitedB], frontier: [], path: [], done: true };
  }
}

// Bellman-Ford
function* bellmanFord(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const dist = new Map<string, number>(nodes.map(n => [n.id, Infinity]));
  const prev = new Map<string, string>();
  dist.set(start, 0);
  const visited = new Set<string>([start]);

  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false;
    for (const e of edges) {
      const d = (dist.get(e.from) ?? Infinity) + e.weight;
      if (d < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, d);
        prev.set(e.to, e.from);
        visited.add(e.to);
        updated = true;
      }
      const d2 = (dist.get(e.to) ?? Infinity) + e.weight;
      if (d2 < (dist.get(e.from) ?? Infinity)) {
        dist.set(e.from, d2);
        prev.set(e.from, e.to);
        visited.add(e.from);
        updated = true;
      }
    }
    if (!updated) break;
    yield { visited: [...visited], frontier: [], path: [], done: false };
  }

  const path = dist.get(end) !== Infinity ? reconstructPath(prev, end) : [];
  yield { visited: [...visited], frontier: [], path, done: true };
}

// Bidirectional Dijkstra
function* bidirDijkstra(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const distF = new Map<string, number>([[start, 0]]);
  const distB = new Map<string, number>([[end, 0]]);
  const prevF = new Map<string, string>();
  const prevB = new Map<string, string>();
  const settledF = new Set<string>();
  const settledB = new Set<string>();
  const pqF = new MinHeap<string>();
  const pqB = new MinHeap<string>();
  pqF.push(0, start);
  pqB.push(0, end);
  let best = Infinity;
  let meetNode = '';

  while (pqF.size || pqB.size) {
    if (pqF.size) {
      const [d, cur] = pqF.pop()!;
      if (!settledF.has(cur)) {
        settledF.add(cur);
        for (const nb of (adj.get(cur) || [])) {
          const nd = d + nb.weight;
          if (nd < (distF.get(nb.to) ?? Infinity)) {
            distF.set(nb.to, nd);
            prevF.set(nb.to, cur);
            pqF.push(nd, nb.to);
          }
          if (settledB.has(nb.to)) {
            const total = nd + (distB.get(nb.to) ?? Infinity);
            if (total < best) { best = total; meetNode = nb.to; }
          }
        }
      }
    }
    if (pqB.size) {
      const [d, cur] = pqB.pop()!;
      if (!settledB.has(cur)) {
        settledB.add(cur);
        for (const nb of (adj.get(cur) || [])) {
          const nd = d + nb.weight;
          if (nd < (distB.get(nb.to) ?? Infinity)) {
            distB.set(nb.to, nd);
            prevB.set(nb.to, cur);
            pqB.push(nd, nb.to);
          }
          if (settledF.has(nb.to)) {
            const total = nd + (distF.get(nb.to) ?? Infinity);
            if (total < best) { best = total; meetNode = nb.to; }
          }
        }
      }
    }

    yield {
      visited: [...settledF, ...settledB],
      frontier: [],
      path: [],
      done: false
    };

    if (meetNode && (distF.get(meetNode) ?? Infinity) + (distB.get(meetNode) ?? Infinity) <= best) break;
  }

  if (meetNode) {
    const pF = reconstructPath(prevF, meetNode);
    const pB = reconstructPath(prevB, meetNode).reverse();
    yield { visited: [...settledF, ...settledB], frontier: [], path: [...pF, ...pB.slice(1)], done: true };
  } else {
    yield { visited: [...settledF, ...settledB], frontier: [], path: [], done: true };
  }
}

// Ant Colony Optimization (simulated)
function* antColony(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;
  const pheromone = new Map<string, number>();
  const getKey = (a: string, b: string) => `${a}-${b}`;
  const ANTS = 5, ITERS = 15;
  const allVisited = new Set<string>([start]);
  let bestPath: string[] = [];

  for (let iter = 0; iter < ITERS; iter++) {
    const iterPaths: string[][] = [];
    for (let ant = 0; ant < ANTS; ant++) {
      const path = [start];
      const visited = new Set([start]);
      let cur = start;

      for (let step = 0; step < 50; step++) {
        if (cur === end) break;
        const neighbors = (adj.get(cur) || []).filter(nb => !visited.has(nb.to));
        if (!neighbors.length) break;

        // Weighted choice by pheromone + heuristic
        const scores = neighbors.map(nb => {
          const ph = pheromone.get(getKey(cur, nb.to)) ?? 0.1;
          const h = 1 / (heuristic(nmap.get(nb.to)!, endNode) + 1);
          return ph * h;
        });
        const total = scores.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let chosen = neighbors[0];
        for (let i = 0; i < neighbors.length; i++) {
          r -= scores[i];
          if (r <= 0) { chosen = neighbors[i]; break; }
        }

        visited.add(chosen.to);
        path.push(chosen.to);
        allVisited.add(chosen.to);
        cur = chosen.to;
      }

      if (cur === end) {
        iterPaths.push(path);
        if (!bestPath.length || path.length < bestPath.length) bestPath = path;
      }
    }

    // Update pheromones
    for (const path of iterPaths) {
      const reward = 1 / path.length;
      for (let i = 0; i < path.length - 1; i++) {
        const k = getKey(path[i], path[i + 1]);
        pheromone.set(k, (pheromone.get(k) ?? 0) + reward);
      }
    }

    yield { visited: [...allVisited], frontier: [], path: bestPath, done: false };
  }

  yield { visited: [...allVisited], frontier: [], path: bestPath, done: true };
}

// Genetic Algorithm (simulated)
function* genetic(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;
  const allVisited = new Set<string>([start]);
  let population: string[][] = [];
  const POP = 8, GENS = 20;

  // Init random paths
  for (let i = 0; i < POP; i++) {
    const path = [start];
    let cur = start;
    const visited = new Set([start]);
    for (let s = 0; s < 30; s++) {
      if (cur === end) break;
      const nbs = (adj.get(cur) || []).filter(nb => !visited.has(nb.to));
      if (!nbs.length) break;
      const nb = nbs[Math.floor(Math.random() * nbs.length)];
      visited.add(nb.to);
      path.push(nb.to);
      allVisited.add(nb.to);
      cur = nb.to;
    }
    population.push(path);
  }

  let bestPath: string[] = [];
  for (let gen = 0; gen < GENS; gen++) {
    // Score by: did it reach end? shorter is better
    const scored = population.map(p => {
      const reachEnd = p[p.length - 1] === end;
      const lastNode = nmap.get(p[p.length - 1]);
      const h = lastNode ? heuristic(lastNode, endNode) : Infinity;
      return { path: p, score: reachEnd ? p.length : p.length + h };
    }).sort((a, b) => a.score - b.score);

    const best = scored[0];
    if (best.path[best.path.length - 1] === end) {
      if (!bestPath.length || best.path.length < bestPath.length) bestPath = best.path;
    }

    // New generation: keep top half, mutate
    const survivors = scored.slice(0, POP / 2).map(s => s.path);
    population = [...survivors];
    for (const p of survivors) {
      const mutated = [...p];
      const splitAt = Math.floor(Math.random() * (mutated.length - 1));
      let cur = mutated[splitAt];
      const visited = new Set(mutated.slice(0, splitAt + 1));
      for (let s = 0; s < 15; s++) {
        if (cur === end) break;
        const nbs = (adj.get(cur) || []).filter(nb => !visited.has(nb.to));
        if (!nbs.length) break;
        const nb = nbs[Math.floor(Math.random() * nbs.length)];
        visited.add(nb.to);
        mutated.push(nb.to);
        allVisited.add(nb.to);
        cur = nb.to;
      }
      population.push(mutated);
    }

    yield { visited: [...allVisited], frontier: [], path: bestPath, done: false };
  }

  yield { visited: [...allVisited], frontier: [], path: bestPath, done: true };
}

// Goal-Directed (A* with stronger pruning)
function* goalDirected(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;
  const g = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new MinHeap<string>();
  pq.push(0, start);

  while (pq.size) {
    const [, cur] = pq.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);

    if (cur === end) {
      yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
      return;
    }

    const frontier: string[] = [];
    for (const nb of (adj.get(cur) || [])) {
      const ng = (g.get(cur) ?? Infinity) + nb.weight;
      if (ng < (g.get(nb.to) ?? Infinity)) {
        // Extra pruning: only expand if heading roughly toward goal
        const nbNode = nmap.get(nb.to);
        const curNode = nmap.get(cur);
        if (nbNode && curNode) {
          const hNow = heuristic(curNode, endNode);
          const hNext = heuristic(nbNode, endNode);
          if (hNext > hNow * 1.5) continue; // prune backward moves
        }
        g.set(nb.to, ng);
        prev.set(nb.to, cur);
        pq.push(ng + heuristic(nmap.get(nb.to)!, endNode), nb.to);
        frontier.push(nb.to);
      }
    }
    yield { visited: [...visited], frontier, path: [], done: false };
  }
  yield { visited: [...visited], frontier: [], path: [], done: true };
}

// Floyd-Warshall (subset for visualization)
function* floydWarshall(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  // Run on a subset for visualization purposes
  const adj = buildAdjList(edges);
  const subset = Array.from(new Set([start, end, ...nodes.slice(0, 30).map(n => n.id)]));
  const n = subset.length;
  const idx = new Map(subset.map((id, i) => [id, i]));

  const dist: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity)
  );
  const next: (number | null)[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => null)
  );

  for (const e of edges) {
    const fi = idx.get(e.from), ti = idx.get(e.to);
    if (fi !== undefined && ti !== undefined) {
      if (e.weight < dist[fi][ti]) {
        dist[fi][ti] = e.weight;
        dist[ti][fi] = e.weight;
        next[fi][ti] = ti;
        next[ti][fi] = fi;
      }
    }
  }

  const visited = new Set<string>();
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];
        }
      }
    }
    visited.add(subset[k]);
    if (k % 3 === 0)
      yield { visited: [...visited], frontier: subset.slice(k + 1, k + 5), path: [], done: false };
  }

  // Reconstruct path
  const si = idx.get(start), ei = idx.get(end);
  const path: string[] = [];
  if (si !== undefined && ei !== undefined && next[si][ei] !== null) {
    let cur = si;
    path.push(subset[cur]);
    while (cur !== ei) {
      cur = next[cur][ei]!;
      if (cur === null) break;
      path.push(subset[cur]);
    }
  }

  yield { visited: [...visited], frontier: [], path, done: true };
}

// Yen's k-Shortest Paths
function* yenK(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const K = 3;
  const allPaths: string[][] = [];
  const allVisited = new Set<string>();

  // Run Dijkstra for base path
  function dijkstraPath(blockedEdges: Set<string>, blockedNodes: Set<string>): string[] | null {
    const dist = new Map<string, number>([[start, 0]]);
    const prev = new Map<string, string>();
    const visited = new Set<string>();
    const pq = new MinHeap<string>();
    pq.push(0, start);

    while (pq.size) {
      const [d, cur] = pq.pop()!;
      if (visited.has(cur) || blockedNodes.has(cur)) continue;
      visited.add(cur);
      if (cur === end) return reconstructPath(prev, end);
      for (const nb of (adj.get(cur) || [])) {
        if (blockedEdges.has(`${cur}-${nb.to}`) || blockedNodes.has(nb.to)) continue;
        const nd = d + nb.weight;
        if (nd < (dist.get(nb.to) ?? Infinity)) {
          dist.set(nb.to, nd);
          prev.set(nb.to, cur);
          pq.push(nd, nb.to);
        }
      }
    }
    return null;
  }

  const firstPath = dijkstraPath(new Set(), new Set());
  if (!firstPath) { yield { visited: [], frontier: [], path: [], done: true }; return; }
  allPaths.push(firstPath);
  firstPath.forEach(n => allVisited.add(n));

  for (let k = 1; k < K; k++) {
    const prev = allPaths[k - 1];
    const candidates: string[][] = [];

    for (let i = 0; i < prev.length - 1; i++) {
      const spurNode = prev[i];
      const rootPath = prev.slice(0, i + 1);
      const blockedEdges = new Set<string>();
      const blockedNodes = new Set<string>();

      for (const path of allPaths) {
        if (path.slice(0, i + 1).join(',') === rootPath.join(',')) {
          blockedEdges.add(`${path[i]}-${path[i + 1]}`);
        }
      }
      rootPath.slice(0, -1).forEach(n => blockedNodes.add(n));

      const spurPath = dijkstraPath(blockedEdges, blockedNodes);
      if (spurPath) {
        const total = [...rootPath.slice(0, -1), ...spurPath];
        candidates.push(total);
        total.forEach(n => allVisited.add(n));
      }
    }

    if (!candidates.length) break;
    candidates.sort((a, b) => a.length - b.length);
    allPaths.push(candidates[0]);
    yield { visited: [...allVisited], frontier: [], path: candidates[0], done: false };
  }

  yield { visited: [...allVisited], frontier: [], path: allPaths[allPaths.length - 1] || [], done: true };
}

// Time-Dependent Dijkstra (edge weights vary over time)
function* timeDependent(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new MinHeap<string>();
  let t = 0;

  dist.set(start, 0);
  pq.push(0, start);

  while (pq.size) {
    const [d, cur] = pq.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    t++;

    if (cur === end) {
      yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
      return;
    }

    const frontier: string[] = [];
    for (const nb of (adj.get(cur) || [])) {
      // Time-dependent weight: varies sinusoidally
      const timeFactor = 1 + 0.5 * Math.sin(t * 0.3);
      const nd = d + nb.weight * timeFactor;
      if (nd < (dist.get(nb.to) ?? Infinity)) {
        dist.set(nb.to, nd);
        prev.set(nb.to, cur);
        pq.push(nd, nb.to);
        frontier.push(nb.to);
      }
    }
    yield { visited: [...visited], frontier, path: [], done: false };
  }
  yield { visited: [...visited], frontier: [], path: [], done: true };
}

// D* Lite (simplified - runs A* but periodically "changes" some edges)
function* dstar(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;
  const allVisited = new Set<string>();
  let bestPath: string[] = [];

  for (let phase = 0; phase < 3; phase++) {
    // Block some random nodes to simulate dynamic changes
    const blocked = new Set<string>();
    if (phase > 0) {
      const nodeIds = nodes.map(n => n.id);
      for (let i = 0; i < 5; i++) {
        const randomNode = nodeIds[Math.floor(Math.random() * nodeIds.length)];
        if (randomNode !== start && randomNode !== end) blocked.add(randomNode);
      }
    }

    const g = new Map<string, number>([[start, 0]]);
    const prev = new Map<string, string>();
    const visited = new Set<string>();
    const pq = new MinHeap<string>();
    pq.push(0, start);

    while (pq.size) {
      const [, cur] = pq.pop()!;
      if (visited.has(cur) || blocked.has(cur)) continue;
      visited.add(cur);
      allVisited.add(cur);

      if (cur === end) {
        bestPath = reconstructPath(prev, end);
        break;
      }

      for (const nb of (adj.get(cur) || [])) {
        if (blocked.has(nb.to)) continue;
        const ng = (g.get(cur) ?? Infinity) + nb.weight;
        if (ng < (g.get(nb.to) ?? Infinity)) {
          g.set(nb.to, ng);
          prev.set(nb.to, cur);
          pq.push(ng + heuristic(nmap.get(nb.to)!, endNode), nb.to);
        }
      }
    }

    yield { visited: [...allVisited], frontier: [], path: bestPath, done: false };
  }

  yield { visited: [...allVisited], frontier: [], path: bestPath, done: true };
}

// Johnson's (BF reweight + Dijkstra, simplified)
function* johnsons(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  // Phase 1: Bellman-Ford from virtual source to get reweighting potentials
  const h = new Map<string, number>(nodes.map(n => [n.id, 0]));
  const adj = buildAdjList(edges);
  const visited = new Set<string>();

  for (let i = 0; i < Math.min(nodes.length, 10); i++) {
    for (const e of edges) {
      const d = (h.get(e.from) ?? 0) + e.weight;
      if (d < (h.get(e.to) ?? 0)) h.set(e.to, d);
    }
    if (i % 3 === 0) {
      visited.add(nodes[i % nodes.length].id);
      yield { visited: [...visited], frontier: [], path: [], done: false };
    }
  }

  // Phase 2: Dijkstra with reweighted edges
  const dist = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, string>();
  const settled = new Set<string>();
  const pq = new MinHeap<string>();
  pq.push(0, start);

  while (pq.size) {
    const [d, cur] = pq.pop()!;
    if (settled.has(cur)) continue;
    settled.add(cur);
    visited.add(cur);

    if (cur === end) {
      yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
      return;
    }

    const frontier: string[] = [];
    for (const nb of (adj.get(cur) || [])) {
      const reweighted = nb.weight + (h.get(cur) ?? 0) - (h.get(nb.to) ?? 0);
      const nd = d + Math.max(0, reweighted);
      if (nd < (dist.get(nb.to) ?? Infinity)) {
        dist.set(nb.to, nd);
        prev.set(nb.to, cur);
        pq.push(nd, nb.to);
        frontier.push(nb.to);
      }
    }
    yield { visited: [...visited], frontier, path: [], done: false };
  }
  yield { visited: [...visited], frontier: [], path: [], done: true };
}

// ALT (A* with Landmark heuristic, simplified)
function* alt(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;

  // Pick a few "landmarks"
  const landmarks = nodes.filter((_, i) => i % Math.floor(nodes.length / 4) === 0).slice(0, 4);
  const landmarkH = (node: Node): number => {
    return Math.max(...landmarks.map(lm => Math.abs(heuristic(node, endNode) - heuristic(lm, endNode))));
  };

  const g = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new MinHeap<string>();
  pq.push(0, start);

  while (pq.size) {
    const [, cur] = pq.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);

    if (cur === end) {
      yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
      return;
    }

    const frontier: string[] = [];
    for (const nb of (adj.get(cur) || [])) {
      const ng = (g.get(cur) ?? Infinity) + nb.weight;
      if (ng < (g.get(nb.to) ?? Infinity)) {
        g.set(nb.to, ng);
        prev.set(nb.to, cur);
        const nbNode = nmap.get(nb.to)!;
        pq.push(ng + landmarkH(nbNode), nb.to);
        frontier.push(nb.to);
      }
    }
    yield { visited: [...visited], frontier, path: [], done: false };
  }
  yield { visited: [...visited], frontier: [], path: [], done: true };
}

// Hub Labeling (simulate near-instant)
function* hubLabeling(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  // Simulate: briefly show a few hubs, then instant path
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;

  // Find a few "hub" nodes (high degree)
  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }
  const hubs = [...degree.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);

  yield { visited: hubs, frontier: [], path: [], done: false };

  // Quick A* for actual path
  const g = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new MinHeap<string>();
  pq.push(0, start);

  while (pq.size) {
    const [, cur] = pq.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    if (cur === end) break;
    for (const nb of (adj.get(cur) || [])) {
      const ng = (g.get(cur) ?? Infinity) + nb.weight;
      if (ng < (g.get(nb.to) ?? Infinity)) {
        g.set(nb.to, ng);
        prev.set(nb.to, cur);
        pq.push(ng + heuristic(nmap.get(nb.to)!, endNode), nb.to);
      }
    }
  }

  const path = reconstructPath(prev, end);
  yield { visited: [...visited], frontier: [], path, done: true };
}

// Contraction Hierarchies (simulated)
function* contractionHierarchies(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;

  // Simulate contraction: pick every Nth node as "important"
  const importantNodes = new Set(nodes.filter((_, i) => i % 5 === 0).map(n => n.id));
  importantNodes.add(start);
  importantNodes.add(end);

  yield { visited: [...importantNodes], frontier: [], path: [], done: false };

  // Bidirectional A* restricted to important nodes
  const g = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new MinHeap<string>();
  pq.push(0, start);

  while (pq.size) {
    const [, cur] = pq.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    if (cur === end) break;

    for (const nb of (adj.get(cur) || [])) {
      if (!importantNodes.has(nb.to) && nb.to !== end) continue;
      const ng = (g.get(cur) ?? Infinity) + nb.weight;
      if (ng < (g.get(nb.to) ?? Infinity)) {
        g.set(nb.to, ng);
        prev.set(nb.to, cur);
        pq.push(ng + heuristic(nmap.get(nb.to)!, endNode), nb.to);
      }
    }
    yield { visited: [...importantNodes, ...visited], frontier: [], path: [], done: false };
  }

  yield { visited: [...importantNodes, ...visited], frontier: [], path: reconstructPath(prev, end), done: true };
}

// Distance Vector routing
function* distanceVector(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const dist = new Map<string, Map<string, number>>();
  const visited = new Set<string>([start]);

  // Initialize
  for (const n of nodes) {
    const table = new Map<string, number>();
    table.set(n.id, 0);
    for (const nb of (adj.get(n.id) || [])) {
      table.set(nb.to, nb.weight);
    }
    dist.set(n.id, table);
  }

  // Simulate ripple updates
  for (let round = 0; round < 8; round++) {
    let updated = false;
    for (const n of nodes) {
      const tableN = dist.get(n.id)!;
      for (const nb of (adj.get(n.id) || [])) {
        const tableNb = dist.get(nb.to)!;
        for (const [dest, d] of tableNb) {
          const newD = nb.weight + d;
          if (newD < (tableN.get(dest) ?? Infinity)) {
            tableN.set(dest, newD);
            updated = true;
            visited.add(nb.to);
          }
        }
      }
    }
    if (!updated) break;
    yield { visited: [...visited], frontier: [], path: [], done: false };
  }

  // Extract path using accumulated distances
  const startTable = dist.get(start)!;
  const prev = new Map<string, string>();

  for (const n of nodes) {
    const tableN = dist.get(n.id)!;
    for (const nb of (adj.get(n.id) || [])) {
      if ((tableN.get(end) ?? Infinity) > nb.weight + (dist.get(nb.to)?.get(end) ?? Infinity)) {
        prev.set(n.id, nb.to);
      }
    }
  }

  const path: string[] = [start];
  let cur = start;
  const seen = new Set([start]);
  while (cur !== end && path.length < 50) {
    const next = prev.get(cur);
    if (!next || seen.has(next)) break;
    seen.add(next);
    path.push(next);
    cur = next;
  }

  yield { visited: [...visited], frontier: [], path: path[path.length - 1] === end ? path : [], done: true };
}

// Link-State (OSPF)
function* linkState(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  // Phase 1: broadcast (all nodes appear)
  const visited = new Set<string>();
  const allNodeIds = nodes.map(n => n.id);

  for (let i = 0; i < allNodeIds.length; i += 5) {
    for (let j = i; j < Math.min(i + 5, allNodeIds.length); j++) {
      visited.add(allNodeIds[j]);
    }
    yield { visited: [...visited], frontier: [], path: [], done: false };
  }

  // Phase 2: each node runs Dijkstra, we show the tree from start
  const adj = buildAdjList(edges);
  const dist = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, string>();
  const settled = new Set<string>();
  const pq = new MinHeap<string>();
  pq.push(0, start);

  while (pq.size) {
    const [d, cur] = pq.pop()!;
    if (settled.has(cur)) continue;
    settled.add(cur);
    if (cur === end) break;
    for (const nb of (adj.get(cur) || [])) {
      const nd = d + nb.weight;
      if (nd < (dist.get(nb.to) ?? Infinity)) {
        dist.set(nb.to, nd);
        prev.set(nb.to, cur);
        pq.push(nd, nb.to);
      }
    }
  }

  yield { visited: [...visited], frontier: [], path: reconstructPath(prev, end), done: true };
}

// Path Vector (BGP) - policy based
function* pathVector(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  // Simulate policy zones
  const zoneA = new Set(nodes.slice(0, Math.floor(nodes.length / 3)).map(n => n.id));
  const zoneB = new Set(nodes.slice(Math.floor(nodes.length / 3), Math.floor(2 * nodes.length / 3)).map(n => n.id));

  const visited = new Set<string>([start]);
  const prev = new Map<string, string>();
  const queue = [start];

  // Propagate with zone-based policy
  while (queue.length) {
    const next: string[] = [];
    for (const cur of queue) {
      for (const nb of (adj.get(cur) || [])) {
        if (visited.has(nb.to)) continue;
        // Policy: prefer staying in same zone
        const sameZone = (zoneA.has(cur) && zoneA.has(nb.to)) || (zoneB.has(cur) && zoneB.has(nb.to));
        if (!sameZone && Math.random() < 0.3) continue; // filter some cross-zone
        visited.add(nb.to);
        prev.set(nb.to, cur);
        next.push(nb.to);
      }
    }
    queue.splice(0, queue.length, ...next);
    yield { visited: [...visited], frontier: [...queue], path: [], done: false };
    if (visited.has(end)) break;
  }

  const path = visited.has(end) ? reconstructPath(prev, end) : [];
  yield { visited: [...visited], frontier: [], path, done: true };
}

// RL Routing (simulate convergence)
function* rlRouting(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;
  const allVisited = new Set<string>();
  let bestPath: string[] = [];
  const qTable = new Map<string, Map<string, number>>();

  for (let ep = 0; ep < 20; ep++) {
    // Epsilon-greedy episode
    const eps = Math.max(0.1, 1 - ep * 0.05);
    const path = [start];
    let cur = start;
    const visited = new Set([start]);

    for (let step = 0; step < 40; step++) {
      if (cur === end) break;
      const neighbors = (adj.get(cur) || []).filter(nb => !visited.has(nb.to));
      if (!neighbors.length) break;

      let chosen: typeof neighbors[0];
      if (Math.random() < eps) {
        // Explore
        chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
      } else {
        // Exploit
        const qCur = qTable.get(cur) ?? new Map();
        chosen = neighbors.reduce((best, nb) => {
          const q = qCur.get(nb.to) ?? 0;
          const bq = (qTable.get(cur) ?? new Map()).get(best.to) ?? 0;
          return q > bq ? nb : best;
        });
      }

      // Update Q-value
      if (!qTable.has(cur)) qTable.set(cur, new Map());
      const reward = chosen.to === end ? 100 : -1 - heuristic(nmap.get(chosen.to)!, endNode) * 0.001;
      const prevQ = qTable.get(cur)!.get(chosen.to) ?? 0;
      qTable.get(cur)!.set(chosen.to, prevQ + 0.1 * (reward - prevQ));

      visited.add(chosen.to);
      allVisited.add(chosen.to);
      path.push(chosen.to);
      cur = chosen.to;
    }

    if (cur === end && (!bestPath.length || path.length < bestPath.length)) bestPath = path;
    if (ep % 3 === 0) yield { visited: [...allVisited], frontier: [], path: bestPath, done: false };
  }

  yield { visited: [...allVisited], frontier: [], path: bestPath, done: true };
}

// Multi-Criteria Routing
function* multiCriteria(nodes: Node[], edges: Edge[], start: string, end: string): Generator<AlgorithmStep> {
  const adj = buildAdjList(edges);
  const nmap = nodeMap(nodes);
  const endNode = nmap.get(end)!;
  const allVisited = new Set<string>();

  // Run 3 Dijkstra variants with different cost functions
  const criteria = [
    { name: 'distance', fn: (w: number) => w },
    { name: 'time', fn: (w: number) => w * (1 + Math.random() * 0.5) },
    { name: 'comfort', fn: (w: number) => w * (0.5 + Math.random()) },
  ];

  let lastPath: string[] = [];
  for (const crit of criteria) {
    const dist = new Map<string, number>([[start, 0]]);
    const prev = new Map<string, string>();
    const visited = new Set<string>();
    const pq = new MinHeap<string>();
    pq.push(0, start);

    while (pq.size) {
      const [d, cur] = pq.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      allVisited.add(cur);
      if (cur === end) break;

      for (const nb of (adj.get(cur) || [])) {
        const nd = d + crit.fn(nb.weight);
        if (nd < (dist.get(nb.to) ?? Infinity)) {
          dist.set(nb.to, nd);
          prev.set(nb.to, cur);
          pq.push(nd + heuristic(nmap.get(nb.to)!, endNode), nb.to);
        }
      }
    }

    lastPath = reconstructPath(prev, end);
    yield { visited: [...allVisited], frontier: [], path: lastPath, done: false };
  }

  yield { visited: [...allVisited], frontier: [], path: lastPath, done: true };
}

export type AlgorithmRunner = (
  nodes: Node[], edges: Edge[], start: string, end: string, costFn?: CostFn
) => Generator<AlgorithmStep>;

export const RUNNERS: Record<string, AlgorithmRunner> = {
  'bfs': bfs,
  'dfs': dfs,
  'dijkstra': dijkstra,
  'bellman-ford': bellmanFord,
  'greedy': greedy,
  'astar': astar,
  'bidirectional': bidirectional,
  'floyd-warshall': floydWarshall,
  'johnsons': johnsons,
  'contraction': contractionHierarchies,
  'alt': alt,
  'hub-labeling': hubLabeling,
  'bidir-dijkstra': bidirDijkstra,
  'goal-directed': goalDirected,
  'time-dependent': timeDependent,
  'dstar': dstar,
  'yen-k': yenK,
  'multi-criteria': multiCriteria,
  'distance-vector': distanceVector,
  'link-state': linkState,
  'path-vector': pathVector,
  'genetic': genetic,
  'ant-colony': antColony,
  'rl-routing': rlRouting,
};