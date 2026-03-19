import { createFileRoute, Outlet, redirect, useLocation, useRouter } from '@tanstack/react-router';
import { adminAuthService } from '~lib/adminAuth';
import {
    AppBar,
    Avatar,
    Badge,
    Button,
    Box,
    Chip,
    CircularProgress,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Drawer,
    FormControlLabel,
    IconButton,
    InputBase,
    List,
    ListItemButton,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Popover,
    Stack,
    Switch,
    TextField,
    Toolbar,
    Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InboxIcon from '@mui/icons-material/Inbox';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayoutFiltersProvider } from '~features/admin-layout/adminLayoutFilters';
import { apiClient } from '~lib/apiClient';

const DRAWER_WIDTH = 276;
const UI_SETTINGS_KEY = 'openbk_admin_ui_settings';
const LAST_NOTIF_SEEN_KEY = 'openbk_admin_last_notif_seen_at';

interface UiSettings {
    displayName: string;
    enableResetRequestNotifications: boolean;
    autoRefreshNotifications: boolean;
    notificationIntervalSec: number;
}

interface PasswordResetRequestNotificationSource {
    id: number;
    nis: string;
    studentId: number | null;
    requestedAt: string | null;
    updatedAt: string | null;
}

interface UiNotification {
    id: string;
    title: string;
    description: string;
    createdAt: string;
}

const defaultUiSettings: UiSettings = {
    displayName: '',
    enableResetRequestNotifications: true,
    autoRefreshNotifications: true,
    notificationIntervalSec: 60,
};

function readUiSettings(): UiSettings {
    try {
        const raw = localStorage.getItem(UI_SETTINGS_KEY);
        if (!raw) return defaultUiSettings;
        const parsed = JSON.parse(raw);
        return {
            displayName: typeof parsed.displayName === 'string' ? parsed.displayName : '',
            enableResetRequestNotifications: parsed.enableResetRequestNotifications !== false,
            autoRefreshNotifications: parsed.autoRefreshNotifications !== false,
            notificationIntervalSec: [30, 60, 120].includes(parsed.notificationIntervalSec)
                ? parsed.notificationIntervalSec
                : 60,
        };
    } catch {
        return defaultUiSettings;
    }
}

export const Route = createFileRoute('/admin')({
    beforeLoad: ({ location }) => {
        if (location.pathname === '/admin/login') {
            if (adminAuthService.isAuthenticated()) throw redirect({ to: '/admin' });
            return;
        }
        if (!adminAuthService.isAuthenticated()) {
            throw redirect({ to: '/admin/login', search: { redirect: location.href } });
        }
    },
    component: AdminLayout,
});

function AdminLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [uiSettings, setUiSettings] = useState<UiSettings>(readUiSettings);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLElement | null>(null);
    const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(null);
    const [notifications, setNotifications] = useState<UiNotification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [notificationsError, setNotificationsError] = useState('');
    const [lastNotifSeenAt, setLastNotifSeenAt] = useState<number>(() => {
        const raw = localStorage.getItem(LAST_NOTIF_SEEN_KEY);
        const parsed = raw ? Number(raw) : 0;
        return Number.isFinite(parsed) ? parsed : 0;
    });
    const router = useRouter();
    const location = useLocation();
    const session = adminAuthService.getSession();
    const role = session?.role || 'guru_bk';

    const normalizePath = (path: string): string => {
        if (path === '/') return path;
        const normalized = path.replace(/\/+$/, '');
        return normalized === '' ? '/' : normalized;
    };

    const pathname = normalizePath(location.pathname);
    const isLoginRoute = pathname.endsWith('/login') || pathname.includes('/admin/login');
    const isDashboardRoute = pathname === '/admin';
    const notificationOpen = Boolean(notificationAnchorEl);
    const profileMenuOpen = Boolean(profileAnchorEl);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const closeProfileMenu = () => setProfileAnchorEl(null);

    const handleLogout = async () => {
        adminAuthService.clearSession();
        await router.invalidate();
        router.navigate({ to: '/admin/login' });
    };

    const navigateTo = (to: '/admin' | '/admin/inbox' | '/admin/kamus' | '/admin/users' | '/admin/logs' | '/admin/students' | '/admin/repository' | '/admin/student-profiles' | '/admin/counseling' | '/admin/reports') => {
        router.navigate({ to });
        setMobileOpen(false);
    };

    const fetchNotifications = useCallback(async () => {
        if (role !== 'admin' || !uiSettings.enableResetRequestNotifications) {
            setNotifications([]);
            setNotificationsError('');
            return;
        }

        try {
            setNotificationsLoading(true);
            const requests = await apiClient<PasswordResetRequestNotificationSource[]>('/admin/student-reset-requests');
            const nextNotifications = requests
                .map((resetRequest) => ({
                    id: `reset-request-${resetRequest.id}`,
                    title: `Permintaan reset password NIS ${resetRequest.nis}`,
                    description: 'Siswa meminta reset password. Buka Kelola Siswa untuk memprosesnya.',
                    createdAt: resetRequest.requestedAt || resetRequest.updatedAt || new Date().toISOString(),
                }))
                .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

            setNotifications(nextNotifications);
            setNotificationsError('');
        } catch {
            setNotificationsError('Gagal memuat notifikasi.');
        } finally {
            setNotificationsLoading(false);
        }
    }, [role, uiSettings.enableResetRequestNotifications]);

    useEffect(() => {
        localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(uiSettings));
    }, [uiSettings]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (role !== 'admin' || !uiSettings.autoRefreshNotifications || !uiSettings.enableResetRequestNotifications) {
            return;
        }

        const intervalId = window.setInterval(() => {
            fetchNotifications();
        }, uiSettings.notificationIntervalSec * 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [
        fetchNotifications,
        role,
        uiSettings.autoRefreshNotifications,
        uiSettings.enableResetRequestNotifications,
        uiSettings.notificationIntervalSec,
    ]);

    const unreadNotifications = useMemo(
        () => notifications.filter((item) => Date.parse(item.createdAt) > lastNotifSeenAt).length,
        [notifications, lastNotifSeenAt]
    );

    const markNotificationsSeen = () => {
        const now = Date.now();
        setLastNotifSeenAt(now);
        localStorage.setItem(LAST_NOTIF_SEEN_KEY, String(now));
    };

    const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchorEl(event.currentTarget);
        markNotificationsSeen();
    };

    const handleCloseNotifications = () => {
        setNotificationAnchorEl(null);
    };

    const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
        setProfileAnchorEl(event.currentTarget);
    };

    const handleOpenSettings = () => {
        closeProfileMenu();
        setSettingsOpen(true);
    };

    const handleOpenProfileDialog = () => {
        closeProfileMenu();
        setProfileDialogOpen(true);
    };

    const displayName = uiSettings.displayName.trim() || session?.username || 'Pengguna';

    const isActive = (path: string) => pathname === normalizePath(path);

    if (isLoginRoute) {
        return <Outlet />;
    }

    const navButtonSx = (path: string) => ({
        borderRadius: 2,
        px: 2,
        py: 1.35,
        mb: 0.65,
        border: '1px solid',
        borderColor: isActive(path) ? 'rgba(96, 165, 250, 0.46)' : 'transparent',
        bgcolor: isActive(path) ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : 'transparent',
        background: isActive(path) ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : 'transparent',
        color: isActive(path) ? '#ffffff' : '#475569',
        '&:hover': {
            bgcolor: isActive(path) ? '#2563eb' : '#f8fbff',
            color: isActive(path) ? '#ffffff' : '#1e293b',
            borderColor: isActive(path) ? 'rgba(96, 165, 250, 0.46)' : '#dbeafe',
        },
        boxShadow: isActive(path) ? '0 16px 28px rgba(37, 99, 235, 0.2)' : 'none',
        transition: 'all 0.2s ease',
    });

    const navItems = role === 'admin'
        ? [
            { to: '/admin' as const, label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
            { to: '/admin/users' as const, label: 'Kelola Pengguna', icon: <PeopleIcon fontSize="small" /> },
            { to: '/admin/students' as const, label: 'Kelola Siswa', icon: <SchoolIcon fontSize="small" /> },
            { to: '/admin/logs' as const, label: 'Lihat Log', icon: <HistoryIcon fontSize="small" /> },
        ]
        : role === 'kepala_sekolah'
        ? [
            { to: '/admin' as const, label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
            { to: '/admin/reports' as const, label: 'Laporan', icon: <AssessmentIcon fontSize="small" /> },
        ]
        : [
            { to: '/admin' as const, label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
            { to: '/admin/inbox' as const, label: 'Kotak Masuk', icon: <InboxIcon fontSize="small" /> },
            { to: '/admin/counseling' as const, label: 'Pencatatan Konseling', icon: <AssignmentTurnedInIcon fontSize="small" /> },
            { to: '/admin/reports' as const, label: 'Laporan', icon: <AssessmentIcon fontSize="small" /> },
            { to: '/admin/student-profiles' as const, label: 'Data Siswa', icon: <GroupsIcon fontSize="small" /> },
            { to: '/admin/repository' as const, label: 'Repository', icon: <LibraryBooksIcon fontSize="small" /> },
            { to: '/admin/kamus' as const, label: 'Kamus Risiko', icon: <MenuBookIcon fontSize="small" /> },
        ];

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f7faff' }}>
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    background: 'linear-gradient(180deg, #ffffff 0%, #f4f8ff 100%)',
                    borderBottom: '1px solid #e2e8f0',
                }}
            >
                <Box sx={{
                    width: 42, height: 42, borderRadius: 2, bgcolor: '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    boxShadow: '0 16px 32px rgba(37, 99, 235, 0.24)',
                }}>
                    <AdminPanelSettingsIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2, fontSize: '1.3rem' }}>
                        Open BK
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
                        {role === 'admin' ? 'IT Admin Dashboard' : role === 'kepala_sekolah' ? 'Kepala Sekolah Dashboard' : 'Guru BK Dashboard'}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ flex: 1, px: 2, py: 2.25 }}>
                <List sx={{ p: 0 }}>
                    {navItems.map((item) => (
                        <ListItemButton key={item.to} onClick={() => navigateTo(item.to)} sx={navButtonSx(item.to)}>
                            <Box sx={{ mr: 1.4, display: 'flex', alignItems: 'center', color: 'inherit' }}>{item.icon}</Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>{item.label}</Typography>
                        </ListItemButton>
                    ))}
                </List>
            </Box>

            <Box sx={{ p: 2.5, borderTop: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <ListItemButton onClick={handleOpenSettings} sx={{ borderRadius: 1, mb: 0.75, color: '#475569' }}>
                    <SettingsIcon sx={{ mr: 1.25, fontSize: 18 }} />
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Settings</Typography>
                </ListItemButton>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        borderRadius: 1,
                        color: '#ef4444',
                        '&:hover': { bgcolor: '#fef2f2' },
                        transition: 'all 0.2s'
                    }}
                >
                    <LogoutIcon sx={{ mr: 1.25, fontSize: 18, color: 'inherit' }} />
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Logout</Typography>
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <AdminLayoutFiltersProvider value={{ searchTerm, setSearchTerm, dateFilter, setDateFilter }}>
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#eef4fb' }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    display: { sm: 'none' },
                    width: '100%',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    color: '#0f172a',
                    borderBottom: '1px solid #e2e8f0',
                    backdropFilter: 'blur(14px)',
                }}
            >
                <Toolbar>
                    <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', flex: 1 }}>Open BK</Typography>
                    <Chip
                        label={role === 'admin' ? 'Admin IT' : role === 'kepala_sekolah' ? 'Kepala Sekolah' : 'Guru BK'}
                        size="small"
                        sx={{
                            bgcolor: role === 'admin' ? '#dbeafe' : role === 'kepala_sekolah' ? '#fef3c7' : '#f3e8ff',
                            color: role === 'admin' ? '#1d4ed8' : role === 'kepala_sekolah' ? '#a16207' : '#7c3aed',
                            fontWeight: 700,
                        }}
                    />
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.22)' },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid #dbe5f4', backgroundImage: 'linear-gradient(180deg, #f8fbff 0%, #f3f8ff 100%)' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 3 },
                    pt: { xs: 10, sm: 3 },
                    width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                    overflowY: 'auto'
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        border: '1px solid rgba(191, 219, 254, 0.75)',
                        borderRadius: 3,
                        px: { xs: 1.5, sm: 2.5 },
                        py: 1.35,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        bgcolor: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(18px)',
                        boxShadow: '0 20px 44px rgba(15, 23, 42, 0.05)',
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                        {isDashboardRoute ? (
                            <Typography sx={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>
                                Ringkasan data sistem
                            </Typography>
                        ) : (
                            <>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    bgcolor: '#f1f5f9',
                                    borderRadius: 1,
                                    px: 1.5,
                                    py: 0.8,
                                    flex: 1,
                                    minWidth: 0
                                }}>
                                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                                    <InputBase
                                        fullWidth
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Cari data di halaman ini..."
                                        sx={{ fontSize: '0.9rem' }}
                                    />
                                </Box>
                                <TextField
                                    size="small"
                                    type="date"
                                    label="Tanggal"
                                    value={dateFilter}
                                    onChange={(event) => setDateFilter(event.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ minWidth: 165 }}
                                />
                            </>
                        )}
                    </Stack>

                    <Stack direction="row" spacing={1.2} alignItems="center">
                        <IconButton onClick={handleOpenNotifications} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <Badge
                                color="error"
                                variant={unreadNotifications > 0 ? 'dot' : undefined}
                                badgeContent={unreadNotifications > 0 ? unreadNotifications : undefined}
                            >
                                <NotificationsNoneIcon sx={{ color: '#64748b', fontSize: 20 }} />
                            </Badge>
                        </IconButton>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ cursor: 'pointer' }} onClick={handleOpenProfileMenu}>
                            <Typography sx={{ fontWeight: 600, color: '#334155', display: { xs: 'none', md: 'block' } }}>
                                {displayName}
                            </Typography>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#fde68a', color: '#7c2d12', fontWeight: 700 }}>
                                {displayName.charAt(0).toUpperCase()}
                            </Avatar>
                        </Stack>
                    </Stack>
                </Paper>

                <Box sx={{ px: { xs: 0.25, sm: 0.5 }, pb: 2 }}>
                    <Outlet />
                </Box>

                <Popover
                    open={notificationOpen}
                    anchorEl={notificationAnchorEl}
                    onClose={handleCloseNotifications}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ sx: { width: 360, borderRadius: 1.5, p: 1.25 } }}
                >
                    <Stack spacing={1}>
                        <Typography sx={{ px: 1, pt: 0.5, fontWeight: 800, color: '#0f172a' }}>
                            Notifikasi
                        </Typography>
                        <Divider />
                        {notificationsLoading ? (
                            <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress size={22} />
                            </Box>
                        ) : notificationsError ? (
                            <Typography sx={{ px: 1, py: 1, color: '#ef4444', fontSize: '0.9rem' }}>
                                {notificationsError}
                            </Typography>
                        ) : notifications.length === 0 ? (
                            <Typography sx={{ px: 1, py: 1, color: '#64748b', fontSize: '0.9rem' }}>
                                Belum ada notifikasi.
                            </Typography>
                        ) : (
                            <List sx={{ p: 0 }}>
                                {notifications.map((item) => (
                                    <ListItemButton
                                        key={item.id}
                                        onClick={() => {
                                            navigateTo('/admin/students');
                                            handleCloseNotifications();
                                        }}
                                        sx={{ borderRadius: 1, alignItems: 'flex-start' }}
                                    >
                                        <ListItemText
                                            primary={item.title}
                                            secondary={`${item.description} | ${new Date(item.createdAt).toLocaleString('id-ID')}`}
                                            primaryTypographyProps={{ sx: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
                                            secondaryTypographyProps={{ sx: { color: '#64748b', fontSize: '0.8rem' } }}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        )}
                    </Stack>
                </Popover>

                <Menu
                    anchorEl={profileAnchorEl}
                    open={profileMenuOpen}
                    onClose={closeProfileMenu}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem onClick={handleOpenProfileDialog}>Profil Saya</MenuItem>
                    <MenuItem onClick={handleOpenSettings}>Settings</MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>Logout</MenuItem>
                </Menu>

                <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ fontWeight: 800 }}>Profil Pengguna</DialogTitle>
                    <DialogContent>
                        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                            <Typography><strong>Username:</strong> {session?.username || '-'}</Typography>
                            <Typography><strong>Role:</strong> {role === 'admin' ? 'Admin IT' : role === 'kepala_sekolah' ? 'Kepala Sekolah' : 'Guru BK'}</Typography>
                            <Typography>
                                <strong>Session berakhir:</strong>{' '}
                                {session?.expiresAt ? new Date(session.expiresAt).toLocaleString('id-ID') : '-'}
                            </Typography>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setProfileDialogOpen(false)}>Tutup</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ fontWeight: 800 }}>Settings</DialogTitle>
                    <DialogContent>
                        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                            <TextField
                                label="Nama tampilan"
                                value={uiSettings.displayName}
                                onChange={(event) => setUiSettings((prev) => ({ ...prev, displayName: event.target.value }))}
                                fullWidth
                                helperText="Kosongkan untuk memakai username akun."
                            />
                            <FormControlLabel
                                control={(
                                    <Switch
                                        checked={uiSettings.enableResetRequestNotifications}
                                        onChange={(event) => {
                                            setUiSettings((prev) => ({
                                                ...prev,
                                                enableResetRequestNotifications: event.target.checked,
                                            }));
                                        }}
                                    />
                                )}
                                label="Aktifkan notifikasi request reset password"
                            />
                            <FormControlLabel
                                control={(
                                    <Switch
                                        checked={uiSettings.autoRefreshNotifications}
                                        onChange={(event) => {
                                            setUiSettings((prev) => ({
                                                ...prev,
                                                autoRefreshNotifications: event.target.checked,
                                            }));
                                        }}
                                    />
                                )}
                                label="Auto refresh notifikasi"
                            />
                            <TextField
                                select
                                label="Interval refresh notifikasi"
                                value={uiSettings.notificationIntervalSec}
                                disabled={!uiSettings.autoRefreshNotifications}
                                onChange={(event) => {
                                    setUiSettings((prev) => ({
                                        ...prev,
                                        notificationIntervalSec: Number(event.target.value),
                                    }));
                                }}
                            >
                                <MenuItem value={30}>30 detik</MenuItem>
                                <MenuItem value={60}>60 detik</MenuItem>
                                <MenuItem value={120}>120 detik</MenuItem>
                            </TextField>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSettingsOpen(false)} variant="contained">Simpan</Button>
                    </DialogActions>
                </Dialog>
            </Box>
            </Box>
        </AdminLayoutFiltersProvider>
    );
}
