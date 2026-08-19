// TUI color theme
// Using purple palette for borders and accents

export const theme = {
  // Primary border and accent color (purple)
  // Using #9D4EDD - a vibrant purple that reads well on dark backgrounds
  border: "#9D4EDD",
  accent: "#9D4EDD",

  // Alternative purple shades for variety
  accentBright: "#B57EFC",
  accentDim: "#7B2CBF",

  // Existing functional colors (keep as-is)
  success: "green",
  warning: "yellow",
  error: "red",
  info: "gray",

  // Text colors
  textPrimary: "white",
  textDim: "gray",
} as const;
