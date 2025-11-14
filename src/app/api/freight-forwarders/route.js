// src/app/api/freight-forwarders/route.js
import { getForwardersByExporter } from '@/data-access/freightForwarders';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserCompanyMembership } from '@/data-access/companies';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's company membership to get exporterId
    const membership = await getUserCompanyMembership(userId);
    
    if (!membership || !membership.companies) {
      return NextResponse.json(
        { error: 'User company membership not found' },
        { status: 400 }
      );
    }

    const exporterId = membership.companies.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const services = searchParams.get('services');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');

    let forwarders = await getForwardersByExporter(exporterId);
    // Filter out forwarders without relationships (inactive) and only show active ones
    forwarders = forwarders.filter(ff => ff.relationship);
    // && ff.relationship.status === 'ACTIVE'

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