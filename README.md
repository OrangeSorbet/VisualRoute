# VisualRoute

VisualRoute is an interactive pathfinding visualization tool built on real-world road networks. It combines OpenStreetMap data with classical and advanced routing algorithms, enabling dynamic exploration of how different strategies behave on actual maps.

---

## How It Works

1. The frontend requests graph data using latitude and longitude.
2. The backend generates a road network graph using OSMnx.
3. The graph is processed into nodes and edges with weights such as distance, travel time, and risk.
4. The data is served to the frontend and rendered using MapLibre GL.
5. Users select start and end nodes directly on the map.
6. Selected algorithms run in a Web Worker and stream step-by-step updates.
7. The map visualizes:

   * Visited nodes
   * Frontier expansion
   * Final computed path
   * Multi-objective routes (fastest, shortest, safest)

---

## Features

* Real-world graph generation from OpenStreetMap
* Interactive map with node selection
* Step-by-step algorithm visualization
* Multiple routing strategies and categories
* Multi-objective routing (distance, time, safety)
* Dynamic graph reloading on map movement
* Web Worker-based algorithm execution for smooth UI

---

## Algorithms Used

| Name                    | Approach Type                   | Category      |
| ----------------------- | ------------------------------- | ------------- |
| BFS                     | Unweighted traversal            | Core          |
| DFS                     | Unweighted traversal            | Core          |
| Dijkstra                | Distance-dependent              | Core          |
| Bellman-Ford            | Distance-dependent              | Core          |
| Greedy Best-First       | Heuristic-based                 | Heuristic     |
| A*                      | Heuristic + distance            | Heuristic     |
| Bidirectional Search    | Heuristic-based                 | Heuristic     |
| Floyd-Warshall          | Distance-dependent (all-pairs)  | All-Pairs     |
| Johnson's               | Distance-dependent (reweighted) | All-Pairs     |
| Contraction Hierarchies | Optimization-based              | Optimization  |
| ALT (A* + Landmarks)    | Heuristic + preprocessing       | Optimization  |
| Hub Labeling            | Precomputed lookup              | Optimization  |
| Bidirectional Dijkstra  | Distance-dependent              | Optimization  |
| Goal-Directed Search    | Heuristic-based                 | Optimization  |
| Time-Dependent Dijkstra | Time-dependent                  | Dynamic       |
| D* Lite                 | Dynamic replanning              | Dynamic       |
| Yen's k-Shortest        | Multi-path (distance)           | Multi-Path    |
| Multi-Criteria Routing  | Hybrid (distance/time/risk)     | Multi-Path    |
| Distance Vector (RIP)   | Distributed                     | Distributed   |
| Link-State (OSPF)       | Distributed                     | Distributed   |
| Path Vector (BGP)       | Policy-based                    | Distributed   |
| Genetic Algorithm       | Metaheuristic                   | Metaheuristic |
| Ant Colony Optimization | Metaheuristic                   | Metaheuristic |
| RL Routing              | Learning-based                  | Learning      |

---

## Tech Stack

**Frontend**

* React (TypeScript)
* MapLibre GL
* Vite

**Backend**

* Python
* Flask
* OSMnx

---

## Project Structure

```
VisualRoute/
├── public/
├── src/
│   ├── components/
│   ├── algorithms/
│   ├── workers/
│   ├── utils/
│   ├── scripts/
│   └── types/
├── server.py
├── package.json
└── README.md
```

---

## Developer Setup

### Clone Repository

```
git clone https://github.com/OrangeSorbet/VisualRoute.git
cd VisualRoute
```

---

### Install Dependencies

```
npm install
pip install osmnx flask requests
```

---

### Run the Application

```
npm run dev
```

This command starts both:

* Frontend (Vite)
* Backend (Flask)

---

## Usage

* Select an algorithm from the control panel
* Choose start and end nodes on the map
* Run, pause, or reset the visualization
* Adjust simulation speed
* Observe how different algorithms explore and compute routes in real time

---

## License

MIT License
