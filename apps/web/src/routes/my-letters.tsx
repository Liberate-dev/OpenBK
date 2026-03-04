import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import {
  Paper, Stack, Typography, Box, Button, CircularProgress, Alert, Container,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Badge, useMediaQuery, useTheme, TextField
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '~lib/apiClient';
import { authService } from '~lib/auth';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/my-letters')({
  beforeLoad: () => {
    const session = authService.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }
  },
  component: StudentLetterHistory,
});

interface LetterReply {
  id: number;
  body: string;
  adminName: string | null;
  isOwnReply: boolean;
  createdAt: string;
}

interface Letter {
  id: string;
  preview: string;
  body: string;
  riskLevel: string;
  submittedAt: string;
  repliesCount: number;
  replies: LetterReply[];
}

function StudentLetterHistory() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');

  const handleReply = async () => {
    if (!selectedLetter || !replyText.trim()) return;
    setReplySending(true);
    setReplyError('');
    try {
      const result = await apiClient<{ success: boolean; reply: LetterReply }>(
        `/messages/${selectedLetter.id}/reply`,
        { method: 'POST', body: JSON.stringify({ body: replyText.trim() }) }
      );

      const newLetter = {
        ...selectedLetter,
        replies: [...selectedLetter.replies, result.reply],
        repliesCount: selectedLetter.replies.length + 1
      };
      setSelectedLetter(newLetter);
      setLetters(letters.map(l => l.id === newLetter.id ? newLetter : l));
      setReplyText('');
    } catch (err: unknown) {
      setReplyError(getErrorMessage(err, 'Gagal mengirim balasan.'));
    } finally {
      setReplySending(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiClient<Letter[]>('/messages/history');
      setLetters(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat riwayat surat.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <Box sx={{
      minHeight: '100vh', width: '100%', bgcolor: '#f8fafc',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      py: { xs: 3, md: 6 }, px: 2
    }}>
      <Container maxWidth="sm">
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.navigate({ to: '/send-letter' })}
              sx={{ color: '#475569', fontWeight: 600 }}
            >
              Kembali
            </Button>
          </Stack>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <Paper elevation={0} sx={{
              p: { xs: 3, md: 4 }, borderRadius: 4,
              border: '1px solid', borderColor: 'divider',
              bgcolor: 'white'
            }}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: '50%', display: 'flex' }}>
                    <MailOutlineIcon sx={{ color: '#3b82f6' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      Riwayat Surat
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Semua surat yang sudah kamu kirim & balasannya.
                    </Typography>
                  </Box>
                </Stack>

                {isLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress color="primary" />
                  </Box>
                )}

                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                {!isLoading && letters.length === 0 && !error && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <MailOutlineIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                    <Typography color="text.secondary">Belum ada surat yang dikirim.</Typography>
                  </Box>
                )}

                <AnimatePresence>
                  {letters.map((letter, idx) => (
                    <motion.div
                      key={letter.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Paper
                        elevation={0}
                        onClick={() => setSelectedLetter(letter)}
                        sx={{
                          p: 2.5, borderRadius: 2, cursor: 'pointer',
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: '#f8fafc', borderColor: '#3b82f6', transform: 'translateY(-1px)' }
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8' }}>
                              {new Date(letter.submittedAt).toLocaleString('id-ID')}
                            </Typography>
                            {letter.repliesCount > 0 && (
                              <Badge badgeContent={letter.repliesCount} color="primary">
                                <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                              </Badge>
                            )}
                          </Stack>
                          <Typography sx={{
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                            overflow: 'hidden', textOverflow: 'ellipsis', color: '#1e293b', fontSize: '0.95rem'
                          }}>
                            {letter.preview}
                          </Typography>
                        </Stack>
                      </Paper>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Stack>
            </Paper>
          </motion.div>
        </Stack>
      </Container>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLetter} onClose={() => { setSelectedLetter(null); setReplyText(''); setReplyError(''); }} fullWidth maxWidth="sm" fullScreen={isMobile}>
        {selectedLetter && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
              Suratmu
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {selectedLetter.body}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Dikirim: {new Date(selectedLetter.submittedAt).toLocaleString('id-ID')}
                </Typography>

                <Divider />

                <Stack direction="row" spacing={1} alignItems="center">
                  <ChatBubbleOutlineIcon sx={{ color: '#64748b', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Balasan Guru BK ({selectedLetter.replies.length})
                  </Typography>
                </Stack>

                {selectedLetter.replies.length > 0 ? (
                  <Stack spacing={2}>
                    {selectedLetter.replies.map((r) => (
                      <Box key={r.id} sx={{ bgcolor: r.isOwnReply ? '#f8fafc' : '#f0f9ff', p: 2, borderRadius: 2, borderLeft: r.isOwnReply ? '4px solid #94a3b8' : '4px solid #3b82f6' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                          {r.body}
                        </Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="caption" sx={{ fontWeight: 600, color: r.isOwnReply ? '#64748b' : '#3b82f6' }}>
                            {r.isOwnReply ? 'Kamu' : (r.adminName || 'Guru BK')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(r.createdAt).toLocaleString('id-ID')}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Belum ada balasan dari Guru BK. Sabar ya 💙
                  </Typography>
                )}

                <Divider />
                <Stack spacing={2}>
                  <TextField
                    label="Kirim Balasan"
                    multiline
                    minRows={2}
                    value={replyText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setReplyText(e.target.value)}
                    fullWidth
                    placeholder="Tulis balasanmu di sini..."
                  />
                  {replyError && <Alert severity="error" sx={{ borderRadius: 2 }}>{replyError}</Alert>}
                  <Button
                    variant="contained"
                    onClick={handleReply}
                    disabled={replySending || !replyText.trim()}
                    sx={{ alignSelf: 'flex-end', bgcolor: '#3b82f6', fontWeight: 700, borderRadius: 2, px: 3 }}
                  >
                    {replySending ? 'MENGIRIM...' : 'KIRIM'}
                  </Button>
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setSelectedLetter(null); setReplyText(''); setReplyError(''); }} color="primary">Tutup</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
