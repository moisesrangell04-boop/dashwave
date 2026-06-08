import { useState, useMemo, useCallback } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const nextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) setPage((p) => p - 1);
  }, [hasPrev]);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(1);
    setTotal(0);
  }, []);

  const updateTotal = useCallback((t: number) => {
    setTotal(t);
  }, []);

  const changeLimit = useCallback((l: number) => {
    setLimit(l);
    setPage(1);
  }, []);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    goToPage,
    reset,
    updateTotal,
    changeLimit,
  };
}
