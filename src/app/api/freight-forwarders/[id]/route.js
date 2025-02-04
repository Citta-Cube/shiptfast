import { mockFreightForwarderDetail } from '@/mockData/freightForwarderDetail';
import { NextResponse } from 'next/server';
import { getForwarderById } from '@/data-access/freightForwarders';

export async function GET(request, { params }) {
  const { id } = params;
  const exporterId = 'e0912188-4fbd-415e-b5a7-19b35cfbab42';
  const forwarder = await getForwarderById(id, exporterId);

  console.log(forwarder);
  return NextResponse.json(forwarder);
}