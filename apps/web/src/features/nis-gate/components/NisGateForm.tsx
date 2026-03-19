import { FormEvent, useState } from "react";
import { Alert, Button, Paper, Stack, TextField, Typography, Box, Tabs, Tab } from "@mui/material";
import { useLoginNis } from "~features/nis-gate/hooks/useLoginNis";
import { useRegisterNis } from "~features/nis-gate/hooks/useRegisterNis";
import { useRequestPasswordReset } from "~features/nis-gate/hooks/useRequestPasswordReset";
import { authService } from "~lib/auth";
import { useRouter } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import BadgeIcon from "@mui/icons-material/Badge";

export function NisGateForm() {
  const [tab, setTab] = useState<0 | 1>(0); // 0 = Masuk, 1 = Daftar
  const [nis, setNis] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const loginMutation = useLoginNis();
  const registerMutation = useRegisterNis();
  const passwordResetRequestMutation = useRequestPasswordReset();
  const router = useRouter();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue as 0 | 1);
    setLocalError("");
    loginMutation.reset();
    registerMutation.reset();
    passwordResetRequestMutation.reset();
  };

  const handleForgotPassword = () => {
    setLocalError("");

    if (nis.trim().length < 4) {
      setLocalError("Isi NIS dulu sebelum mengirim request reset password.");
      return;
    }

    passwordResetRequestMutation.mutate(nis.trim());
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError("");

    if (nis.length < 4) {
      setLocalError("NIS terlalu pendek.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password minimal 6 karakter.");
      return;
    }

    if (tab === 1 && password !== confirmPassword) {
      setLocalError("Konfirmasi password tidak cocok.");
      return;
    }

    if (tab === 0) {
      // Login
      loginMutation.mutate({ nis: nis.trim(), passwordHash: password }, {
        onSuccess: async (result) => {
          if (result.success && result.sessionToken) {
            authService.setSession({ nis: nis.trim(), token: result.sessionToken, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
            await router.invalidate();
            router.navigate({ to: "/send-letter" });
          }
        },
        onError: (error) => {
          console.error("Login Error:", error);
        }
      });
    } else {
      // Register
      registerMutation.mutate({ nis: nis.trim(), passwordHash: password }, {
        onSuccess: async (result) => {
          if (result.success && result.sessionToken) {
            authService.setSession({ nis: nis.trim(), token: result.sessionToken, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
            await router.invalidate();
            router.navigate({ to: "/send-letter" });
          }
        },
        onError: (error) => {
          console.error("Register Error:", error);
        }
      });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;
  const serverMsg = tab === 0 ? loginMutation.data : registerMutation.data;

  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, mx: "auto", maxWidth: 450, borderRadius: 4, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, bgcolor: "primary.main" }} />

        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            <BadgeIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography variant="h4" color="primary.main">Gerbang Siswa</Typography>
          </Stack>

          <Typography color="text.secondary" align="center" sx={{ fontSize: "1rem" }}>
            Identitasmu dijaga ketat. Buat sandi agar hanya kamu yang bisa cek status suratmu nanti. 🔒
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
              <Tab label="Masuk" id="tab-0" />
              <Tab label="Daftar Baru" id="tab-1" />
            </Tabs>
          </Box>

          <Stack component="form" spacing={2.5} onSubmit={onSubmit}>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Stack spacing={2.5}>
                  <TextField
                    label="Nomor Induk Siswa (NIS)"
                    variant="outlined"
                    value={nis}
                    onChange={(event) => setNis(event.target.value)}
                    inputMode="numeric"
                    autoComplete="username"
                    required
                    fullWidth
                  />
                  <TextField
                    type="password"
                    label="Kata Sandi Rahasia"
                    variant="outlined"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={tab === 0 ? "current-password" : "new-password"}
                    required
                    fullWidth
                  />
                  {tab === 0 && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -1 }}>
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        onClick={handleForgotPassword}
                        disabled={passwordResetRequestMutation.isPending}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                      >
                        {passwordResetRequestMutation.isPending ? "Mengirim request..." : "Lupa password?"}
                      </Button>
                    </Box>
                  )}
                  {tab === 1 && (
                    <TextField
                      type="password"
                      label="Ulangi Kata Sandi"
                      variant="outlined"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                      fullWidth
                    />
                  )}
                </Stack>
              </motion.div>
            </AnimatePresence>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ py: 1.5, fontSize: "1.1rem", mt: 2 }}
            >
              {isLoading ? "Memproses..." : tab === 0 ? "Masuk ke Open BK 🚀" : "Buat Sandi & Lanjut 📝"}
            </Button>

            {localError && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>{localError}</Alert>
            )}

            {serverMsg && (
              <Alert severity={serverMsg.success ? "success" : "warning"} sx={{ borderRadius: 2 }}>
                {serverMsg.message}
              </Alert>
            )}

            {passwordResetRequestMutation.data && (
              <Alert severity={passwordResetRequestMutation.data.success ? "success" : "warning"} sx={{ borderRadius: 2 }}>
                {passwordResetRequestMutation.data.message}
              </Alert>
            )}

            {(loginMutation.error || registerMutation.error || passwordResetRequestMutation.error) && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {passwordResetRequestMutation.error?.message || loginMutation.error?.message || registerMutation.error?.message || "Terjadi kesalahan pada server."}
              </Alert>
            )}
          </Stack>
        </Stack>
      </Paper>
    </motion.div>
  );
}
