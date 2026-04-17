import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const defaultEdgeStyle = {
  markerEnd: { type: 'arrowclosed' },
  style: { strokeWidth: 2, stroke: '#6366f1' },
  labelStyle: { fill: '#e2e8f0', fontSize: 12, fontWeight: 500 },
  labelBgStyle: { fill: '#1a1d2e', fillOpacity: 0.9 },
  labelBgPadding: [6, 4],
  labelBgBorderRadius: 4,
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    const { edge } = req.body
    if (!edge || !edge.id || !edge.source || !edge.target)
      return res.status(400).json({ error: 'Edge must have id, source, and target' })

    const { data: current, error: fetchErr } = await supabase
      .from('graphs')
      .select('edges')
      .eq('id', 'default')
      .single()
    if (fetchErr) return res.status(500).json({ error: fetchErr.message })

    const newEdge = { ...defaultEdgeStyle, ...edge }
    const edges = [...current.edges, newEdge]

    const { error } = await supabase
      .from('graphs')
      .update({ edges, updated_at: new Date().toISOString() })
      .eq('id', 'default')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ ok: true, edge: newEdge })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
