import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KamaloIcon, type KamaloIconName } from '@/components/kamalo-icon';
import { useColors } from '@/hooks/useColors';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { useToast } from '@/contexts/ToastContext';

export function NavigationMenu() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { currentUser, role, isStaff, isSuperAdmin, setRole, signOut } = useAuth();
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const items = React.useMemo(() => {
    switch (role) {
      case 'super_admin':
        return [
          { label: 'Control Room', icon: 'inbox' as KamaloIconName, href: '/admin' },
          { label: 'Knowledge Admin', icon: 'cpu' as KamaloIconName, href: '/admin/knowledge' },
          { label: 'Chatbot', icon: 'message-circle' as KamaloIconName, href: '/(tabs)/chat' },
          { label: 'Knowledge Guide', icon: 'book-open' as KamaloIconName, href: '/(tabs)/knowledge' },
          { label: 'History', icon: 'clock' as KamaloIconName, href: '/(tabs)/history' },
          { label: 'Raise Ticket', icon: 'life-buoy' as KamaloIconName, href: '/(tabs)' },
        ];
      case 'admin':
        return [
          { label: 'Control Room', icon: 'inbox' as KamaloIconName, href: '/admin' },
          { label: 'Knowledge Admin', icon: 'cpu' as KamaloIconName, href: '/admin/knowledge' },
          { label: 'Knowledge Guide', icon: 'book-open' as KamaloIconName, href: '/(tabs)/knowledge' },
          { label: 'History', icon: 'clock' as KamaloIconName, href: '/(tabs)/history' },
          { label: 'Raise Ticket', icon: 'life-buoy' as KamaloIconName, href: '/(tabs)' },
        ];
      case 'human_reviewer':
        return [
          { label: 'Support Queue', icon: 'inbox' as KamaloIconName, href: '/admin' },
          { label: 'Knowledge Guide', icon: 'book-open' as KamaloIconName, href: '/(tabs)/knowledge' },
          { label: 'My Tickets & Chats', icon: 'clock' as KamaloIconName, href: '/(tabs)/history' },
          { label: 'Raise Ticket', icon: 'life-buoy' as KamaloIconName, href: '/(tabs)' },
        ];
      case 'editor':
        return [
          { label: 'Knowledge Admin', icon: 'cpu' as KamaloIconName, href: '/admin/knowledge' },
          { label: 'Knowledge Guide', icon: 'book-open' as KamaloIconName, href: '/(tabs)/knowledge' },
          { label: 'My Tickets & Chats', icon: 'clock' as KamaloIconName, href: '/(tabs)/history' },
        ];
      case 'customer':
      default:
        return [
          { label: 'Raise Ticket', icon: 'life-buoy' as KamaloIconName, href: '/(tabs)' },
          { label: 'My Tickets', icon: 'clock' as KamaloIconName, href: '/(tabs)/history' },
          { label: 'Knowledge Guide', icon: 'book-open' as KamaloIconName, href: '/(tabs)/knowledge' },
        ];
    }
  }, [role]);

  function navigate(href: string) {
    setOpen(false);
    setTimeout(() => {
      router.push(href as never);
    }, 120);
  }

  function handleSignOut() {
    signOut();
    showToast({
      title: 'Signed Out',
      message: 'You are now in guest customer mode.',
      type: 'info',
    });
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
          {
            backgroundColor: colors.secondary,
            borderColor: colors.border,
            borderWidth: 1,
            opacity: pressed ? 0.62 : 1,
          },
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
                paddingTop: insets.top + 14,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
            >
              <View>
                {/* Header */}
                <View style={styles.panelHeader}>
                  <View>
                    <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>KAMALO</Text>
                    <Text style={[styles.panelTitle, { color: colors.foreground }]}>Menu</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close navigation menu"
                    onPress={() => setOpen(false)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.closeBtn,
                      { backgroundColor: colors.secondary, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <KamaloIcon name="x" size={18} color={colors.foreground} />
                  </Pressable>
                </View>

                {/* Account / Profile Card */}
                <View
                  style={[
                    styles.profileCard,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.profileTop}>
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: isStaff ? colors.foreground : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          {
                            color: isStaff ? colors.background : colors.foreground,
                          },
                        ]}
                      >
                        {currentUser?.name ? currentUser.name[0].toUpperCase() : 'G'}
                      </Text>
                    </View>
                    <View style={styles.profileMeta}>
                      <Text
                        style={[styles.profileName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {currentUser?.name || 'Guest User'}
                      </Text>
                      <Text
                        style={[styles.profileUsername, { color: colors.mutedForeground }]}
                      >
                        {currentUser?.username ? `@${currentUser.username}` : 'Not signed in'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.roleRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <KamaloIcon
                        name={isStaff ? 'shield' : 'user'}
                        size={12}
                        color={colors.foreground}
                      />
                      <Text style={[styles.roleBadgeText, { color: colors.foreground }]}>
                        {role.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>

                    {currentUser ? (
                      <Pressable
                        onPress={handleSignOut}
                        style={[styles.signInOutBtn, { borderColor: colors.border }]}
                      >
                        <Text style={[styles.signInOutText, { color: colors.mutedForeground }]}>
                          Sign Out
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => {
                          setAuthModalMode('signin');
                          setAuthModalVisible(true);
                        }}
                        style={[styles.signInOutBtn, { backgroundColor: colors.foreground }]}
                      >
                        <Text style={[styles.signInOutText, { color: colors.background }]}>
                          Sign In
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Role Viewpoint Preview (Super Admin Only) */}
                {(currentUser?.role === 'super_admin' || currentUser?.username === 'yash') ? (
                  <View style={styles.quickTesterBox}>
                    <Text style={[styles.sectionMiniLabel, { color: colors.mutedForeground }]}>
                      VIEW AS ROLE (SUPER ADMIN PREVIEW)
                    </Text>
                    <View style={styles.roleTesterChips}>
                      {(['customer', 'super_admin', 'admin', 'editor', 'human_reviewer'] as UserRole[]).map(
                        (r) => {
                          const isCurrent = role === r;
                          return (
                            <Pressable
                              key={r}
                              onPress={() => {
                                setRole(r);
                                showToast({
                                  title: 'Previewing Role',
                                  message: `Simulating ${r.replace('_', ' ').toUpperCase()} view`,
                                  type: 'info',
                                });
                              }}
                              style={[
                                styles.roleTesterChip,
                                {
                                  backgroundColor: isCurrent ? colors.foreground : colors.secondary,
                                  borderColor: isCurrent ? colors.foreground : colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.roleTesterText,
                                  {
                                    color: isCurrent ? colors.background : colors.foreground,
                                  },
                                ]}
                              >
                                {r === 'super_admin'
                                  ? 'Super Admin'
                                  : r === 'human_reviewer'
                                  ? 'Reviewer'
                                  : r.charAt(0).toUpperCase() + r.slice(1)}
                              </Text>
                            </Pressable>
                          );
                        }
                      )}
                    </View>
                  </View>
                ) : null}

                {/* Navigation Items */}
                <View style={styles.itemList}>
                  <Text style={[styles.sectionMiniLabel, { color: colors.mutedForeground }]}>
                    PAGES & WORKSPACES
                  </Text>
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
                            borderColor: active ? colors.border : 'transparent',
                            opacity: pressed ? 0.62 : 1,
                          },
                        ]}
                      >
                        <KamaloIcon
                          name={item.icon}
                          size={18}
                          color={active ? colors.foreground : colors.mutedForeground}
                        />
                        <Text
                          style={[
                            styles.itemLabel,
                            {
                              color: active ? colors.foreground : colors.mutedForeground,
                              fontFamily: active ? 'Inter_700Bold' : 'Inter_500Medium',
                            },
                          ]}
                        >
                          {item.label}
                        </Text>
                        {active ? (
                          <View style={[styles.activeDot, { backgroundColor: colors.foreground }]} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Sign In / Sign Up Trigger */}
                <View style={[styles.authTriggerBox, { borderTopColor: colors.border }]}>
                  <Pressable
                    onPress={() => {
                      setAuthModalMode('signin');
                      setAuthModalVisible(true);
                    }}
                    style={[styles.authActionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <KamaloIcon name="user" size={15} color={colors.foreground} />
                    <Text style={[styles.authActionBtnText, { color: colors.foreground }]}>
                      {currentUser ? 'Switch Account / Sign In' : 'Sign In / Sign Up'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Theme Toggle in Drawer Footer */}
              <View style={[styles.themeToggleWrap, { borderTopColor: colors.border }]}>
                <ThemeToggle showLabel />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sign In / Sign Up Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        initialMode={authModalMode}
      />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  panel: {
    width: '82%',
    maxWidth: 340,
    minWidth: 270,
    borderLeftWidth: 1,
    paddingHorizontal: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  panelTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  profileUsername: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  signInOutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  signInOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  quickTesterBox: {
    marginBottom: 16,
    gap: 6,
  },
  sectionMiniLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  roleTesterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  roleTesterChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleTesterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  itemList: {
    gap: 6,
  },
  item: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  authTriggerBox: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  authActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  authActionBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  themeToggleWrap: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
});