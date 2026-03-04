import { redirect } from '@tanstack/react-router';
import { adminAuthService } from '~lib/adminAuth';

export function requireAdminRole() {
  const session = adminAuthService.getSession();
  if (!session) {
    throw redirect({ to: '/admin/login' });
  }
  if (session.role !== 'admin') {
    throw redirect({ to: '/admin' });
  }
}
