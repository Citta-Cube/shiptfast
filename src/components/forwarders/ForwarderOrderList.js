import React from 'react';
import ForwarderOrderCard from './ForwarderOrderCard';
import ForwarderOrderListView from './ForwarderOrderListView';

const ForwarderOrderList = ({ orders, viewMode }) => {
  if (orders.length === 0) {
    return <div className="text-center py-8">No orders found matching your criteria.</div>;
  }

  if (viewMode === 'list') {
    return <ForwarderOrderListView orders={orders} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {orders.map((order) => (
        <ForwarderOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
};

export default ForwarderOrderList; 