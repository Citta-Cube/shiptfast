import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Upload or replace a final invoice for a selected quote (forwarder-only)
export async function POST(request) {
  try {
    const supabase = createAdminClient()
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const orderId = formData.get('orderId')
    const quoteId = formData.get('quoteId')

    if (!file || !orderId || !quoteId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get forwarder company id from membership (also capture membership id to store in uploaded_by)
    const { data: membership, error: memberErr } = await supabase
      .from('company_members')
      .select('id, companies:company_id(id, type)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    if (memberErr || !membership?.companies?.id) {
      return NextResponse.json({ error: 'No active company membership' }, { status: 403 })
    }
    const forwarderCompanyId = membership.companies.id
    if (membership.companies.type !== 'FREIGHT_FORWARDER') {
      return NextResponse.json({ error: 'Only freight forwarders can upload invoices' }, { status: 403 })
    }

    // Fetch quote and order, validate ownership and selection
    const [{ data: quote, error: quoteErr }, { data: order, error: orderErr }] = await Promise.all([
      supabase
        .from('quotes')
        .select('id, order_id, freight_forwarder_id')
        .eq('id', quoteId)
        .single(),
      supabase
        .from('orders')
        .select('id, reference_number, selected_quote_id')
        .eq('id', orderId)
        .single(),
    ])

    if (quoteErr || orderErr || !quote || !order) {
      return NextResponse.json({ error: 'Order or Quote not found' }, { status: 404 })
    }

    if (quote.order_id !== order.id) {
      return NextResponse.json({ error: 'Quote does not belong to order' }, { status: 400 })
    }

    if (order.selected_quote_id !== quote.id) {
      return NextResponse.json({ error: 'Only the selected quote can upload final invoice' }, { status: 403 })
    }

    if (quote.freight_forwarder_id !== forwarderCompanyId) {
      return NextResponse.json({ error: 'You do not own this quote' }, { status: 403 })
    }

    // Check if there's an existing final invoice for this quote (entity: ORDER_QUOTE)
    const { data: existingDocs, error: docsErr } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', 'ORDER_QUOTE')
      .eq('entity_id', quote.id)
      .order('created_at', { ascending: false })

    if (docsErr) {
      return NextResponse.json({ error: 'Failed to check existing invoices' }, { status: 500 })
    }

  const existingInvoice = (existingDocs || []).find(d => d.metadata?.type === 'FINAL_INVOICE')

    if (existingInvoice?.metadata?.locked) {
      return NextResponse.json({ error: 'Invoice is already accepted and locked' }, { status: 409 })
    }

    // If an invoice exists and is not locked, we will UPDATE its DB row after uploading the new file

    // Build storage path: invoices/{orderNumber}/{quoteNumber}/document.ext
    const orderNumber = order.reference_number
    // Use a short quote number derived from UUID until a dedicated quote number exists
    const quoteNumber = `Q-${quote.id.slice(0, 8)}`
    const ext = (file.name?.split('.')?.pop() || 'pdf').toLowerCase()
    const folderPath = `invoices/${orderNumber}/${quoteNumber}`
    const fileName = `document.${ext}`
    const storagePath = `${folderPath}/${fileName}`

    // Best-effort: clean any stale files in the folder to ensure only one document exists
    try {
      const { data: list, error: listErr } = await supabase.storage
        .from('documents')
        .list(folderPath, { limit: 100 })
      if (!listErr && Array.isArray(list) && list.length > 0) {
        const paths = list.map(obj => `${folderPath}/${obj.name}`)
        await supabase.storage.from('documents').remove(paths)
      }
    } catch (_) {
      // ignore cleanup failure; we'll rely on upsert below
    }

    // Upload file to documents bucket under invoices path
    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, { cacheControl: '3600', upsert: true, contentType: file.type || undefined })
    if (uploadErr) {
      return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath)

    const fileUrl = publicUrlData?.publicUrl

    // Prepare metadata for DB
    const metadata = {
      type: 'FINAL_INVOICE',
      locked: false,
      order_reference: orderNumber,
      quote_id: quote.id,
      quote_number: quoteNumber,
      storagePath,
      originalName: file.name,
      size: file.size,
      contentType: file.type,
    }

  let doc
    if (existingInvoice) {
      // Update the existing row
      const { data: updated, error: updErr } = await supabase
        .from('documents')
        .update({
          file_url: fileUrl,
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingInvoice.id)
        .select('*')
        .single()
      if (updErr) {
        // cleanup storage on failure
        await supabase.storage.from('documents').remove([storagePath])
        return NextResponse.json({ error: 'Failed to update invoice record' }, { status: 500 })
      }
      doc = updated
    } else {
      // Insert new document row tagged as FINAL_INVOICE
      const { data: inserted, error: insertErr } = await supabase
        .from('documents')
        .insert({
          title: 'Final Invoice',
          description: 'Final invoice uploaded by forwarder',
          file_url: fileUrl,
          uploaded_by: membership.id,
          entity_type: 'ORDER_QUOTE',
          entity_id: quote.id,
          metadata,
        })
        .select('*')
        .single()
      if (insertErr) {
        // cleanup storage on failure
        await supabase.storage.from('documents').remove([storagePath])
        return NextResponse.json({ error: 'Failed to save invoice record' }, { status: 500 })
      }
      doc = inserted
    }

    return NextResponse.json({ success: true, invoice: doc })
  } catch (err) {
    console.error('Final invoice upload error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
