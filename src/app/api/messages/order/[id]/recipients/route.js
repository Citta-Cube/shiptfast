import { NextResponse } from 'next/server';
import { getOrderForwarders, getOrderExporter } from '@/data-access/messages';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const userRole = searchParams.get('role');
    
    if (userRole === 'exporter') {
      // Get all forwarders for this order
      const forwarders = await getOrderForwarders(params.id);
      return NextResponse.json(forwarders);
    } else if (userRole === 'forwarder') {
      // Get the exporter for this order
      const exporter = await getOrderExporter(params.id);
      return NextResponse.json(exporter);
    } else {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching message recipients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    );
  }
}