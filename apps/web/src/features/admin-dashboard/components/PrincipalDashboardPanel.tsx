import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import { useRouter } from '@tanstack/react-router';
import { apiClient } from '~lib/apiClient';
import { getErrorMessage } from '~lib/error';

interface DashboardSummary {
  incomingReports: number;
  urgentReports: number;
  counselingThisMonth: number;
  counselingTotal: number;
  counselingCompleted: number;
  counselingOpen: number;
  studentsHandled: number;
}

export function PrincipalDashboardPanel() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient<DashboardSummary>('/admin/dashboard-summary');
      setSummary(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat dashboard kepala sekolah.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #dbe5f4', p: { xs: 3, md: 4 }, background: 'linear-gradient(135deg, #fffef7 0%, #fff9db 42%, #ffffff 100%)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box sx={{ maxWidth: 760 }}>
            <Typography sx={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800, color: '#a16207', mb: 1 }}>
              Leadership Overview
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', mb: 1 }}>
              Dashboard Kepala Sekolah
            </Typography>
            <Typography sx={{ color: '#475569', lineHeight: 1.8 }}>
              Ringkasan eksekutif untuk memantau volume laporan masuk, capaian layanan konseling, dan tindak lanjut yang masih berjalan.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AssessmentOutlinedIcon />}
            onClick={() => router.navigate({ to: '/admin/reports' })}
            sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, bgcolor: '#0f172a', textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 2.5 }}
          >
            Buka Laporan
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5 }}>
        <MetricCard icon={<MarkEmailUnreadOutlinedIcon fontSize="small" />} title="Laporan Masuk" value={summary?.incomingReports ?? 0} accent="#1d4ed8" tone="#eff6ff" />
        <MetricCard icon={<PendingActionsOutlinedIcon fontSize="small" />} title="Kasus Mendesak" value={summary?.urgentReports ?? 0} accent="#b91c1c" tone="#fef2f2" />
        <MetricCard icon={<CalendarMonthOutlinedIcon fontSize="small" />} title="Konseling Bulan Ini" value={summary?.counselingThisMonth ?? 0} accent="#a16207" tone="#fefce8" />
        <MetricCard icon={<SchoolOutlinedIcon fontSize="small" />} title="Total Konseling" value={summary?.counselingTotal ?? 0} accent="#15803d" tone="#f0fdf4" />
        <MetricCard icon={<AssessmentOutlinedIcon fontSize="small" />} title="Belum Selesai" value={summary?.counselingOpen ?? 0} accent="#7c3aed" tone="#f5f3ff" />
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3 }}>
        <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>Capaian Layanan</Typography>
        <Stack spacing={1.2}>
          <Typography sx={{ color: '#475569' }}>Konseling selesai: <strong>{summary?.counselingCompleted ?? 0}</strong></Typography>
          <Typography sx={{ color: '#475569' }}>Konseling belum selesai: <strong>{summary?.counselingOpen ?? 0}</strong></Typography>
          <Typography sx={{ color: '#475569' }}>Siswa yang sudah ditangani: <strong>{summary?.studentsHandled ?? 0}</strong></Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}

function MetricCard(props: { icon: ReactNode; title: string; value: number; accent: string; tone: string }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(148, 163, 184, 0.18)', bgcolor: '#ffffff', p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 700, mb: 0.7 }}>{props.title}</Typography>
          <Typography sx={{ color: '#0f172a', fontSize: '1.9rem', lineHeight: 1, fontWeight: 900 }}>{props.value}</Typography>
        </Box>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: props.tone, color: props.accent }}>
          {props.icon}
        </Box>
      </Stack>
    </Paper>
  );
}
