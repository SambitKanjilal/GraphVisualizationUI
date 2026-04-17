# Graph Editor

A collaborative graph editor built with React and React Flow, backed by Supabase and deployed on Vercel. Multiple engineers (and AI agents) can edit the same graph in real-time.

## Features

- **Add nodes** — click "Add Node" to place a new node on the canvas
- **Connect nodes** — drag from a node's handle to another node to create a directed edge
- **Edit nodes and edges** — double-click any node or edge to rename it and attach arbitrary key/value data fields
- **Data fields** — extra fields are visible directly on the node card in the canvas
- **Real-time collaboration** — changes from any user sync to all other open tabs within ~200ms via Supabase Realtime
- **Presence indicator** — live count of connected users in the toolbar
- **Copy/paste** — Ctrl+C / Ctrl+V duplicates selected nodes; edges between them are preserved
- **Delete** — select nodes or edges and press Delete (or the "Delete Selected" button)
- **Export / Import** — download and reload graphs as JSON files
- **Agent REST API** — Vercel serverless functions let an AI agent read and write the graph programmatically

## Tech Stack

| Tool | Role |
|---|---|
| [React 18](https://react.dev) | UI framework |
| [React Flow 11](https://reactflow.dev) | Graph canvas, drag-and-drop, edge routing |
| [Vite 5](https://vitejs.dev) | Dev server and bundler |
| [Supabase](https://supabase.com) | Postgres database + Realtime WebSocket sync |
| [Vercel](https://vercel.com) | Hosting + serverless API routes |

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, then run this SQL in the **SQL Editor**:

```sql
create table graphs (
  id text primary key default 'default',
  nodes jsonb not null default '[]',
  edges jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

insert into graphs (id) values ('default');
```

Then enable Realtime on the `graphs` table: **Table Editor → graphs → Realtime → Enable**.

### 2. Configure environment variables

Copy `.env.local` and fill in your keys from **Supabase → Settings → API**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> `VITE_SUPABASE_*` variables are safe to expose to the browser.
> `SUPABASE_SERVICE_ROLE_KEY` is server-only — never commit it.

### 3. Run locally

```bash
npm install
npm run dev        # Vite on localhost:5173
```

To test the API routes locally, install the Vercel CLI and run `vercel dev` instead of `npm run dev`.

### 4. Deploy to Vercel

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel deploy
```

Vercel auto-detects the Vite frontend and the `api/` serverless functions.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+C` | Copy selected nodes (and edges between them) |
| `Ctrl+V` | Paste — each successive paste offsets by 30px |
| `Delete` / `Backspace` | Delete selected nodes and edges |

## Agent REST API

The following endpoints are available for an AI agent to read and write the graph. All mutations are instantly broadcast to all connected browsers via Supabase Realtime.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/graph` | Get full `{ nodes, edges }` |
| `POST` | `/api/graph` | Replace the entire graph |
| `POST` | `/api/nodes` | Add a node |
| `PATCH` | `/api/nodes/:id` | Update a node's data fields |
| `DELETE` | `/api/nodes/:id` | Remove a node and its connected edges |
| `POST` | `/api/edges` | Add an edge |
| `PATCH` | `/api/edges/:id` | Update an edge's label or data |
| `DELETE` | `/api/edges/:id` | Remove an edge |

### Example: agent adds a node

```bash
curl -X POST https://your-app.vercel.app/api/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "node": {
      "id": "node_resistor1",
      "position": { "x": 300, "y": 200 },
      "data": { "label": "R1", "resistance": "10k", "tolerance": "5%" }
    }
  }'
```

## Graph JSON Format

```json
{
  "nodes": [
    {
      "id": "node_a1b2c3d4",
      "type": "dataNode",
      "position": { "x": 100, "y": 150 },
      "data": { "label": "R1", "resistance": "10k" }
    }
  ],
  "edges": [
    {
      "id": "edge_e5f6g7h8",
      "source": "node_a1b2c3d4",
      "target": "node_b2c3d4e5",
      "label": "connects to",
      "data": { "net": "VCC" }
    }
  ]
}
```

## Project Structure

```
api/
├── graph.js                  # GET/POST full graph
├── nodes.js                  # POST add node
├── nodes/[id].js             # PATCH/DELETE node
├── edges.js                  # POST add edge
└── edges/[id].js             # PATCH/DELETE edge
src/
├── App.jsx                   # Graph state, Supabase sync, keyboard shortcuts
├── App.css
├── index.css
├── main.jsx
├── lib/
│   └── supabase.js           # Supabase browser client singleton
└── components/
    ├── DataNode.jsx           # Custom node renderer (label + data fields)
    ├── NodeEditModal.jsx      # Edit modal for nodes and edges
    ├── Toolbar.jsx            # Top bar with presence indicator
    └── *.css
```
