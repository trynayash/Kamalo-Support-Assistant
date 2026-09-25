import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { KamaloIcon } from "@/components/kamalo-icon";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { isDark, toggleTheme, colors } = useTheme();

  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics optional
    }
    toggleTheme();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? "light" : "dark"} mode`}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.secondary,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <KamaloIcon
        name={isDark ? "sun" : "moon"}
        size={16}
        color={colors.foreground}
      />
      {showLabel ? (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {isDark ? "Light Mode" : "Dark Mode"}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 34,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
});
