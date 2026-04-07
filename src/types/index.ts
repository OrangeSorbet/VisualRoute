export type Node = {
  id: string;
  lat: number;
  lon: number;
  elevation?: number;
};

export type Edge = {
  from: string;
  to: string;
  weight: number;           // meters (physical, immutable)
  travelTime: number;       // seconds base
  speedLimit: number;       // kph
  lanes: number;
  highway: string;
  name: string;
  oneway: boolean;
  trafficMultiplier: number; // 1.0 free flow → 4.0 gridlock
  riskScore: number;         // 0–1
};

export type GraphData = {
  nodes: Node[];
  edges: Edge[];
};

export type AlgorithmStep = {
  visited: string[];
  frontier: string[];
  path: string[];
  done: boolean;
  objective?: 'fastest' | 'shortest' | 'safest';
};

export type MultiObjectiveResult = {
  fastest: { path: string[]; cost: number; label: string };
  shortest: { path: string[]; cost: number; label: string };
  safest: { path: string[]; cost: number; label: string };
};

export type TrafficPreset = 'freeflow' | 'morning' | 'midday' | 'evening' | 'night';

export type TrafficMultipliers = {
  motorway: number;
  trunk: number;
  primary: number;
  secondary: number;
  residential: number;
  default: number;
};

export type AlgorithmId =
  | 'bfs' | 'dfs' | 'dijkstra' | 'bellman-ford'
  | 'greedy' | 'astar' | 'bidirectional' | 'floyd-warshall'
  | 'johnsons' | 'contraction' | 'alt' | 'hub-labeling'
  | 'bidir-dijkstra' | 'goal-directed' | 'time-dependent'
  | 'dstar' | 'yen-k' | 'multi-criteria' | 'distance-vector'
  | 'link-state' | 'path-vector' | 'genetic' | 'ant-colony'
  | 'rl-routing';

export type AlgorithmDef = {
  id: AlgorithmId;
  name: string;
  category: string;
  description: string;
  color: string;
  animStyle: string;
};

export type WorkerMessage =
  | { type: 'run'; graphData: GraphData; start: string; end: string; algorithmId: AlgorithmId; trafficMultipliers: TrafficMultipliers }
  | { type: 'step'; step: AlgorithmStep }
  | { type: 'multiObjective'; result: MultiObjectiveResult }
  | { type: 'done' }
  | { type: 'error'; msg: string };

export type PlayState = 'idle' | 'playing' | 'paused' | 'done';