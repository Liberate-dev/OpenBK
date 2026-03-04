import { Box, Button, Typography, Container, Paper } from "@mui/material";
import { ErrorComponentProps, useRouter } from "@tanstack/react-router";

export function ErrorFallback({ error, reset }: ErrorComponentProps) {
    const router = useRouter();

    return (
        <Container maxWidth="sm">
            <Paper sx={{ p: 4, mt: 8, textAlign: "center", border: "1px solid", borderColor: "error.main" }}>
                <Typography variant="h5" color="error" gutterBottom>
                    Terjadi Kesalahan
                </Typography>
                <Typography color="text.secondary" paragraph>
                    {error.message || "Something went wrong. Please try again."}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                            router.invalidate();
                            reset();
                        }}
                    >
                        Coba Lagi
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.navigate({ to: "/" })}
                    >
                        Kembali ke Beranda
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
