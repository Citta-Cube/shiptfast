import { notFound } from 'next/navigation';
import ForwarderOrderDetailContent from '@/components/forwarders/ForwarderOrderDetailContent';
import {
  getForwarderOrderById,
  getForwarderQuotes,
  getOrderDocuments,
  getQuoteDocuments
} from '@/data-access/forwarder-orders';
import { getCurrentUser } from '@/data-access/users';
import { getUserCompanyMembership } from '@/data-access/companies'

export default async function ForwarderOrderPage({ params }) {
  try {
    const user = await getCurrentUser();
    const companyMember = await getUserCompanyMembership(user.id);
    const forwarderId = companyMember.companies?.id;

    // Fetch all required data in parallel
    const [order, documents, quotes] = await Promise.all([
      getForwarderOrderById(params.id, forwarderId),
      getOrderDocuments(params.id),
      getForwarderQuotes(params.id, forwarderId),
    ]);

    // Find selected quote and fetch its documents
    const selectedQuote = quotes?.find(q => q.status === 'SELECTED');
    const quoteDocuments = selectedQuote ? await getQuoteDocuments(selectedQuote.id) : [];

    return (
      <ForwarderOrderDetailContent
        order={order}
        documents={documents}
        quotes={quotes}
        quoteDocuments={quoteDocuments}
      />
    );
  } catch (error) {
    console.error('Error fetching forwarder order data:', error);
    notFound();
  }
}