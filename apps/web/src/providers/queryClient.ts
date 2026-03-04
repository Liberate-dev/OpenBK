import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1_800_000,
      retry: 2,
      refetchOnWindowFocus: true
    },
    mutations: {
      retry: 1
    }
  }
});

