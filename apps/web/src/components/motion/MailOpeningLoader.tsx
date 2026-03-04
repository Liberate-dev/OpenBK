import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DraftsIcon from "@mui/icons-material/Drafts";
import EmailIcon from "@mui/icons-material/Email";
import { Box, Typography } from "@mui/material";

export default function MailOpeningLoader() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setIsOpen(o => !o);
        }, 900); // Durasi 900ms as per plan
        return () => clearInterval(timer);
    }, []);

    return (
        <Box sx={{ display: "grid", placeItems: "center", gap: 2 }}>
            <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.9, repeat: Infinity }}
            >
                {isOpen ? (
                    <DraftsIcon sx={{ fontSize: 48, color: "secondary.main" }} />
                ) : (
                    <EmailIcon sx={{ fontSize: 48, color: "secondary.main" }} />
                )}
            </motion.div>
            <Typography variant="body2" color="text.secondary">
                Membuka surat...
            </Typography>
        </Box>
    );
}
