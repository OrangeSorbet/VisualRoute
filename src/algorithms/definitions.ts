import type { AlgorithmDef } from '../types';

export const ALGORITHMS: AlgorithmDef[] = [
  { id: 'bfs', name: 'BFS', category: 'Core', description: 'Uniform flood-fill, layer by layer', color: '#00d4ff', animStyle: 'flood-fill' },
  { id: 'dfs', name: 'DFS', category: 'Core', description: 'Deep wandering path with backtracking', color: '#ff6b35', animStyle: 'wandering' },
  { id: 'dijkstra', name: 'Dijkstra', category: 'Core', description: 'Weighted expanding wave', color: '#7fff00', animStyle: 'wave' },
  { id: 'bellman-ford', name: 'Bellman-Ford', category: 'Core', description: 'Repeated global edge relaxation', color: '#ffd700', animStyle: 'sweep' },
  { id: 'greedy', name: 'Greedy Best-First', category: 'Heuristic', description: 'Sharp beam toward target', color: '#ff69b4', animStyle: 'beam' },
  { id: 'astar', name: 'A*', category: 'Heuristic', description: 'Directed cone toward goal', color: '#00ff88', animStyle: 'cone' },
  { id: 'bidirectional', name: 'Bidirectional Search', category: 'Heuristic', description: 'Two waves colliding', color: '#da70d6', animStyle: 'collision' },
  { id: 'floyd-warshall', name: 'Floyd-Warshall', category: 'All-Pairs', description: 'All-pairs DP matrix updates', color: '#ff8c00', animStyle: 'matrix' },
  { id: 'johnsons', name: "Johnson's", category: 'All-Pairs', description: 'Reweight + Dijkstra waves', color: '#40e0d0', animStyle: 'multi-wave' },
  { id: 'contraction', name: 'Contraction Hierarchies', category: 'Optimization', description: 'Sparse jumps on important roads', color: '#ff4500', animStyle: 'sparse-jump' },
  { id: 'alt', name: 'ALT (A* + Landmarks)', category: 'Optimization', description: 'Strong directional pull', color: '#9370db', animStyle: 'landmark' },
  { id: 'hub-labeling', name: 'Hub Labeling', category: 'Optimization', description: 'Near-instant path highlight', color: '#00ced1', animStyle: 'instant' },
  { id: 'bidir-dijkstra', name: 'Bidirectional Dijkstra', category: 'Optimization', description: 'Two weighted waves meeting', color: '#ff1493', animStyle: 'bidir-wave' },
  { id: 'goal-directed', name: 'Goal-Directed Search', category: 'Optimization', description: 'Narrowed cone pruning', color: '#adff2f', animStyle: 'narrow-cone' },
  { id: 'time-dependent', name: 'Time-Dependent Dijkstra', category: 'Dynamic', description: 'Wave changes speed by time', color: '#ff7f50', animStyle: 'time-wave' },
  { id: 'dstar', name: 'D* Lite', category: 'Dynamic', description: 'Path reshapes as map changes', color: '#dc143c', animStyle: 'reshape' },
  { id: 'yen-k', name: "Yen's k-Shortest", category: 'Multi-Path', description: 'Multiple branching paths', color: '#20b2aa', animStyle: 'multi-path' },
  { id: 'multi-criteria', name: 'Multi-Criteria Routing', category: 'Multi-Path', description: 'Competing colored paths', color: '#ba55d3', animStyle: 'competing' },
  { id: 'distance-vector', name: 'Distance Vector (RIP)', category: 'Distributed', description: 'Peer-to-peer ripple updates', color: '#cd853f', animStyle: 'ripple' },
  { id: 'link-state', name: 'Link-State (OSPF)', category: 'Distributed', description: 'Network broadcast then trees', color: '#4169e1', animStyle: 'broadcast' },
  { id: 'path-vector', name: 'Path Vector (BGP)', category: 'Distributed', description: 'Policy-based path appear/disappear', color: '#2e8b57', animStyle: 'policy' },
  { id: 'genetic', name: 'Genetic Algorithm', category: 'Metaheuristic', description: 'Evolving population of routes', color: '#ff6347', animStyle: 'evolving' },
  { id: 'ant-colony', name: 'Ant Colony Optimization', category: 'Metaheuristic', description: 'Many agents, path thickens', color: '#daa520', animStyle: 'pheromone' },
  { id: 'rl-routing', name: 'RL Routing', category: 'Learning', description: 'Paths stabilize from chaos', color: '#7b68ee', animStyle: 'stabilize' },
];

export const ALGORITHM_MAP = new Map(ALGORITHMS.map(a => [a.id, a]));