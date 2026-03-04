import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import BadgeIcon from '@mui/icons-material/Badge';
import HistoryIcon from '@mui/icons-material/History';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useRouter } from '@tanstack/react-router';
import { apiClient } from '~lib/apiClient';
import { getErrorMessage } from '~lib/error';

interface AdminUser {
  id: number;
}

interface AllowedNisItem {
  id: number;
}

interface StudentAccount {
  id: number;
}

interface ActivityLogEntry {
  id: number;
  action: string;
  description: string;
  adminName: string;
  createdAt: string;
}

export function AdminItDashboardPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentLogs, setRecentLogs] = useState<ActivityLogEntry[]>([]);
  const [metrics, setMetrics] = useState({
    users: 0,
    students: 0,
    allowedNis: 0,
    logs: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [users, students, allowedNis, logs] = await Promise.all([
        apiClient<AdminUser[]>('/admin/users'),
        apiClient<StudentAccount[]>('/admin/students'),
        apiClient<AllowedNisItem[]>('/admin/nis'),
        apiClient<ActivityLogEntry[]>('/admin/logs'),
      ]);

      setMetrics({
        users: users.length,
        students: students.length,
        allowedNis: allowedNis.length,
        logs: logs.length,
      });
      setRecentLogs(logs.slice(0, 6));
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat dashboard admin.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3.2}>
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.6, fontSize: { xs: '1.7rem', md: '2rem' } }}>
              Dashboard Admin IT
            </Typography>
            <Typography color="text.secondary">
              Selamat datang kembali, berikut ringkasan sistem hari ini.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
        <MetricCard title="Pengguna Admin" value={metrics.users} subtitle="Aktif" icon={<PeopleIcon />} />
        <MetricCard title="Akun Siswa" value={metrics.students} subtitle="Terverifikasi" icon={<SchoolIcon />} />
        <MetricCard title="NIS Diizinkan" value={metrics.allowedNis} subtitle="Whitelist Terdaftar" icon={<BadgeIcon />} />
        <MetricCard title="Log Aktivitas" value={metrics.logs} subtitle="24 Jam Terakhir" icon={<HistoryIcon />} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, overflow: 'hidden' }}>
          <Box sx={{ p: 2.2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.35rem' }}>
              Recent Activity Logs
            </Typography>
            <Button size="small" onClick={() => router.navigate({ to: '/admin/logs' })} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Lihat Semua
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', py: 1.5 }}>WAKTU</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', py: 1.5 }}>PENGGUNA</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', py: 1.5 }}>AKTIVITAS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', py: 1.5 }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                    Belum ada log aktivitas.
                  </TableCell>
                </TableRow>
              ) : (
                recentLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ color: '#64748b', whiteSpace: 'nowrap', py: 1.5 }}>
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#334155', py: 1.5 }}>
                      {log.adminName}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', py: 1.5 }}>
                      {log.description}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <StatusChip action={log.action} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>

        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, overflow: 'hidden' }}>
          <Box sx={{ p: 2.2, borderBottom: '1px solid #e2e8f0' }}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.35rem' }}>
              Quick Actions
            </Typography>
          </Box>
          <List sx={{ p: 1.2 }}>
            <QuickActionItem
              icon={<GroupAddIcon fontSize="small" />}
              title="Tambah Admin"
              subtitle="Daftarkan pengelola baru"
              onClick={() => router.navigate({ to: '/admin/users' })}
            />
            <QuickActionItem
              icon={<FileUploadIcon fontSize="small" />}
              title="Impor NIS Massal"
              subtitle="Upload CSV/XLSX file NIS"
              onClick={() => router.navigate({ to: '/admin/nis' })}
            />
            <QuickActionItem
              icon={<DescriptionIcon fontSize="small" />}
              title="Laporan Mingguan"
              subtitle="Lihat log operasional"
              onClick={() => router.navigate({ to: '/admin/logs' })}
            />
            <QuickActionItem
              icon={<DeleteSweepIcon fontSize="small" />}
              title="Kelola Akun Siswa"
              subtitle="Reset password siswa lupa"
              onClick={() => router.navigate({ to: '/admin/students' })}
            />
          </List>
        </Paper>
      </Box>
    </Stack>
  );
}

function MetricCard(props: { title: string; value: number; subtitle: string; icon: ReactNode }) {
  const { title, value, subtitle, icon } = props;

  return (
    <Paper elevation={0} sx={{ p: 2.2, border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
        <Typography sx={{ color: '#64748b', fontWeight: 600 }}>{title}</Typography>
        <Box sx={{ color: '#4f46e5', bgcolor: '#eef2ff', borderRadius: 2, p: 0.9, display: 'flex' }}>{icon}</Box>
      </Stack>
      <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.8rem', mt: 0.5 }}>
        {subtitle}
      </Typography>
    </Paper>
  );
}

function QuickActionItem(props: { icon: ReactNode; title: string; subtitle: string; onClick: () => void }) {
  const { icon, title, subtitle, onClick } = props;

  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        borderRadius: 1,
        mb: 0.8,
        border: '1px solid #eef2ff',
        display: 'flex',
        alignItems: 'center',
        gap: 1.2,
      }}
    >
      <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{title}</Typography>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>{subtitle}</Typography>
      </Box>
    </ListItemButton>
  );
}

function StatusChip(props: { action: string }) {
  const { action } = props;

  const palette = action.includes('failed')
    ? { bg: '#fef3c7', color: '#b45309', label: 'Pending' }
    : action.includes('delete')
      ? { bg: '#fee2e2', color: '#b91c1c', label: 'Warning' }
      : action === 'reset_student_password'
        ? { bg: '#fee2e2', color: '#b91c1c', label: 'Alert' }
        : { bg: '#dcfce7', color: '#166534', label: 'Success' };

  return (
    <Box
      sx={{
        px: 1.1,
        py: 0.3,
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 700,
        display: 'inline-flex',
        bgcolor: palette.bg,
        color: palette.color
      }}
    >
      {palette.label}
    </Box>
  );
}
