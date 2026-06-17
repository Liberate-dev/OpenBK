import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import { authService } from '~lib/auth';
import { apiClient } from '~lib/apiClient';

export const Route = createFileRoute('/student/')({
  component: StudentDashboard,
});

interface Letter {
  id: string;
  submittedAt: string;
  repliesCount: number;
}

const dashboardTone = {
  text: '#10233f',
  muted: '#60738f',
  primary: '#1a73e8',
  primaryDeep: '#0f4fbf',
  primarySoft: 'rgba(26, 115, 232, 0.06)',
  card: '#ffffff',
  border: 'rgba(148, 163, 184, 0.12)',
};

function StudentDashboard() {
  const router = useRouter();
  const session = authService.getSession();
  const [letterCount, setLetterCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiClient<Letter[]>('/messages/history');
      setLetterCount(data.length);
    } catch {
      setLetterCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }}>
      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: '24px',
          border: `1px solid ${dashboardTone.border}`,
          background: 'linear-gradient(135deg, #0f4fbf 0%, #1a73e8 50%, #5ba7ff 100%)',
          color: '#ffffff',
          boxShadow: '0 20px 60px rgba(26, 115, 232, 0.18), 0 4px 16px rgba(15, 79, 191, 0.1)',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={{ xs: 2.5, lg: 3 }}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 'auto -5% -20% auto',
              width: { xs: 180, md: 280 },
              height: { xs: 180, md: 280 },
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -40,
              right: '30%',
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Stack spacing={2.2} sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 1.4,
                  py: 0.7,
                  borderRadius: '12px',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <ShieldRoundedIcon sx={{ fontSize: 15 }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Ruang Aman Open BK
                </Typography>
              </Box>
            </Stack>

            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '2rem', md: '2.8rem' },
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                  mb: 1.2,
                }}
              >
                Hai, {session?.nis || 'Siswa'}.
              </Typography>
              <Typography
                sx={{
                  maxWidth: 560,
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: { xs: '0.92rem', md: '1rem' },
                  lineHeight: 1.7,
                }}
              >
                Tempat bercerita tanpa ribut, tanpa dihakimi. Hubungi Guru BK, lihat balasan, dan akses materi pendukung dari satu ruang yang tenang dan privat.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
              <Button
                onClick={() => router.navigate({ to: '/student/send-letter' })}
                variant="contained"
                disableElevation
                sx={{
                  alignSelf: 'flex-start',
                  borderRadius: '14px',
                  px: 2.5,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  color: dashboardTone.primaryDeep,
                  bgcolor: '#ffffff',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  '&:hover': { bgcolor: '#f0f6ff' },
                }}
              >
                Cerita Sekarang
              </Button>
              <Button
                onClick={() => router.navigate({ to: '/student/repository' })}
                variant="outlined"
                sx={{
                  alignSelf: 'flex-start',
                  borderRadius: '14px',
                  px: 2.5,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: '#ffffff',
                    bgcolor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                Lihat Panduan
              </Button>
            </Stack>
          </Stack>

          <Stack
            spacing={1.5}
            sx={{
              width: { xs: '100%', lg: 280 },
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '20px',
                color: '#ffffff',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8, mb: 1.2 }}>
                Status Hari Ini
              </Typography>
              <Stack spacing={1}>
                <MetricRow
                  label="Surat terkirim"
                  value={
                    loading ? (
                      <CircularProgress size={14} sx={{ color: '#ffffff' }} />
                    ) : (
                      `${letterCount ?? 0}`
                    )
                  }
                />
                <MetricRow label="Privasi" value="Aktif" />
                <MetricRow label="Akses materi" value="Terbuka" />
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '20px',
                color: '#ffffff',
                background: 'rgba(7, 23, 55, 0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.6, fontStyle: 'italic' }}>
                "Bercerita itu bukan tanda lemah. Itu tanda kamu mau ditolong dengan cara yang sehat."
              </Typography>
            </Paper>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' }, gap: 2 }}>
        <FeatureCard
          icon={<ForumRoundedIcon sx={{ fontSize: 22 }} />}
          eyebrow="Percakapan"
          title="Surat Pribadi ke Guru BK"
          description="Tulis apa yang kamu rasakan, lalu cek balasan tanpa perlu keluar dari dashboard."
          action="Buka Surat"
          accent="linear-gradient(135deg, rgba(26,115,232,0.08) 0%, rgba(91,167,255,0.15) 100%)"
          onClick={() => router.navigate({ to: '/student/send-letter' })}
        />
        <FeatureCard
          icon={<FolderOpenRoundedIcon sx={{ fontSize: 22 }} />}
          eyebrow="Pendampingan"
          title="Repository Panduan Siswa"
          description="Kumpulan materi pengembangan diri, tips belajar, dan dokumen pendukung."
          action="Lihat Materi"
          accent="linear-gradient(135deg, rgba(15,79,191,0.06) 0%, rgba(26,115,232,0.12) 100%)"
          onClick={() => router.navigate({ to: '/student/repository' })}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          mx: { xs: 1, md: 2 },
          p: { xs: 2, md: 2.5 },
          borderRadius: '20px',
          bgcolor: dashboardTone.card,
          border: `1px solid ${dashboardTone.border}`,
          boxShadow: '0 8px 32px rgba(148, 163, 184, 0.08)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 3 }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: dashboardTone.primary }} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: dashboardTone.primary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Catatan Kecil
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, fontWeight: 700, color: dashboardTone.text, lineHeight: 1.5 }}>
              Kamu tidak harus menunggu keadaan memburuk untuk mulai bercerita.
            </Typography>
            <Typography sx={{ mt: 1, color: dashboardTone.muted, lineHeight: 1.7, maxWidth: 640, fontSize: '0.88rem' }}>
              Kirim surat lebih awal. Percakapan yang baik dimulai dari satu pesan singkat yang jujur.
            </Typography>
          </Box>

          <Button
            onClick={() => router.navigate({ to: '/student/send-letter' })}
            sx={{
              flexShrink: 0,
              borderRadius: '14px',
              px: 2,
              py: 1.1,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: dashboardTone.primary,
              bgcolor: dashboardTone.primarySoft,
              '&:hover': { bgcolor: 'rgba(26, 115, 232, 0.1)' },
            }}
          >
            Mulai Sekarang
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

function MetricRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{value}</Typography>
    </Stack>
  );
}

function FeatureCard({
  accent,
  action,
  description,
  eyebrow,
  icon,
  onClick,
  title,
}: {
  accent: string;
  action: string;
  description: string;
  eyebrow: string;
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5,
        borderRadius: '20px',
        cursor: 'pointer',
        bgcolor: '#ffffff',
        border: `1px solid ${dashboardTone.border}`,
        boxShadow: '0 8px 32px rgba(148, 163, 184, 0.08)',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 16px 40px rgba(26, 115, 232, 0.12)',
        },
      }}
    >
      <Stack spacing={2} sx={{ height: '100%' }}>
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            color: dashboardTone.primary,
            background: accent,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: dashboardTone.primary, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.7 }}>
            {eyebrow}
          </Typography>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: dashboardTone.text, letterSpacing: '-0.03em', mb: 0.9 }}>
            {title}
          </Typography>
          <Typography sx={{ color: dashboardTone.muted, lineHeight: 1.65, fontSize: '0.88rem' }}>
            {description}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 'auto', color: dashboardTone.primary, fontWeight: 800, fontSize: '0.88rem' }}>
          <Typography>{action}</Typography>
          <ArrowOutwardRoundedIcon sx={{ fontSize: 16 }} />
        </Stack>
      </Stack>
    </Paper>
  );
}
