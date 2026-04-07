import type { GraphData, Edge } from '../types';

let cached: GraphData | null = null;

export async function loadGraphData(lat: number, lon: number): Promise<GraphData> {
  if (cached) return cached;
  const res = await fetch(`/graph?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`Failed to load graph.json: ${res.status}`);
  const raw = await res.json();

  // Normalize edges — fill missing fields with safe defaults
  const edges: Edge[] = (raw.edges as any[]).map(e => ({
    from: String(e.from),
    to: String(e.to),
    weight: e.weight ?? e.length ?? 100,
    travelTime: e.travelTime ?? e.travel_time ?? (e.weight ?? 100) / 13.9,
    speedLimit: e.speedLimit ?? e.speed_kph ?? 50,
    lanes: Number(e.lanes ?? 1),
    highway: e.highway ?? 'residential',
    name: e.name ?? '',
    oneway: Boolean(e.oneway ?? false),
    trafficMultiplier: 1.0,
    riskScore: computeRisk(e.highway ?? 'residential'),
  }));

  cached = { nodes: raw.nodes, edges };
  return cached;
}

function computeRisk(highway: string): number {
  const table: Record<string, number> = {
    motorway: 0.15, motorway_link: 0.2,
    trunk: 0.2, trunk_link: 0.25,
    primary: 0.3, primary_link: 0.35,
    secondary: 0.4, secondary_link: 0.45,
    tertiary: 0.5, tertiary_link: 0.55,
    residential: 0.35, living_street: 0.25,
    service: 0.6, unclassified: 0.55,
  };
  return table[highway] ?? 0.5;
}

export function applyTraffic(graphData: GraphData, multipliers: Record<string, number>): GraphData {
  return {
    ...graphData,
    edges: graphData.edges.map(e => ({
      ...e,
      trafficMultiplier: multipliers[e.highway] ?? multipliers['default'] ?? 1.0,
    })),
  };
}

export function findNearestNode(lat: number, lon: number, graphData: GraphData): string {
  let best = graphData.nodes[0].id;
  let bestD = Infinity;
  for (const n of graphData.nodes) {
    const dx = n.lat - lat, dy = n.lon - lon;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = n.id; }
  }
  return best;
}