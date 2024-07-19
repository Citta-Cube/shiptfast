// @/components/dashboard/DashboardContent.js
'use client';

import React, { useState, useEffect } from 'react';
import OrderList from '@/components/dashboard/OrderList';
import SearchAndFilter from '@/components/dashboard/SearchAndFilter';
import { Skeleton } from "@/components/ui/skeleton";


const DashboardContent = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
      }, []);
    
    const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
        throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data);
        setFilteredOrders(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
    };
  
    const handleSearch = (searchTerm) => {
      const filtered = orders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    };
  
    const handleFilterShipmentType = (type) => {
      if (type === 'all') {
        setFilteredOrders(orders);
      } else {
        const filtered = orders.filter(order => order.shipmentType === type);
        setFilteredOrders(filtered);
      }
    };
  
    const handleFilterLoadType = (type) => {
      if (type === 'all') {
        setFilteredOrders(orders);
      } else {
        const filtered = orders.filter(order => order.loadType === type);
        setFilteredOrders(filtered);
      }
    };
  
    const handleFilterStatus = (status) => {
      if (status === 'all') {
        setFilteredOrders(orders);
      } else {
        const filtered = orders.filter(order => order.status === status);
        setFilteredOrders(filtered);
      }
    };
  
    const handleSort = (sortBy) => {
      let sorted;
      if (sortBy === 'shipmentDate') {
        sorted = [...filteredOrders].sort((a, b) => new Date(a.shipmentDate) - new Date(b.shipmentDate));
      } else if (sortBy === 'timeLeft') {
        sorted = [...filteredOrders].sort((a, b) => {
          if (a.status !== 'open') return 1;
          if (b.status !== 'open') return -1;
          return new Date(a.timeLeft) - new Date(b.timeLeft);
        });
      }
      setFilteredOrders(sorted);
    };

    return (
        <>
          <h1 className="text-2xl font-bold mb-6">Orders Dashboard</h1>
          <SearchAndFilter
            onSearch={handleSearch}
            onFilterShipmentType={handleFilterShipmentType}
            onFilterLoadType={handleFilterLoadType}
            onFilterStatus={handleFilterStatus}
            onSort={handleSort}
          />
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-[200px] w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <OrderList orders={filteredOrders} />
          )}
        </>
      );
  };
  
  export default DashboardContent;