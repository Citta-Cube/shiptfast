'use client';

import React from 'react';
import OrderSummary from '@/components/orders/OrderSummary';
import DocumentSection from '@/components/orders/DocumentSection';
import QuoteManagementSection from '@/components/forwarders/QuoteManagementSection';
import OrderMessagingSheet from '@/components/orders/OrderMessagingSheet';
import InvoiceUploadSection from '@/components/forwarders/InvoiceUploadSection';

const ForwarderOrderDetailContent = ({ order, documents, quotes, quoteDocuments = [] }) => {
  // Extract shipment type and load type from order
  const shipmentType = order?.shipment_type || 'SEA';
  const loadType = order?.load_type || 'FCL';

  // Find the selected quote if any
  const selectedQuote = quotes?.find(q => q.status === 'SELECTED');
  const showInvoiceSection = selectedQuote && order.status === 'CLOSED';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order {order.reference_number}</h1>
          <p className="text-sm text-muted-foreground">ID: {order.id}</p>
        </div>
        <div className="flex gap-2">
          <OrderMessagingSheet 
            orderId={order.id}
            order={order}
            userRole="forwarder"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary - reusing existing component */}
        <OrderSummary order={order} />

        {/* Document Section - reusing existing component */}
        <DocumentSection
          documents={documents}
          entityId={order.id}
          entityType="ORDER"
          canUpload={false}
          canDelete={false}
        />

        {/* Quote Management Section - new interactive component */}
        <QuoteManagementSection
          orderId={order.id}
          forwarderId={order.order_selected_forwarder.freight_forwarder_id}
          quotes={quotes || []}
          shipmentType={shipmentType}
          loadType={loadType}
          originPort={order.origin_port}
          destinationPort={order.destination_port}
          orderStatus={order.status}
        />

        {/* Invoice Upload Section - only show when quote is selected and order is closed */}
        {showInvoiceSection && (
          <InvoiceUploadSection
            orderId={order.id}
            quoteId={selectedQuote.id}
            documents={quoteDocuments}
            orderStatus={order.status}
            quoteStatus={selectedQuote.status}
            canUpload={true}
            canDelete={true}
            className="lg:col-span-2"
          />
        )}
      </div>
    </div>
  );
};

export default ForwarderOrderDetailContent; 