import { useState, useEffect, useCallback } from 'react';

export function usePorts(searchTerm, service) {
  const [ports, setPorts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchPorts = useCallback(async (search, currentPage) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '100',
        search: search,
        service: service || '' // Add this line
      });
  
      const response = await fetch(`/api/ports?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch ports');
  
      const jsonResponse = await response.json();
  
      const { data = [], pagination = {} } = jsonResponse || {};
  
      setPorts(prevPorts => {
        const newPorts = currentPage === 1 ? data : [...prevPorts, ...data];
        return newPorts;
      });
      setHasNextPage(currentPage < (pagination.totalPages || 0));
    } catch (error) {
      console.error('Error fetching ports:', error);
      setPorts([]);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
    }
  }, [service]); // Add service to the dependency array

  useEffect(() => {
    setPage(1);
    fetchPorts(searchTerm, 1);
  }, [searchTerm, service, fetchPorts]); // Add service to the dependency array

  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPorts(searchTerm, nextPage);
    }
  }, [hasNextPage, isLoading, page, searchTerm, fetchPorts]);
  return { ports, isLoading, fetchNextPage, hasNextPage };
}