import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user's company
    const { data: companyMember } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
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
      orderId, 
      forwarderId, 
      netFreightCost, 
      estimatedTimeDays, 
      validityPeriodDays, 
      notes,
      quoteDetails,
      transshipmentPorts
    } = body;
    
    // Validate required fields
    if (!orderId || !forwarderId || !netFreightCost || !estimatedTimeDays || !validityPeriodDays) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate that this forwarder is associated with the user's company
    if (forwarderId !== companyMember.company_id) {
      return NextResponse.json(
        { error: 'Unauthorized to submit quote for this forwarder' },
        { status: 403 }
      );
    }
    
    // Check if this forwarder is invited to quote for this order
    const { data: orderSelectedForwarder, error: forwarderCheckError } = await supabase
      .from('order_selected_forwarders')
      .select('*')
      .eq('order_id', orderId)
      .eq('freight_forwarder_id', forwarderId)
      .single();
      
    if (forwarderCheckError || !orderSelectedForwarder) {
      return NextResponse.json(
        { error: 'Forwarder not invited to quote for this order' },
        { status: 403 }
      );
    }
    
    // Check if forwarder has rejected the invitation
    if (orderSelectedForwarder.is_rejected) {
      return NextResponse.json(
        { error: 'Forwarder has rejected the invitation to quote' },
        { status: 403 }
      );
    }
    
    // Check if there's an existing active quote to update
    const { data: existingQuotes } = await supabase
      .from('quotes')
      .select('*')
      .eq('order_id', orderId)
      .eq('freight_forwarder_id', forwarderId)
      .eq('status', 'ACTIVE');
      
    let quoteId;
    
    if (existingQuotes && existingQuotes.length > 0) {
      // Update existing quote
      const existingQuote = existingQuotes[0];
      
      // Create amendment record if price changed
      if (existingQuote.net_freight_cost !== netFreightCost) {
        await supabase.from('quote_amendments').insert({
          quote_id: existingQuote.id,
          previous_net_freight_cost: existingQuote.net_freight_cost,
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
          updated_at: new Date().toISOString()
        })
        .eq('id', existingQuote.id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      quoteId = existingQuote.id;
    } else {
      // Create new quote
      const { data: newQuote, error: insertError } = await supabase
        .from('quotes')
        .insert({
          order_id: orderId,
          freight_forwarder_id: forwarderId,
          net_freight_cost: netFreightCost,
          estimated_time_days: estimatedTimeDays,
          validity_period_days: validityPeriodDays,
          note: notes,
          quote_details: quoteDetails || {},
          status: 'ACTIVE'
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      quoteId = newQuote.id;
      
      // Add transshipment ports if provided
      if (transshipmentPorts && transshipmentPorts.length > 0) {
        // Format transshipment ports with the new quote id
        const formattedPorts = transshipmentPorts.map(port => ({
          quote_id: quoteId,
          port_id: port.port_id,
          sequence_number: port.sequence_number || 1
        }));
        
        // Insert transshipment ports
        const { error: portsError } = await supabase
          .from('transshipment_ports')
          .insert(formattedPorts);
          
        if (portsError) {
          console.error('Failed to add transshipment ports:', portsError);
        }
      }
      
      // Update order_selected_forwarders to mark as submitted
      await supabase
        .from('order_selected_forwarders')
        .update({ is_submitted: true })
        .eq('order_id', orderId)
        .eq('freight_forwarder_id', forwarderId);
    }
    
    return NextResponse.json({ success: true, quoteId });
    
  } catch (error) {
    console.error('Quote submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quote' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
} 