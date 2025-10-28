'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Pagination } from '@/components/ui/pagination';
import ForwarderOrderList from './ForwarderOrderList';

const ForwarderOrderTabs = ({ orders, viewMode, currentPage, itemsPerPage, onPageChange }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize active tab from URL or default to 'all'
  const initialTab = searchParams?.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [paginatedOrders, setPaginatedOrders] = useState([]);
  
  // Filter orders based on the active tab
  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    
    return orders.filter(order => {
      switch (activeTab) {
        case 'open':
          return order.quote_status === 'open';
        case 'quoted':
          return order.quote_status === 'quoted';
        case 'pending':
          return order.quote_status === 'pending';
        case 'rejected':
          return order.quote_status === 'rejected';
        case 'selected':
          // Check if quote exists and its status is SELECTED
          return order.quote && order.quote.status === 'SELECTED';
        default:
          return true;
      }
    });
  };
  
  // Count orders for each tab
  const counts = {
    all: orders.length,
    open: orders.filter(order => order.quote_status === 'open').length,
    quoted: orders.filter(order => order.quote_status === 'quoted').length,
    pending: orders.filter(order => order.quote_status === 'pending').length,
    rejected: orders.filter(order => order.quote_status === 'rejected').length,
    selected: orders.filter(order => order.quote && order.quote.status === 'SELECTED').length
  };

  // Sync active tab with URL parameter
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Pagination logic for current tab
  useEffect(() => {
    const filteredOrders = getFilteredOrders();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, itemsPerPage, orders]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    // Reset to page 1 when changing tabs
    onPageChange(1);
    
    // Update URL with the new tab parameter
    const currentParams = new URLSearchParams(searchParams?.toString());
    if (value === 'all') {
      // Remove tab parameter for 'all' tab
      currentParams.delete('tab');
    } else {
      currentParams.set('tab', value);
    }
    
    const queryString = currentParams.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="all">
          All <Badge className="ml-2 bg-gray-500">{counts.all}</Badge>
        </TabsTrigger>
        <TabsTrigger value="open">
          Open <Badge className="ml-2 bg-blue-500">{counts.open}</Badge>
        </TabsTrigger>
        <TabsTrigger value="quoted">
          Quoted <Badge className="ml-2 bg-yellow-500">{counts.quoted}</Badge>
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending <Badge className="ml-2 bg-orange-500">{counts.pending}</Badge>
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected <Badge className="ml-2 bg-red-500">{counts.rejected}</Badge>
        </TabsTrigger>
        <TabsTrigger value="selected">
          Selected <Badge className="ml-2 bg-green-500">{counts.selected}</Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" className="mt-6">
        <ForwarderOrderList orders={paginatedOrders} viewMode={viewMode} />
        {getFilteredOrders().length > itemsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(getFilteredOrders().length / itemsPerPage)}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="open" className="mt-6">
        <ForwarderOrderList orders={paginatedOrders} viewMode={viewMode} />
        {getFilteredOrders().length > itemsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(getFilteredOrders().length / itemsPerPage)}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="quoted" className="mt-6">
        <ForwarderOrderList orders={paginatedOrders} viewMode={viewMode} />
        {getFilteredOrders().length > itemsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(getFilteredOrders().length / itemsPerPage)}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="pending" className="mt-6">
        <ForwarderOrderList orders={paginatedOrders} viewMode={viewMode} />
        {getFilteredOrders().length > itemsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(getFilteredOrders().length / itemsPerPage)}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="rejected" className="mt-6">
        <ForwarderOrderList orders={paginatedOrders} viewMode={viewMode} />
        {getFilteredOrders().length > itemsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(getFilteredOrders().length / itemsPerPage)}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="selected" className="mt-6">
        <ForwarderOrderList orders={paginatedOrders} viewMode={viewMode} />
        {getFilteredOrders().length > itemsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(getFilteredOrders().length / itemsPerPage)}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ForwarderOrderTabs;