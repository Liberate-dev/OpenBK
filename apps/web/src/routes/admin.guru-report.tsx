import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Alert, Box, Button, Paper, Stack, TextField, Typography,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SendIcon from '@mui/icons-material/Send';
import { apiClient } from '~lib/apiClient';
import { getErrorMessage } from '~lib/error';
import { requireGuruRole } from '~lib/adminGuards';

export const Route = createFileRoute('/admin/guru-report')({
  beforeLoad: () => {
    requireGuruRole();
  },
  component: GuruReportPage,
});

interface ReportResponse {
  success: boolean;
  referenceId: string;
  message: string;
}

function GuruReportPage() {
  const [form, setForm] = useState({
    studentName: '',
    studentClass: '',
    studentNis: '',
    summary: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await apiClient<ReportResponse>('/admin/guru/reports', {
        method: 'POST',
        body: JSON.stringify({
          student_name: form.studentName,
          student_class: form.studentClass || null,
          student_nis: form.studentNis || null,
          summary: form.summary,
          message: form.message,
        }),
      });

      setSuccess(`Laporan berhasil dikirim! Referensi: ${result.referenceId}`);
      setForm({ studentName: '', studentClass: '', studentNis: '', summary: '', message: '' });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal mengirim laporan.'));
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.studentName.length >= 3 && form.summary.length >= 5 && form.message.length >= 20;

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ReportProblemIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Lapor Kasus Siswa
          </Typography>
        </Stack>
        <Typography sx={{ color: '#64748b', ml: 7 }}>
          Isi form di bawah untuk melaporkan kasus siswa yang perlu ditangani Guru BK.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 }, borderRadius: 3,
          border: '1px solid #e2e8f0', bgcolor: 'white',
        }}
      >
        <Stack spacing={3}>
          {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          <TextField
            label="Nama Siswa"
            value={form.studentName}
            onChange={(e) => setForm(prev => ({ ...prev, studentName: e.target.value }))}
            fullWidth
            required
            helperText="Minimal 3 karakter"
          />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Kelas"
              value={form.studentClass}
              onChange={(e) => setForm(prev => ({ ...prev, studentClass: e.target.value }))}
              fullWidth
            />
            <TextField
              label="NIS Siswa (opsional)"
              value={form.studentNis}
              onChange={(e) => setForm(prev => ({
                ...prev,
                studentNis: e.target.value.replace(/\D/g, '').slice(0, 30),
              }))}
              fullWidth
            />
          </Stack>

          <TextField
            label="Ringkasan Kasus"
            value={form.summary}
            onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
            fullWidth
            required
            helperText="Minimal 5 karakter, maks 150"
            inputProps={{ maxLength: 150 }}
          />

          <TextField
            label="Detail Laporan"
            value={form.message}
            onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
            multiline
            minRows={8}
            fullWidth
            required
            helperText="Jelaskan kondisi siswa, konteks kejadian, dan alasan perlu ditindaklanjuti oleh Guru BK. Minimal 20 karakter."
          />

          <Button
            variant="contained"
            startIcon={<SendIcon />}
            disabled={loading || !isValid}
            onClick={handleSubmit}
            sx={{
              alignSelf: 'flex-start', fontWeight: 700, px: 4, py: 1.2,
              bgcolor: '#f59e0b', color: '#fff',
              '&:hover': { bgcolor: '#d97706' },
              borderRadius: 2,
            }}
          >
            {loading ? 'Mengirim...' : 'Kirim Laporan'}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
