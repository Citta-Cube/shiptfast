// src/components/orders/OrderDetailContent.js
'use client';

import React, { useState } from 'react';
import OrderSummary from './OrderSummary';
import DocumentSection from './DocumentSection';
import QuotationSection from './QuotationSection';
import TimelineSheet from './TimelineSheet';

const OrderDetailContent = ({ order }) => {
  const [currentOrder, setCurrentOrder] = useState(order);

  const handleCancelOrder = async () => {
    // API call to cancel order
    setCurrentOrder({ ...currentOrder, status: 'cancelled' });
  };

  const handleSelectAgent = async (agentId) => {
    // API call to select agent
    setCurrentOrder({ ...currentOrder, status: 'closed', selectedAgentId: agentId });
  };

  const handlePublishMessage = async (message) => {
    // API call to publish message
    setCurrentOrder({
      ...currentOrder,
      timeline: [...currentOrder.timeline, { type: 'User', content: message, date: new Date() }]
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order #{currentOrder.orderNumber}</h1>
        <TimelineSheet 
          events={currentOrder.timeline} 
          onPublishMessage={handlePublishMessage}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <OrderSummary order={currentOrder} onCancelOrder={handleCancelOrder} />
        <DocumentSection documents={currentOrder.documents} orderId={currentOrder.id} />
        <QuotationSection 
          order={currentOrder}
          onSelectAgent={handleSelectAgent}
        />
      </div>
    </div>
  );
};

export default OrderDetailContent;