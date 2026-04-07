import type { GraphData } from '../types';

type Props = { path: string[]; graphData: GraphData };

export function ElevationProfile({ path, graphData }: Props) {
  const nmap = new Map(graphData.nodes.map(n => [n.id, n]));
  const points = path.map(id => nmap.get(id)?.elevation ?? 0);
  if (points.every(p => p === 0)) return null;

  const min = Math.min(...points);
  const max = Math.max(...points) || 1;
  const W = 400, H = 80;
  const pts = points.map((e, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((e - min) / (max - min)) * H;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="elevation-panel">
      <div className="section-label" style={{ marginBottom: 6 }}>ELEVATION PROFILE</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id="elev-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#elev-grad)" />
        <polyline points={pts} fill="none" stroke="#00d4ff" strokeWidth="1.5" />
      </svg>
      <div className="elev-labels">
        <span>{min.toFixed(0)}m</span>
        <span>{max.toFixed(0)}m</span>
      </div>
    </div>
  );
}