import { createClient } from '@supabase/supabase-js'

// Admin client using service role key (bypasses RLS)
// Ensure SUPABASE_SERVICE_ROLE_KEY is set in the server environment (never expose to client)
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'shiptfast-admin' } }
  })
}
