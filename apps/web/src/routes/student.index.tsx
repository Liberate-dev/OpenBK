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
  primarySoft: 'rgba(26, 115, 232, 0.10)',
  card: '#ffffff',
  border: 'rgba(148, 163, 184, 0.18)',
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
    <Stack spacing={{ xs: 2.5, md: 3 }}>
      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: '34px',
          border: `1px solid ${dashboardTone.border}`,
          background: 'linear-gradient(135deg, #0f4fbf 0%, #1a73e8 48%, #7bc6ff 100%)',
          color: '#ffffff',
          boxShadow: '0 34px 80px rgba(26, 115, 232, 0.24)',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={{ xs: 3, lg: 4 }}
          sx={{
            p: { xs: 3, md: 4.5 },
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 'auto -10% -25% auto',
              width: { xs: 220, md: 320 },
              height: { xs: 220, md: 320 },
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 72%)',
            },
          }}
        >
          <Stack spacing={2.6} sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.4,
                  py: 0.8,
                  borderRadius: '999px',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <ShieldRoundedIcon sx={{ fontSize: 17 }} />
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Ruang Aman Open BK
                </Typography>
              </Box>
            </Stack>

            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '2.2rem', md: '3.25rem' },
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                  lineHeight: 1,
                  mb: 1.4,
                }}
              >
                Hai, {session?.nis || 'Siswa'}.
              </Typography>
              <Typography
                sx={{
                  maxWidth: 620,
                  color: 'rgba(255,255,255,0.88)',
                  fontSize: { xs: '0.98rem', md: '1.04rem' },
                  lineHeight: 1.75,
                }}
              >
                Tempat untuk bercerita tanpa ribut, tanpa takut dihakimi. Kamu bisa menghubungi Guru BK,
                melihat balasan, dan membuka materi pendukung dari satu ruang yang tenang dan privat.
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3}>
              <Button
                onClick={() => router.navigate({ to: '/student/send-letter' })}
                variant="contained"
                disableElevation
                sx={{
                  alignSelf: 'flex-start',
                  borderRadius: '999px',
                  px: 2.8,
                  py: 1.25,
                  textTransform: 'none',
                  fontWeight: 800,
                  color: dashboardTone.primaryDeep,
                  bgcolor: '#ffffff',
                  '&:hover': { bgcolor: '#eef6ff' },
                }}
              >
                Cerita Sekarang
              </Button>
              <Button
                onClick={() => router.navigate({ to: '/student/repository' })}
                variant="outlined"
                sx={{
                  alignSelf: 'flex-start',
                  borderRadius: '999px',
                  px: 2.8,
                  py: 1.25,
                  textTransform: 'none',
                  fontWeight: 700,
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.34)',
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
              width: { xs: '100%', lg: 310 },
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: '28px',
                color: '#ffffff',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.82, mb: 1 }}>
                Status Hari Ini
              </Typography>
              <Stack spacing={1.2}>
                <MetricRow
                  label="Surat terkirim"
                  value={
                    loading ? (
                      <CircularProgress size={16} sx={{ color: '#ffffff' }} />
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
                p: 2.2,
                borderRadius: '28px',
                color: '#ffffff',
                background: 'rgba(7, 23, 55, 0.22)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.6 }}>
                “Bercerita itu bukan tanda lemah. Itu tanda kamu mau ditolong dengan cara yang sehat.”
              </Typography>
            </Paper>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, gap: 2.5 }}>
        <FeatureCard
          icon={<ForumRoundedIcon sx={{ fontSize: 24 }} />}
          eyebrow="Percakapan"
          title="Surat pribadi ke Guru BK"
          description="Tulis apa yang sedang kamu rasakan, lalu cek balasan tanpa perlu keluar dari dashboard."
          action="Buka Surat"
          accent="linear-gradient(135deg, rgba(26,115,232,0.10) 0%, rgba(123,198,255,0.20) 100%)"
          onClick={() => router.navigate({ to: '/student/send-letter' })}
        />
        <FeatureCard
          icon={<FolderOpenRoundedIcon sx={{ fontSize: 24 }} />}
          eyebrow="Pendampingan"
          title="Repository panduan siswa"
          description="Kumpulan materi pengembangan diri, tips belajar, dan dokumen pendukung yang bisa kamu buka kapan saja."
          action="Lihat Materi"
          accent="linear-gradient(135deg, rgba(15,79,191,0.08) 0%, rgba(26,115,232,0.16) 100%)"
          onClick={() => router.navigate({ to: '/student/repository' })}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.2, md: 3 },
          borderRadius: '30px',
          bgcolor: dashboardTone.card,
          border: `1px solid ${dashboardTone.border}`,
          boxShadow: '0 18px 42px rgba(148, 163, 184, 0.10)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <AutoAwesomeRoundedIcon sx={{ color: dashboardTone.primary }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: dashboardTone.primary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Catatan Kecil
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: { xs: '1.08rem', md: '1.2rem' }, fontWeight: 700, color: dashboardTone.text, lineHeight: 1.55 }}>
              Kamu tidak harus menunggu keadaan memburuk untuk mulai bercerita.
            </Typography>
            <Typography sx={{ mt: 1, color: dashboardTone.muted, lineHeight: 1.7, maxWidth: 720 }}>
              Kalau ada hal yang mengganggu fokus, suasana hati, atau hubunganmu di sekolah, kirim surat lebih awal.
              Percakapan yang baik biasanya dimulai dari satu pesan singkat yang jujur.
            </Typography>
          </Box>

          <Button
            onClick={() => router.navigate({ to: '/student/send-letter' })}
            sx={{
              flexShrink: 0,
              borderRadius: '999px',
              px: 2.2,
              py: 1.15,
              textTransform: 'none',
              fontWeight: 800,
              color: dashboardTone.primary,
              bgcolor: dashboardTone.primarySoft,
              '&:hover': { bgcolor: 'rgba(26, 115, 232, 0.16)' },
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
      <Typography sx={{ color: 'rgba(255,255,255,0.74)', fontSize: '0.9rem' }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>{value}</Typography>
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
        p: 2.6,
        borderRadius: '30px',
        cursor: 'pointer',
        bgcolor: '#ffffff',
        border: `1px solid ${dashboardTone.border}`,
        boxShadow: '0 18px 40px rgba(148, 163, 184, 0.10)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 28px 52px rgba(26, 115, 232, 0.14)',
        },
      }}
    >
      <Stack spacing={2.2} sx={{ height: '100%' }}>
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: '18px',
            display: 'grid',
            placeItems: 'center',
            color: dashboardTone.primary,
            background: accent,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.76rem', fontWeight: 800, color: dashboardTone.primary, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.8 }}>
            {eyebrow}
          </Typography>
          <Typography sx={{ fontSize: '1.28rem', fontWeight: 800, color: dashboardTone.text, letterSpacing: '-0.03em', mb: 1 }}>
            {title}
          </Typography>
          <Typography sx={{ color: dashboardTone.muted, lineHeight: 1.7 }}>
            {description}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto', color: dashboardTone.primary, fontWeight: 800 }}>
          <Typography>{action}</Typography>
          <ArrowOutwardRoundedIcon sx={{ fontSize: 18 }} />
        </Stack>
      </Stack>
    </Paper>
  );
}
