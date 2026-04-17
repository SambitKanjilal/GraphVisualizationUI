import React, { useRef } from 'react'
import './Toolbar.css'

export default function Toolbar({ onAddNode, onDeleteSelected, onExport, onImport, connectedCount, isOnline }) {
  const fileInputRef = useRef(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
      e.target.value = ''
    }
  }

  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>Graph Editor</span>
      </div>

      <div className="toolbar-actions">
        <button className="btn btn-primary" onClick={onAddNode} title="Add a new node">
          <PlusIcon /> Add Node
        </button>
        <button className="btn btn-danger" onClick={onDeleteSelected} title="Delete selected nodes/edges (or press Delete)">
          <TrashIcon /> Delete Selected
        </button>
        <div className="divider" />
        <button className="btn btn-secondary" onClick={onExport} title="Export graph as JSON">
          <ExportIcon /> Export
        </button>
        <button className="btn btn-secondary" onClick={handleImportClick} title="Import graph from JSON">
          <ImportIcon /> Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div className="toolbar-right">
        {isOnline && (
          <div className="presence" title={`${connectedCount} user${connectedCount === 1 ? '' : 's'} connected`}>
            <span className="presence-dot" />
            <span className="presence-count">{connectedCount}</span>
          </div>
        )}
        <div className="toolbar-hint">
          Double-click to edit &nbsp;·&nbsp; Drag handles to connect
        </div>
      </div>
    </header>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function ImportIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}
