import { getForwarderMembers } from '@/data-access/freightForwarders';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const members = await getForwarderMembers(id);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching forwarder members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forwarder members' },
      { status: 500 }
    );
  }
} 