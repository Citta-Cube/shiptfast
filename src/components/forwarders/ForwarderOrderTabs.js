'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Pagination } from '@/components/ui/pagination';
import ForwarderOrderList from './ForwarderOrderList';

const VALID_TABS = ['all', 'open', 'quoted', 'pending', 'rejected', 'selected'];

const ForwarderOrderTabs = ({
  orders = [],
  viewMode = 'grid',
  itemsPerPage = 9,
  initialTab = 'all',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine tab from URL or props
  const derivedInitialTab = useMemo(() => {
    const urlTab = searchParams?.get('tab') || searchParams?.get('status');
    const candidate = (urlTab || initialTab || 'all').toLowerCase();
    return VALID_TABS.includes(candidate) ? candidate : 'all';
  }, [initialTab, searchParams]);

  const [activeTab, setActiveTab] = useState(derivedInitialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedOrders, setPaginatedOrders] = useState([]);

  // Keep activeTab in sync with URL
  useEffect(() => {
    if (activeTab !== derivedInitialTab) setActiveTab(derivedInitialTab);
  }, [derivedInitialTab]);

  // Filter orders by tab
  const getFilteredOrders = useMemo(() => {
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
          return order.quote && order.quote.status === 'SELECTED';
        default:
          return true;
      }
    });
  }, [orders, activeTab]);

  // Count per tab
  const counts = useMemo(
    () => ({
      all: orders.length,
      open: orders.filter(o => o.quote_status === 'open').length,
      quoted: orders.filter(o => o.quote_status === 'quoted').length,
      pending: orders.filter(o => o.quote_status === 'pending').length,
      rejected: orders.filter(o => o.quote_status === 'rejected').length,
      selected: orders.filter(o => o.quote && o.quote.status === 'SELECTED').length,
    }),
    [orders]
  );

  // Paginate filtered orders
  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setPaginatedOrders(getFilteredOrders.slice(start, end));
  }, [getFilteredOrders, currentPage, itemsPerPage]);

  // Handle tab change and URL sync
  const handleTabChange = (value) => {
    const next = VALID_TABS.includes(value) ? value : 'all';
    setActiveTab(next);
    setCurrentPage(1); // Reset pagination on tab change

    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', next);
    if (params.has('status')) params.delete('status');
    const nextUrl = params.toString() ? `${pathname}?${params}` : pathname;

    router.push(nextUrl);
  };

  const totalPages = Math.ceil(getFilteredOrders.length / itemsPerPage);

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

      <TabsContent value={activeTab} className="mt-6">
        <ForwarderOrderList orders={paginatedOrders} viewMode={viewMode} />

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ForwarderOrderTabs;