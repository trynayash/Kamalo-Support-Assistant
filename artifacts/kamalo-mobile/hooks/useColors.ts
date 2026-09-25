import { useTheme } from '@/contexts/ThemeContext';
import { ColorPalette } from '@/constants/colors';

/**
 * Returns the active color palette based on user selection or system theme.
 * Seamlessly toggles between pure White (light) and deep Midnight (dark).
 */
export function useColors(): ColorPalette {
  const { colors } = useTheme();
  return colors;
}
