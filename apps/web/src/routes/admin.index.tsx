import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboardPanel } from '~features/admin-inbox/components/AdminDashboardPanel'
import { AdminItDashboardPanel } from '~features/admin-dashboard/components/AdminItDashboardPanel'
import { PrincipalDashboardPanel } from '~features/admin-dashboard/components/PrincipalDashboardPanel'
import { adminAuthService } from '~lib/adminAuth'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const session = adminAuthService.getSession()

  if (session?.role === 'admin') {
    return <AdminItDashboardPanel />
  }

  if (session?.role === 'kepala_sekolah') {
    return <PrincipalDashboardPanel />
  }

  return <AdminDashboardPanel />
}
