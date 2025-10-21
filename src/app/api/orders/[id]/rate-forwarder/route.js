import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from "@clerk/nextjs/server";
import { getUserCompanyMembership } from '@/data-access/companies';

export async function POST(request, { params }) {
  try {
    const { id: orderId } = params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company membership
    const membership = await getUserCompanyMembership(userId);
    if (!membership?.companies?.id) {
      return NextResponse.json(
        { error: 'User is not associated with any company' },
        { status: 403 }
      );
    }

    const raterCompanyId = membership.companies.id;

    // Parse request body
    const { forwarderId, ratingCategories, comment } = await request.json();

    if (!forwarderId || !ratingCategories) {
      return NextResponse.json(
        { error: 'Missing required fields: forwarderId and ratingCategories' },
        { status: 400 }
      );
    }

    // Validate rating categories
    const requiredCategories = ['service_quality', 'on_time_delivery', 'reliability'];
    const hasAllCategories = requiredCategories.every(category => 
      ratingCategories.hasOwnProperty(category) && 
      ratingCategories[category] >= 1 && 
      ratingCategories[category] <= 5
    );

    if (!hasAllCategories) {
      return NextResponse.json(
        { error: 'All rating categories must be provided with values between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate that the forwarder is different from the rater
    if (forwarderId === raterCompanyId) {
      return NextResponse.json(
        { error: 'Cannot rate your own company' },
        { status: 400 }
      );
    }

    // Verify that the order exists and the rater company is the exporter
    const supabase = createClient();
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, exporter_id, status, selected_quote_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify that the rater is the exporter of this order
    if (order.exporter_id !== raterCompanyId) {
      return NextResponse.json(
        { error: 'Only the exporter can rate forwarders for this order' },
        { status: 403 }
      );
    }

    // Verify that the order has a selected quote and is in CLOSED status
    if (order.status !== 'CLOSED' || !order.selected_quote_id) {
      return NextResponse.json(
        { error: 'Can only rate forwarders after order completion' },
        { status: 400 }
      );
    }

    // Verify that the forwarder being rated is the one who was selected
    const { data: selectedQuote, error: quoteError } = await supabase
      .from('quotes')
      .select('freight_forwarder_id')
      .eq('id', order.selected_quote_id)
      .single();

    if (quoteError || !selectedQuote) {
      return NextResponse.json(
        { error: 'Selected quote not found' },
        { status: 404 }
      );
    }

    if (selectedQuote.freight_forwarder_id !== forwarderId) {
      return NextResponse.json(
        { error: 'Can only rate the selected forwarder for this order' },
        { status: 400 }
      );
    }

    // Check if rating already exists for this order
    const { data: existingRating, error: existingError } = await supabase
      .from('company_ratings')
      .select('id')
      .eq('order_id', orderId)
      .eq('rater_company_id', raterCompanyId)
      .single();

    if (existingRating) {
      return NextResponse.json(
        { error: 'Rating already submitted for this order' },
        { status: 400 }
      );
    }

    // Insert the rating
    const { data: ratingData, error: insertError } = await supabase
      .from('company_ratings')
      .insert({
        order_id: orderId,
        rater_company_id: raterCompanyId,
        ratee_company_id: forwarderId,
        rating_categories: ratingCategories,
        comment: comment,
        created_by: userId
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting rating:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Rating submitted successfully',
      rating: ratingData
    });

  } catch (error) {
    console.error('Error in rate-forwarder API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
