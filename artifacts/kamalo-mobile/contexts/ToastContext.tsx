import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { KamaloIcon, type KamaloIconName } from '@/components/kamalo-icon';
import { useColors } from '@/hooks/useColors';

export interface ToastOptions {
  title: string;
  message?: string;
  icon?: KamaloIconName;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  hideToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -60,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast(options);

      // Trigger haptic ping
      try {
        if (options.type === 'error') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (options.type === 'warning') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {}

      translateY.setValue(-60);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = options.duration || 3800;
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [translateY, opacity, hideToast]
  );

  const getIconName = (options: ToastOptions): KamaloIconName => {
    if (options.icon) return options.icon;
    if (options.type === 'error') return 'alert-circle';
    if (options.type === 'warning') return 'alert-circle';
    if (options.type === 'info') return 'info';
    return 'check';
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: Math.max(insets.top + 8, 16),
              transform: [{ translateY }],
              opacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityRole="alert"
            onPress={hideToast}
            style={({ pressed }) => [
              styles.toastBody,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
              <KamaloIcon
                name={getIconName(toast)}
                size={16}
                color={colors.foreground}
              />
            </View>
            <View style={styles.contentWrap}>
              <Text style={[styles.titleText, { color: colors.foreground }]}>
                {toast.title}
              </Text>
              {toast.message ? (
                <Text
                  style={[styles.messageText, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {toast.message}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={hideToast} hitSlop={10} style={styles.closeBtn}>
              <KamaloIcon name="x" size={15} color={colors.mutedForeground} />
            </Pressable>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
    alignItems: 'center',
  },
  toastBody: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  messageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
});
