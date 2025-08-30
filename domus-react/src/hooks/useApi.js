import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for API requests with loading states
 * @param {Function} apiFunction - Function that returns a Promise
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {object} options - Configuration options
 * @returns {object} - Object containing data, loading state, error, and refetch function
 */
export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const { 
    initialData = null, 
    executeOnMount = true,
    onSuccess,
    onError 
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  useEffect(() => {
    if (executeOnMount) {
      execute();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    setData,
    setError,
  };
};

/**
 * Custom hook for paginated API requests
 * @param {Function} apiFunction - Function that returns paginated data
 * @param {object} options - Configuration options
 * @returns {object} - Object containing paginated data and controls
 */
export const usePaginatedApi = (apiFunction, options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 10,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    pageSize: initialPageSize,
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (page = pagination.currentPage, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiFunction({ page, pageSize });
      
      setData(result.data || []);
      setPagination({
        currentPage: result.pagination?.currentPage || page,
        pageSize: result.pagination?.pageSize || pageSize,
        totalPages: result.pagination?.totalPages || 0,
        totalItems: result.pagination?.totalItems || 0,
        hasNextPage: result.pagination?.hasNextPage || false,
        hasPreviousPage: result.pagination?.hasPreviousPage || false,
      });

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, pagination.currentPage, pagination.pageSize, onSuccess, onError]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchData(page, pagination.pageSize);
    }
  }, [fetchData, pagination.totalPages, pagination.pageSize]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.currentPage + 1);
    }
  }, [goToPage, pagination.hasNextPage, pagination.currentPage]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      goToPage(pagination.currentPage - 1);
    }
  }, [goToPage, pagination.hasPreviousPage, pagination.currentPage]);

  const changePageSize = useCallback((newPageSize) => {
    fetchData(1, newPageSize);
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData(pagination.currentPage, pagination.pageSize);
  }, [fetchData, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    pagination,
    loading,
    error,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
    refetch,
    setData,
    setError,
  };
};
