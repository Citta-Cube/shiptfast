// src/components/dashboard/OrderList.js
import React from 'react';
import OrderCard from '@/components/dashboard/OrderCard';

const OrderList = ({ orders }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
};

export default OrderList;