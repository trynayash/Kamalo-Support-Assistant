import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KamaloIcon, type KamaloIconName } from '@/components/kamalo-icon';
import { useColors } from '@/hooks/useColors';

const items = [
  { label: 'Home', icon: 'home' as KamaloIconName, href: '/(tabs)' },
  { label: 'History', icon: 'clock' as KamaloIconName, href: '/(tabs)/history' },
  { label: 'Support', icon: 'message-circle' as KamaloIconName, href: '/(tabs)/support' },
  { label: 'Guide', icon: 'book-open' as KamaloIconName, href: '/(tabs)/knowledge' },
];

export function NavigationMenu() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function navigate(href: string) {
    setOpen(false);
    router.replace(href as never);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open navigation menu"
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: colors.secondary, opacity: pressed ? 0.62 : 1 },
        ]}
      >
        <KamaloIcon name="menu" size={20} color={colors.foreground} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close navigation menu"
            onPress={() => setOpen(false)}
            style={styles.backdrop}
          />
          <View
            style={[
              styles.panel,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingTop: insets.top + 12,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View style={styles.panelHeader}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>KAMALO</Text>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Navigate</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close navigation menu"
                onPress={() => setOpen(false)}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.58 : 1 })}
              >
                <KamaloIcon name="x" size={22} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={styles.itemList}>
              {items.map((item) => {
                const active =
                  item.href === '/(tabs)'
                    ? pathname === '/' || pathname === '/(tabs)'
                    : pathname.endsWith(item.href.replace('/(tabs)', ''));
                return (
                  <Pressable
                    key={item.href}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => navigate(item.href)}
                    style={({ pressed }) => [
                      styles.item,
                      {
                        backgroundColor: active ? colors.secondary : 'transparent',
                        opacity: pressed ? 0.62 : 1,
                      },
                    ]}
                  >
                    <KamaloIcon
                      name={item.icon}
                      size={19}
                      color={active ? colors.primary : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.itemLabel,
                        { color: active ? colors.primary : colors.foreground },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {active ? (
                      <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(21, 35, 33, 0.38)',
  },
  panel: {
    width: '78%',
    maxWidth: 330,
    minWidth: 270,
    borderLeftWidth: 1,
    paddingHorizontal: 22,
    boxShadow: '-4px 0 14px rgba(0, 0, 0, 0.18)',
    elevation: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  panelTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    letterSpacing: -0.6,
    marginTop: 5,
  },
  itemList: {
    gap: 7,
    marginTop: 28,
  },
  item: {
    minHeight: 54,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 13,
  },
  itemLabel: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});