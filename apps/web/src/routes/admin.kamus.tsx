import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Paper, Stack, Typography, Box, Button, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, CircularProgress, Alert, Chip,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    FormControl, InputLabel, Select, MenuItem, Tooltip, Container, useMediaQuery, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { apiClient } from '~lib/apiClient';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/admin/kamus')({
    component: KamusManagement,
});

interface DictionaryEntry {
    id: number;
    word: string;
    risk_level: string;
    weight: number;
    created_at: string;
}

function KamusManagement() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { searchTerm, dateFilter } = useAdminLayoutFilters();
    const [entries, setEntries] = useState<DictionaryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null);
    const [form, setForm] = useState({ word: '', risk_level: 'medium', weight: 5 });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<DictionaryEntry | null>(null);

    const fetchEntries = useCallback(async () => {
        try {
            const data = await apiClient<DictionaryEntry[]>('/admin/risk-dictionary');
            setEntries(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Gagal memuat kamus risiko.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const filteredEntries = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return entries.filter((entry) => {
            const haystack = `${entry.word} ${entry.risk_level} ${entry.weight}`.toLowerCase();
            const matchesSearch = query === '' || haystack.includes(query);
            const matchesDate = dateFilter === '' || entry.created_at.startsWith(dateFilter);
            return matchesSearch && matchesDate;
        });
    }, [entries, searchTerm, dateFilter]);

    const openCreate = () => {
        setEditingEntry(null);
        setForm({ word: '', risk_level: 'medium', weight: 5 });
        setError('');
        setDialogOpen(true);
    };

    const openEdit = (entry: DictionaryEntry) => {
        setEditingEntry(entry);
        setForm({ word: entry.word, risk_level: entry.risk_level, weight: entry.weight });
        setError('');
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            if (editingEntry) {
                await apiClient(`/admin/risk-dictionary/${editingEntry.id}`, { method: 'PUT', body: JSON.stringify(form) });
                setSuccess('Kata kunci berhasil diperbarui.');
            } else {
                await apiClient('/admin/risk-dictionary', { method: 'POST', body: JSON.stringify(form) });
                setSuccess('Kata kunci baru berhasil ditambahkan.');
            }
            setDialogOpen(false);
            fetchEntries();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Gagal menyimpan kata kunci.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await apiClient(`/admin/risk-dictionary/${deleteConfirm.id}`, { method: 'DELETE' });
            setSuccess(`Kata kunci "${deleteConfirm.word}" berhasil dihapus.`);
            setDeleteConfirm(null);
            fetchEntries();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Gagal menghapus kata kunci.'));
            setDeleteConfirm(null);
        }
    };

    const riskColorMap: Record<string, string> = {
        low: theme.palette.risk?.low || '#10b981',
        medium: theme.palette.risk?.medium || '#f59e0b',
        high: theme.palette.risk?.high || '#ef4444',
        critical: theme.palette.risk?.critical || '#b91c1c'
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2}>
                    <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                            <MenuBookIcon sx={{ color: '#1c67f2', fontSize: 28 }} />
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                                Kamus Risiko
                            </Typography>
                        </Stack>
                        <Typography sx={{ color: '#64748b', fontSize: '1rem' }}>
                            Kelola kata kunci beserta level risikonya untuk sistem deteksi otomatis.
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
                        sx={{ bgcolor: '#1c67f2', fontWeight: 700, borderRadius: 2, px: 3 }}>
                        Tambah Kata
                    </Button>
                </Stack>

                {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>{success}</Alert>}
                {error && !dialogOpen && <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>{error}</Alert>}

                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Kata / Frasa</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Tingkat Risiko</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Bobot</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Aksi</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEntries.map((entry) => (
                                    <TableRow key={entry.id} hover>
                                        <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{entry.word}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={entry.risk_level.toUpperCase()}
                                                size="small"
                                                sx={{
                                                    color: '#fff',
                                                    bgcolor: riskColorMap[entry.risk_level],
                                                    fontWeight: 700,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: '#64748b' }}>{entry.weight}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => openEdit(entry)} sx={{ color: '#1c67f2' }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Hapus">
                                                <IconButton size="small" onClick={() => setDeleteConfirm(entry)} sx={{ color: '#ef4444' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredEntries.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                                            Tidak ada kata kunci yang sesuai filter.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Stack>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingEntry ? `Edit Kata: ${editingEntry.word}` : 'Tambah Kata Baru'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField
                            label="Kata / Frasa"
                            value={form.word}
                            onChange={(e) => setForm({ ...form, word: e.target.value })}
                            required
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Tingkat Risiko</InputLabel>
                            <Select
                                value={form.risk_level}
                                label="Tingkat Risiko"
                                onChange={(e) => setForm({ ...form, risk_level: e.target.value })}
                            >
                                <MenuItem value="critical">Critical</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="low">Low</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Bobot Skor"
                            type="number"
                            value={form.weight}
                            onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) || 0 })}
                            required
                            fullWidth
                            inputProps={{ min: 1 }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setDialogOpen(false)} color="inherit">Batal</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || !form.word || form.weight < 1}
                        sx={{ bgcolor: '#1c67f2', fontWeight: 700, borderRadius: 2 }}>
                        {saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
                <DialogTitle sx={{ fontWeight: 700 }}>Hapus Kata?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Anda yakin ingin menghapus kata <strong>{deleteConfirm?.word}</strong>? Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm(null)} color="inherit">Batal</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} sx={{ fontWeight: 700 }}>Hapus</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
