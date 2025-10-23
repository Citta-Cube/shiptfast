// src/app/dashboard/orders/[id]/page.js
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import OrderDetailContent from '@/components/orders/OrderDetailContent';
import { getOrderById, getOrderDocuments, getOrderQuotes, getQuoteDocumentsByQuoteId } from '@/data-access/orders';
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

    // Find selected quote and fetch its documents
    const selectedQuote = quotes?.find(q => q.id === order.selected_quote_id);
    const quoteDocuments = selectedQuote ? await getQuoteDocumentsByQuoteId(selectedQuote.id) : [];

    return (
      <OrderDetailContent
        order={order}
        documents={documents}
        quotes={quotes}
        userRole={userRole}
        quoteDocuments={quoteDocuments}
      />
    );
  } catch (error) {
    console.error('Error fetching order data:', error);
    notFound();
  }
}