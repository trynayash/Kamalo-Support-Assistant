import React, { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { NavigationMenu } from '@/components/NavigationMenu';

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return <View style={[styles.screen, { backgroundColor: colors.background }, style]}>{children}</View>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.headerActions}>
        {action && onAction ? (
          <Pressable testID="header-action" onPress={onAction} hitSlop={10} style={({ pressed }) => [styles.headerAction, { opacity: pressed ? 0.58 : 1 }]}>
            <Text style={[styles.headerActionText, { color: colors.primary }]}>{action}</Text>
          </Pressable>
        ) : null}
        <NavigationMenu />
      </View>
    </View>
  );
}

export function IconButton({ icon, label, onPress, disabled, tone = 'plain' }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; disabled?: boolean; tone?: 'plain' | 'filled' }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        tone === 'filled' && { backgroundColor: colors.primary },
        { opacity: disabled ? 0.35 : pressed ? 0.62 : 1 },
      ]}
    >
      <Feather name={icon} size={18} color={tone === 'filled' ? colors.primaryForeground : colors.foreground} />
    </Pressable>
  );
}

export function Button({ label, onPress, icon, loading, disabled, secondary }: { label: string; onPress: () => void; icon?: keyof typeof Feather.glyphMap; loading?: boolean; disabled?: boolean; secondary?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      testID={`button-${label.toLowerCase().replaceAll(' ', '-')}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: secondary ? colors.secondary : colors.primary, opacity: disabled ? 0.42 : pressed ? 0.78 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={secondary ? colors.foreground : colors.primaryForeground} size="small" /> : icon ? <Feather name={icon} size={16} color={secondary ? colors.foreground : colors.primaryForeground} /> : null}
      <Text style={[styles.buttonText, { color: secondary ? colors.foreground : colors.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const colors = useColors();
  const content = <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
  if (!onPress) return content;
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [{ opacity: pressed ? 0.76 : 1 }]}>{content}</Pressable>;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'teal' | 'amber' | 'red' }) {
  const colors = useColors();
  const palette = tone === 'teal'
    ? { backgroundColor: colors.primary + '20', color: colors.primary }
    : tone === 'amber'
      ? { backgroundColor: colors.accent + '28', color: colors.accentForeground }
      : tone === 'red'
        ? { backgroundColor: colors.destructive + '20', color: colors.destructive }
        : { backgroundColor: colors.muted, color: colors.mutedForeground };
  return <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}><Text style={[styles.badgeText, { color: palette.color }]}>{label}</Text></View>;
}

export function Field({ label, error, style, ...props }: TextInputProps & { label: string; error?: string }) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: error ? colors.destructive : colors.border }, style]}
      />
      {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
    </View>
  );
}

export function LoadingState({ label = 'Loading your workspace' }: { label?: string }) {
  const colors = useColors();
  return <View style={styles.state}><ActivityIndicator color={colors.primary} /><Text style={[styles.stateText, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

export function ErrorState({ onRetry, label = 'Something went wrong' }: { onRetry: () => void; label?: string }) {
  const colors = useColors();
  return <View style={styles.state}><View style={[styles.stateIcon, { backgroundColor: colors.destructive + '18' }]}><Feather name="alert-circle" size={20} color={colors.destructive} /></View><Text style={[styles.stateTitle, { color: colors.foreground }]}>{label}</Text><Button label="Try again" icon="refresh-cw" onPress={onRetry} secondary /></View>;
}

export function EmptyState({ icon, title, body, action }: { icon: keyof typeof Feather.glyphMap; title: string; body: string; action?: ReactNode }) {
  const colors = useColors();
  return <View style={styles.empty}><View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={22} color={colors.primary} /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{body}</Text>{action}</View>;
}

export function formatDate(date: string, withTime = false) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, withTime ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function statusTone(status: string): 'neutral' | 'teal' | 'amber' | 'red' {
  if (status === 'resolved' || status === 'closed' || status === 'approved') return 'teal';
  if (status === 'in_review' || status === 'draft') return 'amber';
  if (status === 'failed') return 'red';
  return 'neutral';
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  headerCopy: { flex: 1, paddingRight: 12 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.4, marginBottom: 7 },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.7 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 6 },
  headerAction: { paddingTop: 4, paddingLeft: 8 },
  headerActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  headerActions: { alignItems: 'flex-end', gap: 7, paddingTop: 1 },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  button: { minHeight: 46, paddingHorizontal: 17, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16 },
  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.45, textTransform: 'uppercase' },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.2, marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 11, fontFamily: 'Inter_400Regular', fontSize: 15 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 5 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  stateIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, textAlign: 'center' },
  stateText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 44 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, textAlign: 'center' },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 7, marginBottom: 18 },
});