/**
 * Dark mode only theme with purplish tones for the app.
 */

import { Platform } from 'react-native';

// Purple/violet theme colors
const tintColor = '#b794f6'; // Light purple
const accentPurple = '#6b1fa8'; // Deep purple

export const Colors = {
  text: '#ECEDEE',
  background: '#0f0a1a', // Dark purple-tinted background
  tint: tintColor,
  icon: '#9BA1A6',
  cancelButton: '#1a1a2e',
  tabIconDefault: '#6b5b7b',
  tabIconSelected: tintColor,
  accent: accentPurple,
  cardBackground: '#1a1226',
  border: '#2d1f3d',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
