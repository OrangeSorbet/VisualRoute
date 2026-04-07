import type { WorkerMessage, AlgorithmId, MultiObjectiveResult } from '../types';
import { RUNNERS } from '../algorithms/runners';
import { COST_FASTEST, COST_SHORTEST, COST_SAFEST } from '../algorithms/graphUtils';
import { applyTraffic } from '../utils/graphLoader';
import type { Node, Edge, GraphData } from '../types';

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  if (e.data.type !== 'run') return;
  const { graphData, start, end, algorithmId, trafficMultipliers } = e.data;

  const graph = applyTraffic(graphData as GraphData, trafficMultipliers as any);
  const runner = RUNNERS[algorithmId as AlgorithmId];

  if (!runner) {
    self.postMessage({ type: 'error', msg: `Unknown algorithm: ${algorithmId}` });
    return;
  }

  try {
    // Stream animation steps using the chosen algo's natural cost (fastest by default)
    const gen = runner(graph.nodes as Node[], graph.edges as Edge[], start, end, COST_FASTEST);
    for (const step of gen) {
      self.postMessage({ type: 'step', step });
    }

    // After animation, compute all 3 objectives with A* for the result cards
    const astar = RUNNERS['astar'];
    const computePath = (costFn: typeof COST_FASTEST, label: string) => {
      const g = astar(graph.nodes, graph.edges, start, end, costFn);
      let last: any = { path: [], done: false };
      for (const s of g) { last = s; }
      const cost = last.path.reduce((acc: number, id: string, i: number) => {
        if (i === 0) return 0;
        const from = last.path[i - 1];
        const edge = graph.edges.find((edge: Edge) => edge.from === from && edge.to === id);
        return acc + (edge ? costFn(edge) : 0);
      }, 0);
      return { path: last.path, cost: Math.round(cost), label };
    };

    const result: MultiObjectiveResult = {
      fastest: computePath(COST_FASTEST, 'Fastest'),
      shortest: computePath(COST_SHORTEST, 'Shortest'),
      safest: computePath(COST_SAFEST, 'Safest'),
    };

    self.postMessage({ type: 'multiObjective', result });
    self.postMessage({ type: 'done' });
  } catch (err) {
    self.postMessage({ type: 'error', msg: String(err) });
  }
};