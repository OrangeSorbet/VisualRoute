import type { Node, Edge } from '../types';

export type AdjList = Map<string, { to: string; weight: number; edge: Edge }[]>;

export function buildAdjList(edges: Edge[], costFn: (e: Edge) => number): AdjList {
  const adj: AdjList = new Map();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push({ to: e.to, weight: costFn(e), edge: e });
    if (!e.oneway) {
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.to)!.push({ to: e.from, weight: costFn(e), edge: e });
    }
  }
  return adj;
}

export function heuristic(a: Node, b: Node): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function reconstructPath(prev: Map<string, string>, end: string): string[] {
  const path: string[] = [];
  let cur: string | undefined = end;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    path.unshift(cur);
    seen.add(cur);
    cur = prev.get(cur);
  }
  return path;
}

// Cost functions for 3 objectives
export const COST_FASTEST = (e: Edge) => e.travelTime * e.trafficMultiplier;
export const COST_SHORTEST = (e: Edge) => e.weight;
export const COST_SAFEST = (e: Edge) => e.riskScore * e.weight;