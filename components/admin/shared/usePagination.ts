import { useEffect, useState, type DependencyList } from "react";

export function usePagination<T>(
  items: T[],
  resetDeps: DependencyList = [],
  initialPageSize = 10,
) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, ...resetDeps]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = items.slice(pageStart, pageStart + pageSize);

  return {
    pageItems,
    pageSize,
    setPageSize,
    page: currentPage,
    setPage,
    totalPages,
    pageStart,
    count: items.length,
  };
}
