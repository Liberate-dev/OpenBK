import { createFileRoute, Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { useMemo } from 'react';
import {
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import { authService } from '~lib/auth';

export const Route = createFileRoute('/student')({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
  },
  component: StudentLayout,
});

const shell = {
  bgTop: '#eef5ff',
  bgBottom: '#f7fbff',
  panel: 'rgba(255,255,255,0.88)',
  panelStrong: '#ffffff',
  border: 'rgba(148, 163, 184, 0.16)',
  text: '#10233f',
  muted: '#60738f',
  primary: '#1a73e8',
  primaryDeep: '#0f4fbf',
  accent: '#e44747',
  primarySoft: 'rgba(26, 115, 232, 0.08)',
};

function StudentLayout() {
  const router = useRouter();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const session = authService.getSession();

  const handleLogout = async () => {
    authService.clearSession();
    await router.invalidate();
    router.navigate({ to: '/' });
  };

  const navItems = useMemo(() => [
    { to: '/student' as const, label: 'Beranda', caption: 'Ringkasan aman', icon: <HomeRoundedIcon sx={{ fontSize: 20 }} />, exact: true },
    { to: '/student/send-letter' as const, label: 'Surat', caption: 'Cerita & balasan', icon: <MailOutlineRoundedIcon sx={{ fontSize: 20 }} /> },
    { to: '/student/repository' as const, label: 'Repository', caption: 'Panduan & materi', icon: <FolderOpenRoundedIcon sx={{ fontSize: 20 }} /> },
  ], []);

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return currentPath === to;
    return currentPath.startsWith(to);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: shell.text,
        background: `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(120, 179, 255, 0.18), transparent 50%),
          radial-gradient(ellipse 60% 40% at 80% 0%, rgba(15, 79, 191, 0.08), transparent 45%),
          linear-gradient(185deg, ${shell.bgTop} 0%, ${shell.bgBottom} 60%, #ffffff 100%)`,
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3.5 } }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Box
            sx={{
              mx: { xs: 2, md: 4 },
              px: { xs: 2.5, md: 3.5 },
              py: { xs: 2, md: 2.2 },
              borderRadius: '28px',
              background: shell.panel,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${shell.border}`,
              boxShadow: '0 8px 32px rgba(15, 79, 191, 0.06), 0 2px 8px rgba(148, 163, 184, 0.04)',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'stretch', md: 'center' }}
              justifyContent="space-between"
              gap={{ xs: 2, md: 0 }}
            >
              <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, md: 2 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: { xs: 1.4, md: 2 },
                    py: { xs: 0.9, md: 1.1 },
                    borderRadius: '18px',
                    bgcolor: shell.panelStrong,
                    boxShadow: '0 4px 16px rgba(15, 79, 191, 0.08)',
                    border: `1px solid ${shell.border}`,
                  }}
                >
                  <SchoolRoundedIcon sx={{ fontSize: { xs: 16, md: 18 }, color: shell.primary }} />
                  <Typography sx={{ fontWeight: 900, letterSpacing: '-0.03em', color: shell.primary, fontSize: { xs: '0.95rem', md: '1rem' } }}>
                    Open BK
                  </Typography>
                </Box>
                <Typography sx={{ display: { xs: 'none', lg: 'block' }, color: shell.muted, fontSize: '0.88rem', pl: 1 }}>
                  Ruang aman untuk bercerita dan bertumbuh
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={{ xs: 1, md: 1.5 }} flexWrap="wrap" useFlexGap>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.6,
                    py: 0.95,
                    borderRadius: '16px',
                    bgcolor: shell.panelStrong,
                    border: `1px solid ${shell.border}`,
                    boxShadow: '0 2px 8px rgba(15, 79, 191, 0.04)',
                  }}
                >
                  <ShieldRoundedIcon sx={{ fontSize: 16, color: shell.primaryDeep }} />
                  <Box>
                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: shell.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      NIS
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: shell.text, letterSpacing: '-0.01em' }}>
                      {session?.nis || '-'}
                    </Typography>
                  </Box>
                </Box>

                <IconButton
                  sx={{
                    width: 44,
                    height: 44,
                    color: shell.primaryDeep,
                    bgcolor: shell.panelStrong,
                    border: `1px solid ${shell.border}`,
                    boxShadow: '0 2px 8px rgba(15, 79, 191, 0.04)',
                    '&:hover': { bgcolor: shell.primarySoft },
                  }}
                >
                  <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>

                <Button
                  onClick={handleLogout}
                  variant="contained"
                  disableElevation
                  sx={{
                    borderRadius: '14px',
                    px: { xs: 2, md: 2.5 },
                    py: 1.1,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    bgcolor: shell.accent,
                    boxShadow: '0 4px 16px rgba(228, 71, 71, 0.2)',
                    '&:hover': {
                      bgcolor: '#d93b3b',
                      boxShadow: '0 6px 20px rgba(217, 59, 59, 0.28)',
                    },
                  }}
                >
                  Keluar
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2.5, md: 3 }}>
            <Box
              sx={{
                width: { xs: '100%', md: 260 },
                flexShrink: 0,
              }}
            >
              <Stack
                spacing={1.5}
                sx={{
                  position: { md: 'sticky' },
                  top: 20,
                  p: 2,
                  borderRadius: '24px',
                  bgcolor: shell.panel,
                  border: `1px solid ${shell.border}`,
                  boxShadow: '0 4px 20px rgba(15, 79, 191, 0.05), 0 1px 4px rgba(148, 163, 184, 0.03)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 1.5,
                    borderRadius: '18px',
                    bgcolor: shell.panelStrong,
                    border: `1px solid ${shell.border}`,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: shell.primary,
                      boxShadow: '0 4px 16px rgba(26, 115, 232, 0.2)',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                    }}
                  >
                    {session?.nis?.[0] || 'S'}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {session?.nis || 'Siswa'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: shell.muted }}>
                      Siswa Open BK
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, overflowX: 'auto', pb: 0.5 }}>
                  {navItems.map((item) => {
                    const active = isActive(item.to, item.exact);
                    return (
                      <Button
                        key={`mobile-${item.to}`}
                        onClick={() => router.navigate({ to: item.to })}
                        startIcon={item.icon}
                        sx={{
                          flexShrink: 0,
                          px: 2,
                          py: 1,
                          borderRadius: '14px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: active ? '#ffffff' : shell.text,
                          bgcolor: active ? shell.primary : shell.panelStrong,
                          border: active ? 'none' : `1px solid ${shell.border}`,
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Box>

                <Stack spacing={0.8} sx={{ display: { xs: 'none', md: 'flex' } }}>
                  {navItems.map((item) => {
                    const active = isActive(item.to, item.exact);
                    return (
                      <Button
                        key={`desk-${item.to}`}
                        onClick={() => router.navigate({ to: item.to })}
                        disableElevation
                        disableRipple
                        sx={{
                          justifyContent: 'flex-start',
                          px: 1.5,
                          py: 1.3,
                          borderRadius: '16px',
                          textTransform: 'none',
                          color: active ? '#ffffff' : shell.text,
                          background: active
                            ? `linear-gradient(135deg, ${shell.primary} 0%, ${shell.primaryDeep} 100%)`
                            : 'transparent',
                          boxShadow: active ? '0 4px 16px rgba(26, 115, 232, 0.2)' : 'none',
                          border: active ? 'none' : `1px solid transparent`,
                          '&:hover': {
                            background: active
                              ? `linear-gradient(135deg, ${shell.primaryDeep} 0%, ${shell.primary} 100%)`
                              : shell.primarySoft,
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: '12px',
                              display: 'grid',
                              placeItems: 'center',
                              bgcolor: active ? 'rgba(255,255,255,0.2)' : shell.primarySoft,
                              color: active ? '#ffffff' : shell.primary,
                              transition: 'all 200ms ease',
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: '0.9rem' }}>
                              {item.label}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: active ? 'rgba(255,255,255,0.78)' : shell.muted }}>
                              {item.caption}
                            </Typography>
                          </Box>
                        </Stack>
                      </Button>
                    );
                  })}
                </Stack>

                <Box
                  sx={{
                    p: 1.8,
                    mt: 0.5,
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${shell.primarySoft} 0%, rgba(15, 79, 191, 0.03) 100%)`,
                    border: `1px solid ${shell.border}`,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <ShieldRoundedIcon sx={{ fontSize: 14, color: shell.primary }} />
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: shell.primary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Privasi Terjamin
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: '0.82rem', color: shell.muted, lineHeight: 1.6 }}>
                    Identitasmu terlindungi. Cerita dengan nyaman.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Outlet />
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
