// hooks/useQuotations.js

import { useState, useMemo } from 'react';

export const useQuotations = (initialQuotations) => {
  const [sortBy, setSortBy] = useState('net_freight_cost');
  const [filterText, setFilterText] = useState('');

  const sortedAndFilteredQuotations = useMemo(() => {
    return initialQuotations
      .filter(q => 
        q.companies.name.toLowerCase().includes(filterText.toLowerCase()) ||
        q.net_freight_cost.toString().includes(filterText)
      )
      .sort((a, b) => {
        if (sortBy === 'net_freight_cost') return a.net_freight_cost - b.net_freight_cost;
        if (sortBy === 'estimated_time_days') return a.estimated_time_days - b.estimated_time_days;
        if (sortBy === 'average_rating') return (b.companies.average_rating || 0) - (a.companies.average_rating || 0);
        return 0;
      });
  }, [initialQuotations, sortBy, filterText]);

  return {
    sortedAndFilteredQuotations,
    sortBy,
    setSortBy,
    filterText,
    setFilterText
  };
};