import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from "@clerk/nextjs/server";
import { getUserCompanyMembership } from '@/data-access/companies';

// Forwarder rates Exporter for a completed order (after final invoice accepted)
export async function POST(request, { params }) {
  try {
    const { id: orderId } = params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Identify rater company (must be a forwarder)
    const membership = await getUserCompanyMembership(userId);
    if (!membership?.companies?.id) {
      return NextResponse.json({ error: 'User is not associated with any company' }, { status: 403 });
    }
    const raterCompanyId = membership.companies.id;

    // Parse body
    const { ratingCategories, comment } = await request.json();
    if (!ratingCategories) {
      return NextResponse.json({ error: 'Missing required field: ratingCategories' }, { status: 400 });
    }

    // Validate categories for exporter rating (3 categories)
    const requiredCategories = [
      'clarity_of_requirements',
      'payment_timeliness',
      'documentation_accuracy'
    ];
    const hasAllCategories = requiredCategories.every((key) =>
      Object.prototype.hasOwnProperty.call(ratingCategories, key) &&
      ratingCategories[key] >= 1 && ratingCategories[key] <= 5
    );
    if (!hasAllCategories) {
      return NextResponse.json(
        { error: 'All rating categories must be provided with values between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Load order, ensure it exists and has a selected quote
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, exporter_id, selected_quote_id')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (!order.selected_quote_id) {
      return NextResponse.json({ error: 'No selected quote for this order' }, { status: 400 });
    }

    // Verify the rater is the selected forwarder on this order
    const { data: selectedQuote, error: quoteErr } = await supabase
      .from('quotes')
      .select('id, freight_forwarder_id, order_id')
      .eq('id', order.selected_quote_id)
      .single();
    if (quoteErr || !selectedQuote) {
      return NextResponse.json({ error: 'Selected quote not found' }, { status: 404 });
    }
    if (selectedQuote.order_id !== order.id) {
      return NextResponse.json({ error: 'Quote does not belong to order' }, { status: 400 });
    }
    if (selectedQuote.freight_forwarder_id !== raterCompanyId) {
      return NextResponse.json({ error: 'Only the selected forwarder can rate this exporter' }, { status: 403 });
    }

    // Verify final invoice exists and has been accepted (locked)
    const { data: docs, error: docsErr } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', 'ORDER_QUOTE')
      .eq('entity_id', order.selected_quote_id)
      .order('created_at', { ascending: false });
    if (docsErr) {
      return NextResponse.json({ error: 'Failed to verify invoice status' }, { status: 500 });
    }
    const finalInvoice = (docs || []).find((d) => d?.metadata?.type === 'FINAL_INVOICE');
    const isAccepted = !!finalInvoice?.metadata?.locked;
    if (!isAccepted) {
      return NextResponse.json(
        { error: 'You can rate the exporter only after the final invoice is accepted' },
        { status: 400 }
      );
    }

    // Prevent duplicate rating by this rater for this order
    const { data: existing, error: existingErr } = await supabase
      .from('company_ratings')
      .select('id')
      .eq('order_id', orderId)
      .eq('rater_company_id', raterCompanyId)
      .maybeSingle();
    if (existingErr && existingErr.code && existingErr.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to check existing rating' }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ error: 'Rating already submitted for this order' }, { status: 400 });
    }

    // Resolve real company_members row for created_by
    const { data: memberRow, error: memberErr } = await supabase
      .from('company_members')
      .select('id')
      .eq('user_id', userId)
      .eq('company_id', raterCompanyId)
      .single();
    if (memberErr || !memberRow) {
      return NextResponse.json({ error: 'User is not an active member of this company' }, { status: 400 });
    }

    // Prepare rating payload: exporter-specific keys only
    const ratingPayload = {
      clarity_of_requirements: ratingCategories.clarity_of_requirements,
      payment_timeliness: ratingCategories.payment_timeliness,
      documentation_accuracy: ratingCategories.documentation_accuracy,
    };

    // Insert the rating (ratee is the exporter of the order)
    const { data: inserted, error: insertErr } = await supabase
      .from('company_ratings')
      .insert({
        order_id: orderId,
        rater_company_id: raterCompanyId,
        ratee_company_id: order.exporter_id,
        rating_categories: ratingPayload,
        comment: comment || null,
        created_by: memberRow.id,
      })
      .select()
      .single();
    if (insertErr) {
      console.error('Error inserting exporter rating:', insertErr);
      return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Rating submitted successfully', rating: inserted });
  } catch (err) {
    console.error('Error in rate-exporter API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
