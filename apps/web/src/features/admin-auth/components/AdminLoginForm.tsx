import { FormEvent, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import LockIcon from "@mui/icons-material/Lock";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { adminAuthService } from "~lib/adminAuth";
import { getErrorMessage } from "~lib/error";

export function AdminLoginForm() {
    const [step, setStep] = useState<1 | 2>(1);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [challengeId, setChallengeId] = useState<number | null>(null);
    const [challengeToken, setChallengeToken] = useState("");
    const [nip, setNip] = useState("");
    const [fullName, setFullName] = useState("");
    const [generatedToken, setGeneratedToken] = useState("");
    const [loginToken, setLoginToken] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (countdown <= 0) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [countdown]);

    const onSubmitCredentials = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError("");
        setInfo("");

        try {
            const { adminLogin } = await import("~features/admin-auth/api/adminLogin");
            const result = await adminLogin({ username, password });

            if (result.success && result.requires_token && result.challenge_id && result.challenge_token) {
                setChallengeId(result.challenge_id);
                setChallengeToken(result.challenge_token);
                setGeneratedToken("");
                setLoginToken("");
                setNip("");
                setFullName("");
                setCountdown(0);
                setInfo(result.message || "Username dan password valid. Silakan generate token login.");
                setStep(2);
            } else {
                setError(result.message || "Username atau password salah.");
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Gagal menghubungi server."));
        } finally {
            setIsLoading(false);
        }
    };

    const onGenerateToken = async () => {
        if (!challengeId || !challengeToken) return;

        setIsLoading(true);
        setError("");
        setInfo("");

        try {
            const { adminGenerateToken } = await import("~features/admin-auth/api/adminLogin");
            const result = await adminGenerateToken({
                challenge_id: challengeId,
                challenge_token: challengeToken,
                nip,
                full_name: fullName,
            });

            if (result.success && result.generated_token) {
                setGeneratedToken(result.generated_token);
                setLoginToken("");
                setCountdown(300);
                setInfo(result.message || "Token login berhasil dibuat dan berlaku selama 5 menit.");
            } else {
                setError(result.message || "Gagal membuat token login.");
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Gagal membuat token login."));
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitToken = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!challengeId || !challengeToken) return;

        setIsLoading(true);
        setError("");

        try {
            const { adminVerifyToken } = await import("~features/admin-auth/api/adminLogin");
            const result = await adminVerifyToken({
                challenge_id: challengeId,
                challenge_token: challengeToken,
                login_token: loginToken,
            });

            if (result.success && result.token) {
                adminAuthService.setSession({
                    username: result.username || username || "admin",
                    token: result.token,
                    role: result.role || "guru_bk",
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                });
                window.location.href = "/admin";
                return;
            }

            setError(result.message || "Token login salah.");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Gagal memverifikasi token login."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setStep(1);
        setChallengeId(null);
        setChallengeToken("");
        setNip("");
        setFullName("");
        setGeneratedToken("");
        setLoginToken("");
        setError("");
        setInfo("");
        setCountdown(0);
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "100vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.default",
                p: 2,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    position: "absolute",
                    top: -150,
                    right: -100,
                    width: 400,
                    height: 400,
                    borderRadius: "50%",
                    bgcolor: "secondary.light",
                    opacity: 0.1,
                    filter: "blur(60px)",
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: "absolute",
                    bottom: -100,
                    left: -100,
                    width: 400,
                    height: 400,
                    borderRadius: "50%",
                    bgcolor: "primary.light",
                    opacity: 0.1,
                    filter: "blur(60px)",
                    zIndex: 0,
                }}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    style={{ zIndex: 1, width: "100%", maxWidth: 460 }}
                >
                    <Paper
                        elevation={4}
                        sx={{
                            p: { xs: 4, md: 5 },
                            width: "100%",
                            borderRadius: 4,
                            position: "relative",
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
                        }}
                    >
                        <Box
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 8,
                                background:
                                    step === 1
                                        ? "linear-gradient(90deg, #1976d2 0%, #9c27b0 100%)"
                                        : "linear-gradient(90deg, #0f766e 0%, #22c55e 100%)",
                            }}
                        />

                        {step === 1 ? (
                            <Stack component="form" spacing={3.5} onSubmit={onSubmitCredentials} sx={{ mt: 1 }}>
                                <Stack spacing={1.5} alignItems="center" justifyContent="center">
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: "50%",
                                            bgcolor: "secondary.50",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <LockIcon sx={{ fontSize: 32, color: "secondary.main" }} />
                                    </Box>
                                    <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800 }}>
                                        Admin Login
                                    </Typography>
                                </Stack>

                                <Typography color="text.secondary" align="center" variant="body2" sx={{ px: 1 }}>
                                    Masuk ke dashboard, lalu lanjutkan verifikasi token dengan NIP dan nama lengkap.
                                </Typography>

                                <Stack spacing={2.5}>
                                    <TextField
                                        label="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        fullWidth
                                    />
                                    <TextField
                                        label="Password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        fullWidth
                                    />
                                </Stack>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    disabled={isLoading || !username || !password}
                                    sx={{ mt: 2, py: 1.5, fontWeight: 700, borderRadius: 2 }}
                                >
                                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Lanjut Verifikasi"}
                                </Button>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                                {error}
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Stack>
                        ) : (
                            <Stack component="form" spacing={2.5} onSubmit={onSubmitToken} sx={{ mt: 1 }}>
                                <Stack spacing={1.5} alignItems="center" justifyContent="center">
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: "50%",
                                            bgcolor: "#ecfeff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <VpnKeyIcon sx={{ fontSize: 32, color: "#0f766e" }} />
                                    </Box>
                                    <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800 }}>
                                        Token Login
                                    </Typography>
                                </Stack>

                                <Typography color="text.secondary" align="center" variant="body2" sx={{ px: 1 }}>
                                    Generate token memakai NIP dan nama lengkap, lalu masukkan token tersebut untuk masuk.
                                </Typography>

                                <AnimatePresence>
                                    {info && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                                {info}
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Stack spacing={2}>
                                    <TextField
                                        label="NIP"
                                        value={nip}
                                        onChange={(e) => setNip(e.target.value.replace(/\D/g, "").slice(0, 30))}
                                        required
                                        fullWidth
                                    />
                                    <TextField
                                        label="Nama Lengkap"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        fullWidth
                                    />
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        onClick={onGenerateToken}
                                        disabled={isLoading || !nip || !fullName || !challengeId || !challengeToken}
                                        sx={{ py: 1.3, fontWeight: 700, borderRadius: 2 }}
                                    >
                                        {isLoading ? <CircularProgress size={22} color="inherit" /> : "Generate Token"}
                                    </Button>

                                    <TextField
                                        label="Token Hasil Generate"
                                        value={generatedToken}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                        helperText="Token hanya berlaku 5 menit dan harus dimasukkan ulang di bawah."
                                    />

                                    <TextField
                                        label="Masukkan Token"
                                        value={loginToken}
                                        onChange={(e) => setLoginToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        required
                                        fullWidth
                                        inputProps={{
                                            maxLength: 6,
                                            style: {
                                                textAlign: "center",
                                                fontSize: "1.5rem",
                                                letterSpacing: "0.5em",
                                                fontWeight: 700,
                                            },
                                        }}
                                        placeholder="0 0 0 0 0 0"
                                    />
                                </Stack>

                                {countdown > 0 && (
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        Token berlaku selama <strong>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</strong>
                                    </Typography>
                                )}

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="success"
                                    size="large"
                                    disabled={isLoading || loginToken.length < 6 || !challengeId || !challengeToken}
                                    sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
                                >
                                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "Verifikasi & Masuk"}
                                </Button>

                                <Button
                                    variant="text"
                                    color="inherit"
                                    startIcon={<ArrowBackIcon />}
                                    onClick={handleBack}
                                    sx={{ fontWeight: 600, color: "text.secondary" }}
                                >
                                    Kembali ke Login
                                </Button>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                                {error}
                                            </Alert>
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
