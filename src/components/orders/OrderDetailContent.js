'use client'

import React, { useState, useEffect } from 'react';
import OrderSummary from './OrderSummary';
import DocumentSection from './DocumentSection';
import QuotationSection from './quotations/QuotationSection';
import TimelineSheet from './TimelineSheet';
import HistoricalPricingChart from './HistoricalPricingChart';

// Mocked API function
const fetchHistoricalData = (startPort, endPort) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = [
        { date: '2023-01', price: 2000 },
        { date: '2023-02', price: 2100 },
        { date: '2023-03', price: 2050 },
        { date: '2023-04', price: 2200 },
        { date: '2023-05', price: 2150 },
        { date: '2023-06', price: 3200 },
      ];
      resolve(mockData);
    }, 1500); // Simulate a 1.5 second delay
  });
};

const OrderDetailContent = ({ order }) => {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [historicalData, setHistoricalData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistoricalData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchHistoricalData(order.originPort, order.destinationPort);
        // const response = await fetch(`/api/historical-pricing?startPort=${order.originPort}&endPort=${order.destinationPort}`);
        setHistoricalData(data);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoricalData();
  }, [order.originPort, order.destinationPort]);

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
        <HistoricalPricingChart
          historicalData={historicalData}
          currentBestQuote={getCurrentBestQuote()}
          startPort={{ name: currentOrder.originPort, countryCode: currentOrder.originCountryCode }}
          endPort={{ name: currentOrder.destinationPort, countryCode: currentOrder.destinationCountryCode }}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default OrderDetailContent;