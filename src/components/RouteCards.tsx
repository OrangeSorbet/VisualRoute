import type { MultiObjectiveResult, GraphData } from '../types';

type Props = {
  result: MultiObjectiveResult;
  active: 'fastest' | 'shortest' | 'safest';
  onSelect: (r: 'fastest' | 'shortest' | 'safest') => void;
  graphData: GraphData;
};

const CARD_CONFIG = {
  fastest: { icon: '⚡', color: '#00d4ff', unit: (c: number) => `${Math.round(c / 60)}min` },
  shortest: { icon: '📏', color: '#7fff00', unit: (c: number) => `${(c / 1000).toFixed(1)}km` },
  safest: { icon: '🛡', color: '#da70d6', unit: (c: number) => `risk ${c.toFixed(0)}` },
};

export function RouteCards({ result, active, onSelect }: Props) {
  return (
    <div className="route-cards">
      {(['fastest', 'shortest', 'safest'] as const).map(key => {
        const cfg = CARD_CONFIG[key];
        const r = result[key];
        return (
          <button
            key={key}
            className={`route-card ${active === key ? 'active' : ''}`}
            style={{ '--card-color': cfg.color } as any}
            onClick={() => onSelect(key)}
          >
            <span className="card-icon">{cfg.icon}</span>
            <div className="card-info">
              <div className="card-label">{r.label}</div>
              <div className="card-cost">{cfg.unit(r.cost)}</div>
              <div className="card-hops">{r.path.length} nodes</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}