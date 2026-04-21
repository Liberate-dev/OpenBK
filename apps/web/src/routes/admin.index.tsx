import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboardPanel } from '~features/admin-inbox/components/AdminDashboardPanel'
import { AdminItDashboardPanel } from '~features/admin-dashboard/components/AdminItDashboardPanel'
import { PrincipalDashboardPanel } from '~features/admin-dashboard/components/PrincipalDashboardPanel'
import { adminAuthService } from '~lib/adminAuth'
import { Box, Stack, Typography, Paper } from '@mui/material'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import { useRouter } from '@tanstack/react-router'

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

  if (session?.role === 'guru') {
    return <GuruDashboard />
  }

  return <AdminDashboardPanel />
}

function GuruDashboard() {
  const router = useRouter()
  const session = adminAuthService.getSession()

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
          Selamat Datang, {session?.username || 'Guru'}
        </Typography>
        <Typography sx={{ color: '#64748b' }}>
          Panel guru untuk melaporkan kasus siswa dan mengakses repository.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5 }}>
        <Paper
          elevation={0}
          onClick={() => router.navigate({ to: '/admin/guru-report' })}
          sx={{
            p: 3.5, borderRadius: 3, cursor: 'pointer',
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(161,98,7,0.12)' }
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReportProblemIcon sx={{ color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#92400e' }}>Lapor Kasus</Typography>
            <Typography sx={{ color: '#a16207', fontSize: '0.9rem' }}>
              Laporkan kasus siswa yang perlu ditangani oleh Guru BK.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          onClick={() => router.navigate({ to: '/admin/repository' })}
          sx={{
            p: 3.5, borderRadius: 3, cursor: 'pointer',
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(37,99,235,0.12)' }
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LibraryBooksIcon sx={{ color: 'white' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e40af' }}>Repository</Typography>
            <Typography sx={{ color: '#1d4ed8', fontSize: '0.9rem' }}>
              Akses materi, panduan, dan dokumen dari Guru BK.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
