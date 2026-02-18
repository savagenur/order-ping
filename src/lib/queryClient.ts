import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - reduces Firebase reads
      gcTime: 1000 * 60 * 30, // 30 minutes cache
      refetchOnWindowFocus: false, // Don't refetch on tab switch - saves quota
      retry: 1,
    },
  },
});
