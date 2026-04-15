import React, { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './App.css'
import Toolbar from './components/Toolbar.jsx'
import EditModal from './components/NodeEditModal.jsx'
import DataNode from './components/DataNode.jsx'

let nodeIdCounter = 1
let edgeIdCounter = 1
const genNodeId = () => `node_${nodeIdCounter++}`
const genEdgeId = () => `edge_${edgeIdCounter++}`
// keep genId as alias so addNode still works
const genId = genNodeId

const defaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2, stroke: '#6366f1' },
  labelStyle: { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 },
  labelBgStyle: { fill: '#1a1d2e', fillOpacity: 0.9 },
  labelBgPadding: [6, 4],
  labelBgBorderRadius: 4,
}

const nodeTypes = { dataNode: DataNode }

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  // editingItem: { item, kind: 'node' | 'edge' } | null
  const [editingItem, setEditingItem] = useState(null)
  // clipboard: { nodes, edges } | null
  const [clipboard, setClipboard] = useState(null)
  const pasteCountRef = useRef(0)
  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  )

  const addNode = useCallback(() => {
    const id = genId()
    const viewport = reactFlowInstance?.getViewport() ?? { x: 0, y: 0, zoom: 1 }
    const bounds = reactFlowWrapper.current?.getBoundingClientRect()
    const centerX = bounds ? (bounds.width / 2 - viewport.x) / viewport.zoom : 200
    const centerY = bounds ? (bounds.height / 2 - viewport.y) / viewport.zoom : 200

    const newNode = {
      id,
      type: 'dataNode',
      position: {
        x: centerX - 65 + (Math.random() * 80 - 40),
        y: centerY - 20 + (Math.random() * 80 - 40),
      },
      data: { label: `Node ${nodeIdCounter - 1}` },
    }
    setNodes((nds) => nds.concat(newNode))
  }, [reactFlowInstance, setNodes])

  const onNodeDoubleClick = useCallback((_event, node) => {
    setEditingItem({ item: node, kind: 'node' })
  }, [])

  const onEdgeDoubleClick = useCallback((_event, edge) => {
    setEditingItem({ item: edge, kind: 'edge' })
  }, [])

  const onDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected))
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setNodes, setEdges])

  const handleSaveItem = useCallback((id, kind, { label, extraData }) => {
    if (kind === 'node') {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? { ...n, data: { label, ...extraData } }
            : n
        )
      )
    } else {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === id
            ? {
                ...e,
                label: label || undefined,
                data: { ...extraData },
              }
            : e
        )
      )
    }
    setEditingItem(null)
  }, [setNodes, setEdges])

  const exportGraph = useCallback(() => {
    const graphData = { nodes, edges }
    const json = JSON.stringify(graphData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graph.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [nodes, edges])

  const importGraph = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          alert('Invalid graph file: must have "nodes" and "edges" arrays.')
          return
        }
        const importedNodes = parsed.nodes.map((n) => ({
          ...n,
          type: 'dataNode',
        }))
        const importedEdges = parsed.edges.map((e) => ({
          ...defaultEdgeOptions,
          ...e,
          style: { strokeWidth: 2, stroke: '#6366f1', ...(e.style ?? {}) },
          markerEnd: e.markerEnd ?? { type: MarkerType.ArrowClosed },
        }))
        const maxNum = importedNodes.reduce((max, n) => {
          const m = n.id.match(/node_(\d+)/)
          return m ? Math.max(max, parseInt(m[1], 10)) : max
        }, 0)
        if (maxNum >= nodeIdCounter) nodeIdCounter = maxNum + 1
        setNodes(importedNodes)
        setEdges(importedEdges)
      } catch {
        alert('Failed to parse JSON file.')
      }
    }
    reader.readAsText(file)
  }, [setNodes, setEdges])

  const onKeyDown = useCallback(
    (e) => {
      // Never fire shortcuts when the edit modal is open or focus is inside an input
      if (editingItem) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDeleteSelected()
        return
      }

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 'c') {
        e.preventDefault()
        const selectedNodes = nodes.filter((n) => n.selected)
        if (selectedNodes.length === 0) return
        const selectedIds = new Set(selectedNodes.map((n) => n.id))
        const selectedEdges = edges.filter(
          (ed) => selectedIds.has(ed.source) && selectedIds.has(ed.target)
        )
        setClipboard({ nodes: selectedNodes, edges: selectedEdges })
        pasteCountRef.current = 0
        return
      }

      if (ctrl && e.key === 'v') {
        e.preventDefault()
        if (!clipboard || clipboard.nodes.length === 0) return
        pasteCountRef.current += 1
        const offset = pasteCountRef.current * 30

        // Remap every node to a fresh ID
        const idMap = {}
        const newNodes = clipboard.nodes.map((n) => {
          const newId = genNodeId()
          idMap[n.id] = newId
          return {
            ...n,
            id: newId,
            selected: true,
            position: { x: n.position.x + offset, y: n.position.y + offset },
            data: { ...n.data },
          }
        })

        // Remap edge endpoints to the new node IDs
        const newEdges = clipboard.edges.map((ed) => ({
          ...ed,
          id: genEdgeId(),
          source: idMap[ed.source],
          target: idMap[ed.target],
          selected: true,
          data: { ...ed.data },
        }))

        // Deselect everything already on the canvas, then add the pasted set
        setNodes((nds) => [
          ...nds.map((n) => ({ ...n, selected: false })),
          ...newNodes,
        ])
        setEdges((eds) => [
          ...eds.map((ed) => ({ ...ed, selected: false })),
          ...newEdges,
        ])
      }
    },
    [editingItem, onDeleteSelected, nodes, edges, clipboard, setNodes, setEdges]
  )

  return (
    <div className="app" onKeyDown={onKeyDown} tabIndex={0}>
      <Toolbar
        onAddNode={addNode}
        onDeleteSelected={onDeleteSelected}
        onExport={exportGraph}
        onImport={importGraph}
      />
      <div className="flow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          deleteKeyCode={null}
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#2a2d3e" />
          <Controls />
          <MiniMap
            nodeColor="#6366f1"
            maskColor="rgba(15,17,23,0.7)"
            style={{ background: '#1a1d2e' }}
          />
        </ReactFlow>
      </div>
      {editingItem && (
        <EditModal
          item={editingItem.item}
          kind={editingItem.kind}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}
