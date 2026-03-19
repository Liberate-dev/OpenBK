import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
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
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EditIcon from '@mui/icons-material/Edit';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAdminLayoutFilters } from '~features/admin-layout/adminLayoutFilters';
import { apiClient } from '~lib/apiClient';
import { requireGuruBkRole } from '~lib/adminGuards';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/admin/student-profiles')({
  beforeLoad: () => {
    requireGuruBkRole();
  },
  component: StudentProfilesPage,
});

interface StudentProfile {
  id: number;
  nis: string;
  name: string | null;
  className: string | null;
  profileSummary: string | null;
  characterNotes: string | null;
  accountStatus: 'active' | 'reset_required' | 'not_registered';
  messagesCount: number;
  lastMessageAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function StudentProfilesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { searchTerm, dateFilter } = useAdminLayoutFilters();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [form, setForm] = useState({
    name: '',
    className: '',
    profileSummary: '',
    characterNotes: '',
  });

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient<StudentProfile[]>('/admin/student-profiles');
      setProfiles(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat data siswa.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const filteredProfiles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return profiles.filter((profile) => {
      const haystack = `${profile.nis} ${profile.name || ''} ${profile.className || ''} ${profile.profileSummary || ''}`.toLowerCase();
      const matchesSearch = query === '' || haystack.includes(query);
      const matchesDate = dateFilter === '' || (profile.updatedAt?.startsWith(dateFilter) ?? profile.createdAt?.startsWith(dateFilter) ?? false);
      return matchesSearch && matchesDate;
    });
  }, [profiles, searchTerm, dateFilter]);

  const stats = useMemo(() => {
    const totalStudents = profiles.length;
    const activeAccounts = profiles.filter((profile) => profile.accountStatus === 'active').length;
    const pendingSignup = profiles.filter((profile) => profile.accountStatus === 'not_registered').length;
    const resetRequired = profiles.filter((profile) => profile.accountStatus === 'reset_required').length;
    const totalMessages = profiles.reduce((sum, profile) => sum + profile.messagesCount, 0);

    return {
      totalStudents,
      activeAccounts,
      pendingSignup,
      resetRequired,
      totalMessages,
    };
  }, [profiles]);

  const openEdit = (profile: StudentProfile) => {
    setSelectedProfile(profile);
    setForm({
      name: profile.name || '',
      className: profile.className || '',
      profileSummary: profile.profileSummary || '',
      characterNotes: profile.characterNotes || '',
    });
  };

  const handleSave = async () => {
    if (!selectedProfile) return;

    try {
      setSaving(true);
      await apiClient(`/admin/student-profiles/${selectedProfile.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name || null,
          class_name: form.className || null,
          profile_summary: form.profileSummary || null,
          character_notes: form.characterNotes || null,
        }),
      });

      setSuccess(`Profil siswa ${selectedProfile.nis} berhasil diperbarui.`);
      setSelectedProfile(null);
      fetchProfiles();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal menyimpan profil siswa.'));
    } finally {
      setSaving(false);
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
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid #dbe5f4',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f8fbff 0%, #eef5ff 55%, #ffffff 100%)',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,1), rgba(0,0,0,0.2))',
            pointerEvents: 'none',
          }}
        />
        <Stack spacing={3} sx={{ position: 'relative', p: { xs: 3, md: 4 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  color: '#2563eb',
                  mb: 1,
                }}
              >
                Student Directory
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: '#2563eb',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 16px 32px rgba(37, 99, 235, 0.18)',
                  }}
                >
                  <GroupsIcon />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                  Data Siswa
                </Typography>
              </Stack>
              <Typography sx={{ color: '#475569', maxWidth: 760, lineHeight: 1.75 }}>
                Pusat referensi Guru BK untuk melihat status akun, jejak surat, dan catatan karakter siswa secara lebih rapi dan cepat dipindai.
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                minWidth: { xs: '100%', md: 250 },
                p: 2,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                Hasil Filter
              </Typography>
              <Typography sx={{ fontSize: '2.2rem', lineHeight: 1, fontWeight: 900, color: '#1d4ed8', mb: 0.5 }}>
                {filteredProfiles.length}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                siswa tampil dari total {stats.totalStudents} data.
              </Typography>
            </Paper>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5 }}>
            <MetricCard icon={<PersonOutlineIcon fontSize="small" />} label="Total Siswa" value={stats.totalStudents} accent="#1d4ed8" tone="blue" />
            <MetricCard icon={<AutoStoriesIcon fontSize="small" />} label="Akun Aktif" value={stats.activeAccounts} accent="#15803d" tone="green" />
            <MetricCard icon={<WarningAmberIcon fontSize="small" />} label="Belum Signup" value={stats.pendingSignup} accent="#0369a1" tone="sky" />
            <MetricCard icon={<WarningAmberIcon fontSize="small" />} label="Perlu Reset" value={stats.resetRequired} accent="#b91c1c" tone="red" />
            <MetricCard icon={<MarkEmailUnreadIcon fontSize="small" />} label="Total Surat" value={stats.totalMessages} accent="#7c3aed" tone="violet" />
          </Box>
        </Stack>
      </Paper>

      {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Paper
        elevation={0}
        sx={{
          border: '1px solid #d9e2ef',
          borderRadius: 4,
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.05)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          gap={1.5}
          sx={{ px: { xs: 2, md: 3 }, py: 2.2, borderBottom: '1px solid #e2e8f0' }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.08rem' }}>
              Direktori Profil Siswa
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
              Fokus pada data penting, dengan aksi edit yang lebih ringan dan mudah dipindai.
            </Typography>
          </Box>
          {!isMobile && (
            <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800 }}>
              BK Monitoring Board
            </Typography>
          )}
        </Stack>

        <TableContainer>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.73rem', py: 1.8 }}>NIS</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.73rem', py: 1.8 }}>Nama</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.73rem', py: 1.8 }}>Kelas</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.73rem', py: 1.8 }}>Surat</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.73rem', py: 1.8 }}>Ringkasan Profil</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.73rem', py: 1.8 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#64748b' }}>
                    Tidak ada data siswa yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => {
                  return (
                  <TableRow
                    key={profile.id}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 'none' },
                      '&:hover': {
                        bgcolor: '#fbfdff',
                      },
                    }}
                  >
                    <TableCell sx={{ py: 2.1 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.3,
                          py: 0.65,
                          borderRadius: 999,
                          bgcolor: '#eff6ff',
                          color: '#1d4ed8',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {profile.nis}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2.1 }}>
                      <Stack spacing={0.35}>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {profile.name || 'Belum diisi'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {profile.updatedAt
                            ? `Diperbarui ${new Date(profile.updatedAt).toLocaleDateString('id-ID')}`
                            : 'Belum ada pembaruan profil'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 2.1, color: '#475569', fontWeight: 600 }}>
                      {profile.className || '-'}
                    </TableCell>
                    <TableCell sx={{ py: 2.1 }}>
                      <Stack spacing={0.25}>
                        <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {profile.messagesCount}
                        </Typography>
                        <Typography sx={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                          {profile.lastMessageAt
                            ? new Date(profile.lastMessageAt).toLocaleDateString('id-ID')
                            : 'Belum ada surat'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 2.1 }}>
                      <Typography
                        sx={{
                          color: profile.profileSummary ? '#475569' : '#94a3b8',
                          maxWidth: 360,
                          lineHeight: 1.65,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {profile.profileSummary || 'Belum ada ringkasan awal untuk siswa ini.'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2.1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => openEdit(profile)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: 999,
                          px: 1.8,
                          borderColor: '#bfdbfe',
                          color: '#2563eb',
                          bgcolor: '#ffffff',
                          '&:hover': {
                            borderColor: '#93c5fd',
                            bgcolor: '#eff6ff',
                          },
                        }}
                      >
                        Edit Profil
                      </Button>
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!selectedProfile} onClose={() => setSelectedProfile(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Edit Profil Siswa {selectedProfile?.nis}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.2} sx={{ mt: 1 }}>
            <TextField label="Nama Siswa" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Kelas" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} fullWidth />
            <TextField label="Ringkasan Profil" value={form.profileSummary} onChange={(e) => setForm({ ...form, profileSummary: e.target.value })} fullWidth />
            <TextField
              label="Catatan Karakter"
              value={form.characterNotes}
              onChange={(e) => setForm({ ...form, characterNotes: e.target.value })}
              fullWidth
              multiline
              minRows={6}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSelectedProfile(null)} color="inherit">Batal</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: '#1c67f2', fontWeight: 700, px: 2.4 }}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function MetricCard(props: {
  icon: ReactNode;
  label: string;
  value: number;
  accent: string;
  tone: 'blue' | 'green' | 'sky' | 'red' | 'violet';
}) {
  const toneMap = {
    blue: '#eff6ff',
    green: '#f0fdf4',
    sky: '#f0f9ff',
    red: '#fef2f2',
    violet: '#f5f3ff',
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid rgba(148, 163, 184, 0.18)',
        bgcolor: '#ffffff',
        p: 2,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 700, mb: 0.7 }}>
            {props.label}
          </Typography>
          <Typography sx={{ color: '#0f172a', fontSize: '1.9rem', lineHeight: 1, fontWeight: 900 }}>
            {props.value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: toneMap[props.tone],
            color: props.accent,
          }}
        >
          {props.icon}
        </Box>
      </Stack>
    </Paper>
  );
}
