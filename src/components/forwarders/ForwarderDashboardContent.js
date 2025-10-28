'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Grid, List } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ForwarderMetrics from '@/components/forwarders/ForwarderMetrics';
import ForwarderSearchAndFilter from '@/components/forwarders/ForwarderSearchAndFilter';
import ForwarderOrderTabs from '@/components/forwarders/ForwarderOrderTabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ForwarderDashboardContent = ({ initialFilters = {} }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [activeFilters, setActiveFilters] = useState({
    searchTerm: '',
    shipmentType: initialFilters.shipmentType || 'all',
    loadType: initialFilters.loadType || 'all',
    sortBy: initialFilters.sortBy || 'shipmentDate'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/forwarders/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch forwarder orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let result = [...orders];

    if (activeFilters.searchTerm) {
      const term = activeFilters.searchTerm.toLowerCase();
      result = result.filter(order =>
        String(order.reference_number || '').toLowerCase().includes(term)
      );
    }

    if (activeFilters.shipmentType !== 'all') {
      const st = String(activeFilters.shipmentType || '').toLowerCase();
      result = result.filter(order => String(order.shipment_type || '').toLowerCase() === st);
    }

    if (activeFilters.loadType !== 'all') {
      const lt = String(activeFilters.loadType || '').toLowerCase();
      result = result.filter(order => String(order.load_type || '').toLowerCase() === lt);
    }

    if (activeFilters.sortBy) {
      if (activeFilters.sortBy === 'shipmentDate') {
        result.sort((a, b) => new Date(a.cargo_ready_date) - new Date(b.cargo_ready_date));
      } else if (activeFilters.sortBy === 'timeLeft') {
        result.sort((a, b) => {
          if (a.status !== 'OPEN') return 1;
          if (b.status !== 'OPEN') return -1;
          return new Date(a.quotation_deadline) - new Date(b.quotation_deadline);
        });
      } else if (activeFilters.sortBy === 'quoteValue') {
        result.sort((a, b) => {
          if (!a.quote) return 1;
          if (!b.quote) return -1;
          return b.quote.net_freight_cost - a.quote.net_freight_cost;
        });
      }
    }

    setFilteredOrders(result);
  }, [orders, activeFilters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters]);

  useEffect(() => {
    setActiveFilters(prev => ({
      ...prev,
      shipmentType: initialFilters.shipmentType || 'all',
      loadType: initialFilters.loadType || 'all',
      sortBy: initialFilters.sortBy || 'shipmentDate'
    }));
  }, [initialFilters]);

  const navigateWithFilters = (nextFilters) => {
    const queryParams = new URLSearchParams();
    if ((nextFilters.shipmentType || 'all') !== 'all') queryParams.set('shipmentType', nextFilters.shipmentType);
    if ((nextFilters.loadType || 'all') !== 'all') queryParams.set('loadType', nextFilters.loadType);
    if (nextFilters.sortBy) queryParams.set('sortBy', nextFilters.sortBy);

    const currentTab = searchParams?.get('tab');
    if (currentTab) queryParams.set('tab', currentTab);

    const newUrl = queryParams.toString() ? `${pathname}?${queryParams.toString()}` : pathname;
    router.push(newUrl);
    router.refresh();
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => {
      const updated = { ...prev, [filterType]: value };
      navigateWithFilters(updated);
      return updated;
    });
  };

  const activeTab = searchParams?.get('tab') || 'all';

  const filteredOrdersForActiveTab = useMemo(() => {
    if (activeTab === 'all') return filteredOrders;
    return filteredOrders.filter(order => {
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
  }, [filteredOrders, activeTab]);

  const totalPages = Math.ceil(filteredOrdersForActiveTab.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'grid' ? 'list' : 'grid');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className="h-[200px] w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <ForwarderOrderTabs
          orders={filteredOrders}
          viewMode={viewMode}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i + 1}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {totalPages > 5 && <PaginationEllipsis />}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders Dashboard</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {filteredOrders.length > 0
                ? `${filteredOrders.length} orders available`
                : 'No orders found'}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={toggleViewMode}>
          {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
          {viewMode === 'grid' ? 'List View' : 'Grid View'}
        </Button>
      </div>

      <ForwarderMetrics />

      <div className="my-6" />

      <ForwarderSearchAndFilter
        activeFilters={activeFilters}
        onSearch={(value) => handleFilterChange('searchTerm', value)}
        onFilterShipmentType={(value) => handleFilterChange('shipmentType', value)}
        onFilterLoadType={(value) => handleFilterChange('loadType', value)}
        onSort={(value) => handleFilterChange('sortBy', value)}
      />

      {renderContent()}
    </>
  );
};

export default ForwarderDashboardContent;