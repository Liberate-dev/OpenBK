import { useSuspenseQuery } from "@tanstack/react-query";
import { getInboxMessages } from "~features/admin-inbox/api/getInboxMessages";

export const adminInboxQueryKey = ["admin-inbox"] as const;

export function useAdminInbox() {
  return useSuspenseQuery({
    queryKey: adminInboxQueryKey,
    queryFn: getInboxMessages,
    refetchInterval: 10000, // Poll every 10 seconds
  });
}

