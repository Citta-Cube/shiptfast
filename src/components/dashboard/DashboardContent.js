'use client';

import React, { useState, useEffect, useCallback } from 'react';
import OrderList from '@/components/dashboard/OrderList';
import OrderListView from '@/components/dashboard/OrderListView';
import SearchAndFilter from '@/components/dashboard/SearchAndFilter';
import Pagination from '@/components/ui/pagination';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Grid, List } from 'lucide-react';

const DashboardContent = ({ initialFilters = {} }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [paginatedOrders, setPaginatedOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const [activeFilters, setActiveFilters] = useState({
        searchTerm: '',
        tradeType: initialFilters.tradeType || 'all',
        shipmentType: initialFilters.shipmentType || 'all',
        loadType: initialFilters.loadType || 'all',
        status: initialFilters.status || 'all',
        sortBy: initialFilters.sortBy || ''
    });

    useEffect(() => {
        fetchOrders();
        fetchMyCompany();
    }, []);

    useEffect(() => {
        const queryParams = new URLSearchParams();
        
        if (activeFilters.tradeType !== 'all') 
            queryParams.set('tradeType', activeFilters.tradeType);
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

    const [exporterCountryCode, setExporterCountryCode] = useState(null);
    const [companyType, setCompanyType] = useState(null);

    const fetchMyCompany = async () => {
        try {
            const res = await fetch('/api/me/company');
            if (!res.ok) return; // non-blocking for non-exporters/unauth
            const data = await res.json();
            setCompanyType(data.type || null);
            setExporterCountryCode((data.country_code || '').toUpperCase() || null);
        } catch (e) {
            // ignore
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

        // Apply trade type using exporter country vs destination country if user is EXPORTER
        if (activeFilters.tradeType !== 'all') {
            if (companyType === 'EXPORTER' && exporterCountryCode) {
                result = result.filter(order => {
                    const destCc = order?.destination_port?.country_code?.toUpperCase?.() || '';
                    const isImport = destCc === exporterCountryCode;
                    const isExport = !isImport;
                    return activeFilters.tradeType === 'import' ? isImport : isExport;
                });
            } else {
                // Fallback based on incoterms if company or country unknown
                const EXPORT_INCOTERMS = new Set(['EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP']);
                const IMPORT_INCOTERMS = new Set(['DAP','DPU','DDP']);
                result = result.filter(order => {
                    const inc = String(order.incoterm || '').toUpperCase();
                    const isExport = EXPORT_INCOTERMS.has(inc);
                    const isImport = IMPORT_INCOTERMS.has(inc);
                    return activeFilters.tradeType === 'export' ? isExport : isImport;
                });
            }
        }

        // Apply shipment type filter
        if (activeFilters.shipmentType !== 'all') {
            result = result.filter(order => order.shipment_type.toLowerCase() === activeFilters.shipmentType);
        }

        // Apply load type filter
        if (activeFilters.loadType !== 'all') {
            result = result.filter(order => order.load_type.toLowerCase() === activeFilters.loadType);
        }

        // Apply status filter
        if (activeFilters.status !== 'all') {
            result = result.filter(order => order.status.toLowerCase() === activeFilters.status);
        }

        // Apply sorting
        if (activeFilters.sortBy) {
            if (activeFilters.sortBy === 'shipmentDate') {
                result.sort((a, b) => new Date(a.cargo_ready_date) - new Date(b.cargo_ready_date));
            } else if (activeFilters.sortBy === 'timeLeft') {
                result.sort((a, b) => {
                    if (a.status.toLowerCase() !== 'open') return 1;
                    if (b.status.toLowerCase() !== 'open') return -1;
                    return new Date(a.quotation_deadline) - new Date(b.quotation_deadline);
                });
            }
        }

        setFilteredOrders(result);
    }, [orders, activeFilters, companyType, exporterCountryCode]);

    // Moved below applyFilters to avoid TDZ when reading it in the deps array
    useEffect(() => {
        applyFilters();
    }, [orders, activeFilters, applyFilters]);

    // Pagination logic
    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
    }, [filteredOrders, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilters]);

    const handleFilterChange = (filterType, value) => {
        setActiveFilters(prev => ({ ...prev, [filterType]: value }));
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
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
            ? <OrderList orders={paginatedOrders} />
            : <OrderListView orders={paginatedOrders} />;
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Orders Dashboard</h1>
                    {!isLoading && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {filteredOrders.length > 0 ? (
                                `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, filteredOrders.length)} of ${filteredOrders.length} orders`
                            ) : (
                                'No orders found'
                            )}
                        </p>
                    )}
                </div>
                <Button variant="outline" size="sm" onClick={toggleViewMode}>
                    {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid className="h-4 w-4 mr-2" />}
                    {viewMode === 'grid' ? 'List View' : 'Grid View'}
                </Button>
            </div>
            <SearchAndFilter
                activeFilters={activeFilters}
                onSearch={(value) => handleFilterChange('searchTerm', value)}
                onFilterTradeType={(value) => handleFilterChange('tradeType', value)}
                onFilterShipmentType={(value) => handleFilterChange('shipmentType', value)}
                onFilterLoadType={(value) => handleFilterChange('loadType', value)}
                onFilterStatus={(value) => handleFilterChange('status', value)}
                onSort={(value) => handleFilterChange('sortBy', value)}
            />
            {renderOrders()}
            {filteredOrders.length > itemsPerPage && (
                <div className="mt-8">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredOrders.length / itemsPerPage)}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </>
    );
};

export default DashboardContent;