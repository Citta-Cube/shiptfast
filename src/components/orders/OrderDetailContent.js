'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import OrderSummary from './OrderSummary';
import DocumentSection from './DocumentSection';
import QuotationSection from './quotations/QuotationSection';
import OrderMessagingSheet from './OrderMessagingSheet';

// Mocked API function
const fetchHistoricalData = (startPort, endPort) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = [
        { date: '2023-01', price: 2000 },
        { date: '2023-02', price: 2100 },
      ];
      resolve(mockData);
    }, 1500); // Simulate a 1.5 second delay
  });
};

const OrderDetailContent = ({ order, documents, quotes, userRole, quoteDocuments = [] }) => {
  const { user } = useUser();
  const [currentOrder, setCurrentOrder] = useState(order);
  const [historicalData, setHistoricalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistoricalData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchHistoricalData(order.origin_port?.country_code, order.destination_port?.country_code);
        // const response = await fetch(`/api/historical-pricing?startPort=${order.originPort}&endPort=${order.destinationPort}`);
        setHistoricalData(data);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoricalData();
  }, [order?.origin_port?.country_code, order?.destination_port?.country_code]);

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

  const getCurrentBestQuote = () => {
    if (!currentOrder.quotations || currentOrder.quotations.length === 0) return null;
    return Math.min(...currentOrder.quotations.map(q => q.price));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order {currentOrder.reference_number}</h1>
          <p className="text-sm text-muted-foreground">ID: {currentOrder.id}</p>
        </div>
        <div className="flex gap-2">
          <OrderMessagingSheet 
            orderId={currentOrder.id}
            order={currentOrder}
            userRole={userRole}
            quotes={quotes}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <OrderSummary order={order} onCancelOrder={handleCancelOrder} />
        <DocumentSection
          documents={documents}
          entityId={currentOrder.id}
          entityType="ORDER"
          canUpload={true}
          canDelete={true}
        />
        <QuotationSection
          order={order}
          quotes={quotes}
          onSelectAgent={handleSelectAgent}
          quoteDocuments={quoteDocuments}
        />
        {/* <HistoricalPricingChart
          historicalData={historicalData}
          currentBestQuote={getCurrentBestQuote()}
          startPort={{ name: currentOrder.originPort, countryCode: currentOrder.originCountryCode }}
          endPort={{ name: currentOrder.destinationPort, countryCode: currentOrder.destinationCountryCode }}
          isLoading={isLoading}
        /> */}
      </div>
    </div>
  );
};

export default OrderDetailContent;