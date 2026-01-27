/**
 * Professional dark theme with black, grey, and white tones for the app.
 */

import { Platform } from "react-native";

// Professional black, grey, white theme colors
const tintColor = "#FFFFFF"; // Pure white for primary actions
const accentGrey = "#2A2A2A"; // Dark grey accent

export const Colors = {
  text: "#FFFFFF",
  background: "#000000", // Pure black background
  tint: tintColor,
  icon: "#9CA3AF", // Medium grey for icons
  cancelButton: "#1F1F1F",
  tabIconDefault: "#6B7280",
  tabIconSelected: tintColor,
  accent: accentGrey,
  cardBackground: "#1A1A1A", // Dark grey for cards
  border: "#2A2A2A", // Slightly lighter grey for borders
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
