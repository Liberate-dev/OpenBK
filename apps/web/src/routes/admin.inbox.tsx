import { createFileRoute } from "@tanstack/react-router";
import { AdminInboxList } from "~features/admin-inbox/components/AdminInboxList";

export const Route = createFileRoute("/admin/inbox")({
  component: AdminInboxPage
});

function AdminInboxPage() {
  return <AdminInboxList />;
}

