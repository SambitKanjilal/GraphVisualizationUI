import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('Supabase env vars missing — collaborative sync disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = (url && key) ? createClient(url, key) : null

export const GRAPH_ID = 'default'
