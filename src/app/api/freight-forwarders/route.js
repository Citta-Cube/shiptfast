// src/app/api/freight-forwarders/route.js
import { mockFreightForwarders } from '@/mockData/freightForwarders';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const services = searchParams.get('services');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort');

  let filteredForwarders = [...mockFreightForwarders];

  if (status && status !== 'null') {
    filteredForwarders = filteredForwarders.filter(ff => ff.status === status);
  }

  if (services && services !== 'null') {
    const serviceList = services.split(',');
    filteredForwarders = filteredForwarders.filter(ff => 
      serviceList.every(service => ff.services.includes(service))
    );
  }

  if (search) {
    filteredForwarders = filteredForwarders.filter(ff => 
      ff.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (sort === 'asc') {
    filteredForwarders.sort((a, b) => a.rating - b.rating);
  } else if (sort === 'desc') {
    filteredForwarders.sort((a, b) => b.rating - a.rating);
  }

  return NextResponse.json(filteredForwarders);
}