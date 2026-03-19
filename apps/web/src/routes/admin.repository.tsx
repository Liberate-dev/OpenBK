import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import { apiClient } from '~lib/apiClient';
import { getErrorMessage } from '~lib/error';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { requireGuruBkRole } from '~lib/adminGuards';

export const Route = createFileRoute('/admin/repository')({
  beforeLoad: () => {
    requireGuruBkRole();
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
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
}

function RepositoryPage() {
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
  });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient<RepositoryItem[]>('/admin/repository');
      setItems(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat repository.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
    setForm({ title: '', summary: '', content: '', linkUrl: '' });
    setEditingItem(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: RepositoryItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      summary: item.summary,
      content: item.content,
      linkUrl: item.linkUrl || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const payload = {
        title: form.title,
        category: 'repository',
        summary: form.summary,
        content: form.content,
        link_url: form.linkUrl || null,
      };

      if (editingItem) {
        await apiClient(`/admin/repository/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess('Repository berhasil diperbarui.');
      } else {
        await apiClient('/admin/repository', {
          method: 'POST',
          body: JSON.stringify(payload),
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
            Satu tempat untuk menyimpan teknik, modul, artikel, dan panduan praktik terbaik layanan BK.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ bgcolor: '#1c67f2', fontWeight: 700 }}>
          Tambah Item
        </Button>
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
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8 }}>
                        <Chip label="Repository" size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />
                        <Typography variant="caption" color="text.secondary">
                          Oleh {item.createdBy}
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => openEdit(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(item)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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

                  <Typography variant="caption" color="text.secondary">
                    Diperbarui {item.updatedAt ? new Date(item.updatedAt).toLocaleString('id-ID') : '-'}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

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
    </Stack>
  );
}
