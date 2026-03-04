import { motion } from "framer-motion";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import { Box, Typography } from "@mui/material";

export default function PaperPlaneSubmit({ onComplete }: { onComplete?: () => void }) {
    return (
        <Box sx={{ display: "grid", placeItems: "center", gap: 2, p: 4, overflow: "hidden" }}>
            <motion.div
                initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
                animate={{
                    scale: [1, 0.85, 1.05],
                    x: [0, -10, 300],
                    y: [0, 10, -300],
                    opacity: [1, 1, 0]
                }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                onAnimationComplete={onComplete}
            >
                <FlightTakeoffIcon sx={{ fontSize: 64, color: "secondary.main", transform: "rotate(-15deg)" }} />
            </motion.div>
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
            >
                <Typography variant="body1" color="text.secondary">
                    Mengirim pesan rahasia...
                </Typography>
            </motion.div>
        </Box>
    );
}
