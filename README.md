# Graph Editor

A client-side graph editor built with React and React Flow. Create nodes and edges, attach custom data to them, and save your work by exporting to JSON.

## Features

- **Add nodes** — click "Add Node" to place a new node on the canvas
- **Connect nodes** — drag from a node's handle (the dot on the edge of a node) to another node to create a directed edge
- **Edit nodes and edges** — double-click any node or edge to open an editor where you can rename it and attach arbitrary key/value data fields
- **Data fields** — key/value pairs you add are stored on the node/edge and displayed directly on the node card in the canvas
- **Copy/paste** — select one or more nodes and use Ctrl+C / Ctrl+V to duplicate them; edges between copied nodes are preserved
- **Delete** — select nodes or edges and press Delete (or use the "Delete Selected" button)
- **Export** — download the current graph as a `graph.json` file
- **Import** — load a previously exported `graph.json` to restore your work
- **Pan and zoom** — scroll to zoom, drag the canvas to pan; minimap in the bottom-right for orientation

## Tech Stack

| Tool | Role |
|---|---|
| [React 18](https://react.dev) | UI framework |
| [React Flow 11](https://reactflow.dev) | Graph canvas, drag-and-drop, edge routing |
| [Vite 5](https://vitejs.dev) | Dev server and bundler |

Everything runs in the browser — no backend, no database.

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+C` | Copy selected nodes (and edges between them) |
| `Ctrl+V` | Paste — each successive paste offsets by 30px |
| `Delete` / `Backspace` | Delete selected nodes and edges |

## Graph JSON Format

Exported files follow React Flow's node/edge schema with an extra `data` field for custom properties.

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "dataNode",
      "position": { "x": 100, "y": 150 },
      "data": {
        "label": "My Node",
        "weight": "42",
        "color": "blue"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "label": "connects to",
      "data": {
        "capacity": "100"
      }
    }
  ]
}
```

All `data` values are stored as strings. The `label` on a node is displayed as its title; extra keys are shown as a field list inside the node card. The `label` on an edge is rendered along the edge line.

## Project Structure

```
src/
├── App.jsx                     # Root component: graph state, keyboard shortcuts, import/export
├── App.css                     # React Flow canvas overrides
├── index.css                   # Global reset and font
├── main.jsx                    # React entry point
└── components/
    ├── DataNode.jsx             # Custom node renderer (label + data fields)
    ├── DataNode.css
    ├── NodeEditModal.jsx        # Edit modal for both nodes and edges (label + key/value editor)
    ├── NodeEditModal.css
    ├── Toolbar.jsx              # Top bar: Add Node, Delete, Export, Import
    └── Toolbar.css
```
