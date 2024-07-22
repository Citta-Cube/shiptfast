'use client';

import React, { useState, useEffect, useCallback } from 'react';
import OrderList from '@/components/dashboard/OrderList';
import OrderListView from '@/components/dashboard/OrderListView';
import SearchAndFilter from '@/components/dashboard/SearchAndFilter';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Grid, List } from 'lucide-react';

const DashboardContent = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [activeFilters, setActiveFilters] = useState({
      searchTerm: '',
      shipmentType: 'all',
      loadType: 'all',
      status: 'all',
      sortBy: ''
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [orders, activeFilters]);

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
                order.orderNumber.toLowerCase().includes(activeFilters.searchTerm.toLowerCase())
            );
        }

        // Apply shipment type filter
        if (activeFilters.shipmentType !== 'all') {
            result = result.filter(order => order.shipmentType === activeFilters.shipmentType);
        }

        // Apply load type filter
        if (activeFilters.loadType !== 'all') {
            result = result.filter(order => order.loadType === activeFilters.loadType);
        }

        // Apply status filter
        if (activeFilters.status !== 'all') {
            result = result.filter(order => order.status === activeFilters.status);
        }

        // Apply sorting
        if (activeFilters.sortBy) {
            if (activeFilters.sortBy === 'shipmentDate') {
                result.sort((a, b) => new Date(a.shipmentDate) - new Date(b.shipmentDate));
            } else if (activeFilters.sortBy === 'timeLeft') {
                result.sort((a, b) => {
                    if (a.status !== 'open') return 1;
                    if (b.status !== 'open') return -1;
                    return new Date(a.timeLeft) - new Date(b.timeLeft);
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

    const renderOrders = () => {
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
            return <div className="text-red-500">{error}</div>;
        }

        return viewMode === 'grid' 
            ? <OrderList orders={filteredOrders} />
            : <OrderListView orders={filteredOrders} />;
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
        <SearchAndFilter
            activeFilters={activeFilters}
            onSearch={(value) => handleFilterChange('searchTerm', value)}
            onFilterShipmentType={(value) => handleFilterChange('shipmentType', value)}
            onFilterLoadType={(value) => handleFilterChange('loadType', value)}
            onFilterStatus={(value) => handleFilterChange('status', value)}
            onSort={(value) => handleFilterChange('sortBy', value)}
        />
        {renderOrders()}
      </>
    );
};

export default DashboardContent;