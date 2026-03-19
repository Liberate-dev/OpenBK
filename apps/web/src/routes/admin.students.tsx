import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
  IconButton,
  Paper,
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
import SchoolIcon from '@mui/icons-material/School';
import LockResetIcon from '@mui/icons-material/LockReset';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import { apiClient } from '~lib/apiClient';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { requireAdminRole } from '~lib/adminGuards';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/admin/students')({
  beforeLoad: () => {
    requireAdminRole();
  },
  component: StudentManagementPage,
});

interface AllowedNis {
  id: number;
  nis: string;
  name: string | null;
  created_at: string;
}

interface StudentAccount {
  id: number;
  nis: string;
  messagesCount: number;
  status: 'active' | 'reset_required';
  canLogin: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  lastMessageAt: string | null;
  pendingResetRequestedAt: string | null;
}

interface ManagedStudentRow {
  key: string;
  nisId: number | null;
  accountId: number | null;
  nis: string;
  name: string | null;
  allowSignup: boolean;
  accountStatus: 'active' | 'reset_required' | 'not_registered';
  messagesCount: number;
  allowlistedAt: string | null;
  registeredAt: string | null;
  updatedAt: string | null;
  lastMessageAt: string | null;
  pendingResetRequestedAt: string | null;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

interface NisImportSummary {
  total_rows: number;
  imported: number;
  inserted: number;
  updated: number;
  skipped_empty_nis: number;
  skipped_invalid_nis: number;
  skipped_duplicate_in_file: number;
  ignored_columns: string[];
}

interface NisImportResponse {
  success: boolean;
  message: string;
  summary: NisImportSummary;
}

function StudentManagementPage() {
  const { searchTerm, dateFilter } = useAdminLayoutFilters();
  const [allowedNisList, setAllowedNisList] = useState<AllowedNis[]>([]);
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingNis, setEditingNis] = useState<AllowedNis | null>(null);
  const [formNis, setFormNis] = useState('');
  const [formName, setFormName] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [selectedStudent, setSelectedStudent] = useState<ManagedStudentRow | null>(null);
  const [resetting, setResetting] = useState(false);

  const [deletingStudent, setDeletingStudent] = useState<ManagedStudentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState<NisImportSummary | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [allowedNis, students] = await Promise.all([
        apiClient<AllowedNis[]>('/admin/nis'),
        apiClient<StudentAccount[]>('/admin/students'),
      ]);
      setAllowedNisList(allowedNis);
      setStudentAccounts(students);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat data kelola siswa.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const managedStudents = useMemo<ManagedStudentRow[]>(() => {
    const accountByNis = new Map(studentAccounts.map((student) => [student.nis, student]));
    const merged: ManagedStudentRow[] = allowedNisList.map((item) => {
      const account = accountByNis.get(item.nis);
      if (account) accountByNis.delete(item.nis);
      return {
        key: `nis-${item.id}`,
        nisId: item.id,
        accountId: account?.id ?? null,
        nis: item.nis,
        name: item.name,
        allowSignup: true,
        accountStatus: account?.status ?? 'not_registered',
        messagesCount: account?.messagesCount ?? 0,
        allowlistedAt: item.created_at,
        registeredAt: account?.createdAt ?? null,
        updatedAt: account?.updatedAt ?? null,
        lastMessageAt: account?.lastMessageAt ?? null,
        pendingResetRequestedAt: account?.pendingResetRequestedAt ?? null,
      };
    });

    accountByNis.forEach((account) => {
      merged.push({
        key: `acct-${account.id}`,
        nisId: null,
        accountId: account.id,
        nis: account.nis,
        name: null,
        allowSignup: false,
        accountStatus: account.status,
        messagesCount: account.messagesCount,
        allowlistedAt: null,
        registeredAt: account.createdAt,
        updatedAt: account.updatedAt,
        lastMessageAt: account.lastMessageAt,
        pendingResetRequestedAt: account.pendingResetRequestedAt,
      });
    });

    return merged.sort((left, right) => left.nis.localeCompare(right.nis, 'id-ID', { numeric: true }));
  }, [allowedNisList, studentAccounts]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return managedStudents.filter((student) => {
      const haystack = [student.nis, student.name ?? '', student.allowSignup ? 'boleh signup' : 'riwayat akun', student.accountStatus]
        .join(' ')
        .toLowerCase();
      const matchesSearch = query === '' || haystack.includes(query);
      const referenceDate = student.updatedAt ?? student.registeredAt ?? student.allowlistedAt ?? '';
      const matchesDate = dateFilter === '' || referenceDate.startsWith(dateFilter);
      return matchesSearch && matchesDate;
    });
  }, [managedStudents, searchTerm, dateFilter]);

  const stats = useMemo(() => ({
    total: managedStudents.length,
    allowlisted: managedStudents.filter((student) => student.allowSignup).length,
    registered: managedStudents.filter((student) => student.accountId !== null).length,
    pendingSignup: managedStudents.filter((student) => student.allowSignup && student.accountId === null).length,
    resetRequired: managedStudents.filter((student) => student.accountStatus === 'reset_required').length,
  }), [managedStudents]);

  const openFormDialog = (student?: ManagedStudentRow) => {
    if (student?.nisId) {
      const current = allowedNisList.find((item) => item.id === student.nisId) ?? null;
      setEditingNis(current);
      setFormNis(student.nis);
      setFormName(student.name ?? '');
    } else {
      setEditingNis(null);
      setFormNis(student?.nis ?? '');
      setFormName(student?.name ?? '');
    }
    setFormError('');
    setFormDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formNis.trim()) {
      setFormError('NIS tidak boleh kosong.');
      return;
    }

    try {
      setFormSaving(true);
      setFormError('');
      if (editingNis) {
        await apiClient(`/admin/nis/${editingNis.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nis: formNis.trim(), name: formName.trim() || null }),
        });
        setSuccess(`Data siswa ${formNis.trim()} berhasil diperbarui.`);
      } else {
        await apiClient('/admin/nis', {
          method: 'POST',
          body: JSON.stringify({ nis: formNis.trim(), name: formName.trim() || null }),
        });
        setSuccess(`NIS ${formNis.trim()} sekarang otomatis boleh signup.`);
      }
      setFormDialogOpen(false);
      setEditingNis(null);
      await fetchData();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Gagal menyimpan data siswa.'));
    } finally {
      setFormSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStudent?.accountId) return;
    try {
      setResetting(true);
      const response = await apiClient<ResetPasswordResponse>(`/admin/students/${selectedStudent.accountId}/reset-password`, {
        method: 'POST',
      });
      setSuccess(response.message);
      setSelectedStudent(null);
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal mereset password siswa.'));
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent?.nisId) return;
    try {
      setDeleting(true);
      await apiClient(`/admin/nis/${deletingStudent.nisId}`, { method: 'DELETE' });
      setSuccess(`Akses signup untuk NIS ${deletingStudent.nis} berhasil dihapus.`);
      setDeletingStudent(null);
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal menghapus data siswa.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      setImportError('Pilih file Excel atau CSV terlebih dahulu.');
      return;
    }
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      setImportLoading(true);
      setImportError('');
      setImportSummary(null);
      const response = await apiClient<NisImportResponse>('/admin/nis/import', {
        method: 'POST',
        body: formData,
      });
      setImportSummary(response.summary);
      setSuccess('Import data siswa selesai diproses.');
      await fetchData();
    } catch (err: unknown) {
      setImportError(getErrorMessage(err, 'Gagal melakukan import data siswa.'));
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #dbe5f4', overflow: 'hidden', background: 'linear-gradient(135deg, #f8fbff 0%, #eef5ff 52%, #ffffff 100%)', position: 'relative' }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.055) 1px, transparent 1px)', backgroundSize: '24px 24px', maskImage: 'linear-gradient(180deg, rgba(0,0,0,1), rgba(0,0,0,0.28))', pointerEvents: 'none' }} />
        <Stack spacing={3} sx={{ p: { xs: 3, md: 4 }, position: 'relative' }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" gap={2}>
            <Box sx={{ maxWidth: 820 }}>
              <Typography sx={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800, color: '#2563eb', mb: 1 }}>Student Operations Desk</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.2 }}>
                <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 34px rgba(37, 99, 235, 0.22)' }}>
                  <SchoolIcon />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>Kelola Siswa</Typography>
              </Stack>
              <Typography sx={{ color: '#475569', lineHeight: 1.8, maxWidth: 760 }}>
                Satu layar kerja untuk memasukkan NIS yang otomatis boleh signup, mengimpor data Excel atau CSV, memantau status akun siswa, dan menjalankan reset password tanpa pindah menu.
              </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.82)', border: '1px solid rgba(191, 219, 254, 0.72)', backdropFilter: 'blur(12px)', minWidth: { xs: '100%', lg: 320 } }}>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 0.75 }}>Aturan Operasional</Typography>
              <Typography sx={{ color: '#475569', lineHeight: 1.75, fontSize: '0.94rem' }}>
                Semua NIS yang masuk di halaman ini otomatis menjadi whitelist signup. Reset password hanya berlaku untuk siswa yang sudah punya akun.
              </Typography>
            </Paper>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5 }}>
            <MetricCard icon={<BadgeOutlinedIcon fontSize="small" />} label="Total Baris Kelola" value={stats.total} accent="#1d4ed8" tone="#eff6ff" />
            <MetricCard icon={<KeyOutlinedIcon fontSize="small" />} label="Boleh Signup" value={stats.allowlisted} accent="#2563eb" tone="#eff6ff" />
            <MetricCard icon={<SchoolIcon fontSize="small" />} label="Sudah Punya Akun" value={stats.registered} accent="#15803d" tone="#f0fdf4" />
            <MetricCard icon={<PersonAddAlt1Icon fontSize="small" />} label="Menunggu Signup" value={stats.pendingSignup} accent="#a16207" tone="#fefce8" />
            <MetricCard icon={<LockResetIcon fontSize="small" />} label="Perlu Reset" value={stats.resetRequired} accent="#b91c1c" tone="#fef2f2" />
          </Box>
        </Stack>
      </Paper>

      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #d9e2ef', borderRadius: 4, overflow: 'hidden', background: '#ffffff', boxShadow: '0 18px 40px rgba(15, 23, 42, 0.05)' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', lg: 'center' }} gap={1.5} sx={{ px: { xs: 2, md: 3 }, py: 2.4, borderBottom: '1px solid #e2e8f0' }}>
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.08rem', mb: 0.35 }}>Direktori Akses dan Akun Siswa</Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.92rem' }}>Tambah atau edit NIS, beri akses signup, lalu reset akun bila diperlukan.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ width: { xs: '100%', lg: 'auto' } }}>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => { setImportDialogOpen(true); setImportFile(null); setImportError(''); setImportSummary(null); }} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 2, borderColor: '#bfdbfe', color: '#2563eb', '&:hover': { borderColor: '#93c5fd', bgcolor: '#eff6ff' } }}>
              Import Excel / CSV
            </Button>
            <Button variant="contained" startIcon={<PersonAddAlt1Icon />} onClick={() => openFormDialog()} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 2.2, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
              Tambah Siswa
            </Button>
          </Stack>
        </Stack>

        <TableContainer>
          <Table sx={{ minWidth: 1080 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={headCellSx}>Siswa</TableCell>
                <TableCell sx={headCellSx}>Akses Signup</TableCell>
                <TableCell sx={headCellSx}>Status Akun</TableCell>
                <TableCell sx={headCellSx}>Pembaharuan</TableCell>
                <TableCell align="right" sx={headCellSx}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: '#64748b' }}>Tidak ada data siswa yang sesuai filter.</TableCell>
                </TableRow>
              ) : filteredStudents.map((student) => {
                const signupStatus = signupMeta(student.allowSignup);
                const accountStatus = accountMeta(student.accountStatus);
                return (
                  <TableRow key={student.key} hover sx={{ '&:last-child td': { borderBottom: 'none' }, '&:hover': { bgcolor: '#fbfdff' } }}>
                    <TableCell sx={{ py: 2.1 }}>
                      <Stack spacing={0.45}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.3, py: 0.65, borderRadius: 999, bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.04em' }}>{student.nis}</Box>
                          {!student.allowSignup && <Chip size="small" label="Riwayat akun" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }} />}
                        </Stack>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{student.name || 'Nama belum diisi'}</Typography>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>{student.allowSignup ? `Masuk whitelist ${formatDate(student.allowlistedAt)}` : 'Akun terdeteksi tanpa entri whitelist aktif'}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell><Chip size="small" label={signupStatus.label} sx={{ bgcolor: signupStatus.bg, color: signupStatus.color, fontWeight: 700, borderRadius: 999 }} /></TableCell>
                    <TableCell>
                      <Stack spacing={0.7} alignItems="flex-start">
                        <Chip size="small" label={accountStatus.label} sx={{ bgcolor: accountStatus.bg, color: accountStatus.color, fontWeight: 700, borderRadius: 999 }} />
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>{student.registeredAt ? `Akun dibuat ${formatDate(student.registeredAt)}` : 'Belum ada akun siswa'}</Typography>
                        {student.pendingResetRequestedAt && (
                          <Chip
                            size="small"
                            label={`Request reset masuk ${formatDate(student.pendingResetRequestedAt)}`}
                            sx={{ bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 700, borderRadius: 999 }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 2.1 }}>
                      <Typography sx={{ color: '#475569', fontWeight: 600 }}>{formatDate(student.updatedAt ?? student.registeredAt ?? student.allowlistedAt)}</Typography>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>{student.updatedAt ? 'Aktivitas akun terbaru' : student.allowlistedAt ? 'Tanggal entri whitelist' : 'Belum ada pembaruan'}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2.1 }}>
                      <Stack direction="row" justifyContent="flex-end" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} onClick={() => openFormDialog(student)} sx={outlineButtonSx}>
                          {student.allowSignup ? 'Edit' : 'Izinkan Signup'}
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<LockResetIcon />} disabled={!student.accountId} onClick={() => setSelectedStudent(student)} sx={{ ...outlineButtonSx, borderColor: '#fecaca', color: '#b91c1c', '&:hover': { borderColor: '#fca5a5', bgcolor: '#fef2f2' } }}>
                          Reset
                        </Button>
                        <IconButton size="small" disabled={!student.nisId} onClick={() => setDeletingStudent(student)} sx={{ border: '1px solid #fee2e2', borderRadius: 999, color: '#b91c1c', '&:hover': { bgcolor: '#fef2f2' } }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingNis ? 'Edit Data Siswa' : 'Tambah Siswa ke Whitelist'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2.4} sx={{ mt: 1 }}>
            <Alert severity="info">NIS yang disimpan di sini langsung boleh dipakai untuk signup siswa.</Alert>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField label="Nomor Induk Siswa (NIS)" value={formNis} onChange={(event) => setFormNis(event.target.value)} fullWidth required />
            <TextField label="Nama Siswa" value={formName} onChange={(event) => setFormName(event.target.value)} fullWidth helperText="Opsional, tapi membantu admin saat mencari data." />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFormDialogOpen(false)} color="inherit">Batal</Button>
          <Button onClick={handleSave} variant="contained" disabled={formSaving} sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
            {formSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedStudent} onClose={() => setSelectedStudent(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Reset Password Siswa</DialogTitle>
        <DialogContent>
          <Stack spacing={1.4} sx={{ mt: 1 }}>
            <Typography>Reset password untuk NIS <strong>{selectedStudent?.nis}</strong>?</Typography>
            <Typography color="text.secondary">Setelah reset, siswa harus signup ulang. Entri NIS di halaman ini tetap aman sehingga siswa bisa mendaftar kembali.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedStudent(null)} color="inherit" disabled={resetting}>Batal</Button>
          <Button onClick={handleResetPassword} variant="contained" color="error" disabled={resetting}>{resetting ? 'Mereset...' : 'Reset Password'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deletingStudent} onClose={() => setDeletingStudent(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#b91c1c' }}>Hapus Akses Signup</DialogTitle>
        <DialogContent>
          <Stack spacing={1.4} sx={{ mt: 1 }}>
            <Typography>Hapus NIS <strong>{deletingStudent?.nis}</strong> dari daftar signup?</Typography>
            <Typography color="text.secondary">Tindakan ini mencabut izin signup baru, tetapi tidak menghapus akun siswa yang sudah pernah dibuat.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeletingStudent(null)} color="inherit" disabled={deleting}>Batal</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>{deleting ? 'Menghapus...' : 'Hapus'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importDialogOpen} onClose={() => (!importLoading ? setImportDialogOpen(false) : undefined)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Import Siswa dari Excel / CSV</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2.4} sx={{ mt: 1 }}>
            <Alert severity="info">Header yang dibaca adalah <strong>NIS</strong> dan <strong>Nama Siswa</strong>. Semua NIS hasil import otomatis masuk whitelist signup.</Alert>
            {importError && <Alert severity="error">{importError}</Alert>}
            {importSummary && (
              <Alert severity="success">
                Import selesai: {importSummary.imported} baris diproses ({importSummary.inserted} ditambah, {importSummary.updated} diperbarui).
                <br />
                Diskip: kosong {importSummary.skipped_empty_nis}, tidak valid {importSummary.skipped_invalid_nis}, duplikat file {importSummary.skipped_duplicate_in_file}.
                {importSummary.ignored_columns.length > 0 && (
                  <>
                    <br />
                    Kolom diabaikan: {importSummary.ignored_columns.join(', ')}
                  </>
                )}
              </Alert>
            )}
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} sx={{ width: 'fit-content', textTransform: 'none', fontWeight: 700 }}>
              Pilih File
              <input hidden type="file" accept=".csv,.xlsx,.txt" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} />
            </Button>
            {importFile && <Typography sx={{ color: '#475569' }}>File dipilih: <strong>{importFile.name}</strong></Typography>}
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setImportDialogOpen(false)} color="inherit" disabled={importLoading}>Batal</Button>
          <Button onClick={handleImportSubmit} variant="contained" disabled={importLoading || !importFile} sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
            {importLoading ? 'Mengimpor...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function MetricCard(props: { icon: ReactNode; label: string; value: number; accent: string; tone: string }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(148, 163, 184, 0.18)', bgcolor: '#ffffff', p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 700, mb: 0.7 }}>{props.label}</Typography>
          <Typography sx={{ color: '#0f172a', fontSize: '1.9rem', lineHeight: 1, fontWeight: 900 }}>{props.value}</Typography>
        </Box>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: props.tone, color: props.accent }}>
          {props.icon}
        </Box>
      </Stack>
    </Paper>
  );
}

function signupMeta(allowSignup: boolean) {
  return allowSignup
    ? { label: 'Boleh Signup', bg: '#dbeafe', color: '#1d4ed8' }
    : { label: 'Belum Diizinkan', bg: '#e5e7eb', color: '#475569' };
}

function accountMeta(status: ManagedStudentRow['accountStatus']) {
  if (status === 'active') return { label: 'Aktif', bg: '#dcfce7', color: '#166534' };
  if (status === 'reset_required') return { label: 'Perlu Signup Ulang', bg: '#fee2e2', color: '#991b1b' };
  return { label: 'Belum Signup', bg: '#fef3c7', color: '#a16207' };
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const headCellSx = {
  fontWeight: 800,
  color: '#64748b',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: '0.73rem',
};

const outlineButtonSx = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 999,
  px: 1.6,
  borderColor: '#bfdbfe',
  color: '#2563eb',
  '&:hover': { borderColor: '#93c5fd', bgcolor: '#eff6ff' },
};
