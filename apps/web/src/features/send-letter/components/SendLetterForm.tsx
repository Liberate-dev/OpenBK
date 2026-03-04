import React, { FormEvent, useMemo, useState, useEffect, useCallback, Suspense } from "react";
import {
  Alert, Button, Paper, Stack, TextField, Typography, CircularProgress,
  Box, IconButton, Tooltip, Divider, Badge, Dialog, DialogTitle,
  DialogContent, DialogActions, useMediaQuery, useTheme
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import SendIcon from "@mui/icons-material/Send";
import LogoutIcon from "@mui/icons-material/Logout";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { motion, AnimatePresence } from "framer-motion";
import { useSendLetter } from "~features/send-letter/hooks/useSendLetter";
import { authService } from "~lib/auth";
import { useRouter } from "@tanstack/react-router";
import { apiClient } from "~lib/apiClient";
import { getErrorMessage } from "~lib/error";

const PaperPlaneSubmit = React.lazy(() => import("./motion/PaperPlaneSubmit"));

const MAX_CHAR = 500;

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

export function SendLetterForm() {
  const [message, setMessage] = useState("");
  const sendLetter = useSendLetter();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const remaining = useMemo(() => MAX_CHAR - message.length, [message]);

  // History state
  const [letters, setLetters] = useState<Letter[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      const data = await apiClient<Letter[]>("/messages/history");
      setLetters(data);
    } catch {
      // silently fail — history is supplementary
    } finally {
      setHistoryLoading(false);
    }
  }, []);

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

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Refetch history after successful send
  useEffect(() => {
    if (sendLetter.isSuccess) {
      fetchHistory();
    }
  }, [sendLetter.isSuccess, fetchHistory]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendLetter.mutate({ message: message.trim() });
  };

  const handleLogout = async () => {
    authService.clearSession();
    await router.invalidate();
    router.navigate({ to: "/" });
  };

  return (
    <Stack spacing={3}>
      {/* Send Letter Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)",
            backgroundAttachment: "local",
            backgroundColor: "#f8fafc",
            border: "1px solid",
            borderColor: "divider"
          }}
        >
          <Stack component="form" spacing={3} onSubmit={onSubmit}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, bgcolor: "secondary.light", borderRadius: "50%", display: "flex" }}>
                  <CreateIcon sx={{ color: "secondary.dark" }} />
                </Box>
                <Box>
                  <Typography variant="h5" color="text.primary">Kirim Surat Rahasia</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Identitasmu disembunyikan. Tulis dengan nyaman ya.
                  </Typography>
                </Box>
              </Stack>
              <Tooltip title="Keluar">
                <IconButton onClick={handleLogout} color="error" aria-label="logout">
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <TextField
              placeholder="Mulai ketik cerita kamu disini..."
              multiline
              minRows={7}
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHAR))}
              required
              InputProps={{
                sx: {
                  bgcolor: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3
                }
              }}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color={remaining < 40 ? "error.main" : "text.secondary"} sx={{ fontWeight: 600 }}>
                Sisa karakter: {remaining}
              </Typography>

              <Button
                type="submit"
                variant="contained"
                color="secondary"
                size="large"
                endIcon={<SendIcon />}
                disabled={sendLetter.isPending || message.trim().length === 0}
              >
                {sendLetter.isPending ? "Menerbangkan..." : "Kirim Sekarang"}
              </Button>
            </Stack>

            {sendLetter.isSuccess && (
              <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress color="secondary" /></Box>}>
                <PaperPlaneSubmit />
                <Alert severity="success" sx={{ mt: 2, borderRadius: 3 }}>
                  Yey, suratmu sudah terkirim! 💌 Referensi: <strong>{sendLetter.data.referenceId}</strong>
                </Alert>
              </Suspense>
            )}

            {sendLetter.isError && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>{sendLetter.error.message}</Alert>
            )}
          </Stack>
        </Paper>
      </motion.div>

      {/* Inline Letter History */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.15 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "white"
          }}
        >
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ p: 1, bgcolor: '#f0f9ff', borderRadius: '50%', display: 'flex' }}>
                <MailOutlineIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
                Riwayat Surat & Balasan
              </Typography>
            </Stack>

            {historyLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            )}

            {!historyLoading && letters.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <MailOutlineIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Belum ada surat yang dikirim.
                </Typography>
              </Box>
            )}

            <AnimatePresence>
              {letters.map((letter, idx) => (
                <motion.div
                  key={letter.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Paper
                    elevation={0}
                    onClick={() => setSelectedLetter(letter)}
                    sx={{
                      p: 2, borderRadius: 2, cursor: 'pointer',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: '#f8fafc', borderColor: '#93c5fd', transform: 'translateY(-1px)' }
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8' }}>
                          {new Date(letter.submittedAt).toLocaleString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </Typography>
                        {letter.repliesCount > 0 && (
                          <Badge badgeContent={letter.repliesCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
                            <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                          </Badge>
                        )}
                      </Stack>
                      <Typography sx={{
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden', textOverflow: 'ellipsis', color: '#1e293b', fontSize: '0.9rem',
                        lineHeight: 1.5
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

      {/* Letter Detail Dialog */}
      <Dialog open={!!selectedLetter} onClose={() => { setSelectedLetter(null); setReplyText(''); setReplyError(''); }} fullWidth maxWidth="sm" fullScreen={isMobile}>
        {selectedLetter && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Suratmu</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5}>
                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.95rem' }}>
                    {selectedLetter.body}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Dikirim: {new Date(selectedLetter.submittedAt).toLocaleString('id-ID')}
                </Typography>

                <Divider />

                <Stack direction="row" spacing={1} alignItems="center">
                  <ChatBubbleOutlineIcon sx={{ color: '#64748b', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Balasan Guru BK ({selectedLetter.replies.length})
                  </Typography>
                </Stack>

                {selectedLetter.replies.length > 0 ? (
                  <Stack spacing={1.5}>
                    {selectedLetter.replies.map((r) => (
                      <Box key={r.id} sx={{ bgcolor: r.isOwnReply ? '#f8fafc' : '#f0f9ff', p: 2, borderRadius: 2, borderLeft: r.isOwnReply ? '3px solid #94a3b8' : '3px solid #3b82f6' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0.5 }}>{r.body}</Typography>
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
    </Stack>
  );
}
