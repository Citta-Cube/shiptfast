import { NextResponse } from 'next/server';
import { selectQuote } from '@/data-access/quotes';
import { getOrderById } from '@/data-access/orders';
import { notifyQuoteSelected } from '@/data-access/notifications';

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

    // Create notification for the freight forwarder about quote selection
    try {
      await notifyQuoteSelected(quoteId);
      console.log('Quote selected notification sent successfully');
    } catch (notificationError) {
      console.error('Failed to send quote selected notification:', notificationError);
      // Don't fail the request if notifications fail
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