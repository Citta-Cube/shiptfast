import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processEmailNotifications } from '@/lib/email/processNotifications'

// We will mark notifications as emailed to avoid duplicates
async function fetchUnemailedNotifications(limit = 50) {
  const supabase = createAdminClient()
  // Primary: use emailed_at column if present
  let res = await supabase
    .from('notifications')
    .select('*')
    .is('emailed_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (!res.error) return res.data || []

  // Fallback: if emailed_at column doesn't exist, use JSON flag in data
  // We consider notifications without data.emailed === true as unsent
  const fb = await supabase
    .from('notifications')
    .select('*')
    .or('data->>emailed.is.null,data->>emailed.eq.false')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (fb.error) throw fb.error
  return fb.data || []
}

async function markEmailed(n) {
  const supabase = createAdminClient()
  const ts = new Date().toISOString()
  // Try column first
  const upd = await supabase
    .from('notifications')
    .update({ emailed_at: ts })
    .eq('id', n.id)
  if (!upd.error) return
  // Fallback: mark in data JSON
  const currentData = n.data || {}
  const merged = { ...currentData, emailed: true, emailed_at: ts }
  await supabase
    .from('notifications')
    .update({ data: merged })
    .eq('id', n.id)
}

export async function POST(request) {
  return processRequest(request)
}

export async function GET(request) {
  // Allow triggering via browser with ?token=CRON_SECRET
  return processRequest(request)
}

async function processRequest(request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || (authHeader !== `Bearer ${cronSecret}` && token !== cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await processEmailNotifications({
      types: ['ORDER_DUE_7_DAYS', 'ORDER_DUE_24_HOURS', 'ORDER_CLOSED']
    })
    // Normalize error to HTTP 500 if present
    if (!result?.success && result?.error) {
      return NextResponse.json(result, { status: 500 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in email notifications cron:', error)
    return NextResponse.json({ error: 'Failed to send email notifications' }, { status: 500 })
  }
}