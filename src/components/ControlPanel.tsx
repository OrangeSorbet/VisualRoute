import { useState } from 'react';
import type { AlgorithmId, AlgorithmDef, PlayState } from '../types';
import { ALGORITHMS } from '../algorithms/definitions';

type Props = {
    selectedAlgo: AlgorithmId;
    onAlgoChange: (id: AlgorithmId) => void;
    playState: PlayState;
    onPlay: () => void;
    onPause: () => void;
    onReset: () => void;
    speed: number;
    onSpeedChange: (v: number) => void;
    startId: string | null;
    endId: string | null;
    startCoords: [number, number] | null;
    endCoords: [number, number] | null;
    selectionMode: 'start' | 'end' | null;
    onSetSelectionMode: (m: 'start' | 'end' | null) => void;
    currentStep: number;
    totalSteps: number;
    algorithmDef: AlgorithmDef | null;
};

const CATEGORIES = Array.from(new Set(ALGORITHMS.map(a => a.category)));

export function ControlPanel({
  selectedAlgo, onAlgoChange, playState, onPlay, onPause, onReset,
  speed, onSpeedChange, startId, endId, selectionMode, onSetSelectionMode,
  currentStep, totalSteps, algorithmDef, startCoords, endCoords
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [catFilter, setCatFilter] = useState<string>('All');

  const filtered = catFilter === 'All' ? ALGORITHMS : ALGORITHMS.filter(a => a.category === catFilter);

  return (
    <div className="control-panel" style={{ opacity: expanded ? 1 : 0.85 }}>
      <div className="panel-header" onClick={() => setExpanded(e => !e)}>
        <div className="panel-title">
          <span className="logo-dot" />
          <span>PATHFINDER</span>
        </div>
        <span className="collapse-btn">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="panel-body">
          {/* Algorithm selector */}
          <div className="section">
            <div className="section-label">ALGORITHM</div>
            <div className="cat-tabs">
              {['All', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  className={`cat-tab ${catFilter === cat ? 'active' : ''}`}
                  onClick={() => setCatFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <select
              className="algo-select"
              value={selectedAlgo}
              onChange={e => onAlgoChange(e.target.value as AlgorithmId)}
            >
              {filtered.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {algorithmDef && (
              <div className="algo-desc" style={{ borderLeftColor: algorithmDef.color }}>
                <span className="algo-dot" style={{ background: algorithmDef.color }} />
                {algorithmDef.description}
              </div>
            )}
          </div>

          {/* Point selection */}
          <div className="section">
            <div className="section-label">SELECT POINTS</div>
            <div style={{ fontSize: 12, color: 'yellow' }}>
            Mode: {selectionMode ?? 'NONE'}
            </div>
            <div className="point-btns">
              <button
                className={`point-btn start ${selectionMode === 'start' ? 'active' : ''} ${startId ? 'set' : ''}`}
                onClick={() => onSetSelectionMode(selectionMode === 'start' ? null : 'start')}
              >
                <span className="point-icon">⬤</span>
                {startId ? 'START SET' : 'SET START'}
              </button>
              <button
                className={`point-btn end ${selectionMode === 'end' ? 'active' : ''} ${endId ? 'set' : ''}`}
                onClick={() => onSetSelectionMode(selectionMode === 'end' ? null : 'end')}
              >
                <span className="point-icon">⬤</span>
                {endId ? 'END SET' : 'SET END'}
              </button>
            </div>
            {selectionMode && (
                <div className="hint">
                    Click on the map to set {selectionMode === 'start' ? 'start' : 'end'} point
                </div>
                )}

                {startCoords && (
                <div className="coords">
                    Start: {startCoords[1].toFixed(5)}, {startCoords[0].toFixed(5)}
                </div>
                )}

                {endCoords && (
                <div className="coords">
                    End: {endCoords[1].toFixed(5)}, {endCoords[0].toFixed(5)}
                </div>
            )}
          </div>

          {/* Playback controls */}
          <div className="section">
            <div className="section-label">PLAYBACK</div>
            <div className="playback-row">
              <button
                className="ctrl-btn play"
                onClick={playState === 'playing' ? onPause : onPlay}
                disabled={!startId || !endId}
              >
                {playState === 'playing' ? '⏸' : '▶'}
              </button>
              <button className="ctrl-btn reset" onClick={onReset}>⟳</button>
            </div>

            <div className="speed-row">
              <span className="speed-label">SPEED</span>
              <input
                type="range"
                min={1}
                max={10}
                value={speed}
                onChange={e => onSpeedChange(Number(e.target.value))}
                className="speed-slider"
              />
              <span className="speed-val">{speed}x</span>
            </div>
          </div>

          {/* Progress */}
          {totalSteps > 0 && (
            <div className="section">
              <div className="section-label">PROGRESS</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(currentStep / totalSteps) * 100}%`,
                    background: algorithmDef?.color ?? '#00d4ff'
                  }}
                />
              </div>
              <div className="progress-text">
                Step {currentStep} / {totalSteps}
                {playState === 'done' && <span className="done-badge">DONE</span>}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="legend">
            <div className="legend-item"><span className="leg-dot" style={{ background: '#00ff88' }} /> Start</div>
            <div className="legend-item"><span className="leg-dot" style={{ background: '#ff4455' }} /> End</div>
            <div className="legend-item"><span className="leg-dot" style={{ background: algorithmDef?.color ?? '#00d4ff' }} /> Visited</div>
            <div className="legend-item"><span className="leg-dot" style={{ background: '#ff6b35' }} /> Frontier</div>
            <div className="legend-item"><span className="leg-dot" style={{ background: '#ffffff' }} /> Path</div>
          </div>
        </div>
      )}
    </div>
  );
}