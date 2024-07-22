// hooks/useQuotations.js

import { useState, useMemo } from 'react';

export const useQuotations = (initialQuotations) => {
  const [sortBy, setSortBy] = useState('price');
  const [filterText, setFilterText] = useState('');

  const sortedAndFilteredQuotations = useMemo(() => {
    return initialQuotations
      .filter(q => 
        q.agentCompany.toLowerCase().includes(filterText.toLowerCase()) ||
        q.price.toString().includes(filterText)
      )
      .sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'time') return a.estimatedTime - b.estimatedTime;
        if (sortBy === 'rating') return b.rating - a.rating;
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