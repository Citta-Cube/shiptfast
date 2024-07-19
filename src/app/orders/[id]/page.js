// src/app/dashboard/orders/[id]/page.js
import { notFound } from 'next/navigation';
import OrderDetailContent from '@/components/orders/OrderDetailContent';

async function getOrder(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch order');
  }
  return res.json();
}

export default async function OrderDetailPage({ params }) {
  try {
    const order = await getOrder(params.id);
    return <OrderDetailContent order={order} />;
  } catch (error) {
    console.error('Error fetching order:', error);
    notFound();
  }
}