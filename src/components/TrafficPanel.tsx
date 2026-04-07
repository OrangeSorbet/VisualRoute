import type { TrafficMultipliers, TrafficPreset } from '../types';

const ROAD_TYPES: (keyof TrafficMultipliers)[] = ['motorway', 'trunk', 'primary', 'secondary', 'residential'];
const PRESETS: TrafficPreset[] = ['freeflow', 'morning', 'midday', 'evening', 'night'];

const PRESET_LABELS: Record<TrafficPreset, string> = {
  freeflow: '🟢 Free', morning: '🌅 AM Rush', midday: '🌤 Midday', evening: '🌆 PM Rush', night: '🌙 Night'
};

type Props = {
  multipliers: TrafficMultipliers;
  preset: TrafficPreset;
  onPreset: (p: TrafficPreset) => void;
  onSlider: (road: keyof TrafficMultipliers, val: number) => void;
};

export function TrafficPanel({ multipliers, preset, onPreset, onSlider }: Props) {
  const getColor = (v: number) =>
    v < 1.3 ? '#00ff88' : v < 1.8 ? '#ffd700' : v < 2.5 ? '#ff8c00' : '#ff4455';

  return (
    <div className="traffic-panel">
      <div className="section-label" style={{ marginBottom: 8 }}>TRAFFIC CONDITIONS</div>
      <div className="preset-row">
        {PRESETS.map(p => (
          <button key={p} className={`preset-btn ${preset === p ? 'active' : ''}`} onClick={() => onPreset(p)}>
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>
      <div className="sliders">
        {ROAD_TYPES.map(road => (
          <div key={road} className="slider-row">
            <span className="road-label">{road}</span>
            <input
              type="range" min={1} max={4} step={0.1}
              value={multipliers[road]}
              onChange={e => onSlider(road, Number(e.target.value))}
              className="traffic-slider"
              style={{ '--thumb-color': getColor(multipliers[road]) } as any}
            />
            <span className="mult-val" style={{ color: getColor(multipliers[road]) }}>
              {multipliers[road].toFixed(1)}×
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}