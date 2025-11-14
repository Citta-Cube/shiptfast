import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/orders/[id]/status
// Body: { action: 'REASSIGN' | 'VOIDED', reason?: string }
// Only EXPORTER admins of the order's exporter company can perform this.
export async function POST(request, { params }) {
  const supabase = createAdminClient()
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orderId = params.id
    const body = await request.json().catch(() => ({}))
    const action = (body?.action || '').toUpperCase()
    const reason = body?.reason || null

    if (!orderId || !['REASSIGN', 'VOIDED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Load order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, exporter_id, status, selected_quote_id, reference_number')
      .eq('id', orderId)
      .single()
    if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Validate membership: must be EXPORTER ADMIN of this order's exporter_id
    const { data: membership, error: memberErr } = await supabase
      .from('company_members')
      .select('id, role, companies:company_id(id, type)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    if (memberErr || !membership?.companies?.id) {
      return NextResponse.json({ error: 'No active company membership' }, { status: 403 })
    }
    if (membership.companies.type !== 'EXPORTER') {
      return NextResponse.json({ error: 'Only exporter admins can change order status' }, { status: 403 })
    }
    if (membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can change order status' }, { status: 403 })
    }
    if (membership.companies.id !== order.exporter_id) {
      return NextResponse.json({ error: 'Forbidden: Not your order' }, { status: 403 })
    }

    // Perform DB-side updates via functions; capture pre-change quote id for invoice cleanup
    const selectedQuoteId = order.selected_quote_id

    if (action === 'REASSIGN') {
      if (order.status !== 'CLOSED') {
        return NextResponse.json({ error: 'Order must be CLOSED to reassign' }, { status: 409 })
      }
      const { error: rpcErr } = await supabase
        .rpc('admin_reassign_order', { p_order_id: orderId, p_actor_user_id: membership.id, p_reason: reason })
      if (rpcErr) {
        console.error('admin_reassign_order error:', rpcErr)
        return NextResponse.json({ error: 'Failed to reassign order' }, { status: 500 })
      }

      // Delete FINAL_INVOICE doc rows for the previously selected quote (DB) and storage file(s)
      if (selectedQuoteId) {
        try {
          await supabase.rpc('delete_final_invoice_docs_for_quote', { p_quote_id: selectedQuoteId })
        } catch (e) {
          // continue; storage cleanup best-effort
        }
        // Best-effort: try to remove storage folder inferred from invoice metadata path if any
        // We need to query any remaining docs for that quote (if any) to get storagePath
        try {
          const { data: docs } = await supabase
            .from('documents')
            .select('metadata')
            .eq('entity_type', 'ORDER_QUOTE')
            .eq('entity_id', selectedQuoteId)

          const paths = (docs || [])
            .map(d => d?.metadata?.storagePath)
            .filter(Boolean)
          if (paths.length > 0) {
            await supabase.storage.from('documents').remove(paths)
          }
        } catch (_) {}
      }
    }

    if (action === 'VOIDED') {
      if (!['CLOSED', 'REASSIGN'].includes(order.status)) {
        return NextResponse.json({ error: 'Order must be CLOSED or REASSIGN to void' }, { status: 409 })
      }
      const { error: rpcErr } = await supabase
        .rpc('admin_void_order', { p_order_id: orderId, p_actor_user_id: membership.id, p_reason: reason })
      if (rpcErr) {
        console.error('admin_void_order error:', rpcErr)
        return NextResponse.json({ error: 'Failed to void order' }, { status: 500 })
      }

      // Delete all FINAL_INVOICE doc rows for any quotes of this order and their storage
      try {
        const { data: quotes } = await supabase
          .from('quotes')
          .select('id')
          .eq('order_id', orderId)
        const quoteIds = (quotes || []).map(q => q.id)
        for (const qid of quoteIds) {
          try { await supabase.rpc('delete_final_invoice_docs_for_quote', { p_quote_id: qid }) } catch (_) {}
        }
        const { data: invoiceDocs } = await supabase
          .from('documents')
          .select('metadata')
          .in('entity_id', quoteIds)
          .eq('entity_type', 'ORDER_QUOTE')
        const paths = (invoiceDocs || [])
          .map(d => d?.metadata?.storagePath)
          .filter(Boolean)
        if (paths.length > 0) {
          await supabase.storage.from('documents').remove(paths)
        }
      } catch (_) {}
    }

    // Return updated order snapshot
    const { data: updated } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    return NextResponse.json({ success: true, order: updated })
  } catch (err) {
    console.error('Order status change error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
