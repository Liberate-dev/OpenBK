import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import KeyIcon from '@mui/icons-material/Key';
import LogoutIcon from '@mui/icons-material/Logout';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { apiClient } from '~lib/apiClient';
import { getErrorMessage } from '~lib/error';
import { publicReportApiClient } from '~lib/publicReportApiClient';
import { publicReportSessionService } from '~lib/publicReportSession';

export const Route = createFileRoute('/lapor')({
  component: PublicReportPage,
});

interface GenerateTokenResponse {
  challenge_id: number;
  challenge_token: string;
  generated_token: string;
  expires_at: string;
}

interface VerifyTokenResponse {
  session_token: string;
  expires_at: string;
  reporter: {
    nip: string;
    aliasName: string;
    description?: string | null;
  };
}

interface SubmitReportResponse {
  referenceId: string;
}

function PublicReportPage() {
  const [step, setStep] = useState<'auth' | 'form'>(() =>
    publicReportSessionService.isAuthenticated() ? 'form' : 'auth',
  );
  const [authForm, setAuthForm] = useState({
    nip: publicReportSessionService.getSession()?.reporter.nip ?? '',
    aliasName: publicReportSessionService.getSession()?.reporter.aliasName ?? '',
    loginToken: '',
  });
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const [challengeToken, setChallengeToken] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [tokenExpiresAt, setTokenExpiresAt] = useState('');
  const [reportForm, setReportForm] = useState({
    studentName: '',
    studentClass: '',
    studentNis: '',
    summary: '',
    message: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const session = publicReportSessionService.getSession();
  const reporterLabel = useMemo(() => {
    if (!session) return '';
    return `${session.reporter.aliasName} (${session.reporter.nip})`;
  }, [session]);

  const handleGenerateToken = async () => {
    try {
      setLoadingGenerate(true);
      setError('');
      setSuccess('');

      const result = await apiClient<GenerateTokenResponse>('/report-access/generate-token', {
        method: 'POST',
        body: JSON.stringify({
          nip: authForm.nip,
          alias_name: authForm.aliasName,
        }),
      });

      setChallengeId(result.challenge_id);
      setChallengeToken(result.challenge_token);
      setGeneratedToken(result.generated_token);
      setTokenExpiresAt(result.expires_at);
      setSuccess('Token berhasil dibuat. Lanjut masukkan token untuk membuka form.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal membuat token verifikasi.'));
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!challengeId || !challengeToken) {
      setError('Generate token terlebih dahulu.');
      return;
    }

    try {
      setLoadingVerify(true);
      setError('');
      setSuccess('');

      const result = await apiClient<VerifyTokenResponse>('/report-access/verify-token', {
        method: 'POST',
        body: JSON.stringify({
          challenge_id: challengeId,
          challenge_token: challengeToken,
          login_token: authForm.loginToken,
        }),
      });

      publicReportSessionService.saveSession({
        token: result.session_token,
        expiresAt: result.expires_at,
        reporter: result.reporter,
      });

      setAuthForm((prev) => ({ ...prev, loginToken: '' }));
      setGeneratedToken('');
      setTokenExpiresAt('');
      setStep('form');
      setSuccess('Token berhasil diverifikasi. Anda bisa langsung kirim laporan.');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memverifikasi token.'));
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoadingSubmit(true);
      setError('');
      setSuccess('');

      const result = await publicReportApiClient<SubmitReportResponse>('/public-reports', {
        method: 'POST',
        body: JSON.stringify({
          student_name: reportForm.studentName,
          student_class: reportForm.studentClass || null,
          student_nis: reportForm.studentNis || null,
          summary: reportForm.summary,
          message: reportForm.message,
        }),
      });

      publicReportSessionService.clearSession();
      setStep('auth');
      setChallengeId(null);
      setChallengeToken('');
      setGeneratedToken('');
      setTokenExpiresAt('');
      setReportForm({
        studentName: '',
        studentClass: '',
        studentNis: '',
        summary: '',
        message: '',
      });
      setSuccess(`Laporan berhasil dikirim. Referensi: ${result.referenceId}`);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Gagal mengirim laporan.');
      if (message.toLowerCase().includes('session pelapor')) {
        publicReportSessionService.clearSession();
        setStep('auth');
      }
      setError(message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleResetSession = () => {
    publicReportSessionService.clearSession();
    setStep('auth');
    setChallengeId(null);
    setChallengeToken('');
    setGeneratedToken('');
    setTokenExpiresAt('');
    setError('');
    setSuccess('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#f8fafc',
        background:
          'radial-gradient(circle at top left, rgba(59,130,246,0.12), transparent 32%), radial-gradient(circle at top right, rgba(14,165,233,0.10), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #f8fafc 100%)',
        py: { xs: 4, md: 7 },
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 860, mx: 'auto' }}>
        <Stack spacing={{ xs: 3.5, md: 5 }}>
          <Box
            sx={{
              px: { xs: 2.5, md: 4 },
              py: { xs: 3, md: 4 },
              borderRadius: '32px',
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.78) 0%, rgba(239,246,255,0.9) 100%)',
              border: '1px solid rgba(191,219,254,0.85)',
              boxShadow: '0 20px 50px rgba(148,163,184,0.14)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                color: '#0f172a',
                fontSize: { xs: '2rem', md: '2.75rem' },
                lineHeight: 1.05,
                mb: 1.5,
              }}
            >
              Lapor ke Guru BK
            </Typography>
            <Typography sx={{ color: '#475569', maxWidth: 700, fontSize: { xs: '0.98rem', md: '1.05rem' } }}>
              Halaman ini bisa dipasang di subdomain atau dipakai langsung lewat `/lapor`. Akses hanya untuk NIP yang sudah dikenali admin, dan token generate berlaku 5 menit.
            </Typography>
          </Box>

          <Stack
            spacing={3}
            sx={{
              position: 'relative',
              px: { xs: 2.5, md: 4 },
              py: { xs: 3, md: 4 },
              borderRadius: '32px',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(248,250,252,0.88) 100%)',
              border: '1px solid rgba(226,232,240,0.9)',
              boxShadow: '0 24px 60px rgba(148,163,184,0.12)',
              backdropFilter: 'blur(14px)',
            }}
          >
            {success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            {step === 'auth' ? (
              <Stack spacing={3}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <VerifiedUserIcon sx={{ color: '#1d4ed8' }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    Verifikasi Pelapor
                  </Typography>
                </Stack>

                <TextField
                  label="NIP"
                  value={authForm.nip}
                  onChange={(event) => setAuthForm((prev) => ({
                    ...prev,
                    nip: event.target.value.replace(/\D/g, '').slice(0, 30),
                  }))}
                  fullWidth
                />
                <TextField
                  label="Alias"
                  value={authForm.aliasName}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, aliasName: event.target.value }))}
                  fullWidth
                  helperText="Alias ini harus sama dengan yang didaftarkan oleh admin."
                />
                <Button
                  variant="contained"
                  startIcon={<KeyIcon />}
                  disabled={loadingGenerate || !authForm.nip || !authForm.aliasName}
                  onClick={handleGenerateToken}
                  sx={{ alignSelf: 'flex-start', bgcolor: '#1d4ed8', fontWeight: 700 }}
                >
                  {loadingGenerate ? 'Membuat Token...' : 'Generate Token'}
                </Button>

                {generatedToken && (
                  <Alert severity="info">
                    Token: <strong>{generatedToken}</strong>
                    {tokenExpiresAt ? ` | Berlaku sampai ${new Date(tokenExpiresAt).toLocaleTimeString('id-ID')}` : ''}
                  </Alert>
                )}

                <Divider />

                <TextField
                  label="Masukkan Token 6 Digit"
                  value={authForm.loginToken}
                  onChange={(event) => setAuthForm((prev) => ({
                    ...prev,
                    loginToken: event.target.value.replace(/\D/g, '').slice(0, 6),
                  }))}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  disabled={loadingVerify || authForm.loginToken.length !== 6}
                  onClick={handleVerifyToken}
                  sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
                >
                  {loadingVerify ? 'Memverifikasi...' : 'Verifikasi Token'}
                </Button>
              </Stack>
            ) : (
              <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
                  <Box>
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.8 }}>
                      <AssignmentIcon sx={{ color: '#1d4ed8' }} />
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Isi Laporan Kasus
                      </Typography>
                    </Stack>
                    <Typography sx={{ color: '#475569' }}>
                      Pelapor aktif: <strong>{reporterLabel}</strong>
                    </Typography>
                  </Box>
                  <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleResetSession}>
                    Ganti NIP
                  </Button>
                </Stack>

                <TextField
                  label="Nama Siswa"
                  value={reportForm.studentName}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, studentName: event.target.value }))}
                  fullWidth
                />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label="Kelas"
                    value={reportForm.studentClass}
                    onChange={(event) => setReportForm((prev) => ({ ...prev, studentClass: event.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="NIS Siswa (opsional)"
                    value={reportForm.studentNis}
                    onChange={(event) => setReportForm((prev) => ({
                      ...prev,
                      studentNis: event.target.value.replace(/\D/g, '').slice(0, 30),
                    }))}
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Ringkasan Kasus"
                  value={reportForm.summary}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, summary: event.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Detail Laporan"
                  value={reportForm.message}
                  onChange={(event) => setReportForm((prev) => ({ ...prev, message: event.target.value }))}
                  multiline
                  minRows={8}
                  fullWidth
                  helperText="Jelaskan kondisi siswa, konteks kejadian, dan alasan perlu ditindaklanjuti Guru BK."
                />
                <Button
                  variant="contained"
                  disabled={loadingSubmit || !reportForm.studentName || !reportForm.summary || !reportForm.message}
                  onClick={handleSubmit}
                  sx={{ alignSelf: 'flex-start', bgcolor: '#1d4ed8', fontWeight: 700, px: 3 }}
                >
                  {loadingSubmit ? 'Mengirim...' : 'Kirim Laporan'}
                </Button>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
