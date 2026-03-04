import type { InboxMessage } from "~features/admin-inbox/types/admin-inbox.types";
import { apiClient } from "~lib/apiClient";

export async function getInboxMessages(): Promise<InboxMessage[]> {
  return apiClient<InboxMessage[]>("/admin/messages", {
    method: "GET",
  });
}

