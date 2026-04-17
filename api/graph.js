import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('graphs')
      .select('nodes, edges')
      .eq('id', 'default')
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { nodes, edges } = req.body
    if (!Array.isArray(nodes) || !Array.isArray(edges))
      return res.status(400).json({ error: 'Body must have nodes and edges arrays' })
    const { error } = await supabase
      .from('graphs')
      .update({ nodes, edges, updated_at: new Date().toISOString() })
      .eq('id', 'default')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
