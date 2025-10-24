'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ForwarderOrderList from './ForwarderOrderList';

// Valid tab keys for defensive checks
const VALID_TABS = ['all', 'open', 'quoted', 'pending', 'rejected', 'selected'];

const ForwarderOrderTabs = ({ orders, viewMode, initialTab = 'all' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pick initial tab from props or URL (fallback supports legacy `status` param)
  const derivedInitialTab = useMemo(() => {
    const urlTab = searchParams?.get('tab') || searchParams?.get('status');
    const candidate = (initialTab || urlTab || 'all').toLowerCase();
    return VALID_TABS.includes(candidate) ? candidate : 'all';
  }, [initialTab, searchParams]);

  const [activeTab, setActiveTab] = useState(derivedInitialTab);

  // Keep state in sync if URL changes externally (e.g., sidebar click)
  useEffect(() => {
    if (activeTab !== derivedInitialTab) {
      setActiveTab(derivedInitialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedInitialTab]);
  
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

  const handleTabChange = (value) => {
    const next = VALID_TABS.includes(value) ? value : 'all';
    setActiveTab(next);

    // Preserve existing filters while updating the tab param
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', next);
    // Optional: drop legacy `status` if present
    if (params.has('status')) params.delete('status');

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl);
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
        <ForwarderOrderList orders={getFilteredOrders()} viewMode={viewMode} />
      </TabsContent>
      
      <TabsContent value="open" className="mt-6">
        <ForwarderOrderList orders={getFilteredOrders()} viewMode={viewMode} />
      </TabsContent>
      
      <TabsContent value="quoted" className="mt-6">
        <ForwarderOrderList orders={getFilteredOrders()} viewMode={viewMode} />
      </TabsContent>
      
      <TabsContent value="pending" className="mt-6">
        <ForwarderOrderList orders={getFilteredOrders()} viewMode={viewMode} />
      </TabsContent>
      
      <TabsContent value="rejected" className="mt-6">
        <ForwarderOrderList orders={getFilteredOrders()} viewMode={viewMode} />
      </TabsContent>

      <TabsContent value="selected" className="mt-6">
        <ForwarderOrderList orders={getFilteredOrders()} viewMode={viewMode} />
      </TabsContent>
    </Tabs>
  );
};

export default ForwarderOrderTabs;