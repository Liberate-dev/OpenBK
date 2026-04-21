import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LibraryBooksRoundedIcon from '@mui/icons-material/LibraryBooksRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { apiClient } from '~lib/apiClient';
import { authService } from '~lib/auth';
import { getErrorMessage } from '~lib/error';

export const Route = createFileRoute('/student/repository')({
  component: StudentRepositoryPage,
});

interface RepositoryItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  linkUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  hasFile: boolean;
  createdBy: string;
  createdAt: string | null;
}

const palette = {
  text: '#10233f',
  muted: '#60738f',
  primary: '#1a73e8',
  primaryDeep: '#0f4fbf',
  border: 'rgba(148, 163, 184, 0.18)',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StudentRepositoryPage() {
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient<RepositoryItem[]>('/student/repository');
      setItems(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Gagal memuat repository.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      `${item.title} ${item.summary} ${item.content}`.toLowerCase().includes(query),
    );
  }, [items, search]);

  const handleDownload = (item: RepositoryItem) => {
    const baseUrl = import.meta.env.DEV ? 'http://localhost:8000' : '';
    const token = authService.getSession()?.token || '';
    window.open(`${baseUrl}/api/v1/student/repository/${item.id}/download?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Card
        elevation={0}
        sx={{
          borderRadius: '30px',
          border: `1px solid ${palette.border}`,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15,79,191,0.96) 0%, rgba(26,115,232,0.96) 45%, rgba(123,198,255,0.86) 100%)',
          color: '#ffffff',
          boxShadow: '0 28px 70px rgba(26, 115, 232, 0.18)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.2 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.1 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '14px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  <LibraryBooksRoundedIcon sx={{ color: '#ffffff' }} />
                </Box>
                <Typography sx={{ fontSize: { xs: '1.7rem', md: '2rem' }, fontWeight: 900, letterSpacing: '-0.04em' }}>
                  Repository
                </Typography>
              </Stack>
              <Typography sx={{ maxWidth: 680, color: 'rgba(255,255,255,0.84)', lineHeight: 1.7 }}>
                Materi pendukung dari Guru BK untuk membantumu belajar, menjaga fokus, dan memahami langkah yang bisa diambil saat keadaan terasa berat.
              </Typography>
            </Box>

            <Box
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: '18px',
                bgcolor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <Typography sx={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                Total Materi
              </Typography>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 900 }}>
                {items.length}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${palette.border}`,
          boxShadow: '0 18px 40px rgba(148, 163, 184, 0.10)',
        }}
      >
        <CardContent sx={{ p: 2.2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              placeholder="Cari materi, topik, atau isi panduan..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: '#7b8ba3' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '16px',
                  bgcolor: '#f8fbff',
                },
              }}
            />

            <Chip
              label={`${filteredItems.length} hasil`}
              sx={{
                alignSelf: { xs: 'flex-start', md: 'center' },
                height: 38,
                px: 1,
                borderRadius: '999px',
                bgcolor: 'rgba(26, 115, 232, 0.10)',
                color: palette.primaryDeep,
                fontWeight: 800,
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      {error ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: '24px',
            border: '1px solid rgba(228, 71, 71, 0.18)',
            bgcolor: 'rgba(255, 244, 244, 0.9)',
          }}
        >
          <CardContent>
            <Typography sx={{ color: '#c43b3b', fontWeight: 700 }}>{error}</Typography>
          </CardContent>
        </Card>
      ) : null}

      {filteredItems.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: '30px',
            border: `1px dashed ${palette.border}`,
            bgcolor: 'rgba(255,255,255,0.8)',
          }}
        >
          <CardContent sx={{ py: 7, textAlign: 'center' }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '24px',
                display: 'grid',
                placeItems: 'center',
                mx: 'auto',
                mb: 2,
                bgcolor: 'rgba(26, 115, 232, 0.10)',
              }}
            >
              <LibraryBooksRoundedIcon sx={{ color: palette.primary, fontSize: 34 }} />
            </Box>
            <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: palette.text, mb: 1 }}>
              Belum ada materi yang cocok
            </Typography>
            <Typography sx={{ color: palette.muted }}>
              Coba kata kunci lain atau tunggu materi baru dari Guru BK.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' }, gap: 2.2 }}>
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              elevation={0}
              sx={{
                borderRadius: '28px',
                border: `1px solid ${palette.border}`,
                boxShadow: '0 20px 44px rgba(148, 163, 184, 0.10)',
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 28px 56px rgba(26, 115, 232, 0.14)',
                },
              }}
            >
              <CardContent sx={{ p: 2.4 }}>
                <Stack spacing={2.1} sx={{ height: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.1 }}>
                        <Chip
                          label="Materi BK"
                          sx={{
                            height: 30,
                            borderRadius: '999px',
                            bgcolor: 'rgba(26, 115, 232, 0.10)',
                            color: palette.primaryDeep,
                            fontWeight: 800,
                          }}
                        />
                        <Typography sx={{ fontSize: '0.8rem', color: palette.muted }}>
                          Oleh {item.createdBy}
                        </Typography>
                      </Stack>

                      <Typography sx={{ fontSize: '1.28rem', fontWeight: 800, color: palette.text, letterSpacing: '-0.03em', mb: 0.8 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ color: palette.text, fontWeight: 700, lineHeight: 1.55 }}>
                        {item.summary}
                      </Typography>
                    </Box>

                    {item.hasFile ? (
                      <Button
                        onClick={() => handleDownload(item)}
                        variant="contained"
                        disableElevation
                        startIcon={<DownloadRoundedIcon />}
                        sx={{
                          flexShrink: 0,
                          borderRadius: '999px',
                          px: 1.7,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 800,
                          bgcolor: palette.primary,
                          '&:hover': { bgcolor: palette.primaryDeep },
                        }}
                      >
                        Unduh
                      </Button>
                    ) : null}
                  </Stack>

                  <Typography sx={{ color: palette.muted, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    {item.hasFile && (
                      <Chip
                        icon={<AttachFileRoundedIcon sx={{ fontSize: 16 }} />}
                        label={item.fileSize ? `${item.fileName || 'File'} • ${formatFileSize(item.fileSize)}` : item.fileName || 'File'}
                        sx={{
                          maxWidth: '100%',
                          borderRadius: '999px',
                          bgcolor: '#f4f8ff',
                          color: palette.primaryDeep,
                          fontWeight: 700,
                        }}
                      />
                    )}

                    {item.createdAt && (
                      <Chip
                        label={new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                        sx={{
                          borderRadius: '999px',
                          bgcolor: 'rgba(15, 79, 191, 0.06)',
                          color: palette.muted,
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Stack>

                  {item.linkUrl ? (
                    <Button
                      component="a"
                      href={item.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      endIcon={<ArrowOutwardRoundedIcon />}
                      startIcon={<LinkRoundedIcon />}
                      sx={{
                        alignSelf: 'flex-start',
                        mt: 'auto',
                        px: 0,
                        py: 0,
                        textTransform: 'none',
                        fontWeight: 800,
                        color: palette.primary,
                        '&:hover': {
                          bgcolor: 'transparent',
                          color: palette.primaryDeep,
                        },
                      }}
                    >
                      Buka Link Referensi
                    </Button>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  );
}
