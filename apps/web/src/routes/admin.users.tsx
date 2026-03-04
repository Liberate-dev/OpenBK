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
    role: 'admin' | 'guru_bk';
    email: string | null;
    created_at: string;
}

interface UpdateAdminUserPayload {
    username?: string;
    password?: string;
    role?: 'admin' | 'guru_bk';
    email?: string | null;
}

function UserManagement() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { searchTerm, dateFilter } = useAdminLayoutFilters();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [form, setForm] = useState({ username: '', password: '', role: 'guru_bk' as string, email: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);

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

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return users.filter((user) => {
            const haystack = `${user.username} ${user.role} ${user.email || ''}`.toLowerCase();
            const matchesSearch = query === '' || haystack.includes(query);
            const matchesDate = dateFilter === '' || user.created_at.startsWith(dateFilter);
            return matchesSearch && matchesDate;
        });
    }, [users, searchTerm, dateFilter]);

    const openCreate = () => {
        setEditingUser(null);
        setForm({ username: '', password: '', role: 'guru_bk', email: '' });
        setError('');
        setDialogOpen(true);
    };

    const openEdit = (user: AdminUser) => {
        setEditingUser(user);
        setForm({ username: user.username, password: '', role: user.role, email: user.email || '' });
        setError('');
        setDialogOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            if (editingUser) {
                const body: UpdateAdminUserPayload = {};
                if (form.username !== editingUser.username) body.username = form.username;
                if (form.password) body.password = form.password;
                if (form.role !== editingUser.role) body.role = form.role as 'admin' | 'guru_bk';
                body.email = form.email || null;
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

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="xl" disableGutters>
            <Stack spacing={3}>
                {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ borderRadius: 2 }}>{success}</Alert>}
                {error && !dialogOpen && <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 2 }}>{error}</Alert>}

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
                                    Kelola akun Guru BK dan Admin untuk akses panel.
                                </Typography>
                            </Box>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
                                sx={{ bgcolor: '#1c67f2', fontWeight: 700, borderRadius: 2, px: 3, py: 1 }}>
                                Tambah Pengguna
                            </Button>
                        </Stack>
                    </Box>
                    <Divider />
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Username</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Role</TableCell>
                                    {!isMobile && <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Email</TableCell>}
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
                                                label={user.role === 'admin' ? 'Admin IT' : 'Guru BK'}
                                                size="small"
                                                sx={{
                                                    bgcolor: user.role === 'admin' ? '#dbeafe' : '#f3e8ff',
                                                    color: user.role === 'admin' ? '#1d4ed8' : '#7c3aed',
                                                    fontWeight: 700,
                                                }}
                                            />
                                        </TableCell>
                                        {!isMobile && <TableCell sx={{ color: '#64748b' }}>{user.email || '-'}</TableCell>}
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
                                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                                            Tidak ada data pengguna yang sesuai filter.
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
                                <MenuItem value="admin">Admin IT</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="Alamat Email (untuk OTP)" placeholder="guru_bk@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth helperText="Opsional. Jika diisi, login akan memerlukan verifikasi OTP via Email." />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setDialogOpen(false)} color="inherit">Batal</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || !form.username}
                        sx={{ bgcolor: '#1c67f2', fontWeight: 700, borderRadius: 2 }}>
                        {saving ? <CircularProgress size={20} color="inherit" /> : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
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
        </Container>
    );
}
