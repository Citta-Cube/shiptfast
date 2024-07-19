import { mockFreightForwarderDetail } from '@/mockData/freightForwarderDetail';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = params;
  
  return NextResponse.json(mockFreightForwarderDetail);
}