import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Stack, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, CircularProgress, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { apiClient } from '~lib/apiClient';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { requireAdminRole } from '~lib/adminGuards';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/admin/nis')({
  beforeLoad: () => {
    requireAdminRole();
  },
  component: NisManagement,
});

interface AllowedNis {
  id: number;
  nis: string;
  name: string | null;
  created_at: string;
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

function NisManagement() {
  const { searchTerm, dateFilter } = useAdminLayoutFilters();
  const [nisList, setNisList] = useState<AllowedNis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNis, setEditingNis] = useState<AllowedNis | null>(null);

  const [formNis, setFormNis] = useState('');
  const [formName, setFormName] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState<NisImportSummary | null>(null);

  const fetchNisList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient<AllowedNis[]>('/admin/nis');
      setNisList(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat data NIS'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNisList();
  }, [fetchNisList]);

  const filteredNisList = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return nisList.filter((item) => {
      const haystack = `${item.nis} ${item.name || ''}`.toLowerCase();
      const matchesSearch = query === '' || haystack.includes(query);
      const matchesDate = dateFilter === '' || item.created_at.startsWith(dateFilter);
      return matchesSearch && matchesDate;
    });
  }, [nisList, searchTerm, dateFilter]);

  const handleOpenDialog = (nis?: AllowedNis) => {
    if (nis) {
      setEditingNis(nis);
      setFormNis(nis.nis);
      setFormName(nis.name || '');
    } else {
      setEditingNis(null);
      setFormNis('');
      setFormName('');
    }
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formNis.trim()) {
      setFormError('NIS tidak boleh kosong');
      return;
    }

    setFormSaving(true);
    setFormError('');

    try {
      if (editingNis) {
        await apiClient(`/admin/nis/${editingNis.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nis: formNis, name: formName })
        });
      } else {
        await apiClient('/admin/nis', {
          method: 'POST',
          body: JSON.stringify({ nis: formNis, name: formName })
        });
      }
      setDialogOpen(false);
      fetchNisList();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Gagal menyimpan data NIS'));
    } finally {
      setFormSaving(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
    setImportError('');
    setImportSummary(null);
    setImportFile(null);
  };

  const handleCloseImportDialog = () => {
    if (importLoading) return;
    setImportDialogOpen(false);
    setImportError('');
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImportFile(file);
    setImportError('');
    setImportSummary(null);
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      setImportError('Pilih file Excel/CSV terlebih dahulu.');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    setImportLoading(true);
    setImportError('');
    setImportSummary(null);

    try {
      const response = await apiClient<NisImportResponse>('/admin/nis/import', {
        method: 'POST',
        body: formData,
      });

      setImportSummary(response.summary);
      fetchNisList();
    } catch (err: unknown) {
      setImportError(getErrorMessage(err, 'Gagal melakukan import NIS.'));
    } finally {
      setImportLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiClient(`/admin/nis/${deletingId}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      fetchNisList();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Gagal menghapus NIS'));
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
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
          Kelola NIS
        </Typography>
        <Typography color="text.secondary">
          Atur daftar NIS siswa yang diizinkan untuk login ke sistem Open BK.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AdminPanelSettingsIcon sx={{ color: '#64748b' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              Daftar NIS Diizinkan
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={handleOpenImportDialog}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Import Excel / CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Tambah NIS
            </Button>
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>NIS</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Nama Siswa</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Tgl Ditambahkan</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#475569' }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredNisList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#64748b' }}>
                    Tidak ada data NIS yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredNisList.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{item.nis}</TableCell>
                    <TableCell sx={{ color: '#475569' }}>{item.name || '-'}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(item)} sx={{ color: '#3b82f6' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => confirmDelete(item.id)} sx={{ color: '#ef4444' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog Add/Edit */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingNis ? 'Edit NIS' : 'Tambah NIS Baru'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Nomor Induk Siswa (NIS)"
              value={formNis}
              onChange={(e) => setFormNis(e.target.value)}
              fullWidth
              required
              helperText="Masukkan NIS yang valid"
            />
            <TextField
              label="Nama Siswa (Opsional)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              fullWidth
              helperText="Misal: Budi Santoso"
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Batal</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={formSaving}
            sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
          >
            {formSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Import */}
      <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Import NIS dari Excel / CSV</DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Alert severity="info">
              File wajib memiliki header <strong>NIS</strong> dan <strong>Nama Siswa</strong>. Jika ada kolom lain, sistem akan
              otomatis mengabaikannya.
            </Alert>

            {importError && <Alert severity="error">{importError}</Alert>}

            {importSummary && (
              <Alert severity="success">
                Import selesai: {importSummary.imported} data diproses ({importSummary.inserted} ditambah, {importSummary.updated} diperbarui).
                <br />
                Baris diskip: kosong NIS {importSummary.skipped_empty_nis}, NIS tidak valid {importSummary.skipped_invalid_nis}, duplikat dalam file {importSummary.skipped_duplicate_in_file}.
                {importSummary.ignored_columns.length > 0 && (
                  <>
                    <br />
                    Kolom yang diabaikan: {importSummary.ignored_columns.join(', ')}
                  </>
                )}
              </Alert>
            )}

            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              sx={{ width: 'fit-content', textTransform: 'none', fontWeight: 600 }}
            >
              Pilih File
              <input
                hidden
                type="file"
                accept=".csv,.xlsx,.txt"
                onChange={handleImportFileChange}
              />
            </Button>

            {importFile && (
              <Typography variant="body2" color="text.secondary">
                File dipilih: <strong>{importFile.name}</strong>
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseImportDialog} color="inherit" disabled={importLoading}>
            Batal
          </Button>
          <Button
            onClick={handleImportSubmit}
            variant="contained"
            disabled={importLoading || !importFile}
            sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
          >
            {importLoading ? 'Mengimpor...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Delete */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          Apakah Anda yakin ingin menghapus NIS ini secara permanen dari daftar izin?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Batal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
