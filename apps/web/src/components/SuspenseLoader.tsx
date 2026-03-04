import { Box } from "@mui/material";
import MailOpeningLoader from "./motion/MailOpeningLoader";

export function SuspenseLoader() {
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        minHeight: 240,
        gap: 2
      }}
      role="status"
      aria-live="polite"
    >
      <MailOpeningLoader />
    </Box>
  );
}

