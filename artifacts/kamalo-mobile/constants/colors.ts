/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#15383a',
    tint: '#2c756d',
    background: '#f5f0e7',
    foreground: '#15383a',
    card: '#fbf8f1',
    cardForeground: '#15383a',
    primary: '#2c756d',
    primaryForeground: '#fbf8f1',
    secondary: '#e7ded0',
    secondaryForeground: '#15383a',
    muted: '#ece5da',
    mutedForeground: '#6d7771',
    accent: '#d99b43',
    accentForeground: '#382818',
    destructive: '#b4544b',
    destructiveForeground: '#fff8ee',
    border: '#d8cec0',
    input: '#cfc3b3',
  },

  dark: {
    text: '#f5f0e7',
    tint: '#80b8aa',
    background: '#173638',
    foreground: '#f5f0e7',
    card: '#204245',
    cardForeground: '#f5f0e7',
    primary: '#80b8aa',
    primaryForeground: '#173638',
    secondary: '#2b4c4d',
    secondaryForeground: '#f5f0e7',
    muted: '#28484a',
    mutedForeground: '#b6c2b8',
    accent: '#e1ac59',
    accentForeground: '#382818',
    destructive: '#df8074',
    destructiveForeground: '#231d18',
    border: '#3d5b59',
    input: '#55706b',
  },

  radius: 10,
};

export default colors;
