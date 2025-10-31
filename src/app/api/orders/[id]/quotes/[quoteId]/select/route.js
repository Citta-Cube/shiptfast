import { NextResponse } from 'next/server';
import { selectQuote } from '@/data-access/quotes';
import { getOrderById } from '@/data-access/orders';
import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { processEmailNotifications } from '@/lib/email/processNotifications';

export async function PATCH(request, { params }) {
  try {
    const supabase = createAdminClient()
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: orderId, quoteId } = params;

    // Verify order exists and get current status
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Allow selection when order is PENDING or REASSIGN (admin-only for REASSIGN)
    if (!(order.status === 'PENDING' || order.status === 'REASSIGN')) {
      return NextResponse.json(
        { error: 'Quote can only be selected when order is in PENDING or REASSIGN status' },
        { status: 400 }
      );
    }

    // Ensure the user is from the order's exporter company, and admin if REASSIGN
    const { data: membership, error: memberErr } = await supabase
      .from('company_members')
      .select('role, companies:company_id(id, type)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    if (memberErr || !membership?.companies?.id) {
      return NextResponse.json({ error: 'No active company membership' }, { status: 403 })
    }
    if (membership.companies.type !== 'EXPORTER' || membership.companies.id !== order.exporter_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (order.status === 'REASSIGN' && membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can select a quote in REASSIGN status' }, { status: 403 })
    }

  // Select the quote (DB function allows only ACTIVE quotes)
    await selectQuote(orderId, quoteId);

    // DB triggers create the notification. Send email immediately for this quote.
    try {
      await processEmailNotifications({ types: ['QUOTE_SELECTED'], orderId, quoteId });
    } catch (notificationError) {
      console.error('Email dispatch for quote selected failed:', notificationError);
      // Do not fail the request if emails fail
    }

    return NextResponse.json({
      message: 'Quote selected successfully'
    });

  } catch (error) {
    console.error('Error selecting quote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to select quote' },
      { status: 500 }
    );
  }
}