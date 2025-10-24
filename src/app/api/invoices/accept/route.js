import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Accept final invoice (exporter-only). Locks the invoice.
export async function POST(request) {
  const supabase = createAdminClient()
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { orderId } = body || {}
    if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })

    // Get membership and ensure user is EXPORTER
    const { data: membership, error: memberErr } = await supabase
      .from('company_members')
      .select('companies:company_id(id, type)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    if (memberErr || !membership?.companies?.id) {
      return NextResponse.json({ error: 'No active company membership' }, { status: 403 })
    }
    if (membership.companies.type !== 'EXPORTER') {
      return NextResponse.json({ error: 'Only exporters can accept invoices' }, { status: 403 })
    }

    // Fetch order and ensure it belongs to this exporter
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, exporter_id, selected_quote_id, reference_number')
      .eq('id', orderId)
      .single()
    if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.exporter_id !== membership.companies.id) {
      return NextResponse.json({ error: 'Forbidden: Not your order' }, { status: 403 })
    }

    // Find final invoice document for the selected quote (entity: ORDER_QUOTE)
    const { data: docs, error: docsErr } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', 'ORDER_QUOTE')
      .eq('entity_id', order.selected_quote_id)
      .order('created_at', { ascending: false })
    if (docsErr) return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })

  const invoice = (docs || []).find(d => d.metadata?.type === 'FINAL_INVOICE')
    if (!invoice) return NextResponse.json({ error: 'No final invoice found' }, { status: 404 })
    if (invoice.metadata?.locked) return NextResponse.json({ success: true, locked: true })

    const updatedMetadata = {
      ...invoice.metadata,
      locked: true,
      accepted_at: new Date().toISOString(),
      accepted_by_user: userId,
    }

    const { data: updated, error: updErr } = await supabase
      .from('documents')
      .update({ metadata: updatedMetadata })
      .eq('id', invoice.id)
      .select('*')
      .single()
    if (updErr) return NextResponse.json({ error: 'Failed to lock invoice' }, { status: 500 })

    return NextResponse.json({ success: true, invoice: updated })
  } catch (err) {
    console.error('Accept invoice error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
