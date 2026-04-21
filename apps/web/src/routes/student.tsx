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
  panel: 'rgba(255,255,255,0.82)',
  panelStrong: '#ffffff',
  border: 'rgba(148, 163, 184, 0.22)',
  text: '#10233f',
  muted: '#60738f',
  primary: '#1a73e8',
  primaryDeep: '#0f4fbf',
  accent: '#e44747',
  primarySoft: 'rgba(26, 115, 232, 0.12)',
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
        background: `radial-gradient(circle at top left, rgba(120, 179, 255, 0.28), transparent 28%),
          radial-gradient(circle at top right, rgba(15, 79, 191, 0.12), transparent 22%),
          linear-gradient(180deg, ${shell.bgTop} 0%, ${shell.bgBottom} 55%, #ffffff 100%)`,
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3.5 } }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
            gap={2}
            sx={{
              px: { xs: 2, md: 3 },
              py: { xs: 2, md: 2.5 },
              borderRadius: '30px',
              background: shell.panel,
              backdropFilter: 'blur(18px)',
              border: `1px solid ${shell.border}`,
              boxShadow: '0 24px 60px rgba(148, 163, 184, 0.16)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.6,
                  py: 1,
                  borderRadius: '999px',
                  bgcolor: shell.panelStrong,
                  boxShadow: '0 10px 24px rgba(15, 79, 191, 0.12)',
                }}
              >
                <SchoolRoundedIcon sx={{ fontSize: 18, color: shell.primary }} />
                <Typography sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: shell.primary }}>
                  Open BK
                </Typography>
              </Box>
              <Typography sx={{ display: { xs: 'none', md: 'block' }, color: shell.muted, fontSize: '0.95rem' }}>
                Ruang aman untuk bercerita, bertanya, dan bertumbuh.
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.2} flexWrap="wrap" useFlexGap>
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
                sx={{
                  px: 1.25,
                  py: 0.9,
                  borderRadius: '18px',
                  bgcolor: 'rgba(255,255,255,0.72)',
                  border: `1px solid ${shell.border}`,
                }}
              >
                <ShieldRoundedIcon sx={{ fontSize: 18, color: shell.primaryDeep }} />
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: shell.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Student ID
                  </Typography>
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: shell.text }}>
                    NIS {session?.nis || '-'}
                  </Typography>
                </Box>
              </Stack>

              <IconButton
                sx={{
                  width: 46,
                  height: 46,
                  color: shell.primaryDeep,
                  bgcolor: 'rgba(255,255,255,0.72)',
                  border: `1px solid ${shell.border}`,
                }}
              >
                <NotificationsNoneRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>

              <Button
                onClick={handleLogout}
                variant="contained"
                disableElevation
                sx={{
                  borderRadius: '999px',
                  px: 2.7,
                  py: 1.15,
                  textTransform: 'none',
                  fontWeight: 800,
                  bgcolor: shell.accent,
                  boxShadow: '0 14px 28px rgba(228, 71, 71, 0.24)',
                  '&:hover': {
                    bgcolor: '#d93b3b',
                    boxShadow: '0 16px 32px rgba(217, 59, 59, 0.28)',
                  },
                }}
              >
                Keluar
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2.5, md: 3 }}>
            <Box
              sx={{
                width: { xs: '100%', md: 284 },
                flexShrink: 0,
              }}
            >
              <Stack
                spacing={2}
                sx={{
                  position: { md: 'sticky' },
                  top: 24,
                  p: 2,
                  borderRadius: '30px',
                  bgcolor: shell.panel,
                  border: `1px solid ${shell.border}`,
                  boxShadow: '0 24px 56px rgba(148, 163, 184, 0.12)',
                  backdropFilter: 'blur(18px)',
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 1.25,
                    borderRadius: '22px',
                    bgcolor: 'rgba(255,255,255,0.72)',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: shell.primary,
                      boxShadow: '0 12px 24px rgba(26, 115, 232, 0.22)',
                      fontWeight: 800,
                    }}
                  >
                    {session?.nis?.[0] || 'S'}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                      {session?.nis || 'Siswa'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.84rem', color: shell.muted }}>
                      Akses pribadi siswa Open BK
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
                          px: 1.8,
                          py: 1,
                          borderRadius: '999px',
                          textTransform: 'none',
                          fontWeight: 700,
                          color: active ? '#ffffff' : shell.text,
                          bgcolor: active ? shell.primary : 'rgba(255,255,255,0.78)',
                          border: active ? 'none' : `1px solid ${shell.border}`,
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Box>

                <Stack spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
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
                          px: 1.4,
                          py: 1.45,
                          borderRadius: '22px',
                          textTransform: 'none',
                          color: active ? '#ffffff' : shell.text,
                          background: active
                            ? 'linear-gradient(135deg, #1a73e8 0%, #5ba7ff 100%)'
                            : 'rgba(255,255,255,0.72)',
                          boxShadow: active ? '0 18px 32px rgba(26, 115, 232, 0.25)' : 'none',
                          border: active ? 'none' : `1px solid ${shell.border}`,
                          '&:hover': {
                            background: active
                              ? 'linear-gradient(135deg, #1968d4 0%, #519ef5 100%)'
                              : 'rgba(255,255,255,0.94)',
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.4} alignItems="center">
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '14px',
                              display: 'grid',
                              placeItems: 'center',
                              bgcolor: active ? 'rgba(255,255,255,0.18)' : shell.primarySoft,
                              color: active ? '#ffffff' : shell.primary,
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                              {item.label}
                            </Typography>
                            <Typography sx={{ fontSize: '0.76rem', color: active ? 'rgba(255,255,255,0.82)' : shell.muted }}>
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
                    p: 1.7,
                    borderRadius: '22px',
                    background: 'linear-gradient(180deg, rgba(15, 79, 191, 0.08) 0%, rgba(26, 115, 232, 0.02) 100%)',
                    border: `1px solid rgba(26, 115, 232, 0.10)`,
                  }}
                >
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: shell.primary, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.8 }}>
                    Privasi
                  </Typography>
                  <Typography sx={{ fontSize: '0.87rem', color: shell.muted, lineHeight: 1.65 }}>
                    Identitas siswa tetap terlindungi. Gunakan menu surat untuk bercerita dengan nyaman dan terarah.
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
