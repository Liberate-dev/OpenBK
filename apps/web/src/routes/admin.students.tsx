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
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import LockResetIcon from '@mui/icons-material/LockReset';
import { apiClient } from '~lib/apiClient';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { requireAdminRole } from '~lib/adminGuards';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/admin/students')({
  beforeLoad: () => {
    requireAdminRole();
  },
  component: StudentAccountManagement,
});

interface StudentAccount {
  id: number;
  nis: string;
  messagesCount: number;
  status: 'active' | 'reset_required';
  canLogin: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  lastMessageAt: string | null;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

function StudentAccountManagement() {
  const { searchTerm, dateFilter } = useAdminLayoutFilters();
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentAccount | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient<StudentAccount[]>('/admin/students');
      setStudents(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat data siswa.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const haystack = `${student.nis} ${student.status} ${student.messagesCount}`.toLowerCase();
      const matchesSearch = query === '' || haystack.includes(query);
      const matchesDate = dateFilter === '' || (student.createdAt?.startsWith(dateFilter) ?? false);
      return matchesSearch && matchesDate;
    });
  }, [students, searchTerm, dateFilter]);

  const handleResetPassword = async () => {
    if (!selectedStudent) return;

    try {
      setResetting(true);
      setError('');
      const response = await apiClient<ResetPasswordResponse>(`/admin/students/${selectedStudent.id}/reset-password`, {
        method: 'POST',
      });

      setSuccess(response.message);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal mereset password siswa.'));
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <SchoolIcon sx={{ color: '#1c67f2' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Akun Siswa
          </Typography>
        </Stack>
        <Typography color="text.secondary">
          Semua siswa yang pernah signup akan tampil di sini. Password tidak ditampilkan.
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>NIS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status Akun</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Surat</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Terdaftar</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Surat Terakhir</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                    Tidak ada data siswa yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{student.nis}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={student.status === 'active' ? 'Aktif' : 'Perlu Signup Ulang'}
                        sx={{
                          bgcolor: student.status === 'active' ? '#dcfce7' : '#fee2e2',
                          color: student.status === 'active' ? '#166534' : '#991b1b',
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                    <TableCell>{student.messagesCount}</TableCell>
                    <TableCell>
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    <TableCell>
                      {student.lastMessageAt ? new Date(student.lastMessageAt).toLocaleString('id-ID') : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LockResetIcon />}
                        onClick={() => setSelectedStudent(student)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!selectedStudent} onClose={() => setSelectedStudent(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password Siswa</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Reset password untuk NIS <strong>{selectedStudent?.nis}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Setelah reset, siswa tidak bisa login sampai melakukan signup ulang. Data surat sebelumnya tetap aman.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedStudent(null)} color="inherit" disabled={resetting}>
            Batal
          </Button>
          <Button onClick={handleResetPassword} variant="contained" color="error" disabled={resetting}>
            {resetting ? 'Mereset...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
