import type { GraphData, MultiObjectiveResult } from '../types';

type Props = {
  path: string[];
  graphData: GraphData;
  activeRoute: 'fastest' | 'shortest' | 'safest';
  result: MultiObjectiveResult;
  onToggleElevation: () => void;
};

export function NavigationBar({ path, graphData, activeRoute, result, onToggleElevation }: Props) {
  if (!path.length) return null;

  const nmap = new Map(graphData.nodes.map(n => [n.id, n]));
  const edgeMap = new Map(graphData.edges.map(e => [`${e.from}:${e.to}`, e]));

  // Find current road name (first named edge in path)
  let roadName = '';
  for (let i = 0; i < path.length - 1; i++) {
    const e = edgeMap.get(`${path[i]}:${path[i + 1]}`);
    if (e?.name) { roadName = e.name; break; }
  }

  const r = result[activeRoute];
  const distKm = (r.cost / 1000).toFixed(1);
  const timeMin = Math.round(result.fastest.cost / 60);

  return (
    <div className="nav-bar">
      <div className="nav-left">
        <div className="nav-icon">▲</div>
        <div className="nav-road">{roadName || 'Continue on route'}</div>
      </div>
      <div className="nav-center">
        <span className="nav-dist">{distKm} km</span>
        <span className="nav-sep">·</span>
        <span className="nav-time">{timeMin} min</span>
        <span className="nav-sep">·</span>
        <span className="nav-nodes">{path.length} waypoints</span>
      </div>
      <div className="nav-right">
        <button className="elev-btn" onClick={onToggleElevation} title="Elevation profile">⛰</button>
      </div>
    </div>
  );
}