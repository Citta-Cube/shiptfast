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
  const [filters, setFilters] = useState({ status: null, services: null, search: '', sort: null });

  useEffect(() => {
    fetchForwarders();
  }, [filters]);

  const fetchForwarders = async () => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.services) queryParams.append('services', filters.services);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.sort) queryParams.append('sort', filters.sort);
    
    const response = await fetch(`/api/freight-forwarders?${queryParams.toString()}`);
    const data = await response.json();
    setForwarders(data);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const activeForwarders = forwarders.filter(ff => ff.status === 'active');
  const averageScore = activeForwarders.length > 0
    ? activeForwarders.reduce((sum, ff) => sum + ff.rating, 0) / activeForwarders.length
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
        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blacklisted">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.services} onValueChange={(value) => handleFilterChange('services', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Services</SelectItem>
            <SelectItem value="air">Air</SelectItem>
            <SelectItem value="sea">Sea</SelectItem>
            <SelectItem value="rail">Rail</SelectItem>
            <SelectItem value="road">Road</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Default</SelectItem>
            <SelectItem value="asc">Rating: Low to High</SelectItem>
            <SelectItem value="desc">Rating: High to Low</SelectItem>
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