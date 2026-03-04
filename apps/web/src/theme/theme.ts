import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3B82F6", // Bright Blue
      light: "#60A5FA",
      dark: "#2563EB",
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#F59E0B", // Playful Orange/Yellow
      light: "#FBBF24",
      dark: "#D97706",
      contrastText: "#ffffff"
    },
    background: {
      default: "#EFF6FF", // Soft faint blue
      paper: "#ffffff"
    },
    text: {
      primary: "#1E293B",
      secondary: "#64748B"
    },
    risk: {
      low: "#94A3B8", // Slate
      medium: "#F59E0B", // Amber
      high: "#F97316", // Orange
      critical: "#EF4444" // Red
    }
  },
  shape: {
    borderRadius: 20
  },
  spacing: 8,
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Nunito", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Nunito", sans-serif', fontWeight: 800 },
    h3: { fontFamily: '"Nunito", sans-serif', fontWeight: 800 },
    h4: { fontFamily: '"Nunito", sans-serif', fontWeight: 800 },
    h5: { fontFamily: '"Nunito", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Nunito", sans-serif', fontWeight: 700 },
    button: { fontFamily: '"Nunito", sans-serif', fontWeight: 700, textTransform: "none", fontSize: "1rem" }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: "10px 24px",
          boxShadow: "0 4px 14px 0 rgba(59, 130, 246, 0.39)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 6px 20px 0 rgba(59, 130, 246, 0.39)"
          },
          "&:active": {
            transform: "translateY(0)"
          }
        },
        containedSecondary: {
          boxShadow: "0 4px 14px 0 rgba(245, 158, 11, 0.39)",
          "&:hover": {
            boxShadow: "0 6px 20px 0 rgba(245, 158, 11, 0.39)"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
          borderColor: "#E2E8F0"
        }
      }
    }
  }
});

