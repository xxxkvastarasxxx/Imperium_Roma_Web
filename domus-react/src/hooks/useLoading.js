import { useState, useCallback } from "react";

/**
 * Custom hook for managing loading states
 * @param {boolean} initialState - Initial loading state
 * @returns {object} - Object containing loading state and control functions
 */
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);

  const setLoadingError = useCallback((errorMessage) => {
    setLoading(false);
    setError(errorMessage);
  }, []);

  const withLoading = useCallback(
    async (asyncFunction) => {
      try {
        startLoading();
        const result = await asyncFunction();
        stopLoading();
        return result;
      } catch (err) {
        setLoadingError(err.message || "An error occurred");
        throw err;
      }
    },
    [startLoading, stopLoading, setLoadingError]
  );

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    withLoading,
  };
};

/**
 * Custom hook for managing multiple loading states
 * @param {object} initialStates - Object with initial loading states
 * @returns {object} - Object containing loading states and control functions
 */
export const useMultipleLoading = (initialStates = {}) => {
  const [loadingStates, setLoadingStates] = useState(initialStates);

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const startLoading = useCallback(
    (key) => {
      setLoading(key, true);
    },
    [setLoading]
  );

  const stopLoading = useCallback(
    (key) => {
      setLoading(key, false);
    },
    [setLoading]
  );

  const isLoading = useCallback(
    (key) => {
      return loadingStates[key] || false;
    },
    [loadingStates]
  );

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  return {
    loadingStates,
    setLoading,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
  };
};
