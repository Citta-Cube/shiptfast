// src/components/dashboard/SearchAndFilter.js
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SearchAndFilter = ({ onSearch, onFilterShipmentType, onFilterLoadType, onFilterStatus, onSort }) => {
  return (
    <div className="mb-6 flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
      <Input
        type="search"
        placeholder="Search by Order Number..."
        onChange={(e) => onSearch(e.target.value)}
        className="md:w-1/4"
      />
      <Select onValueChange={onFilterShipmentType}>
        <SelectTrigger className="md:w-1/5">
          <SelectValue placeholder="Shipment Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="sea">Sea Freight</SelectItem>
          <SelectItem value="air">Air Freight</SelectItem>
        </SelectContent>
      </Select>
      <Select onValueChange={onFilterLoadType}>
        <SelectTrigger className="md:w-1/5">
          <SelectValue placeholder="Load Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="FCL">FCL</SelectItem>
          <SelectItem value="LCL">LCL</SelectItem>
        </SelectContent>
      </Select>
      <Select onValueChange={onFilterStatus}>
        <SelectTrigger className="md:w-1/5">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
      <Select onValueChange={onSort}>
        <SelectTrigger className="md:w-1/5">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="shipmentDate">Shipment Date</SelectItem>
          <SelectItem value="timeLeft">Time Left for Bidding</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SearchAndFilter;