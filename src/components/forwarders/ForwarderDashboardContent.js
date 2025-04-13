'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle 
} from 'lucide-react';
import { 
  Alert, 
  AlertDescription 
} from '@/components/ui/alert';
import { Grid, List } from 'lucide-react';
import ForwarderMetrics from '@/components/forwarders/ForwarderMetrics';
import ForwarderSearchAndFilter from '@/components/forwarders/ForwarderSearchAndFilter';
import ForwarderOrderTabs from '@/components/forwarders/ForwarderOrderTabs';

const ForwarderDashboardContent = ({ initialFilters = {} }) => {
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

  useEffect(() => {
    applyFilters();
  }, [orders, activeFilters]);

  useEffect(() => {
    const queryParams = new URLSearchParams();
    
    if (activeFilters.shipmentType !== 'all') 
      queryParams.set('shipmentType', activeFilters.shipmentType);
    if (activeFilters.loadType !== 'all') 
      queryParams.set('loadType', activeFilters.loadType);
    if (activeFilters.status !== 'all') 
      queryParams.set('status', activeFilters.status);
    if (activeFilters.sortBy) 
      queryParams.set('sortBy', activeFilters.sortBy);

    const newUrl = queryParams.toString()
      ? `${window.location.pathname}?${queryParams.toString()}`
      : window.location.pathname;
          
    window.history.replaceState({}, '', newUrl);
  }, [activeFilters]);

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

    // Apply search filter
    if (activeFilters.searchTerm) {
      result = result.filter(order => 
        order.reference_number.toLowerCase().includes(activeFilters.searchTerm.toLowerCase())
      );
    }

    // Apply shipment type filter
    if (activeFilters.shipmentType !== 'all') {
      result = result.filter(order => order.shipment_type.toLowerCase() === activeFilters.shipmentType);
    }

    // Apply load type filter
    if (activeFilters.loadType !== 'all') {
      result = result.filter(order => order.load_type.toLowerCase() === activeFilters.loadType);
    }

    // Apply status filter for forwarder-specific statuses
    if (activeFilters.status !== 'all') {
      const status = activeFilters.status.toUpperCase();
      result = result.filter(order => order.status === status);
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

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({ ...prev, [filterType]: value }));
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

    return <ForwarderOrderTabs orders={filteredOrders} viewMode={viewMode} />;
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Freight Forwarder Dashboard</h1>
      
      <ForwarderMetrics />
      
      <div className="flex justify-between items-center my-6">
        <h2 className="text-xl font-semibold">Order Management</h2>
        <Button variant="outline" size="sm" onClick={toggleViewMode}>
          {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
          {viewMode === 'grid' ? 'List View' : 'Grid View'}
        </Button>
      </div>
      
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