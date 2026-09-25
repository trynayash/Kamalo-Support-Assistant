/**
 * Semantic design tokens for KAMALO Mobile.
 * Two distinct themes:
 * - Light: Pure White & Solid Pitch-Black text (zero bluish tint, 100% crisp neutral monochrome).
 * - Dark: Deep Pitch Black (#000000 / #121212) with Pure White text (zero bluish tint).
 */

export interface ColorPalette {
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  headerDark: string;
  headerDarkText: string;
  radius: number;
}

const colors = {
  light: {
    text: '#000000',
    tint: '#000000',
    background: '#ffffff',
    foreground: '#000000',
    card: '#f9f9fa',
    cardForeground: '#000000',
    primary: '#000000',
    primaryForeground: '#ffffff',
    secondary: '#f0f0f2',
    secondaryForeground: '#000000',
    muted: '#f0f0f2',
    mutedForeground: '#555558',
    accent: '#000000',
    accentForeground: '#ffffff',
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',
    border: '#e2e2e5',
    input: '#ffffff',
    headerDark: '#0a0a0c',
    headerDarkText: '#ffffff',
    radius: 12,
  },

  dark: {
    text: '#ffffff',
    tint: '#ffffff',
    background: '#000000',
    foreground: '#ffffff',
    card: '#121214',
    cardForeground: '#ffffff',
    primary: '#ffffff',
    primaryForeground: '#000000',
    secondary: '#1c1c1f',
    secondaryForeground: '#ffffff',
    muted: '#1c1c1f',
    mutedForeground: '#9e9ea3',
    accent: '#ffffff',
    accentForeground: '#000000',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#26262a',
    input: '#121214',
    headerDark: '#000000',
    headerDarkText: '#ffffff',
    radius: 12,
  },

  radius: 12,
};

export default colors;
