import { createClient as createSb } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createSb(url, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'shiptfast-admin' } }
  })
}
