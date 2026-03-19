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

export function requireGuruBkRole() {
  const session = adminAuthService.getSession();
  if (!session) {
    throw redirect({ to: '/admin/login' });
  }
  if (session.role !== 'guru_bk') {
    throw redirect({ to: '/admin' });
  }
}

export function requireKepalaSekolahRole() {
  const session = adminAuthService.getSession();
  if (!session) {
    throw redirect({ to: '/admin/login' });
  }
  if (session.role !== 'kepala_sekolah') {
    throw redirect({ to: '/admin' });
  }
}

export function requireReportViewerRole() {
  const session = adminAuthService.getSession();
  if (!session) {
    throw redirect({ to: '/admin/login' });
  }
  if (session.role !== 'guru_bk' && session.role !== 'kepala_sekolah') {
    throw redirect({ to: '/admin' });
  }
}
