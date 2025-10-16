import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailForNotification } from './send'

async function fetchUnemailedNotifications(limit = 100, typesFilter, filters = {}) {
  const supabase = createAdminClient()
  // Try emailed_at first
  let query = supabase
    .from('notifications')
    .select('*')
    .is('emailed_at', null)
  if (Array.isArray(typesFilter) && typesFilter.length) {
    query = query.in('type', typesFilter)
  }
  if (filters.orderId) {
    query = query.eq('order_id', filters.orderId)
  }
  if (filters.quoteId) {
    query = query.eq('quote_id', filters.quoteId)
  }
  if (filters.messageId) {
    query = query.eq('message_id', filters.messageId)
  }
  const res = await query.order('created_at', { ascending: true }).limit(limit)
  if (!res.error) return res.data || []

  // Fallback to JSON flag if column doesn't exist
  let fbQuery = supabase
    .from('notifications')
    .select('*')
    .or('data->>emailed.is.null,data->>emailed.eq.false')
  if (Array.isArray(typesFilter) && typesFilter.length) {
    fbQuery = fbQuery.in('type', typesFilter)
  }
  if (filters.orderId) {
    fbQuery = fbQuery.eq('order_id', filters.orderId)
  }
  if (filters.quoteId) {
    fbQuery = fbQuery.eq('quote_id', filters.quoteId)
  }
  if (filters.messageId) {
    fbQuery = fbQuery.eq('message_id', filters.messageId)
  }
  const fb = await fbQuery.order('created_at', { ascending: true }).limit(limit)
  if (fb.error) throw fb.error
  return fb.data || []
}

async function markEmailed(n) {
  const supabase = createAdminClient()
  const ts = new Date().toISOString()
  const upd = await supabase
    .from('notifications')
    .update({ emailed_at: ts })
    .eq('id', n.id)
  if (!upd.error) return
  // Fallback JSON mark
  const merged = { ...(n.data || {}), emailed: true, emailed_at: ts }
  await supabase
    .from('notifications')
    .update({ data: merged })
    .eq('id', n.id)
}

export async function processEmailNotifications(options = {}) {
  const typesFilter = Array.isArray(options.types) ? options.types : undefined
  const filters = {
    orderId: options.orderId,
    quoteId: options.quoteId,
    messageId: options.messageId,
  }
  if (!process.env.RESEND_API_KEY) {
    return { success: true, processed: 0, sent: 0, skipped: 0, note: 'RESEND_API_KEY not set' }
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }
  }

  const notifications = await fetchUnemailedNotifications(100, typesFilter, filters)
  let sent = 0, skipped = 0
  const results = []
  for (const n of notifications) {
    try {
      const result = await sendEmailForNotification(n)
      if (result?.sent) {
        sent++
        await markEmailed(n)
        results.push({ id: n.id, status: 'sent', to: result.to })
      } else {
        skipped++
        results.push({ id: n.id, status: 'skipped', reason: result?.reason || 'unknown' })
      }
    } catch (e) {
      results.push({ id: n.id, status: 'error', error: String(e?.message || e) })
    }
  }
  return { success: true, processed: notifications.length, sent, skipped, results }
}
