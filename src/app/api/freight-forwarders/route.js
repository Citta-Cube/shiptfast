// src/app/api/freight-forwarders/route.js
import { getForwardersByExporter } from '@/data-access/freightForwarders';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const services = searchParams.get('services');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const exporterId = 'e0912188-4fbd-415e-b5a7-19b35cfbab42';

    if (!exporterId) {
      return NextResponse.json(
        { error: 'Exporter ID is required' },
        { status: 400 }
      );
    }

    let forwarders = await getForwardersByExporter(exporterId);

    // Filter out forwarders without relationships (inactive) and only show active ones
    forwarders = forwarders.filter(ff => ff.relationship && ff.relationship.status === 'ACTIVE');

    // Apply additional status filter if provided
    if (status && status !== 'null') {
      forwarders = forwarders.filter(ff => ff.relationship && ff.relationship.status === status);
    }

    if (services && services !== 'null') {
      const serviceList = services.split(',');
      forwarders = forwarders.filter(ff => 
        serviceList.every(service => ff.services.includes(service))
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      forwarders = forwarders.filter(ff => 
        ff.name.toLowerCase().includes(searchLower) ||
        ff.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sort === 'asc') {
      forwarders.sort((a, b) => (a.average_rating || 0) - (b.average_rating || 0));
    } else if (sort === 'desc') {
      forwarders.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    }

    return NextResponse.json(forwarders);
  } catch (error) {
    console.error('Error fetching freight forwarders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch freight forwarders' },
      { status: 500 }
    );
  }
}