import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import { adminAuthService } from '~lib/adminAuth';
import { apiClient } from '~lib/apiClient';
import { requireReportViewerRole } from '~lib/adminGuards';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/admin/reports')({
  beforeLoad: () => {
    requireReportViewerRole();
  },
  component: ReportsPage,
});

interface ReportSummary {
  type: 'weekly' | 'monthly' | 'semester' | 'yearly';
  label: string;
  range: { start: string; end: string };
  stats: {
    totalCounseling: number;
    completed: number;
    unfinished: number;
    studentsHandled: number;
  };
  activities: Array<{ date: string; count: number; details: string[] }>;
  serviceBreakdown: Array<{ serviceType: string; total: number }>;
  monthlyBreakdown: Array<{ period: string; total: number; completed: number; unfinished: number }>;
  items: Array<{
    date: string;
    studentNis: string | null;
    studentName: string | null;
    studentClass: string | null;
    serviceType: string;
    medium: string;
    topic: string;
    status: string;
    resultSummary: string | null;
    followUpPlan: string | null;
    creatorName: string | null;
  }>;
}

function ReportsPage() {
  const today = new Date();
  const initialWeek = new Date(today);
  initialWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'semester' | 'yearly'>('weekly');
  const [weekStart, setWeekStart] = useState(initialWeek.toISOString().slice(0, 10));
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [semester, setSemester] = useState(today.getMonth() < 6 ? '1' : '2');
  const [year, setYear] = useState(String(today.getFullYear()));
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'word' | 'excel' | null>(null);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ type: reportType, year });
    if (reportType === 'weekly') params.set('week_start', weekStart);
    if (reportType === 'monthly') params.set('month', month);
    if (reportType === 'semester') params.set('semester', semester);
    return params.toString();
  }, [month, reportType, semester, weekStart, year]);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient<ReportSummary>(`/admin/reports/summary?${queryString}`);
      setSummary(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat laporan.'));
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleExport = async (format: 'word' | 'excel') => {
    try {
      setExporting(format);
      setError('');

      const token = adminAuthService.getSession()?.token;
      const baseUrl = import.meta.env.DEV ? 'http://localhost:8000' : '';
      const response = await fetch(`${baseUrl}/api/v1/admin/reports/export?${queryString}&format=${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Gagal export laporan (${response.status}).`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${summary?.label || 'laporan'}.${format === 'word' ? 'doc' : 'xls'}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal mengunduh laporan.'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #dbe5f4', p: { xs: 3, md: 4 }, background: 'linear-gradient(135deg, #f8fbff 0%, #eef5ff 52%, #ffffff 100%)' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2}>
          <Box sx={{ maxWidth: 820 }}>
            <Typography sx={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800, color: '#2563eb', mb: 1 }}>
              Reporting Desk
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.2 }}>
              <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 34px rgba(37, 99, 235, 0.22)' }}>
                <AssessmentIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                Laporan BK
              </Typography>
            </Stack>
            <Typography sx={{ color: '#475569', lineHeight: 1.8 }}>
              Susun laporan mingguan, bulanan, semester, dan tahunan. Unduhan tetap memakai format Word dan Excel agar langsung siap dipakai administrasi sekolah.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Jenis Laporan</InputLabel>
              <Select value={reportType} label="Jenis Laporan" onChange={(event) => setReportType(event.target.value as typeof reportType)}>
                <MenuItem value="weekly">Mingguan</MenuItem>
                <MenuItem value="monthly">Bulanan</MenuItem>
                <MenuItem value="semester">Semester</MenuItem>
                <MenuItem value="yearly">Tahunan</MenuItem>
              </Select>
            </FormControl>
            {reportType === 'weekly' && (
              <TextField label="Awal Minggu" type="date" InputLabelProps={{ shrink: true }} value={weekStart} onChange={(event) => setWeekStart(event.target.value)} fullWidth />
            )}
            {reportType === 'monthly' && (
              <FormControl fullWidth>
                <InputLabel>Bulan</InputLabel>
                <Select value={month} label="Bulan" onChange={(event) => setMonth(event.target.value)}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((monthNumber) => (
                    <MenuItem key={monthNumber} value={String(monthNumber)}>
                      {new Date(2026, monthNumber - 1, 1).toLocaleDateString('id-ID', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {reportType === 'semester' && (
              <FormControl fullWidth>
                <InputLabel>Semester</InputLabel>
                <Select value={semester} label="Semester" onChange={(event) => setSemester(event.target.value)}>
                  <MenuItem value="1">Semester 1</MenuItem>
                  <MenuItem value="2">Semester 2</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField label="Tahun" type="number" value={year} onChange={(event) => setYear(event.target.value)} fullWidth />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="contained" onClick={fetchSummary} sx={{ bgcolor: '#0f172a', textTransform: 'none', fontWeight: 700 }}>
              Tampilkan Laporan
            </Button>
            <Button variant="outlined" startIcon={<DescriptionOutlinedIcon />} onClick={() => handleExport('word')} disabled={!summary || exporting !== null} sx={{ textTransform: 'none', fontWeight: 700 }}>
              {exporting === 'word' ? 'Mengunduh...' : 'Export Word'}
            </Button>
            <Button variant="outlined" startIcon={<GridOnOutlinedIcon />} onClick={() => handleExport('excel')} disabled={!summary || exporting !== null} sx={{ textTransform: 'none', fontWeight: 700 }}>
              {exporting === 'excel' ? 'Mengunduh...' : 'Export Excel'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {loading || !summary ? (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 6, textAlign: 'center' }}>
          <Typography sx={{ color: '#64748b' }}>{loading ? 'Memuat laporan...' : 'Belum ada data laporan.'}</Typography>
        </Paper>
      ) : (
        <>
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3 }}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem', mb: 0.7 }}>{summary.label}</Typography>
            <Typography sx={{ color: '#64748b' }}>
              Periode {formatDate(summary.range.start)} - {formatDate(summary.range.end)}
            </Typography>
          </Paper>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
            <MetricCard title="Total Konseling" value={summary.stats.totalCounseling} />
            <MetricCard title="Selesai" value={summary.stats.completed} />
            <MetricCard title="Belum Selesai" value={summary.stats.unfinished} />
            <MetricCard title="Siswa Ditangani" value={summary.stats.studentsHandled} />
          </Box>

          {summary.type === 'weekly' && (
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 3 }}>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>Kegiatan Mingguan</Typography>
              <Stack spacing={2}>
                {summary.activities.length === 0 ? (
                  <Typography sx={{ color: '#64748b' }}>Belum ada kegiatan konseling pada minggu ini.</Typography>
                ) : summary.activities.map((activity) => (
                  <Box key={activity.date} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', mb: 0.8 }}>{formatDate(activity.date)} | {activity.count} kegiatan</Typography>
                    <Stack spacing={0.6}>
                      {activity.details.map((detail, index) => (
                        <Typography key={`${activity.date}-${index}`} sx={{ color: '#475569' }}>• {detail}</Typography>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {(summary.type === 'semester' || summary.type === 'yearly') && (
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2.2, borderBottom: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {summary.type === 'semester' ? 'Rekap Status Semester' : 'Rekap Bulanan Tahun Berjalan'}
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={headCellSx}>{summary.type === 'semester' ? 'Periode' : 'Bulan'}</TableCell>
                      <TableCell sx={headCellSx}>Total</TableCell>
                      <TableCell sx={headCellSx}>Selesai</TableCell>
                      <TableCell sx={headCellSx}>Belum Selesai</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.monthlyBreakdown.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#64748b' }}>Belum ada data.</TableCell></TableRow>
                    ) : summary.monthlyBreakdown.map((row) => (
                      <TableRow key={row.period}>
                        <TableCell>{row.period}</TableCell>
                        <TableCell>{row.total}</TableCell>
                        <TableCell>{row.completed}</TableCell>
                        <TableCell>{row.unfinished}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.2, borderBottom: '1px solid #e2e8f0' }}>
              <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>
                {summary.type === 'monthly' ? 'Daftar Konseling Bulanan' : 'Daftar Konseling'}
              </Typography>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={headCellSx}>Tanggal</TableCell>
                    <TableCell sx={headCellSx}>Siswa</TableCell>
                    <TableCell sx={headCellSx}>Layanan</TableCell>
                    <TableCell sx={headCellSx}>Topik</TableCell>
                    <TableCell sx={headCellSx}>Status</TableCell>
                    <TableCell sx={headCellSx}>Hasil</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.items.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>Belum ada data konseling dalam periode ini.</TableCell></TableRow>
                  ) : summary.items.map((item, index) => (
                    <TableRow key={`${item.date}-${item.studentNis}-${index}`}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{item.studentName || item.studentNis}</Typography>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>{item.studentNis} {item.studentClass ? `| ${item.studentClass}` : ''}</Typography>
                      </TableCell>
                      <TableCell>{humanize(item.serviceType)}</TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>{item.topic}</TableCell>
                      <TableCell>{item.status === 'selesai' ? 'Selesai' : 'Belum Selesai'}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>{item.resultSummary || item.followUpPlan || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Stack>
  );
}

function MetricCard(props: { title: string; value: number }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(148, 163, 184, 0.18)', bgcolor: '#ffffff', p: 2 }}>
      <Typography sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 700, mb: 0.7 }}>{props.title}</Typography>
      <Typography sx={{ color: '#0f172a', fontSize: '1.9rem', lineHeight: 1, fontWeight: 900 }}>{props.value}</Typography>
    </Paper>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

const headCellSx = {
  fontWeight: 800,
  color: '#64748b',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: '0.73rem',
};
