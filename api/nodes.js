import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    const { node } = req.body
    if (!node || !node.id)
      return res.status(400).json({ error: 'Body must have a node with an id' })

    const { data: current, error: fetchErr } = await supabase
      .from('graphs')
      .select('nodes, edges')
      .eq('id', 'default')
      .single()
    if (fetchErr) return res.status(500).json({ error: fetchErr.message })

    const nodes = [...current.nodes, {
      type: 'dataNode',
      position: { x: 200, y: 200 },
      data: { label: node.id },
      ...node,
    }]

    const { error } = await supabase
      .from('graphs')
      .update({ nodes, updated_at: new Date().toISOString() })
      .eq('id', 'default')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ ok: true, node: nodes.at(-1) })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
