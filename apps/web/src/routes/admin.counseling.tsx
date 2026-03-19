import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
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
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { apiClient } from '~lib/apiClient';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { requireGuruBkRole } from '~lib/adminGuards';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/admin/counseling')({
  beforeLoad: () => {
    requireGuruBkRole();
  },
  component: CounselingPage,
});

interface CounselingRecord {
  id: number;
  studentId: number;
  studentNis: string | null;
  studentName: string | null;
  studentClass: string | null;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  serviceType: string;
  medium: string;
  location: string | null;
  topic: string;
  objective: string;
  assessment: string | null;
  intervention: string;
  resultSummary: string | null;
  followUpPlan: string | null;
  status: 'selesai' | 'belum_selesai';
  nextFollowUpDate: string | null;
  creatorName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface StudentOption {
  id: number;
  nis: string;
  name: string | null;
  className: string | null;
}

const serviceTypes = [
  { value: 'individu', label: 'Individu' },
  { value: 'kelompok', label: 'Kelompok' },
  { value: 'konsultasi', label: 'Konsultasi' },
  { value: 'mediasi', label: 'Mediasi' },
  { value: 'home_visit', label: 'Home Visit' },
  { value: 'case_conference', label: 'Case Conference' },
];

const mediaTypes = [
  { value: 'tatap_muka', label: 'Tatap Muka' },
  { value: 'telepon', label: 'Telepon' },
  { value: 'chat', label: 'Chat' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'rujukan', label: 'Rujukan' },
];

function CounselingPage() {
  const { searchTerm, dateFilter } = useAdminLayoutFilters();
  const [records, setRecords] = useState<CounselingRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CounselingRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<CounselingRecord | null>(null);
  const [form, setForm] = useState({
    allowed_nis_id: '',
    session_date: '',
    start_time: '',
    end_time: '',
    service_type: 'individu',
    medium: 'tatap_muka',
    location: '',
    topic: '',
    objective: '',
    assessment: '',
    intervention: '',
    result_summary: '',
    follow_up_plan: '',
    status: 'belum_selesai',
    next_follow_up_date: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [recordData, studentData] = await Promise.all([
        apiClient<CounselingRecord[]>('/admin/counseling-records'),
        apiClient<Array<{ id: number; nis: string; name: string | null; className: string | null }>>('/admin/student-profiles'),
      ]);
      setRecords(recordData);
      setStudents(studentData);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat pencatatan konseling.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      const haystack = [
        record.studentNis ?? '',
        record.studentName ?? '',
        record.studentClass ?? '',
        record.topic,
        record.serviceType,
        record.status,
      ].join(' ').toLowerCase();
      const matchesSearch = query === '' || haystack.includes(query);
      const matchesDate = dateFilter === '' || record.sessionDate.startsWith(dateFilter);
      return matchesSearch && matchesDate;
    });
  }, [records, searchTerm, dateFilter]);

  const stats = useMemo(() => ({
    total: records.length,
    finished: records.filter((record) => record.status === 'selesai').length,
    unfinished: records.filter((record) => record.status === 'belum_selesai').length,
    thisMonth: records.filter((record) => record.sessionDate.startsWith(new Date().toISOString().slice(0, 7))).length,
  }), [records]);

  const openCreate = () => {
    setEditingRecord(null);
    setForm({
      allowed_nis_id: '',
      session_date: '',
      start_time: '',
      end_time: '',
      service_type: 'individu',
      medium: 'tatap_muka',
      location: '',
      topic: '',
      objective: '',
      assessment: '',
      intervention: '',
      result_summary: '',
      follow_up_plan: '',
      status: 'belum_selesai',
      next_follow_up_date: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (record: CounselingRecord) => {
    setEditingRecord(record);
    setForm({
      allowed_nis_id: String(record.studentId),
      session_date: record.sessionDate,
      start_time: record.startTime ?? '',
      end_time: record.endTime ?? '',
      service_type: record.serviceType,
      medium: record.medium,
      location: record.location ?? '',
      topic: record.topic,
      objective: record.objective,
      assessment: record.assessment ?? '',
      intervention: record.intervention,
      result_summary: record.resultSummary ?? '',
      follow_up_plan: record.followUpPlan ?? '',
      status: record.status,
      next_follow_up_date: record.nextFollowUpDate ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const payload = {
        allowed_nis_id: Number(form.allowed_nis_id),
        session_date: form.session_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        service_type: form.service_type,
        medium: form.medium,
        location: form.location || null,
        topic: form.topic,
        objective: form.objective,
        assessment: form.assessment || null,
        intervention: form.intervention,
        result_summary: form.result_summary || null,
        follow_up_plan: form.follow_up_plan || null,
        status: form.status,
        next_follow_up_date: form.next_follow_up_date || null,
      };

      if (editingRecord) {
        await apiClient(`/admin/counseling-records/${editingRecord.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess('Catatan konseling berhasil diperbarui.');
      } else {
        await apiClient('/admin/counseling-records', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess('Catatan konseling berhasil ditambahkan.');
      }

      setDialogOpen(false);
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal menyimpan catatan konseling.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiClient(`/admin/counseling-records/${deleteTarget.id}`, { method: 'DELETE' });
      setSuccess('Catatan konseling berhasil dihapus.');
      setDeleteTarget(null);
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal menghapus catatan konseling.'));
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #dbe5f4', p: { xs: 3, md: 4 }, background: 'linear-gradient(135deg, #f8fbff 0%, #eef5ff 52%, #ffffff 100%)' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2}>
          <Box sx={{ maxWidth: 780 }}>
            <Typography sx={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800, color: '#2563eb', mb: 1 }}>
              Counseling Ledger
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.2 }}>
              <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 34px rgba(37, 99, 235, 0.22)' }}>
                <AssignmentTurnedInIcon />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                Pencatatan Konseling
              </Typography>
            </Stack>
            <Typography sx={{ color: '#475569', lineHeight: 1.8 }}>
              Form lengkap untuk merekam sesi konseling, tindak lanjut, dan status penyelesaian tiap siswa secara terstruktur.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ alignSelf: 'flex-start', bgcolor: '#0f172a', textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 2.5 }}>
            Tambah Catatan
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
        <MetricCard title="Total Catatan" value={stats.total} />
        <MetricCard title="Selesai" value={stats.finished} />
        <MetricCard title="Belum Selesai" value={stats.unfinished} />
        <MetricCard title="Bulan Ini" value={stats.thisMonth} />
      </Box>

      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #d9e2ef', borderRadius: 4, overflow: 'hidden', background: '#ffffff' }}>
        <TableContainer>
          <Table sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={headCellSx}>Tanggal</TableCell>
                <TableCell sx={headCellSx}>Siswa</TableCell>
                <TableCell sx={headCellSx}>Layanan</TableCell>
                <TableCell sx={headCellSx}>Topik</TableCell>
                <TableCell sx={headCellSx}>Status</TableCell>
                <TableCell sx={headCellSx}>Tindak Lanjut</TableCell>
                <TableCell align="right" sx={headCellSx}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: '#64748b' }}>Belum ada catatan konseling yang sesuai filter.</TableCell>
                </TableRow>
              ) : filteredRecords.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{formatDate(record.sessionDate)}</TableCell>
                  <TableCell>
                    <Stack spacing={0.4}>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{record.studentName || record.studentNis}</Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>{record.studentNis} {record.studentClass ? `| ${record.studentClass}` : ''}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography sx={{ fontWeight: 600 }}>{humanize(record.serviceType)}</Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>{humanize(record.medium)}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: '#475569', maxWidth: 240 }}>{record.topic}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={record.status === 'selesai' ? 'Selesai' : 'Belum Selesai'}
                      sx={{ bgcolor: record.status === 'selesai' ? '#dcfce7' : '#fef3c7', color: record.status === 'selesai' ? '#166534' : '#a16207', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#475569', maxWidth: 260 }}>{record.followUpPlan || '-'}</TableCell>
                  <TableCell align="right">
                    <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(record)} sx={actionButtonSx}>Edit</Button>
                    <IconButton size="small" onClick={() => setDeleteTarget(record)} sx={{ ml: 1, border: '1px solid #fee2e2', color: '#b91c1c', '&:hover': { bgcolor: '#fef2f2' } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>{editingRecord ? 'Edit Catatan Konseling' : 'Tambah Catatan Konseling'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2.2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Siswa</InputLabel>
              <Select value={form.allowed_nis_id} label="Siswa" onChange={(event) => setForm((prev) => ({ ...prev, allowed_nis_id: event.target.value }))}>
                {students.map((student) => (
                  <MenuItem key={student.id} value={String(student.id)}>
                    {student.nis} - {student.name || 'Tanpa Nama'}{student.className ? ` (${student.className})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Tanggal Sesi" type="date" InputLabelProps={{ shrink: true }} value={form.session_date} onChange={(event) => setForm((prev) => ({ ...prev, session_date: event.target.value }))} fullWidth />
              <TextField label="Jam Mulai" type="time" InputLabelProps={{ shrink: true }} value={form.start_time} onChange={(event) => setForm((prev) => ({ ...prev, start_time: event.target.value }))} fullWidth />
              <TextField label="Jam Selesai" type="time" InputLabelProps={{ shrink: true }} value={form.end_time} onChange={(event) => setForm((prev) => ({ ...prev, end_time: event.target.value }))} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Jenis Layanan</InputLabel>
                <Select value={form.service_type} label="Jenis Layanan" onChange={(event) => setForm((prev) => ({ ...prev, service_type: event.target.value }))}>
                  {serviceTypes.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Media</InputLabel>
                <Select value={form.medium} label="Media" onChange={(event) => setForm((prev) => ({ ...prev, medium: event.target.value }))}>
                  {mediaTypes.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
                  <MenuItem value="selesai">Selesai</MenuItem>
                  <MenuItem value="belum_selesai">Belum Selesai</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Lokasi" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} fullWidth />
            <TextField label="Topik Permasalahan" value={form.topic} onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))} fullWidth />
            <TextField label="Tujuan Konseling" value={form.objective} onChange={(event) => setForm((prev) => ({ ...prev, objective: event.target.value }))} fullWidth multiline minRows={2} />
            <TextField label="Asesmen / Kondisi Awal" value={form.assessment} onChange={(event) => setForm((prev) => ({ ...prev, assessment: event.target.value }))} fullWidth multiline minRows={2} />
            <TextField label="Intervensi / Langkah Konseling" value={form.intervention} onChange={(event) => setForm((prev) => ({ ...prev, intervention: event.target.value }))} fullWidth multiline minRows={3} />
            <TextField label="Hasil Sementara / Akhir" value={form.result_summary} onChange={(event) => setForm((prev) => ({ ...prev, result_summary: event.target.value }))} fullWidth multiline minRows={2} />
            <TextField label="Rencana Tindak Lanjut" value={form.follow_up_plan} onChange={(event) => setForm((prev) => ({ ...prev, follow_up_plan: event.target.value }))} fullWidth multiline minRows={2} />
            <TextField label="Tanggal Follow Up Berikutnya" type="date" InputLabelProps={{ shrink: true }} value={form.next_follow_up_date} onChange={(event) => setForm((prev) => ({ ...prev, next_follow_up_date: event.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Batal</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.allowed_nis_id || !form.session_date || !form.topic || !form.objective || !form.intervention} sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Hapus Catatan Konseling</DialogTitle>
        <DialogContent>
          <Typography>Hapus catatan untuk <strong>{deleteTarget?.studentName || deleteTarget?.studentNis}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Batal</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Hapus</Button>
        </DialogActions>
      </Dialog>
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

function humanize(value: string | null) {
  return (value || '-').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const headCellSx = {
  fontWeight: 800,
  color: '#64748b',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: '0.73rem',
};

const actionButtonSx = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 999,
  borderColor: '#bfdbfe',
  color: '#2563eb',
  '&:hover': { borderColor: '#93c5fd', bgcolor: '#eff6ff' },
};
