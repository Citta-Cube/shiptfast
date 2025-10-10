// src/app/dashboard/forwarders/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Star, TrendingUp, TrendingDown, Users } from 'lucide-react';
import ForwarderCard from "@/components/forwarders/ForwarderCard";
import MetricCard from "@/components/shared/MetricCard";


const FreightForwardersDashboard = () => {
  const [forwarders, setForwarders] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', services: 'all', search: '', sort: 'default' });

  const fetchForwarders = React.useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.append('status', filters.status.toUpperCase());
      if (filters.services !== 'all') queryParams.append('services', filters.services.toUpperCase());
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sort !== 'default') queryParams.append('sort', filters.sort);
      const response = await fetch(`/api/freight-forwarders?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch forwarders');
      const data = await response.json();
      setForwarders(data);
    } catch (error) {
      console.error('Error fetching forwarders:', error);
    }
  }, [filters.status, filters.services, filters.search, filters.sort]);

  useEffect(() => {
    fetchForwarders();
  }, [fetchForwarders]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const activeForwarders = forwarders.filter(ff => ff.relationship?.status === 'ACTIVE');
  const averageScore = activeForwarders.length > 0
    ? activeForwarders.reduce((sum, ff) => sum + (ff.average_rating || 0), 0) / activeForwarders.length
    : 0;

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Freight Forwarders Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          title="Active Forwarders" 
          value={activeForwarders.length} 
          icon={<CheckCircle className="h-4 w-4" />}
          trend={5}
        />
        <MetricCard 
          title="Average Score" 
          value={averageScore.toFixed(2)} 
          icon={<Star className="h-4 w-4" />}
          trend={-2}
        />
        <MetricCard 
          title="Total Forwarders" 
          value={forwarders.length} 
          icon={<TrendingUp className="h-4 w-4" />}
          trend={8}
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <Input
          placeholder="Search by company name"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="max-w-xs"
        />
        <Select 
          value={filters.status} 
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={filters.services} 
          onValueChange={(value) => handleFilterChange('services', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="AIR">Air</SelectItem>
            <SelectItem value="SEA">Sea</SelectItem>
            <SelectItem value="RAIL">Rail</SelectItem>
            <SelectItem value="ROAD">Road</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={filters.sort} 
          onValueChange={(value) => handleFilterChange('sort', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default Order</SelectItem>
            <SelectItem value="rating_asc">Rating: Low to High</SelectItem>
            <SelectItem value="rating_desc">Rating: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forwarders.map(forwarder => (
          <ForwarderCard key={forwarder.id} forwarder={forwarder} />
        ))}
      </div>
    </>
  );
};

export default FreightForwardersDashboard;