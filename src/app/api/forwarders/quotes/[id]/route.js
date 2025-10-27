import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { auth } from "@clerk/nextjs/server";

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
    
    // Get request body
    const body = await request.json();
    const { 
      netFreightCost, 
      estimatedTimeDays, 
      validityPeriodDays, 
      notes,
      quoteDetails,
      transshipmentPorts
    } = body;
    
    // Validate required fields
    if (!netFreightCost || !estimatedTimeDays || !validityPeriodDays) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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
        { error: 'Unauthorized to update this quote' },
        { status: 403 }
      );
    }
    
    // Verify quote is in an editable state
    if (quote.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Cannot update quote with status: ${quote.status}` },
        { status: 400 }
      );
    }
    
    // Create amendment record if price changed
    if (quote.net_freight_cost !== netFreightCost) {
      await supabase.from('quote_amendments').insert({
        quote_id: quoteId,
        previous_net_freight_cost: quote.net_freight_cost,
        new_net_freight_cost: netFreightCost,
        reason: 'Updated by forwarder'
      });
    }
    
    // Update quote
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        net_freight_cost: netFreightCost,
        estimated_time_days: estimatedTimeDays,
        validity_period_days: validityPeriodDays,
        note: notes,
        quote_details: quoteDetails || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single();
      
    if (updateError) throw updateError;
    
    // Handle transshipment ports update
    if (transshipmentPorts) {
      // First remove existing transshipment ports
      await supabase
        .from('transshipment_ports')
        .delete()
        .eq('quote_id', quoteId);
      
      // Add new transshipment ports if any are provided
      if (transshipmentPorts.length > 0) {
        // Format transshipment ports with the quote id
        const formattedPorts = transshipmentPorts.map(port => ({
          quote_id: quoteId,
          port_id: port.port_id,
          sequence_number: port.sequence_number || 1
        }));
        
        // Insert new transshipment ports
        const { error: portsError } = await supabase
          .from('transshipment_ports')
          .insert(formattedPorts);
          
        if (portsError) {
          console.error('Failed to update transshipment ports:', portsError);
        }
      }
    }
    
    return NextResponse.json({ success: true, quote: updatedQuote });
    
  } catch (error) {
    console.error('Quote update error:', error);
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    );
  }
} 