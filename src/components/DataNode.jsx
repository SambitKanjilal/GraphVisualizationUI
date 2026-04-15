import React from 'react'
import { Handle, Position } from 'reactflow'
import './DataNode.css'

export default function DataNode({ data, selected }) {
  const extraKeys = Object.keys(data).filter((k) => k !== 'label')

  return (
    <div className={`data-node ${selected ? 'data-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="data-node__label">{data.label}</div>
      {extraKeys.length > 0 && (
        <div className="data-node__fields">
          {extraKeys.map((k) => (
            <div key={k} className="data-node__field">
              <span className="data-node__key">{k}</span>
              <span className="data-node__value">{String(data[k])}</span>
            </div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
