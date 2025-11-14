import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { auth } from "@clerk/nextjs/server";
import { processEmailNotifications } from '@/lib/email/processNotifications'

export async function PATCH(request, { params }) {
  try {
    const { id: quoteId } = params;
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Check if user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user's company
    const { data: companyMember } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .single();
      
    if (!companyMember) {
      return NextResponse.json(
        { error: 'User is not associated with any company' },
        { status: 403 }
      );
    }
    
    // Get the quote to verify ownership
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();
      
    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (quote.freight_forwarder_id !== companyMember.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this quote' },
        { status: 403 }
      );
    }
    
    // Verify quote is in a cancellable state
    if (quote.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot cancel quote with status: ${quote.status}` },
        { status: 400 }
      );
    }
    
    // Get the order to check its status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', quote.order_id)
      .single();
    
    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Prevent cancellation when order status is PENDING
    if (order.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot cancel quote when order status is PENDING. You can only edit quotes for pending orders.' },
        { status: 400 }
      );
    }
    
    // Cancel the quote
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);
      
    if (updateError) throw updateError;
    
    // Send email immediately for QUOTE_CANCELLED
    try {
      await processEmailNotifications({ types: ['QUOTE_CANCELLED'], quoteId })
    } catch (e) {
      console.error('Email dispatch for quote cancelled failed:', e)
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Quote cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel quote' },
      { status: 500 }
    );
  }
} 