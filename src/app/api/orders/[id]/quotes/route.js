import { NextResponse } from 'next/server';
import { getOrderQuotes } from '@/data-access/quotes';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const quotes = await getOrderQuotes(id);
    
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error in quotes API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order quotes' },
      { status: 500 }
    );
  }
}