import { createFileRoute } from "@tanstack/react-router";
import { AdminInboxList } from "~features/admin-inbox/components/AdminInboxList";
import { requireGuruBkRole } from "~lib/adminGuards";

export const Route = createFileRoute("/admin/inbox")({
  beforeLoad: () => {
    requireGuruBkRole();
  },
  component: AdminInboxPage
});

function AdminInboxPage() {
  return <AdminInboxList />;
}
