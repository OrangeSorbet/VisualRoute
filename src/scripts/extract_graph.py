#!/usr/bin/env python3
"""
Usage:
  pip install osmnx
  python scripts/extract_graph.py "Manhattan, New York, USA"
  # Outputs: public/graph.json
"""
import osmnx as ox
import json
import sys
import os
import requests

lat = float(sys.argv[1])
lon = float(sys.argv[2])

bbox = (lat + 0.005, lat - 0.005, lon + 0.005, lon - 0.005)

G = ox.graph_from_point(
    (lat, lon),
    dist=500,  # meters
    network_type="drive"
)
G = ox.add_edge_speeds(G)
G = ox.add_edge_travel_times(G)
print(f"Fetching graph for: {lat}, {lon}")
RISK = {
    "motorway": 0.15, "motorway_link": 0.20,
    "trunk": 0.20, "trunk_link": 0.25,
    "primary": 0.30, "primary_link": 0.35,
    "secondary": 0.40, "secondary_link": 0.45,
    "tertiary": 0.50, "tertiary_link": 0.55,
    "residential": 0.35, "living_street": 0.25,
    "service": 0.60, "unclassified": 0.55,
}

nodes = [
    {"id": str(n), "lat": d["y"], "lon": d["x"], "elevation": d.get("elevation", 0)}
    for n, d in G.nodes(data=True)
]

edges = []
for u, v, d in G.edges(data=True):
    hw = d.get("highway", "residential")
    if isinstance(hw, list): hw = hw[0]
    edges.append({
        "from": str(u), "to": str(v),
        "weight": round(d.get("length", 100), 1),
        "travelTime": round(d.get("travel_time", 60), 1),
        "speedLimit": round(d.get("speed_kph", 50), 1),
        "lanes": d.get("lanes", 1),
        "highway": hw,
        "name": d.get("name", ""),
        "oneway": bool(d.get("oneway", False)),
        "trafficMultiplier": 1.0,
        "riskScore": RISK.get(hw, 0.5),
    })

out = os.path.join(os.path.dirname(__file__), "../../public/graph.json")
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w") as f:
    json.dump({"nodes": nodes, "edges": edges}, f)

print(f"Done. {len(nodes)} nodes, {len(edges)} edges -> public/graph.json")