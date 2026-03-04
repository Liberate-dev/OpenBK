import { FormEvent, useState, useEffect, useRef } from "react";
import { Alert, Button, Paper, Stack, TextField, Typography, Box, CircularProgress } from "@mui/material";
import { adminAuthService } from "~lib/adminAuth";
import { getErrorMessage } from "~lib/error";
import { motion, AnimatePresence } from "framer-motion";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export function AdminLoginForm() {
    // Step 1: credentials, Step 2: OTP
    const [step, setStep] = useState<1 | 2>(1);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [otpId, setOtpId] = useState<number | null>(null);
    const [otpCode, setOtpCode] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (countdown > 0) {
            timerRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [countdown]);

    const onSubmitCredentials = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError("");
        setInfo("");

        try {
            const { adminLogin } = await import("~features/admin-auth/api/adminLogin");
            const result = await adminLogin({ username, password });

            if (result.success && result.requires_2fa && result.otp_id) {
                setOtpId(result.otp_id);
                setInfo(result.message || "Kode OTP telah dikirim ke Email Anda.");
                setStep(2);
                setCountdown(60);
                setIsLoading(false);
            } else if (result.success && result.token) {
                adminAuthService.setSession({
                    username: result.username || "admin",
                    token: result.token,
                    role: result.role || "guru_bk",
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000
                });
                window.location.href = "/admin";
            } else {
                setError(result.message || "Username atau password salah.");
                setIsLoading(false);
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Gagal menghubungi server."));
            setIsLoading(false);
        }
    };

    const onSubmitOtp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!otpId) return;
        setIsLoading(true);
        setError("");

        try {
            const { adminVerifyOtp } = await import("~features/admin-auth/api/adminLogin");
            const result = await adminVerifyOtp({ otp_id: otpId, otp_code: otpCode });

            if (result.success && result.token) {
                adminAuthService.setSession({
                    username: result.username || "admin",
                    token: result.token,
                    role: result.role || "guru_bk",
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000
                });
                window.location.href = "/admin";
            } else {
                setError(result.message || "Kode OTP salah.");
                setIsLoading(false);
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Gagal memverifikasi OTP."));
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setStep(1);
        setOtpCode("");
        setOtpId(null);
        setError("");
        setInfo("");
        setCountdown(0);
    };

    return (
        <Box sx={{
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            p: 2,
            position: "relative",
            overflow: "hidden"
        }}>
            <Box sx={{ position: "absolute", top: -150, right: -100, width: 400, height: 400, borderRadius: "50%", bgcolor: "secondary.light", opacity: 0.1, filter: "blur(60px)", zIndex: 0 }} />
            <Box sx={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", bgcolor: "primary.light", opacity: 0.1, filter: "blur(60px)", zIndex: 0 }} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    style={{ zIndex: 1, width: "100%", maxWidth: 420 }}
                >
                    <Paper elevation={4} sx={{
                        p: { xs: 4, md: 5 },
                        width: "100%",
                        borderRadius: 4,
                        position: "relative",
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)"
                    }}>
                        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: step === 1 ? "linear-gradient(90deg, #1976d2 0%, #9c27b0 100%)" : "linear-gradient(90deg, #9c27b0 0%, #4caf50 100%)" }} />

                        {step === 1 ? (
                            <Stack component="form" spacing={3.5} onSubmit={onSubmitCredentials} sx={{ mt: 1 }}>
                                <Stack spacing={1.5} alignItems="center" justifyContent="center">
                                    <Box sx={{ p: 2, borderRadius: "50%", bgcolor: "secondary.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <LockIcon sx={{ fontSize: 32, color: "secondary.main" }} />
                                    </Box>
                                    <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800 }}>Admin Login</Typography>
                                </Stack>

                                <Typography color="text.secondary" align="center" variant="body2" sx={{ px: 1 }}>
                                    Masuk ke Dashboard untuk melihat dan mengelola laporan siswa secara aman.
                                </Typography>

                                <Stack spacing={2.5}>
                                    <TextField label="Username" variant="outlined" value={username} onChange={(e) => setUsername(e.target.value)} required fullWidth />
                                    <TextField label="Password" type="password" variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
                                </Stack>

                                <Button type="submit" variant="contained" color="secondary" size="large" disabled={isLoading || !username || !password} sx={{ mt: 2, py: 1.5, fontWeight: 700, borderRadius: 2 }}>
                                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Masuk Dashboard"}
                                </Button>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Stack>
                        ) : (
                            <Stack component="form" spacing={3.5} onSubmit={onSubmitOtp} sx={{ mt: 1 }}>
                                <Stack spacing={1.5} alignItems="center" justifyContent="center">
                                    <Box sx={{ p: 2, borderRadius: "50%", bgcolor: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <EmailIcon sx={{ fontSize: 32, color: "#4caf50" }} />
                                    </Box>
                                    <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800 }}>Verifikasi OTP</Typography>
                                </Stack>

                                <AnimatePresence>
                                    {info && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                            <Alert severity="info" sx={{ borderRadius: 2 }}>{info}</Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Typography color="text.secondary" align="center" variant="body2" sx={{ px: 1 }}>
                                    Masukkan 6-digit kode OTP yang dikirim ke Email Anda.
                                </Typography>

                                <TextField
                                    label="Kode OTP"
                                    variant="outlined"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    fullWidth
                                    inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 700 } }}
                                    placeholder="● ● ● ● ● ●"
                                />

                                {countdown > 0 && (
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        Kode berlaku selama <strong>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</strong>
                                    </Typography>
                                )}

                                <Button type="submit" variant="contained" color="success" size="large" disabled={isLoading || otpCode.length < 6} sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}>
                                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Verifikasi & Masuk"}
                                </Button>

                                <Button variant="text" color="inherit" startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    Kembali ke Login
                                </Button>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Stack>
                        )}
                    </Paper>
                </motion.div>
            </AnimatePresence>
        </Box>
    );
}
