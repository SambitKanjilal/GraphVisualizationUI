import React, { useState, useCallback, useRef, useEffect } from 'react'
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
import { supabase, GRAPH_ID } from './lib/supabase.js'

const genNodeId = () => 'node_' + crypto.randomUUID().slice(0, 8)
const genEdgeId = () => 'edge_' + crypto.randomUUID().slice(0, 8)

const defaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2, stroke: '#6366f1' },
  labelStyle: { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 },
  labelBgStyle: { fill: '#1a1d2e', fillOpacity: 0.9 },
  labelBgPadding: [6, 4],
  labelBgBorderRadius: 4,
}

const nodeTypes = { dataNode: DataNode }

// Write full graph to Supabase. No-op if Supabase is not configured.
async function persistGraph(nodes, edges) {
  if (!supabase) return
  await supabase
    .from('graphs')
    .update({ nodes, edges, updated_at: new Date().toISOString() })
    .eq('id', GRAPH_ID)
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [editingItem, setEditingItem] = useState(null)
  const [clipboard, setClipboard] = useState(null)
  const [connectedCount, setConnectedCount] = useState(1)
  const pasteCountRef = useRef(0)
  const isDraggingRef = useRef(false)
  // Hold latest nodes/edges in refs so async callbacks don't capture stale state
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { edgesRef.current = edges }, [edges])

  const reactFlowWrapper = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)

  // ── Supabase: initial load + realtime subscription ────────────────────────
  useEffect(() => {
    if (!supabase) return

    // Load initial state
    supabase
      .from('graphs')
      .select('nodes, edges')
      .eq('id', GRAPH_ID)
      .single()
      .then(({ data, error }) => {
        if (error) { console.error('Failed to load graph:', error.message); return }
        if (data) {
          setNodes(data.nodes ?? [])
          setEdges(data.edges ?? [])
        }
      })

    // Subscribe to remote changes — skip updates while user is dragging
    const channel = supabase
      .channel('graph-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'graphs', filter: `id=eq.${GRAPH_ID}` },
        (payload) => {
          if (isDraggingRef.current) return
          setNodes(payload.new.nodes ?? [])
          setEdges(payload.new.edges ?? [])
        }
      )
      .subscribe()

    // Presence: track connected users
    const presenceChannel = supabase.channel('presence')
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setConnectedCount(Object.keys(presenceChannel.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(presenceChannel)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Graph mutations (all persist after state update) ──────────────────────

  const onConnect = useCallback(
    (params) => {
      const newEdge = { ...params, ...defaultEdgeOptions, id: genEdgeId() }
      setEdges((eds) => {
        const next = addEdge(newEdge, eds)
        persistGraph(nodesRef.current, next)
        return next
      })
    },
    [setEdges]
  )

  const addNode = useCallback(() => {
    const id = genNodeId()
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
      data: { label: 'New Node' },
    }
    setNodes((nds) => {
      const next = nds.concat(newNode)
      persistGraph(next, edgesRef.current)
      return next
    })
  }, [reactFlowInstance, setNodes])

  const onNodeDragStart = useCallback(() => { isDraggingRef.current = true }, [])

  const onNodeDragStop = useCallback((_e, node) => {
    isDraggingRef.current = false
    setNodes((nds) => {
      const next = nds.map((n) => n.id === node.id ? { ...n, position: node.position } : n)
      persistGraph(next, edgesRef.current)
      return next
    })
  }, [setNodes])

  const onNodeDoubleClick = useCallback((_event, node) => {
    setEditingItem({ item: node, kind: 'node' })
  }, [])

  const onEdgeDoubleClick = useCallback((_event, edge) => {
    setEditingItem({ item: edge, kind: 'edge' })
  }, [])

  const onDeleteSelected = useCallback(() => {
    setNodes((nds) => {
      const nextNodes = nds.filter((n) => !n.selected)
      setEdges((eds) => {
        const nextEdges = eds.filter((e) => !e.selected)
        persistGraph(nextNodes, nextEdges)
        return nextEdges
      })
      return nextNodes
    })
  }, [setNodes, setEdges])

  const handleSaveItem = useCallback((id, kind, { label, extraData }) => {
    if (kind === 'node') {
      setNodes((nds) => {
        const next = nds.map((n) =>
          n.id === id ? { ...n, data: { label, ...extraData } } : n
        )
        persistGraph(next, edgesRef.current)
        return next
      })
    } else {
      setEdges((eds) => {
        const next = eds.map((e) =>
          e.id === id
            ? { ...e, label: label || undefined, data: { ...extraData } }
            : e
        )
        persistGraph(nodesRef.current, next)
        return next
      })
    }
    setEditingItem(null)
  }, [setNodes, setEdges])

  const exportGraph = useCallback(() => {
    const json = JSON.stringify({ nodes, edges }, null, 2)
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
        const importedNodes = parsed.nodes.map((n) => ({ ...n, type: 'dataNode' }))
        const importedEdges = parsed.edges.map((e) => ({
          ...defaultEdgeOptions,
          ...e,
          style: { strokeWidth: 2, stroke: '#6366f1', ...(e.style ?? {}) },
          markerEnd: e.markerEnd ?? { type: MarkerType.ArrowClosed },
        }))
        setNodes(importedNodes)
        setEdges(importedEdges)
        persistGraph(importedNodes, importedEdges)
      } catch {
        alert('Failed to parse JSON file.')
      }
    }
    reader.readAsText(file)
  }, [setNodes, setEdges])

  const onKeyDown = useCallback(
    (e) => {
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
        setClipboard({
          nodes: selectedNodes,
          edges: edges.filter((ed) => selectedIds.has(ed.source) && selectedIds.has(ed.target)),
        })
        pasteCountRef.current = 0
        return
      }

      if (ctrl && e.key === 'v') {
        e.preventDefault()
        if (!clipboard || clipboard.nodes.length === 0) return
        pasteCountRef.current += 1
        const offset = pasteCountRef.current * 30
        const idMap = {}
        const newNodes = clipboard.nodes.map((n) => {
          const newId = genNodeId()
          idMap[n.id] = newId
          return { ...n, id: newId, selected: true, position: { x: n.position.x + offset, y: n.position.y + offset }, data: { ...n.data } }
        })
        const newEdges = clipboard.edges.map((ed) => ({
          ...ed, id: genEdgeId(), source: idMap[ed.source], target: idMap[ed.target], selected: true, data: { ...ed.data },
        }))
        setNodes((nds) => {
          const next = [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]
          setEdges((eds) => {
            const nextEdges = [...eds.map((ed) => ({ ...ed, selected: false })), ...newEdges]
            persistGraph(next, nextEdges)
            return nextEdges
          })
          return next
        })
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
        connectedCount={connectedCount}
        isOnline={!!supabase}
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
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
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
