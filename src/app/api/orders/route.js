import mockOrders from '@/mockData/orders';
import { NextResponse } from 'next/server';

export async function GET() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(NextResponse.json(mockOrders));
    }, 500);
  });
}
