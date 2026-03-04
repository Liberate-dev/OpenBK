import { useMemo, useState, useCallback } from "react";
import {
  Chip, Divider, Paper, Stack, Typography, useTheme, List, ListItemButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl,
  InputLabel, Select, MenuItem, Box, Container, TextField, CircularProgress,
  Alert, useMediaQuery, Badge
} from "@mui/material";
import ReplyIcon from "@mui/icons-material/Reply";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useAdminInbox } from "~features/admin-inbox/hooks/useAdminInbox";
import type { InboxMessage, RiskLevel } from "~features/admin-inbox/types/admin-inbox.types";
import { useAdminLayoutFilters } from "~features/admin-layout/adminLayoutFilters";
import { apiClient } from "~lib/apiClient";
import { getErrorMessage } from "~lib/error";

const priorityWeight: Record<RiskLevel, number> = {
  low: 0, medium: 1, high: 2, critical: 3
};

interface MessageDetail {
  id: string;
  body: string;
  authorNis: string;
  riskLevel: string;
  riskScore: number;
  riskTags: string[];
  submittedAt: string;
  replies: Array<{
    id: number;
    body: string;
    adminName: string | null;
    studentNis: string | null;
    createdAt: string;
  }>;
}

export function AdminInboxList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { searchTerm, dateFilter } = useAdminLayoutFilters();
  const { data, refetch } = useAdminInbox();
  const [filter, setFilter] = useState<RiskLevel | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MessageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replySuccess, setReplySuccess] = useState("");

  const sortedMessages = useMemo(() => {
    let filtered = [...data];
    if (filter !== "ALL") {
      filtered = filtered.filter((m) => m.riskLevel === filter);
    }
    const query = searchTerm.trim().toLowerCase();
    if (query !== "") {
      filtered = filtered.filter((m) => {
        const haystack = `${m.id} ${m.authorNis} ${m.preview} ${m.riskLevel}`.toLowerCase();
        return haystack.includes(query);
      });
    }
    if (dateFilter !== "") {
      filtered = filtered.filter((m) => m.submittedAt.startsWith(dateFilter));
    }
    return filtered.sort((a, b) => {
      const byRisk = priorityWeight[b.riskLevel] - priorityWeight[a.riskLevel];
      if (byRisk !== 0) return byRisk;
      return Date.parse(b.submittedAt) - Date.parse(a.submittedAt);
    });
  }, [data, filter, searchTerm, dateFilter]);

  const riskColorMap: Record<RiskLevel, string> = {
    low: theme.palette.risk.low,
    medium: theme.palette.risk.medium,
    high: theme.palette.risk.high,
    critical: theme.palette.risk.critical
  };

  const openDetail = useCallback(async (referenceId: string) => {
    setSelectedId(referenceId);
    setDetailLoading(true);
    setDetail(null);
    setReplyText("");
    setReplyError("");
    setReplySuccess("");
    try {
      const data = await apiClient<MessageDetail>(`/admin/messages/${referenceId}`);
      setDetail(data);
    } catch (err: unknown) {
      setReplyError(getErrorMessage(err, "Gagal memuat detail surat."));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const handleReply = async () => {
    if (!detail || !replyText.trim()) return;
    setReplySending(true);
    setReplyError("");
    setReplySuccess("");
    try {
      const result = await apiClient<{ success: boolean; reply: MessageDetail['replies'][0] }>(
        `/admin/messages/${detail.id}/reply`,
        { method: 'POST', body: JSON.stringify({ body: replyText.trim() }) }
      );
      setDetail(prev => prev ? { ...prev, replies: [...prev.replies, result.reply] } : prev);
      setReplyText("");
      setReplySuccess("Balasan terkirim!");
      refetch();
    } catch (err: unknown) {
      setReplyError(getErrorMessage(err, "Gagal mengirim balasan."));
    } finally {
      setReplySending(false);
    }
  };

  return (
    <Container maxWidth="xl" disableGutters>
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 1.5, border: "1px solid #e2e8f0" }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', mb: 1 }}>Kotak Masuk</Typography>
              <Typography sx={{ color: '#64748b', fontSize: '1rem' }}>
                Urutan prioritas berdasarkan severity risiko. Klik untuk detail & balas.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter Risiko</InputLabel>
                <Select value={filter} label="Filter Risiko" onChange={(e) => setFilter(e.target.value as RiskLevel | "ALL")}>
                  <MenuItem value="ALL">Semua</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
          <Divider />
          <List disablePadding>
            {sortedMessages.map((message) => (
              <InboxRow
                key={message.id}
                message={message}
                badgeColor={riskColorMap[message.riskLevel]}
                onClick={() => openDetail(message.id)}
              />
            ))}
            {sortedMessages.length === 0 && (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                Tidak ada surat yang sesuai kriteria.
              </Typography>
            )}
          </List>
        </Stack>
      </Paper>

      {/* Detail + Reply Dialog */}
      <Dialog open={!!selectedId} onClose={closeDetail} fullWidth maxWidth="sm" fullScreen={isMobile}>
        {detailLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
            <CircularProgress />
          </Box>
        ) : detail ? (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Detail Surat</Typography>
                <Chip
                  label={`${detail.riskLevel.toUpperCase()} (${detail.riskScore})`}
                  size="small"
                  sx={{ color: "#fff", backgroundColor: riskColorMap[detail.riskLevel as RiskLevel] || '#94a3b8', fontWeight: 700 }}
                />
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                {/* Message body */}
                <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                    {detail.body}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary">
                    <strong>ID:</strong> {detail.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Pengirim:</strong> NIS {detail.authorNis}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Dikirim:</strong> {new Date(detail.submittedAt).toLocaleString("id-ID")}
                  </Typography>
                </Stack>

                {detail.riskTags && detail.riskTags.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {detail.riskTags.map((tag, i) => (
                      <Chip key={i} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                    ))}
                  </Stack>
                )}

                {/* Replies thread */}
                <Divider />
                <Stack direction="row" spacing={1} alignItems="center">
                  <ChatBubbleOutlineIcon sx={{ color: '#64748b', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Balasan ({detail.replies.length})
                  </Typography>
                </Stack>

                {detail.replies.length > 0 ? (
                  <Stack spacing={2}>
                    {detail.replies.map((r) => (
                      <Box key={r.id} sx={{ bgcolor: r.adminName ? '#f0f9ff' : '#f8fafc', p: 2, borderRadius: 2, borderLeft: r.adminName ? '4px solid #3b82f6' : '4px solid #94a3b8' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>{r.body}</Typography>
                        <Stack direction="row" spacing={1.5}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: r.adminName ? '#3b82f6' : '#64748b' }}>
                            {r.adminName ? r.adminName : `Siswa (NIS: ${r.studentNis})`}
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
                    Belum ada balasan.
                  </Typography>
                )}

                {/* Reply form */}
                <Divider />
                <Stack spacing={2}>
                  <TextField
                    label="Tulis Balasan"
                    multiline
                    minRows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    fullWidth
                    placeholder="Tulis balasan untuk siswa..."
                  />
                  {replyError && <Alert severity="error" sx={{ borderRadius: 2 }}>{replyError}</Alert>}
                  {replySuccess && <Alert severity="success" sx={{ borderRadius: 2 }}>{replySuccess}</Alert>}
                  <Button
                    variant="contained"
                    startIcon={replySending ? <CircularProgress size={18} color="inherit" /> : <ReplyIcon />}
                    onClick={handleReply}
                    disabled={replySending || !replyText.trim()}
                    sx={{ alignSelf: 'flex-end', bgcolor: '#1c67f2', fontWeight: 700, borderRadius: 2, px: 3 }}
                  >
                    {replySending ? 'Mengirim...' : 'Kirim Balasan'}
                  </Button>
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDetail} color="primary">Tutup</Button>
            </DialogActions>
          </>
        ) : (
          <Box sx={{ p: 4 }}>
            {replyError && <Alert severity="error">{replyError}</Alert>}
          </Box>
        )}
      </Dialog>
    </Container>
  );
}

interface InboxRowProps {
  message: InboxMessage;
  badgeColor: string;
  onClick: () => void;
}

function InboxRow({ message, badgeColor, onClick }: InboxRowProps) {
  return (
    <>
      <ListItemButton onClick={onClick} alignItems="flex-start" sx={{ px: 2, py: 2, borderRadius: 1 }}>
        <Stack spacing={1} sx={{ width: "100%" }}>
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>{message.id}</Typography>
              {message.hasReplies && (
                <Badge color="primary" variant="dot">
                  <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                </Badge>
              )}
            </Stack>
            <Chip
              label={`${message.riskLevel.toUpperCase()} (${message.riskScore})`}
              size="small"
              sx={{ color: "#fff", backgroundColor: badgeColor, fontWeight: 700, borderRadius: 1 }}
            />
          </Stack>
          <Typography sx={{
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569', fontSize: '0.9375rem'
          }}>
            {message.preview}
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              NIS {message.authorNis}
            </Typography>
            <Typography variant="caption" color="text.secondary">|</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(message.submittedAt).toLocaleString("id-ID")}
            </Typography>
          </Stack>
        </Stack>
      </ListItemButton>
      <Divider component="li" />
    </>
  );
}
