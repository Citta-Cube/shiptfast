// src/app/dashboard/orders/[id]/page.js
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import OrderDetailContent from '@/components/orders/OrderDetailContent';
import { getOrderById, getOrderDocuments, getOrderQuotes } from '@/data-access/orders';
import { getUserRole } from '@/lib/roleUtils';

export default async function OrderDetailPage({ params }) {
  try {
    const { userId } = await auth();
    
    const [order, documents, quotes, userRole] = await Promise.all([
      getOrderById(params.id),
      getOrderDocuments(params.id),
      getOrderQuotes(params.id),
      getUserRole(userId),
    ]);

    return (
      <OrderDetailContent 
        order={order}
        documents={documents}
        quotes={quotes}
        userRole={userRole}
      />
    );
  } catch (error) {
    console.error('Error fetching order data:', error);
    notFound();
  }
}