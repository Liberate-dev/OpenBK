import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Paper, Stack, Typography, Box, Button, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, CircularProgress, Alert, Chip,
    Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    FormControl, InputLabel, Select, MenuItem, Tooltip, Container, useMediaQuery, useTheme, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { apiClient } from '~lib/apiClient';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { requireAdminRole } from '~lib/adminGuards';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/admin/users')({
    beforeLoad: () => {
        requireAdminRole();
    },
    component: UserManagement,
});

interface AdminUser {
    id: number;
    username: string;
    role: 'admin' | 'guru_bk' | 'kepala_sekolah';
    nip: string;
    full_name: string;
    created_at: string;
}

interface UpdateAdminUserPayload {
    username?: string;
    password?: string;
    role?: 'admin' | 'guru_bk' | 'kepala_sekolah';
    nip?: string;
    full_name?: string;
}

interface RecognizedReporter {
    id: number;
    nip: string;
    aliasName: string;
    description: string | null;
    isActive: boolean;
    createdAt: string | null;
    updatedAt: string | null;
}

function UserManagement() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { searchTerm, dateFilter } = useAdminLayoutFilters();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [form, setForm] = useState({ username: '', password: '', role: 'guru_bk' as 'admin' | 'guru_bk' | 'kepala_sekolah', nip: '', full_name: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);

    const [reporterDialogOpen, setReporterDialogOpen] = useState(false);
    const [reporters, setReporters] = useState<RecognizedReporter[]>([]);
    const [reporterLoading, setReporterLoading] = useState(false);
    const [reporterSaving, setReporterSaving] = useState(false);
    const [editingReporter, setEditingReporter] = useState<RecognizedReporter | null>(null);
    const [deleteReporterConfirm, setDeleteReporterConfirm] = useState<RecognizedReporter | null>(null);
    const [reporterForm, setReporterForm] = useState({
        nip: '',
        aliasName: '',
        description: '',
        isActive: true,
    });

    const fetchUsers = useCallback(async () => {
        try {
            const data = await apiClient<AdminUser[]>('/admin/users');
            setUsers(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Gagal memuat daftar pengguna.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchReporters = useCallback(async () => {
        try {
            setReporterLoading(true);
            const data = await apiClient<RecognizedReporter[]>('/admin/recognized-reporters');
            setReporters(data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Gagal memuat NIP pelapor dikenali.'));
        } finally {
            setReporterLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return users.filter((user) => {
            const haystack = `${user.username} ${user.role} ${user.nip} ${user.full_name}`.toLowerCase();
            const matchesSearch = query === '' || haystack.includes(query);
            const matchesDate = dateFilter === '' || user.created_at.startsWith(dateFilter);
            return matchesSearch && matchesDate;
        });
    }, [users, searchTerm, dateFilter]);

    const openCreate = () => {
        setEditingUser(null);
        setForm({ username: '', password: '', role: 'guru_bk', nip: '', full_name: '' });
        setError('');
        setDialogOpen(true);
    };

    const openEdit = (user: AdminUser) => {
        setEditingUser(user);
        setForm({ username: user.username, password: '', role: user.role, nip: user.nip, full_name: user.full_name });
        setError('');
        setDialogOpen(true);
    };

    const openReporterManager = () => {
        setEditingReporter(null);
        setReporterForm({ nip: '', aliasName: '', description: '', isActive: true });
        setReporterDialogOpen(true);
        fetchReporters();
    };

    const openReporterCreate = () => {
        setEditingReporter(null);
        setReporterForm({ nip: '', aliasName: '', description: '', isActive: true });
    };

    const openReporterEdit = (reporter: RecognizedReporter) => {
        setEditingReporter(reporter);
        setReporterForm({
            nip: reporter.nip,
            aliasName: reporter.aliasName,
            description: reporter.description || '',
            isActive: reporter.isActive,
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            if (editingUser) {
                const body: UpdateAdminUserPayload = {};
                if (form.username !== editingUser.username) body.username = form.username;
                if (form.password) body.password = form.password;
                if (form.role !== editingUser.role) body.role = form.role;
                if (form.nip !== editingUser.nip) body.nip = form.nip;
                if (form.full_name !== editingUser.full_name) body.full_name = form.full_name;
                await apiClient(`/admin/users/${editingUser.id}`, { method: 'PUT', body: JSON.stringify(body) });
                setSuccess('Pengguna berhasil diperbarui.');
            } else {
                await apiClient('/admin/users', { method: 'POST', body: JSON.stringify(form) });
                setSuccess('Pengguna baru berhasil ditambahkan.');
            }
            setDialogOpen(false);
            fetchUsers();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Gagal menyimpan pengguna.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await apiClient(`/admin/users/${deleteConfirm.id}`, { method: 'DELETE' });
            setSuccess(`Pengguna ${deleteConfirm.username} berhasil dihapus.`);
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Gagal menghapus pengguna.'));
            setDeleteConfirm(null);
        }
    };

    const handleSaveReporter = async () => {
        try {
            setReporterSaving(true);
            setError('');

            const payload = {
                nip: reporterForm.nip,
                alias_name: reporterForm.aliasName,
                description: reporterForm.description || null,
                is_active: reporterForm.isActive,
            };

            if (editingReporter) {
                await apiClient(`/admin/recognized-reporters/${editingReporter.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                setSuccess('NIP pelapor berhasil diperbarui.');
            } else {
                await apiClient('/admin/recognized-reporters', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                setSuccess('NIP pelapor berhasil ditambahkan.');
            }

            setEditingReporter(null);
            setReporterForm({ nip: '', aliasName: '', description: '', isActive: true });
            fetchReporters();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Gagal menyimpan NIP pelapor.'));
        } finally {
            setReporterSaving(false);
        }
    };

    const handleDeleteReporter = async () => {
        if (!deleteReporterConfirm) return;
        try {
            await apiClient(`/admin/recognized-reporters/${deleteReporterConfirm.id}`, { method: 'DELETE' });
            setSuccess(`NIP pelapor ${deleteReporterConfirm.nip} berhasil dihapus.`);
            setDeleteReporterConfirm(null);
            if (editingReporter?.id === deleteReporterConfirm.id) {
                setEditingReporter(null);
                setReporterForm({ nip: '', aliasName: '', description: '', isActive: true });
            }
            fetchReporters();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Gagal menghapus NIP pelapor.'));
            setDeleteReporterConfirm(null);
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={3}>
                {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>{success}</Alert>}
                {error && !dialogOpen && !reporterDialogOpen && <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>{error}</Alert>}

                <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: 'white' }}>
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                            <Box>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                                    <PeopleIcon sx={{ color: '#1c67f2', fontSize: 24 }} />
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                        Kelola Pengguna
                                    </Typography>
                                </Stack>
                                <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
                                    Kelola akun Guru BK, Admin IT, dan daftar NIP pelapor yang boleh generate token form laporan.
                                </Typography>
                            </Box>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                <Button variant="outlined" startIcon={<VerifiedUserIcon />} onClick={openReporterManager}
                                    sx={{ fontWeight: 700, borderRadius: 2, px: 3, py: 1 }}>
                                    NIP Pelapor
                                </Button>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
                                    sx={{ bgcolor: '#1c67f2', fontWeight: 700, borderRadius: 2, px: 3, py: 1 }}>
                                    Tambah Pengguna
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>
                    <Divider />
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Username</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Role</TableCell>
                                    {!isMobile && <TableCell sx={{ fontWeight: 700, color: '#475569' }}>NIP</TableCell>}
                                    {!isMobile && <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Nama Lengkap</TableCell>}
                                    {!isMobile && <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Dibuat</TableCell>}
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Aksi</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} hover>
                                        <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{user.username}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={
                                                    user.role === 'admin'
                                                        ? 'Admin IT'
                                                        : user.role === 'kepala_sekolah'
                                                            ? 'Kepala Sekolah'
                                                            : 'Guru BK'
                                                }
                                                size="small"
                                                sx={{
                                                    bgcolor: user.role === 'admin' ? '#dbeafe' : user.role === 'kepala_sekolah' ? '#fef3c7' : '#f3e8ff',
                                                    color: user.role === 'admin' ? '#1d4ed8' : user.role === 'kepala_sekolah' ? '#a16207' : '#7c3aed',
                                                    fontWeight: 700,
                                                }}
                                            />
                                        </TableCell>
                                        {!isMobile && <TableCell sx={{ color: '#64748b' }}>{user.nip}</TableCell>}
                                        {!isMobile && <TableCell sx={{ color: '#64748b' }}>{user.full_name}</TableCell>}
                                        {!isMobile && <TableCell sx={{ color: '#64748b' }}>{new Date(user.created_at).toLocaleDateString('id-ID')}</TableCell>}
                                        <TableCell align="right">
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => openEdit(user)} sx={{ color: '#1c67f2' }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Hapus">
                                                <IconButton size="small" onClick={() => setDeleteConfirm(user)} sx={{ color: '#ef4444' }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                                            Tidak ada data pengguna yang sesuai filter.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Stack>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {editingUser ? `Edit Pengguna: ${editingUser.username}` : 'Tambah Pengguna Baru'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required fullWidth />
                        <TextField label={editingUser ? "Password Baru (kosong = tidak diubah)" : "Password"} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingUser} fullWidth />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select value={form.role} label="Role" onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                <MenuItem value="guru_bk">Guru BK</MenuItem>
                                <MenuItem value="kepala_sekolah">Kepala Sekolah</MenuItem>
                                <MenuItem value="admin">Admin IT</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="NIP"
                            value={form.nip}
                            onChange={(e) => setForm({ ...form, nip: e.target.value.replace(/\D/g, '').slice(0, 30) })}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Nama Lengkap"
                            value={form.full_name}
                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            required
                            fullWidth
                            helperText="Dipakai saat generate token login admin."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setDialogOpen(false)} color="inherit">Batal</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || !form.username || !form.nip || !form.full_name}
                        sx={{ bgcolor: '#1c67f2', fontWeight: 700, borderRadius: 2 }}>
                        {saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
                <DialogTitle sx={{ fontWeight: 700 }}>Hapus Pengguna?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Anda yakin ingin menghapus <strong>{deleteConfirm?.username}</strong>? Tindakan ini tidak dapat dibatalkan.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm(null)} color="inherit">Batal</Button>
                    <Button variant="contained" color="error" onClick={handleDelete} sx={{ fontWeight: 700 }}>Hapus</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={reporterDialogOpen} onClose={() => setReporterDialogOpen(false)} fullWidth maxWidth="lg" fullScreen={isMobile}>
                <DialogTitle sx={{ fontWeight: 700 }}>Kelola NIP Pelapor Dikenali</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <Alert severity="info">
                            NIP di daftar ini tidak bisa login ke panel admin. Mereka hanya bisa generate token untuk membuka form `/lapor`.
                        </Alert>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5, width: '100%', maxWidth: { md: 360 } }}>
                                <Stack spacing={2}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                        {editingReporter ? `Edit NIP ${editingReporter.nip}` : 'Tambah NIP Pelapor'}
                                    </Typography>
                                    <TextField
                                        label="NIP"
                                        value={reporterForm.nip}
                                        onChange={(e) => setReporterForm((prev) => ({ ...prev, nip: e.target.value.replace(/\D/g, '').slice(0, 30) }))}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Alias"
                                        value={reporterForm.aliasName}
                                        onChange={(e) => setReporterForm((prev) => ({ ...prev, aliasName: e.target.value }))}
                                        fullWidth
                                        helperText="Alias ini dipakai saat generate token."
                                    />
                                    <TextField
                                        label="Deskripsi (opsional)"
                                        value={reporterForm.description}
                                        onChange={(e) => setReporterForm((prev) => ({ ...prev, description: e.target.value }))}
                                        fullWidth
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={reporterForm.isActive ? 'active' : 'inactive'}
                                            label="Status"
                                            onChange={(e) => setReporterForm((prev) => ({ ...prev, isActive: e.target.value === 'active' }))}
                                        >
                                            <MenuItem value="active">Aktif</MenuItem>
                                            <MenuItem value="inactive">Nonaktif</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Stack direction="row" spacing={1.5}>
                                        <Button
                                            variant="contained"
                                            onClick={handleSaveReporter}
                                            disabled={reporterSaving || !reporterForm.nip || !reporterForm.aliasName}
                                            sx={{ bgcolor: '#1c67f2', fontWeight: 700 }}
                                        >
                                            {reporterSaving ? 'Menyimpan...' : (editingReporter ? 'Update' : 'Tambah')}
                                        </Button>
                                        <Button onClick={openReporterCreate} color="inherit">
                                            Reset
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Paper>

                            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden', flex: 1, width: '100%' }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>NIP</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Alias</TableCell>
                                                {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Deskripsi</TableCell>}
                                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>Aksi</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reporterLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5 }}>
                                                        <CircularProgress size={24} />
                                                    </TableCell>
                                                </TableRow>
                                            ) : reporters.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                                                        Belum ada NIP pelapor dikenali.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                reporters.map((reporter) => (
                                                    <TableRow key={reporter.id} hover>
                                                        <TableCell sx={{ fontWeight: 600 }}>{reporter.nip}</TableCell>
                                                        <TableCell>{reporter.aliasName}</TableCell>
                                                        {!isMobile && <TableCell>{reporter.description || '-'}</TableCell>}
                                                        <TableCell>
                                                            <Chip
                                                                label={reporter.isActive ? 'Aktif' : 'Nonaktif'}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: reporter.isActive ? '#dcfce7' : '#fee2e2',
                                                                    color: reporter.isActive ? '#166534' : '#991b1b',
                                                                    fontWeight: 700,
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title="Edit">
                                                                <IconButton size="small" onClick={() => openReporterEdit(reporter)} sx={{ color: '#1c67f2' }}>
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Hapus">
                                                                <IconButton size="small" onClick={() => setDeleteReporterConfirm(reporter)} sx={{ color: '#ef4444' }}>
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setReporterDialogOpen(false)} color="inherit">Tutup</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!deleteReporterConfirm} onClose={() => setDeleteReporterConfirm(null)}>
                <DialogTitle sx={{ fontWeight: 700 }}>Hapus NIP Pelapor?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Anda yakin ingin menghapus NIP <strong>{deleteReporterConfirm?.nip}</strong>? NIP ini tidak bisa lagi generate token untuk form laporan.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteReporterConfirm(null)} color="inherit">Batal</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteReporter} sx={{ fontWeight: 700 }}>Hapus</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
