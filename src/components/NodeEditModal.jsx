import React, { useState, useEffect, useRef, useCallback } from 'react'
import './NodeEditModal.css'

let rowIdCounter = 1
const newRow = (key = '', value = '') => ({ _id: rowIdCounter++, key, value })

function dataObjToRows(dataObj) {
  return Object.entries(dataObj ?? {}).map(([k, v]) => newRow(k, String(v)))
}

export default function EditModal({ item, kind, onSave, onClose }) {
  const isNode = kind === 'node'
  const initialLabel = isNode ? (item.data?.label ?? '') : (item.label ?? '')
  const initialExtra = isNode
    ? Object.fromEntries(Object.entries(item.data ?? {}).filter(([k]) => k !== 'label'))
    : (item.data ?? {})

  const [label, setLabel] = useState(initialLabel)
  const [rows, setRows] = useState(() => dataObjToRows(initialExtra))
  const labelRef = useRef(null)

  useEffect(() => {
    labelRef.current?.select()
  }, [])

  const addRow = useCallback(() => {
    setRows((r) => [...r, newRow()])
  }, [])

  const removeRow = useCallback((id) => {
    setRows((r) => r.filter((row) => row._id !== id))
  }, [])

  const updateRow = useCallback((id, field, value) => {
    setRows((r) => r.map((row) => (row._id === id ? { ...row, [field]: value } : row)))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const extraData = {}
    for (const row of rows) {
      const k = row.key.trim()
      if (k) extraData[k] = row.value
    }
    onSave(item.id, kind, { label: label.trim() || initialLabel, extraData })
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const title = isNode ? 'Edit Node' : 'Edit Edge'
  const labelPlaceholder = isNode ? 'Node label...' : 'Edge label (shown on edge)...'

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            {isNode ? <NodeIcon /> : <EdgeIcon />}
            <span>{title}</span>
            <span className="modal-id">{item.id}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label" htmlFor="item-label">Label</label>
            <input
              id="item-label"
              ref={labelRef}
              className="modal-input"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={labelPlaceholder}
            />
          </div>

          <div className="modal-section">
            <div className="modal-section-header">
              <span className="modal-label">Data Fields</span>
              <button type="button" className="btn-add-row" onClick={addRow}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add field
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="modal-empty">No data fields yet. Click "Add field" to attach key-value data.</p>
            ) : (
              <div className="modal-rows">
                <div className="modal-rows-header">
                  <span>Key</span>
                  <span>Value</span>
                </div>
                {rows.map((row) => (
                  <div key={row._id} className="modal-row">
                    <input
                      className="modal-input modal-input--sm"
                      type="text"
                      value={row.key}
                      onChange={(e) => updateRow(row._id, 'key', e.target.value)}
                      placeholder="key"
                    />
                    <input
                      className="modal-input modal-input--sm"
                      type="text"
                      value={row.value}
                      onChange={(e) => updateRow(row._id, 'value', e.target.value)}
                      placeholder="value"
                    />
                    <button
                      type="button"
                      className="btn-remove-row"
                      onClick={() => removeRow(row._id)}
                      aria-label="Remove field"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-modal btn-modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal btn-modal-save">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  )
}

function EdgeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="15 5 19 5 19 9" />
    </svg>
  )
}
