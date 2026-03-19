import { createFileRoute, redirect } from '@tanstack/react-router';
import { requireAdminRole } from '~lib/adminGuards';

export const Route = createFileRoute('/admin/nis')({
  beforeLoad: () => {
    requireAdminRole();
    throw redirect({ to: '/admin/students' });
  },
  component: () => null,
});
