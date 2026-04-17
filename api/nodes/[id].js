import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query

  const { data: current, error: fetchErr } = await supabase
    .from('graphs')
    .select('nodes, edges')
    .eq('id', 'default')
    .single()
  if (fetchErr) return res.status(500).json({ error: fetchErr.message })

  if (req.method === 'PATCH') {
    const { data: patch } = req.body
    if (!patch) return res.status(400).json({ error: 'Body must have a data object' })

    const nodes = current.nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
    )
    const { error } = await supabase
      .from('graphs')
      .update({ nodes, updated_at: new Date().toISOString() })
      .eq('id', 'default')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const nodes = current.nodes.filter((n) => n.id !== id)
    const edges = current.edges.filter((e) => e.source !== id && e.target !== id)
    const { error } = await supabase
      .from('graphs')
      .update({ nodes, edges, updated_at: new Date().toISOString() })
      .eq('id', 'default')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
