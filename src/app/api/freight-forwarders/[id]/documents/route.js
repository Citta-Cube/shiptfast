import { getForwarderDocuments } from '@/data-access/freightForwarders';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const documents = await getForwarderDocuments(id);
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching forwarder documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forwarder documents' },
      { status: 500 }
    );
  }
} 