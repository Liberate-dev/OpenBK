import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper, Stack, Typography, Box, Chip, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  FormControl, InputLabel, Select, MenuItem, Container, useMediaQuery, useTheme,
  Tooltip
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { apiClient } from '~lib/apiClient';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { requireAdminRole } from '~lib/adminGuards';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/admin/logs')({
  beforeLoad: () => {
    requireAdminRole();
  },
  component: SystemLogs,
});

interface ActivityLogEntry {
  id: number;
  action: string;
  description: string;
  adminName: string;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  login: { bg: '#dbeafe', color: '#1d4ed8' },
  login_failed: { bg: '#fee2e2', color: '#dc2626' },
  reply: { bg: '#f3e8ff', color: '#7c3aed' },
  create_user: { bg: '#dcfce7', color: '#16a34a' },
  update_user: { bg: '#fef9c3', color: '#a16207' },
  delete_user: { bg: '#fee2e2', color: '#dc2626' },
  otp_sent: { bg: '#e0f2fe', color: '#0284c7' },
  otp_verified: { bg: '#dcfce7', color: '#16a34a' },
  reset_student_password: { bg: '#fee2e2', color: '#991b1b' },
};

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  login_failed: 'Login Gagal',
  reply: 'Balas Surat',
  create_user: 'Tambah User',
  update_user: 'Edit User',
  delete_user: 'Hapus User',
  otp_sent: 'OTP Terkirim',
  otp_verified: 'OTP Terverifikasi',
  reset_student_password: 'Reset Password Siswa',
};

function getActionChipStyle(action: string) {
  return ACTION_COLORS[action] || { bg: '#f1f5f9', color: '#475569' };
}

function getActionLabel(action: string) {
  return ACTION_LABELS[action] || action;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function SystemLogs() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { searchTerm, dateFilter } = useAdminLayoutFilters();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    try {
      const data = await apiClient<ActivityLogEntry[]>('/admin/logs');
      setLogs(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat log aktivitas.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const haystack = `${log.description} ${log.adminName} ${log.ipAddress || ''} ${getActionLabel(log.action)}`.toLowerCase();
      const matchesSearch = query === '' || haystack.includes(query);
      const matchesDate = dateFilter === '' || log.createdAt.startsWith(dateFilter);
      return matchesAction && matchesSearch && matchesDate;
    });
  }, [logs, filterAction, searchTerm, dateFilter]);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" disableGutters>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <HistoryIcon sx={{ color: '#1c67f2', fontSize: 28 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                Log Aktivitas
              </Typography>
            </Stack>
            <Typography sx={{ color: '#64748b', fontSize: '1rem' }}>
              100 aktivitas terakhir oleh admin dan Guru BK.
            </Typography>
          </Box>

          {/* Filter */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter Aksi</InputLabel>
            <Select
              value={filterAction}
              label="Filter Aksi"
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <MenuItem value="all">Semua Aksi</MenuItem>
              {uniqueActions.map(action => (
                <MenuItem key={action} value={action}>
                  {getActionLabel(action)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>{error}</Alert>}

        {/* Log Table */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Waktu</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Aksi</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Deskripsi</TableCell>
                  {!isMobile && <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Admin</TableCell>}
                  {!isMobile && <TableCell sx={{ fontWeight: 700, color: '#475569' }}>IP</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((log) => {
                  const chipStyle = getActionChipStyle(log.action);
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ color: '#64748b', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getActionLabel(log.action)}
                          size="small"
                          sx={{
                            bgcolor: chipStyle.bg,
                            color: chipStyle.color,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={log.description} arrow>
                          <Typography
                            sx={{
                              color: '#0f172a',
                              fontSize: '0.875rem',
                              maxWidth: isMobile ? 160 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {log.description}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      {!isMobile && (
                        <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                          {log.adminName}
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell sx={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {log.ipAddress || '-'}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                      {filterAction === 'all'
                        ? 'Belum ada log aktivitas.'
                        : `Tidak ada log untuk aksi "${getActionLabel(filterAction)}".`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Summary */}
        <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'right' }}>
          Menampilkan {filtered.length} dari {logs.length} log
        </Typography>
      </Stack>
    </Container>
  );
}
