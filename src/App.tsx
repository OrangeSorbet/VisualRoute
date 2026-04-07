import { useState, useCallback, useRef, useEffect } from 'react';
import { MapView } from './components/MapView';
import { ControlPanel } from './components/ControlPanel';
import { TrafficPanel } from './components/TrafficPanel';
import { RouteCards } from './components/RouteCards';
import { NavigationBar } from './components/NavigationBar';
import { ElevationProfile } from './components/ElevationProfile';
import type {
  AlgorithmId, AlgorithmStep, PlayState, GraphData,
  MultiObjectiveResult, TrafficMultipliers, TrafficPreset
} from './types';
import { ALGORITHM_MAP } from './algorithms/definitions';
import { loadGraphData, findNearestNode } from './utils/graphLoader';
import AlgorithmWorker from './workers/algorithm.worker?worker';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

const TRAFFIC_PRESETS: Record<TrafficPreset, TrafficMultipliers> = {
  freeflow: { motorway: 1.0, trunk: 1.0, primary: 1.0, secondary: 1.0, residential: 1.0, default: 1.0 },
  morning:  { motorway: 2.5, trunk: 2.2, primary: 2.8, secondary: 2.0, residential: 1.5, default: 2.0 },
  midday:   { motorway: 1.4, trunk: 1.3, primary: 1.5, secondary: 1.3, residential: 1.1, default: 1.3 },
  evening:  { motorway: 3.0, trunk: 2.5, primary: 3.2, secondary: 2.2, residential: 1.6, default: 2.5 },
  night:    { motorway: 1.1, trunk: 1.0, primary: 1.1, secondary: 1.0, residential: 1.0, default: 1.0 },
};

export default function App() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmId>('astar');
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [speed, setSpeed] = useState(3);
  const [startId, setStartId] = useState<string | null>(null);
  const [endId, setEndId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'start' | 'end' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayStep, setDisplayStep] = useState<AlgorithmStep | null>(null);
  const [multiResult, setMultiResult] = useState<MultiObjectiveResult | null>(null);
  const [activeRoute, setActiveRoute] = useState<'fastest' | 'shortest' | 'safest'>('fastest');
  const [trafficMultipliers, setTrafficMultipliers] = useState<TrafficMultipliers>(TRAFFIC_PRESETS.freeflow);
  const [trafficPreset, setTrafficPreset] = useState<TrafficPreset>('freeflow');
  const [showElevation, setShowElevation] = useState(false);

  const stepsRef = useRef<AlgorithmStep[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const lastTimeRef = useRef(0);
  const playStateRef = useRef<PlayState>('idle');
  playStateRef.current = playState;

  const algorithmDef = ALGORITHM_MAP.get(selectedAlgo) ?? null;
  const reloadGraph = async (lat: number, lon: number) => {
    console.log("RELOADING GRAPH:", lat, lon);

    await fetch(`/run-graph?lat=${lat}&lon=${lon}`);
    const data = await loadGraphData();

    setGraphData(data);
    setStartId(null);
    setEndId(null);
    setSelectionMode(null);
  };
  // Load graph data
  useEffect(() => {
    if (!navigator.geolocation) {
      setLoadError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      setUserLocation([longitude, latitude]);

      // ⚡ CALL PYTHON (via node child process)
      await fetch(`/run-graph?lat=${latitude}&lon=${longitude}`);

      const data = await loadGraphData();
      setGraphData(data);

      const nearest = findNearestNode(latitude, longitude, data);
      setStartId(nearest);
    });
  }, []);

  const stopAnimation = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const runAnimation = useCallback((spd: number) => {
    const loop = (time: number) => {
      if (playStateRef.current !== 'playing') return;
      const interval = Math.max(16, 500 / spd);
      if (time - lastTimeRef.current >= interval) {
        lastTimeRef.current = time;
        const idx = stepIndexRef.current;
        const steps = stepsRef.current;
        if (idx < steps.length) {
          setDisplayStep(steps[idx]);
          setCurrentStep(idx + 1);
          stepIndexRef.current = idx + 1;
        } else if (steps.length > 0) {
          setPlayState('done');
          return;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const handlePlay = useCallback(() => {
    if (!startId || !endId || !graphData) return;

    if (playState === 'paused' && stepsRef.current.length > 0) {
      setPlayState('playing');
      runAnimation(speed);
      return;
    }

    stopAnimation();
    stepsRef.current = [];
    stepIndexRef.current = 0;
    setCurrentStep(0);
    setDisplayStep(null);
    setMultiResult(null);

    workerRef.current?.terminate();
    const worker = new AlgorithmWorker();
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'step') stepsRef.current.push(msg.step);
      else if (msg.type === 'multiObjective') setMultiResult(msg.result);
      else if (msg.type === 'error') console.error('Worker error:', msg.msg);
    };

    worker.postMessage({
      type: 'run',
      graphData,
      start: startId,
      end: endId,
      algorithmId: selectedAlgo,
      trafficMultipliers,
    });

    setPlayState('playing');
    setTimeout(() => runAnimation(speed), 100);
  }, [startId, endId, graphData, selectedAlgo, playState, speed, trafficMultipliers, stopAnimation, runAnimation]);

  const handlePause = useCallback(() => {
    stopAnimation();
    setPlayState('paused');
  }, [stopAnimation]);

  const handleReset = useCallback(() => {
    stopAnimation();
    workerRef.current?.terminate();
    stepsRef.current = [];
    stepIndexRef.current = 0;
    setCurrentStep(0);
    setDisplayStep(null);
    setMultiResult(null);
    setPlayState('idle');
  }, [stopAnimation]);

  const handleNodeClick = useCallback((nodeId: string) => {
    console.log("APP RECEIVED CLICK:", nodeId, "mode:", selectionMode);

    if (selectionMode === 'start') {
      setStartId(nodeId);
      setSelectionMode(null); // ✅ IMPORTANT
    } 
    else if (selectionMode === 'end') {
      setEndId(nodeId);
      setSelectionMode(null); // ✅ IMPORTANT
    }
  }, [selectionMode]);

  const handleTrafficPreset = useCallback((preset: TrafficPreset) => {
    setTrafficPreset(preset);
    setTrafficMultipliers(TRAFFIC_PRESETS[preset]);
    handleReset();
  }, [handleReset]);

  const handleTrafficSlider = useCallback((road: keyof TrafficMultipliers, val: number) => {
    setTrafficMultipliers(prev => ({ ...prev, [road]: val }));
    setTrafficPreset('freeflow'); // custom
    handleReset();
  }, [handleReset]);

  useEffect(() => { handleReset(); }, [selectedAlgo]);

  const activePath = multiResult?.[activeRoute]?.path ?? displayStep?.path ?? [];

  if (loadError) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#ff4455', fontFamily: 'monospace', flexDirection: 'column', gap: 12, background: '#050d1a' }}>
      <div style={{ fontSize: 24 }}>⚠ Failed to load graph.json</div>
      <div style={{ fontSize: 13, color: '#5a7090' }}>{loadError}</div>
      <div style={{ fontSize: 11, color: '#5a7090' }}>Place a valid graph.json in /public and reload</div>
    </div>
  );

  if (!graphData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#00d4ff', fontFamily: 'monospace', flexDirection: 'column', gap: 12, background: '#050d1a' }}>
      <div className="loading-spinner" />
      <div>Loading road network…</div>
    </div>
  );

  return (
    <div className="app">
      <MapView
        graphData={graphData}
        userLocation={userLocation}
        algorithmDef={algorithmDef}
        currentStep={displayStep}
        startId={startId}
        endId={endId}
        selectionMode={selectionMode}
        onNodeClick={handleNodeClick}
        multiResult={multiResult}
        activeRoute={activeRoute}
        onMapMove={reloadGraph}
      />

      <ControlPanel
        selectedAlgo={selectedAlgo}
        onAlgoChange={id => { setSelectedAlgo(id); }}
        playState={playState}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
        startId={startId}
        endId={endId}
        startCoords={startId ? (() => {
          const n = graphData.nodes.find(n => n.id === startId);
          return n ? [n.lon, n.lat] : null;
        })() : null}
        endCoords={endId ? (() => {
          const n = graphData.nodes.find(n => n.id === endId);
          return n ? [n.lon, n.lat] : null;
        })() : null}
        selectionMode={selectionMode}
        onSetSelectionMode={setSelectionMode}
        currentStep={currentStep}
        totalSteps={stepsRef.current.length || currentStep}
        algorithmDef={algorithmDef}
      />

      <TrafficPanel
        multipliers={trafficMultipliers}
        preset={trafficPreset}
        onPreset={handleTrafficPreset}
        onSlider={handleTrafficSlider}
      />

      {multiResult && (
        <RouteCards
          result={multiResult}
          active={activeRoute}
          onSelect={setActiveRoute}
          graphData={graphData}
        />
      )}

      {multiResult && (
        <NavigationBar
          path={activePath}
          graphData={graphData}
          activeRoute={activeRoute}
          result={multiResult}
          onToggleElevation={() => setShowElevation(v => !v)}
        />
      )}

      {showElevation && activePath.length > 0 && (
        <ElevationProfile path={activePath} graphData={graphData} />
      )}
    </div>
  );
}