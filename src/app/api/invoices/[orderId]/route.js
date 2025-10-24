import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Get final invoice for an order (view/download and status)
export async function GET(_request, { params }) {
  const supabase = createAdminClient()
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orderId = params.orderId
    if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })

    // Load order to get exporter, selected quote and reference number
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, exporter_id, reference_number, selected_quote_id')
      .eq('id', orderId)
      .single()
    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Load selected quote to know which forwarder owns it
    const { data: quote, error: quoteErr } = await supabase
      .from('quotes')
      .select('id, freight_forwarder_id')
      .eq('id', order.selected_quote_id)
      .single()
    if (quoteErr || !quote) {
      return NextResponse.json({ error: 'Selected quote not found' }, { status: 404 })
    }

    // Get all active company memberships for the user
    const { data: memberships, error: memberErr } = await supabase
      .from('company_members')
      .select('companies:company_id(id, type)')
      .eq('user_id', userId)
      .eq('is_active', true)
    if (memberErr) {
      return NextResponse.json({ error: 'Failed to load membership' }, { status: 500 })
    }
    const companyIds = (memberships || []).map(m => m.companies?.id).filter(Boolean)
    const companyTypesById = Object.fromEntries(
      (memberships || [])
        .filter(m => m.companies?.id)
        .map(m => [m.companies.id, m.companies.type])
    )

    // Authorization: allow only
    // - the exporter company of the order, or
    // - the forwarder company that owns the selected quote
    const isExporter = companyIds.includes(order.exporter_id)
    const isForwarderOwner = companyIds.includes(quote.freight_forwarder_id)
    const isForwarderTypeOk = companyTypesById[quote.freight_forwarder_id] === 'FREIGHT_FORWARDER'

    if (!(isExporter || (isForwarderOwner && isForwarderTypeOk))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find a document tagged as FINAL_INVOICE for the selected quote (entity: ORDER_QUOTE)
    // We scope by quote to align with new visibility rules (forwarder that owns the quote and the exporter of the order)
    const { data: docs, error: docsErr } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', 'ORDER_QUOTE')
      .eq('entity_id', order.selected_quote_id)
      .order('created_at', { ascending: false })

    if (docsErr) return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })

    const invoice = (docs || []).find(d => d.metadata?.type === 'FINAL_INVOICE')

    if (!invoice) return NextResponse.json({ invoice: null })

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        file_url: invoice.file_url,
        title: invoice.title,
        created_at: invoice.created_at,
        metadata: invoice.metadata,
        locked: !!invoice.metadata?.locked,
      }
    })
  } catch (err) {
    console.error('Fetch final invoice error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
