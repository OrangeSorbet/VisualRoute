import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import type { GraphData, Node, AlgorithmStep, MultiObjectiveResult } from '../types';
import type { AlgorithmDef } from '../types';

type Props = {
  graphData: GraphData;
  algorithmDef: AlgorithmDef | null;
  currentStep: AlgorithmStep | null;
  startId: string | null;
  endId: string | null;
  selectionMode: 'start' | 'end' | null;
  onNodeClick: (nodeId: string) => void;
  multiResult: MultiObjectiveResult | null;
  activeRoute: 'fastest' | 'shortest' | 'safest';
  userLocation: [number, number] | null;
  onMapMove: (lat: number, lon: number) => void;
};

const NODE_RADIUS = 4;
const VISITED_COLOR = '#1e3a5f';
const FRONTIER_COLOR = '#ff6b35';

function latLonToMapCoord(lat: number, lon: number): [number, number] {
  return [lon, lat];
}

export function MapView({
    graphData,
    algorithmDef,
    currentStep,
    startId,
    endId,
    selectionMode,
    onNodeClick,
    multiResult,
    activeRoute,
    userLocation,
    onMapMove
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const initialized = useRef(false);
    const nodeMapRef = useRef<Map<string, Node>>(new Map());
    const selectionModeRef = useRef<'start' | 'end' | null>(null);
    const moveTimeoutRef = useRef<number | null>(null);
    
    useEffect(() => {
        nodeMapRef.current = new Map(graphData.nodes.map(n => [n.id, n]));
        selectionModeRef.current = selectionMode;
    }, [graphData, selectionMode]);

    useEffect(() => {
        selectionModeRef.current = selectionMode;
    }, [selectionMode]);
    
    useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    map.flyTo({
        center: userLocation,
        zoom: 15,
        essential: true
    });
    }, [userLocation]);

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;
    initialized.current = true;

    const bounds = graphData.nodes.reduce((acc, n) => ({
      minLat: Math.min(acc.minLat, n.lat),
      maxLat: Math.max(acc.maxLat, n.lat),
      minLon: Math.min(acc.minLon, n.lon),
      maxLon: Math.max(acc.maxLon, n.lon),
    }), { minLat: Infinity, maxLat: -Infinity, minLon: Infinity, maxLon: -Infinity });

    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLon = (bounds.minLon + bounds.maxLon) / 2;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            // To upgrade to vector: replace style with:
            // style: 'https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY'
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          }
        },
        layers: [{
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm',
          paint: { 'raster-opacity': 0.85 }
        }]
      },
      center: [centerLon, centerLat],
      zoom: 18,
    });

    map.on('load', () => {
        // Add edges source
        const edgeFeatures = graphData.edges.map(e => {
        const fn = nodeMapRef.current.get(e.from);
        const tn = nodeMapRef.current.get(e.to);
        if (!fn || !tn) return null;
        return {
            type: 'Feature' as const,
            properties: { from: e.from, to: e.to },
            geometry: {
            type: 'LineString' as const,
            coordinates: [latLonToMapCoord(fn.lat, fn.lon), latLonToMapCoord(tn.lat, tn.lon)],
            }
        };
    }).filter(Boolean);

    map.on('moveend', () => {
        if (!onMapMove) return;

        if (moveTimeoutRef.current) {
            clearTimeout(moveTimeoutRef.current);
        }

        moveTimeoutRef.current = window.setTimeout(() => {
            const center = map.getCenter();
            console.log("MAP MOVED FINAL:", center.lat, center.lng);

            onMapMove(center.lat, center.lng);
        }, 800); // adjust if needed
    });

    map.addSource('edges', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: edgeFeatures as any }
    });

    map.addLayer({
        id: 'edges-layer',
        type: 'line',
        source: 'edges',
        paint: {
            'line-color': '#2a3a5a',
            'line-width': 1.5,
            'line-opacity': 0.6,
        }
    });

    // Visited edges
    map.addSource('visited-edges', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
        id: 'visited-edges-layer',
        type: 'line',
        source: 'visited-edges',
        paint: {
            'line-color': ['get', 'color'],
            'line-width': 2,
            'line-opacity': 0.7,
        }
    });

    // Path edges
    map.addSource('path-edges', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
        id: 'path-edges-layer',
        type: 'line',
        source: 'path-edges',
        paint: {
            'line-color': '#ffffff',
            'line-width': 4,
            'line-opacity': 1,
            'line-gap-width': 0,
        }
    });

    // Nodes source
    const nodeFeatures = graphData.nodes.map(n => ({
    type: 'Feature' as const,
    properties: { id: n.id },
    geometry: {
        type: 'Point' as const,
        coordinates: latLonToMapCoord(n.lat, n.lon),
    }
    }));

    map.addSource('nodes', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: nodeFeatures }
    });

    map.addLayer({
    id: 'nodes-layer',
    type: 'circle',
    source: 'nodes',
    paint: {
        'circle-radius': NODE_RADIUS,
        'circle-color': '#1a2744',
        'circle-stroke-color': '#3a5580',
        'circle-stroke-width': 1,
        'circle-opacity': 0.8,
    }
    });

    // Visited nodes
    map.addSource('visited-nodes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
    id: 'visited-nodes-layer',
    type: 'circle',
    source: 'visited-nodes',
    paint: {
        'circle-radius': NODE_RADIUS,
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.7,
    }
    });

    // Frontier nodes
    map.addSource('frontier-nodes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
    id: 'frontier-nodes-layer',
    type: 'circle',
    source: 'frontier-nodes',
    paint: {
        'circle-radius': NODE_RADIUS + 2,
        'circle-color': FRONTIER_COLOR,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.9,
    }
    });
    // Multi-objective path layers
      for (const obj of ['fastest', 'shortest', 'safest'] as const) {
        map.addSource(`path-${obj}`, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        const colors = { fastest: '#00d4ff', shortest: '#7fff00', safest: '#da70d6' };
        map.addLayer({
          id: `path-${obj}-layer`,
          type: 'line',
          source: `path-${obj}`,
          paint: {
            'line-color': colors[obj],
            'line-width': obj === 'fastest' ? 5 : 3,
            'line-opacity': 0.9,
            'line-dasharray': obj === 'shortest' ? [2, 2] : obj === 'safest' ? [4, 1] : [1],
          }
        });
      }
      // Start/End markers
      map.addSource('markers', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'markers-layer',
        type: 'circle',
        source: 'markers',
        paint: {
          'circle-radius': 10,
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-opacity': 1,
        }
      });

      // Click handler
      map.on('click', (e) => {
        if (!selectionModeRef.current) {
            console.log("Selection mode is NULL");
            return;
        }

        const map = mapRef.current;
        if (!map) return;

        let closest: string | null = null;
        let minDist = Infinity;

        for (const n of graphData.nodes) {
            const projected = map.project([n.lon, n.lat]);
            const dx = projected.x - e.point.x;
            const dy = projected.y - e.point.y;
            const dist = dx * dx + dy * dy;

            if (dist < minDist) {
            minDist = dist;
            closest = n.id;
            }
        }

        // 👇 Only accept if click is close enough (IMPORTANT)
        if (closest && minDist < 100) { // ~10px radius
            onNodeClick(closest);
            console.log("NODE CLICKED:", closest);
        }
        console.log("Clicked", e.point);
        console.log("Closest:", closest, "dist:", minDist);
        });
    });

    mapRef.current = map;

    return () => { map.remove(); initialized.current = false; };
  }, []);

  // Update visualization layers when step changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const color = algorithmDef?.color ?? '#00d4ff';
    const step = currentStep;

    if (!step) {
      (map.getSource('visited-nodes') as any)?.setData({ type: 'FeatureCollection', features: [] });
      (map.getSource('frontier-nodes') as any)?.setData({ type: 'FeatureCollection', features: [] });
      (map.getSource('visited-edges') as any)?.setData({ type: 'FeatureCollection', features: [] });
      (map.getSource('path-edges') as any)?.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const nmap = nodeMapRef.current;

    const visitedFeatures = step.visited.map(id => {
      const n = nmap.get(id);
      if (!n) return null;
      return {
        type: 'Feature' as const,
        properties: { id, color },
        geometry: { type: 'Point' as const, coordinates: latLonToMapCoord(n.lat, n.lon) }
      };
    }).filter(Boolean);

    (map.getSource('visited-nodes') as any)?.setData({ type: 'FeatureCollection', features: visitedFeatures });

    const frontierFeatures = step.frontier.map(id => {
      const n = nmap.get(id);
      if (!n) return null;
      return {
        type: 'Feature' as const,
        properties: { id },
        geometry: { type: 'Point' as const, coordinates: latLonToMapCoord(n.lat, n.lon) }
      };
    }).filter(Boolean);

    (map.getSource('frontier-nodes') as any)?.setData({ type: 'FeatureCollection', features: frontierFeatures });

    // Visited edges
    const visitedSet = new Set(step.visited);
    const visitedEdgeFeatures = graphData.edges
      .filter(e => visitedSet.has(e.from) && visitedSet.has(e.to))
      .map(e => {
        const fn = nmap.get(e.from), tn = nmap.get(e.to);
        if (!fn || !tn) return null;
        return {
          type: 'Feature' as const,
          properties: { color },
          geometry: { type: 'LineString' as const, coordinates: [latLonToMapCoord(fn.lat, fn.lon), latLonToMapCoord(tn.lat, tn.lon)] }
        };
      }).filter(Boolean);

    (map.getSource('visited-edges') as any)?.setData({ type: 'FeatureCollection', features: visitedEdgeFeatures });

    // Path
    if (step.path.length > 1) {
      const pathFeatures = [];
      for (let i = 0; i < step.path.length - 1; i++) {
        const fn = nmap.get(step.path[i]), tn = nmap.get(step.path[i + 1]);
        if (!fn || !tn) continue;
        pathFeatures.push({
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'LineString' as const, coordinates: [latLonToMapCoord(fn.lat, fn.lon), latLonToMapCoord(tn.lat, tn.lon)] }
        });
      }
      (map.getSource('path-edges') as any)?.setData({ type: 'FeatureCollection', features: pathFeatures });
    }
  }, [currentStep, algorithmDef, graphData]);

  // Update multi-objective paths
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const nmap = nodeMapRef.current;

    const makePathFeatures = (path: string[]) =>
      path.slice(0, -1).map((id, i) => {
        const fn = nmap.get(id), tn = nmap.get(path[i + 1]);
        if (!fn || !tn) return null;
        return {
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'LineString' as const, coordinates: [[fn.lon, fn.lat], [tn.lon, tn.lat]] }
        };
      }).filter(Boolean);

    for (const obj of ['fastest', 'shortest', 'safest'] as const) {
      const path = multiResult?.[obj]?.path ?? [];
      (map.getSource(`path-${obj}`) as any)?.setData({
        type: 'FeatureCollection',
        features: obj === activeRoute
          ? makePathFeatures(path)
          : []  // only show active route; remove this filter to show all 3
      });
    }
  }, [multiResult, activeRoute]);
  // Update start/end markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const nmap = nodeMapRef.current;

    const features: any[] = [];
    if (startId) {
      const n = nmap.get(startId);
      if (n) features.push({
        type: 'Feature',
        properties: { color: '#00ff88' },
        geometry: { type: 'Point', coordinates: latLonToMapCoord(n.lat, n.lon) }
      });
    }
    if (endId) {
      const n = nmap.get(endId);
      if (n) features.push({
        type: 'Feature',
        properties: { color: '#ff4455' },
        geometry: { type: 'Point', coordinates: latLonToMapCoord(n.lat, n.lon) }
      });
    }

    (map.getSource('markers') as any)?.setData({ type: 'FeatureCollection', features });
  }, [startId, endId]);

  // Update cursor based on selection mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = selectionMode ? 'crosshair' : '';
  }, [selectionMode]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#0a1628' }}
    />
  );
}