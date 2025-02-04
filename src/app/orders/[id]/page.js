// src/app/dashboard/orders/[id]/page.js
import { notFound } from 'next/navigation';
import OrderDetailContent from '@/components/orders/OrderDetailContent';
import { getOrderById, getOrderDocuments, getOrderQuotes } from '@/data-access/orders';

export default async function OrderDetailPage({ params }) {
  try {
    const [order, documents, quotes] = await Promise.all([
      getOrderById(params.id),
      getOrderDocuments(params.id),
      getOrderQuotes(params.id),
    ]);

    return (
      <OrderDetailContent 
        order={order}
        documents={documents}
        quotes={quotes}
      />
    );
  } catch (error) {
    console.error('Error fetching order data:', error);
    notFound();
  }
}