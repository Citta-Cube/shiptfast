import { NextResponse } from 'next/server';
import { selectQuote } from '@/data-access/quotes';
import { getOrderById } from '@/data-access/orders';
import { processEmailNotifications } from '@/lib/email/processNotifications';

export async function PATCH(request, { params }) {
  try {
    const { id: orderId, quoteId } = params;

    // Verify order exists and get current status
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order is in PENDING status
    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Quote can only be selected when order is in PENDING status' },
        { status: 400 }
      );
    }

    // Select the quote
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