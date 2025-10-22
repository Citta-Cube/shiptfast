'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Grid, List } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ForwarderMetrics from '@/components/forwarders/ForwarderMetrics';
import ForwarderSearchAndFilter from '@/components/forwarders/ForwarderSearchAndFilter';
import ForwarderOrderTabs from '@/components/forwarders/ForwarderOrderTabs';

const ForwarderDashboardContent = ({ initialFilters = {} }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilters, setActiveFilters] = useState({
    searchTerm: '',
    shipmentType: initialFilters.shipmentType || 'all',
    loadType: initialFilters.loadType || 'all',
    status: initialFilters.status || 'all',
    sortBy: initialFilters.sortBy || 'shipmentDate'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch orders
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

  // Compute filtered orders based on current orders and filters
  const applyFilters = useCallback(() => {
    let result = [...orders];

    // Apply search filter
    if (activeFilters.searchTerm) {
      const term = activeFilters.searchTerm.toLowerCase();
      result = result.filter(order =>
        String(order.reference_number || '').toLowerCase().includes(term)
      );
    }

    // Apply shipment type filter
    if (activeFilters.shipmentType !== 'all') {
      const st = String(activeFilters.shipmentType || '').toLowerCase();
      result = result.filter(order => String(order.shipment_type || '').toLowerCase() === st);
    }

    // Apply load type filter
    if (activeFilters.loadType !== 'all') {
      const lt = String(activeFilters.loadType || '').toLowerCase();
      result = result.filter(order => String(order.load_type || '').toLowerCase() === lt);
    }

    // Apply status filter
    if (activeFilters.status !== 'all') {
      const status = String(activeFilters.status || '').toLowerCase();
      result = result.filter(order => String(order.status || '').toLowerCase() === status);
    }

    // Apply sorting
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

  // Run filtering whenever applyFilters (and thus its deps) change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Sync internal state when URL search params (via props) change
  useEffect(() => {
    setActiveFilters(prev => ({
      ...prev,
      shipmentType: initialFilters.shipmentType || 'all',
      loadType: initialFilters.loadType || 'all',
      status: initialFilters.status || 'all',
      sortBy: initialFilters.sortBy || 'shipmentDate'
    }));
  }, [initialFilters]);

  const navigateWithFilters = (nextFilters) => {
    const queryParams = new URLSearchParams();
    if ((nextFilters.shipmentType || 'all') !== 'all') queryParams.set('shipmentType', nextFilters.shipmentType);
    if ((nextFilters.loadType || 'all') !== 'all') queryParams.set('loadType', nextFilters.loadType);
    if ((nextFilters.status || 'all') !== 'all') queryParams.set('status', nextFilters.status);
    if (nextFilters.sortBy) queryParams.set('sortBy', nextFilters.sortBy);

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
      <ForwarderOrderTabs
        orders={filteredOrders}
        viewMode={viewMode}
        statusParam={activeFilters.status}
        onStatusChange={(value) => handleFilterChange('status', value)}
      />
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders Dashboard</h1>
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
        onFilterStatus={(value) => handleFilterChange('status', value)}
        onSort={(value) => handleFilterChange('sortBy', value)}
      />

      {renderContent()}
    </>
  );
};

export default ForwarderDashboardContent;