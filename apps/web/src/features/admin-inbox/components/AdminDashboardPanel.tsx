import { useMemo, type ReactNode } from 'react';
import {
  Box,
  Button,
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
import MailIcon from '@mui/icons-material/Mail';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useRouter } from '@tanstack/react-router';
import { useAdminInbox } from '~features/admin-inbox/hooks/useAdminInbox';
import type { RiskLevel } from '~features/admin-inbox/types/admin-inbox.types';

const riskWeight: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function AdminDashboardPanel() {
  const router = useRouter();
  const { data: messages, refetch } = useAdminInbox();

  const stats = useMemo(() => {
    const critical = messages.filter((m) => m.riskLevel === 'critical').length;
    const high = messages.filter((m) => m.riskLevel === 'high').length;
    const replied = messages.filter((m) => m.hasReplies).length;
    const pending = messages.length - replied;

    return {
      total: messages.length,
      urgent: critical + high,
      replied,
      pending,
    };
  }, [messages]);

  const priorityMessages = useMemo(() => {
    return [...messages]
      .sort((a, b) => {
        const riskGap = riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
        if (riskGap !== 0) return riskGap;
        return Date.parse(b.submittedAt) - Date.parse(a.submittedAt);
      })
      .slice(0, 6);
  }, [messages]);

  return (
    <Stack spacing={3.2}>
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.6, fontSize: { xs: '1.7rem', md: '2rem' } }}>
              Dashboard Guru BK
            </Typography>
            <Typography color="text.secondary">
              Pantau surat siswa dan prioritaskan tindak lanjut konseling.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
        <MetricCard title="Total Surat Masuk" value={stats.total} subtitle="Surat Siswa" icon={<MailIcon />} />
        <MetricCard title="Perlu Tindak Lanjut" value={stats.urgent} subtitle="High & Critical" icon={<ErrorOutlineIcon />} />
        <MetricCard title="Sudah Dibalas" value={stats.replied} subtitle="Follow-up Berjalan" icon={<MarkEmailReadIcon />} />
        <MetricCard title="Belum Dibalas" value={stats.pending} subtitle="Menunggu Respons" icon={<PendingActionsIcon />} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2 }}>
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, overflow: 'hidden' }}>
          <Box sx={{ p: 2.2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.35rem' }}>
              Laporan Prioritas
            </Typography>
            <Button size="small" onClick={() => router.navigate({ to: '/admin/inbox' })} sx={{ textTransform: 'none', fontWeight: 700 }}>
              Lihat Semua
            </Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>WAKTU</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>NIS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>RINGKASAN</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>RISIKO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {priorityMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5, color: '#94a3b8' }}>
                    Belum ada surat masuk.
                  </TableCell>
                </TableRow>
              ) : (
                priorityMessages.map((message) => (
                  <TableRow key={message.id} hover>
                    <TableCell sx={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(message.submittedAt).toLocaleString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>
                      {message.authorNis}
                    </TableCell>
                    <TableCell sx={{ color: '#475569' }}>
                      {message.preview}
                    </TableCell>
                    <TableCell>
                      <RiskChip level={message.riskLevel} />
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
              icon={<ChatBubbleOutlineIcon fontSize="small" />}
              title="Buka Kotak Masuk"
              subtitle="Balas surat siswa"
              onClick={() => router.navigate({ to: '/admin/inbox' })}
            />
            <QuickActionItem
              icon={<PriorityHighIcon fontSize="small" />}
              title="Tinjau Kasus Mendesak"
              subtitle="Fokus high/critical"
              onClick={() => router.navigate({ to: '/admin/inbox' })}
            />
            <QuickActionItem
              icon={<MenuBookIcon fontSize="small" />}
              title="Kelola Kamus Risiko"
              subtitle="Update kata kunci"
              onClick={() => router.navigate({ to: '/admin/kamus' })}
            />
            <QuickActionItem
              icon={<RefreshIcon fontSize="small" />}
              title="Refresh Data"
              subtitle="Sinkronisasi dashboard"
              onClick={() => {
                refetch();
              }}
            />
            <QuickActionItem
              icon={<AddAlertIcon fontSize="small" />}
              title="Pantau Belum Dibalas"
              subtitle={`${stats.pending} surat menunggu`}
              onClick={() => router.navigate({ to: '/admin/inbox' })}
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

function RiskChip(props: { level: RiskLevel }) {
  const { level } = props;

  const palette = level === 'critical'
    ? { bg: '#fee2e2', color: '#b91c1c', label: 'CRITICAL' }
    : level === 'high'
      ? { bg: '#ffedd5', color: '#c2410c', label: 'HIGH' }
      : level === 'medium'
        ? { bg: '#fef3c7', color: '#b45309', label: 'MEDIUM' }
        : { bg: '#dcfce7', color: '#166534', label: 'LOW' };

  return (
    <Box sx={{
      px: 1.1,
      py: 0.3,
      borderRadius: 999,
      fontSize: '0.72rem',
      fontWeight: 700,
      display: 'inline-flex',
      bgcolor: palette.bg,
      color: palette.color
    }}>
      {palette.label}
    </Box>
  );
}
