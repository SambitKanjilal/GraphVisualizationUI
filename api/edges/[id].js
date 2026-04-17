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
    .select('edges')
    .eq('id', 'default')
    .single()
  if (fetchErr) return res.status(500).json({ error: fetchErr.message })

  if (req.method === 'PATCH') {
    const { label, data } = req.body
    const edges = current.edges.map((e) =>
      e.id === id
        ? { ...e, ...(label !== undefined && { label }), ...(data && { data: { ...e.data, ...data } }) }
        : e
    )
    const { error } = await supabase
      .from('graphs')
      .update({ edges, updated_at: new Date().toISOString() })
      .eq('id', 'default')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const edges = current.edges.filter((e) => e.id !== id)
    const { error } = await supabase
      .from('graphs')
      .update({ edges, updated_at: new Date().toISOString() })
      .eq('id', 'default')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
