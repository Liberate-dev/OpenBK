import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Stack, TextField, Typography, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import { apiClient } from '~lib/apiClient';
import { getErrorMessage } from '~lib/error';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { adminAuthService } from '~lib/adminAuth';

export const Route = createFileRoute('/admin/repository')({
  beforeLoad: () => {
    const session = adminAuthService.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }
    // guru_bk can manage; guru can read-only (public items)
    if (session.role !== 'guru_bk' && session.role !== 'guru') {
      throw new Error('Unauthorized');
    }
  },
  component: RepositoryPage,
});

interface RepositoryItem {
  id: number;
  title: string;
  category: 'repository';
  summary: string;
  content: string;
  linkUrl: string | null;
  visibility: 'private' | 'public';
  fileName: string | null;
  fileSize: number | null;
  hasFile: boolean;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RepositoryPage() {
  const session = adminAuthService.getSession();
  const isGuruBK = session?.role === 'guru_bk';
  const { searchTerm, dateFilter } = useAdminLayoutFilters();
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RepositoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<RepositoryItem | null>(null);
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    linkUrl: '',
    visibility: 'private' as 'private' | 'public',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = isGuruBK ? '/admin/repository' : '/admin/guru/repository';
      const data = await apiClient<RepositoryItem[]>(endpoint);
      setItems(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat repository.'));
    } finally {
      setLoading(false);
    }
  }, [isGuruBK]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.content} ${item.createdBy}`.toLowerCase();
      const matchesSearch = query === '' || haystack.includes(query);
      const matchesDate = dateFilter === '' || (item.createdAt?.startsWith(dateFilter) ?? false);
      return matchesSearch && matchesDate;
    });
  }, [items, searchTerm, dateFilter]);

  const resetForm = () => {
    setForm({ title: '', summary: '', content: '', linkUrl: '', visibility: 'private' });
    setEditingItem(null);
    setSelectedFile(null);
    setRemoveFile(false);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (item: RepositoryItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      summary: item.summary,
      content: item.content,
      linkUrl: item.linkUrl || '',
      visibility: item.visibility || 'private',
    });
    setSelectedFile(null);
    setRemoveFile(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', 'repository');
      formData.append('summary', form.summary);
      formData.append('content', form.content);
      formData.append('visibility', form.visibility);
      if (form.linkUrl) formData.append('link_url', form.linkUrl);
      if (selectedFile) formData.append('file', selectedFile);
      if (removeFile) formData.append('remove_file', '1');

      if (editingItem) {
        formData.append('_method', 'PUT');
        await apiClient(`/admin/repository/${editingItem.id}`, {
          method: 'POST',
          body: formData,
        });
        setSuccess('Repository berhasil diperbarui.');
      } else {
        await apiClient('/admin/repository', {
          method: 'POST',
          body: formData,
        });
        setSuccess('Item repository berhasil ditambahkan.');
      }

      setDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal menyimpan item repository.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient(`/admin/repository/${deleteTarget.id}`, { method: 'DELETE' });
      setSuccess(`Item "${deleteTarget.title}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchItems();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal menghapus item repository.'));
      setDeleteTarget(null);
    }
  };

  const handleDownload = (item: RepositoryItem) => {
    const baseUrl = import.meta.env.DEV ? 'http://localhost:8000' : '';
    const endpoint = isGuruBK ? `/api/v1/admin/repository/${item.id}/download` : `/api/v1/student/repository/${item.id}/download`;
    const token = adminAuthService.getSession()?.token || '';
    window.open(`${baseUrl}${endpoint}?token=${token}`, '_blank');
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
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <LibraryBooksIcon sx={{ color: '#1c67f2' }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Repository
            </Typography>
          </Stack>
          <Typography color="text.secondary">
            {isGuruBK
              ? 'Kelola teknik, modul, artikel, dan file panduan layanan BK.'
              : 'Akses materi dan dokumen dari Guru BK.'}
          </Typography>
        </Box>
        {isGuruBK && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ bgcolor: '#1c67f2', fontWeight: 700 }}>
            Tambah Item
          </Button>
        )}
      </Stack>

      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        {filteredItems.length === 0 ? (
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">Belum ada item repository yang sesuai filter.</Typography>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {item.title}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8 }} flexWrap="wrap" useFlexGap>
                        <Chip label="Repository" size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />
                        <Chip
                          icon={item.visibility === 'public' ? <VisibilityIcon sx={{ fontSize: 14 }} /> : <VisibilityOffIcon sx={{ fontSize: 14 }} />}
                          label={item.visibility === 'public' ? 'Public' : 'Private'}
                          size="small"
                          sx={{
                            bgcolor: item.visibility === 'public' ? '#dcfce7' : '#fef3c7',
                            color: item.visibility === 'public' ? '#166534' : '#92400e',
                            fontWeight: 700,
                          }}
                        />
                        {item.hasFile && (
                          <Chip
                            icon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                            label={item.fileName || 'File'}
                            size="small"
                            sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, maxWidth: 180 }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Oleh {item.createdBy}
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      {item.hasFile && (
                        <IconButton size="small" onClick={() => handleDownload(item)} title="Download file">
                          <DownloadIcon fontSize="small" sx={{ color: '#2563eb' }} />
                        </IconButton>
                      )}
                      {isGuruBK && (
                        <>
                          <IconButton size="small" onClick={() => openEdit(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </Stack>

                  <Typography sx={{ color: '#334155', fontWeight: 600 }}>
                    {item.summary}
                  </Typography>
                  <Typography sx={{ color: '#475569', whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </Typography>

                  {item.linkUrl && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LinkIcon fontSize="small" sx={{ color: '#64748b' }} />
                      <Typography component="a" href={item.linkUrl} target="_blank" rel="noreferrer" sx={{ color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all' }}>
                        {item.linkUrl}
                      </Typography>
                    </Stack>
                  )}

                  {item.hasFile && item.fileSize && (
                    <Typography variant="caption" color="text.secondary">
                      📎 {item.fileName} ({formatFileSize(item.fileSize)})
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Diperbarui {item.updatedAt ? new Date(item.updatedAt).toLocaleString('id-ID') : '-'}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Create / Edit Dialog */}
      {isGuruBK && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editingItem ? 'Edit Repository' : 'Tambah Repository'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Judul" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
              <TextField label="Ringkasan" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} fullWidth />
              <TextField label="Isi" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} fullWidth multiline minRows={6} />
              <TextField label="Link Referensi (opsional)" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} fullWidth />

              <FormControl fullWidth>
                <InputLabel>Visibilitas</InputLabel>
                <Select
                  value={form.visibility}
                  label="Visibilitas"
                  onChange={(e) => setForm({ ...form, visibility: e.target.value as 'private' | 'public' })}
                >
                  <MenuItem value="private">🔒 Private — Hanya Guru BK</MenuItem>
                  <MenuItem value="public">🌐 Public — Bisa dilihat siswa & guru</MenuItem>
                </Select>
              </FormControl>

              {/* File Upload */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>
                  Upload File (PDF, Word — maks 10MB)
                </Typography>

                {editingItem?.hasFile && !removeFile && !selectedFile && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{
                    p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0', mb: 1,
                  }}>
                    <AttachFileIcon fontSize="small" sx={{ color: '#475569' }} />
                    <Typography sx={{ flex: 1, fontSize: '0.875rem', color: '#334155' }}>
                      {editingItem.fileName} ({formatFileSize(editingItem.fileSize)})
                    </Typography>
                    <IconButton size="small" onClick={() => setRemoveFile(true)} title="Hapus file">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}

                {removeFile && (
                  <Alert severity="warning" sx={{ mb: 1 }} action={
                    <Button size="small" onClick={() => setRemoveFile(false)}>Batalkan</Button>
                  }>
                    File akan dihapus saat disimpan.
                  </Alert>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setRemoveFile(false);
                    }
                  }}
                />

                {selectedFile ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{
                    p: 1.5, bgcolor: '#dbeafe', borderRadius: 2, border: '1px solid #93c5fd',
                  }}>
                    <AttachFileIcon fontSize="small" sx={{ color: '#1d4ed8' }} />
                    <Typography sx={{ flex: 1, fontSize: '0.875rem', color: '#1e40af', fontWeight: 600 }}>
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </Typography>
                    <IconButton size="small" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ borderColor: '#94a3b8', color: '#475569', fontWeight: 600 }}
                  >
                    Pilih File
                  </Button>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} color="inherit">Batal</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !form.title || !form.summary || !form.content}
              sx={{ bgcolor: '#1c67f2', fontWeight: 700 }}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Dialog */}
      {isGuruBK && (
        <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Hapus Item Repository</DialogTitle>
          <DialogContent>
            <Typography>
              Hapus <strong>{deleteTarget?.title}</strong> dari repository?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)} color="inherit">Batal</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Hapus</Button>
          </DialogActions>
        </Dialog>
      )}
    </Stack>
  );
}
