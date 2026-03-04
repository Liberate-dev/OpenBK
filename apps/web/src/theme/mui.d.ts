import "@mui/material/styles";

interface RiskPaletteScale {
  low: string;
  medium: string;
  high: string;
  critical: string;
}

declare module "@mui/material/styles" {
  interface Palette {
    risk: RiskPaletteScale;
  }

  interface PaletteOptions {
    risk?: RiskPaletteScale;
  }
}

