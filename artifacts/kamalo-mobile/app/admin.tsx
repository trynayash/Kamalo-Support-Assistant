import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { KamaloIcon, type KamaloIconName } from '@/components/kamalo-icon';
import {
  getGetSupportTicketQueryKey,
  getListSupportTicketsQueryKey,
  useAnalyzeSupportTicket,
  useListSupportTickets,
  useRetrySupportTicketEmail,
  useUpdateSupportTicket,
  useGetConversation,
  SupportTicket,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NavigationMenu } from '@/components/NavigationMenu';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  formatDate,
  statusTone,
} from '@/components/ui';
import { calculateSlaStatus } from '@/lib/ticketLevels';
import { getAttachmentUrl, getApiBaseUrl } from '@/lib/apiConfig';

const CATEGORY_OPTIONS = [
  'all',
  'Coins related',
  'Transaction related',
  'Fincado related',
  'Others',
];

const STATUS_OPTIONS: Array<'all' | SupportTicket['status']> = [
  'all',
  'open',
  'in_review',
  'resolved',
  'closed',
];

const ROLES: UserRole[] = ['super_admin', 'admin', 'editor', 'human_reviewer', 'customer'];

function parseCustomerInfo(ticket: SupportTicket) {
  let customerName = 'Customer';
  let cleanDetails = ticket.details;

  if (ticket.details && ticket.details.startsWith('Raised by: ')) {
    const parts = ticket.details.split('\n\n');
    customerName = parts[0].replace('Raised by: ', '').trim();
    cleanDetails = parts.slice(1).join('\n\n').trim();
  }

  const customerEmail = ticket.contactEmail?.trim() || 'Not specified';

  return { customerName, cleanDetails, customerEmail };
}

export default function AdminScreen() {
  const colors = useColors();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isStaff, role, setRole, signIn, signOut, currentUser, logActivity, users, auditLogs, updateUserRole, deleteUser, signUp, clearAuditLogs } = useAuth();
  const { showToast } = useToast();

  const tickets = useListSupportTickets();
  const update = useUpdateSupportTicket();
  const analyze = useAnalyzeSupportTicket();
  const retryEmail = useRetrySupportTicketEmail();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicket['status']>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSuperAdminPanel, setShowSuperAdminPanel] = useState(false);
  const [unlockPasscode, setUnlockPasscode] = useState('');

  const rawTickets = tickets.data || [];

  // Filter & Search Tickets
  const filteredTickets = useMemo(() => {
    return rawTickets.filter((t) => {
      const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;

      if (!searchQuery.trim()) return matchCat && matchStatus;

      const q = searchQuery.toLowerCase().trim();
      const { customerName, customerEmail } = parseCustomerInfo(t);
      const matchSearch =
        customerName.toLowerCase().includes(q) ||
        customerEmail.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q));

      return matchCat && matchStatus && matchSearch;
    });
  }, [rawTickets, categoryFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    let overdueCount = 0;
    let urgentCount = 0;
    rawTickets.forEach((t) => {
      if (t.status !== 'resolved' && t.status !== 'closed') {
        const sla = calculateSlaStatus(t.createdAt, t.level, t.resolvedAt);
        if (sla.isOverdue) overdueCount++;
        if (sla.slaCode === 'IS') urgentCount++;
      }
    });
    return {
      total: rawTickets.length,
      open: rawTickets.filter((t) => t.status === 'open').length,
      overdue: overdueCount,
      urgent: urgentCount,
    };
  }, [rawTickets]);

  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Access guard: if not staff, show strict auth requirement or rejection
  if (!isStaff) {
    const isCustomer = currentUser?.role === 'customer';

    return (
      <View style={[styles.guardContainer, { backgroundColor: colors.background, paddingTop: Math.max(insets.top + 20, 40) }]}>
        <View style={styles.guardHeaderRow}>
          <ThemeToggle />
          <NavigationMenu />
        </View>

        <View style={[styles.guardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.guardIconWrap, { backgroundColor: isCustomer ? 'rgba(239, 68, 68, 0.12)' : colors.secondary }]}>
            <KamaloIcon name={isCustomer ? 'alert-circle' : 'shield'} size={32} color={isCustomer ? colors.destructive : colors.foreground} />
          </View>
          <Text style={[styles.guardTitle, { color: colors.foreground }]}>
            {isCustomer ? 'Access Restricted' : 'Operations Control Room'}
          </Text>
          <Text style={[styles.guardText, { color: colors.mutedForeground }]}>
            {isCustomer
              ? `Your account (@${currentUser?.username}) is registered as Customer. The Operations Control Room is strictly reserved for authorized support agents and administrators.`
              : 'Authorized staff credentials are required to inspect support queues and modify customer tickets.'}
          </Text>

          {isCustomer ? (
            <View style={{ width: '100%', gap: 8, marginTop: 10 }}>
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={[styles.primaryButton, { backgroundColor: colors.foreground, width: '100%' }]}
              >
                <Text style={[styles.primaryButtonText, { color: colors.background }]}>
                  Return to Support Home
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  signOut();
                  showToast({ title: 'Signed Out', message: 'You can now sign in with staff credentials.', type: 'info' });
                }}
                style={[styles.secondaryButton, { borderColor: colors.border, width: '100%' }]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                  Sign In with Staff Account
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ width: '100%', gap: 8, marginTop: 10 }}>
              <TextInput
                value={staffUsername}
                onChangeText={setStaffUsername}
                placeholder="Staff Username (e.g. yash, admin, reviewer)"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  {
                    width: '100%',
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />

              <TextInput
                value={staffPassword}
                onChangeText={setStaffPassword}
                placeholder="Staff Password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    width: '100%',
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />

              <Pressable
                onPress={() => {
                  if (!staffUsername.trim() || !staffPassword.trim()) {
                    Alert.alert('Credentials Required', 'Please enter your staff username and password.');
                    return;
                  }
                  const res = signIn(staffUsername, staffPassword);
                  if (res.success) {
                    showToast({
                      title: 'Staff Access Granted',
                      message: `Logged in as ${staffUsername.trim()}`,
                      type: 'success',
                    });
                  } else {
                    Alert.alert('Access Denied', res.error || 'Invalid username or password.');
                  }
                }}
                style={[styles.primaryButton, { backgroundColor: colors.foreground, width: '100%', marginTop: 4 }]}
              >
                <Text style={[styles.primaryButtonText, { color: colors.background }]}>
                  Authorize Staff Login
                </Text>
              </Pressable>

              {/* Staff Presets Helper */}
              <View style={{ marginTop: 8, gap: 5 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.5 }}>
                  STAFF PRESETS (TAP TO FILL CREDENTIALS):
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                  <Pressable
                    onPress={() => { setStaffUsername('yash'); setStaffPassword('kamalo123'); }}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary }}
                  >
                    <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>Yash (Super Admin)</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setStaffUsername('admin'); setStaffPassword('admin123'); }}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary }}
                  >
                    <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>Admin (Ops)</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setStaffUsername('reviewer'); setStaffPassword('reviewer123'); }}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary }}
                  >
                    <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>Reviewer (L1)</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setStaffUsername('editor'); setStaffPassword('editor123'); }}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary }}
                  >
                    <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>Editor</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={[styles.secondaryButton, { borderColor: colors.border, width: '100%', marginTop: 6 }]}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>
                  Return to Support Home
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.listHeaderRoot}>
      {/* Top Navbar Header */}
      <View style={[styles.navbar, { borderBottomColor: colors.border }]}>
        <View style={styles.navbarLeft}>
          <Text style={[styles.navEyebrow, { color: colors.mutedForeground }]}>OPERATIONS CONTROL ROOM</Text>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>Support Queue</Text>
        </View>
        <View style={styles.navbarRight}>
          <ThemeToggle />
          <NavigationMenu />
        </View>
      </View>

      {/* Editor Banner */}
      {role === 'editor' ? (
        <View style={{ marginBottom: 14, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.foreground }}>Content Editor Account</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.mutedForeground }}>Your role manages verified bot knowledge articles.</Text>
          </View>
          <Pressable onPress={() => router.push('/admin/knowledge')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.foreground }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.background }}>Open Knowledge Admin</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Super Admin / Admin Toggle Pill (Hidden for human_reviewer) */}
      {(role === 'super_admin' || role === 'admin') ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowSuperAdminPanel(!showSuperAdminPanel)}
            style={[
              styles.adminTogglePill,
              {
                backgroundColor: showSuperAdminPanel ? colors.foreground : colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <KamaloIcon
              name="shield"
              size={16}
              color={showSuperAdminPanel ? colors.background : colors.foreground}
            />
            <Text
              style={[
                styles.adminTogglePillText,
                { color: showSuperAdminPanel ? colors.background : colors.foreground },
              ]}
            >
              {role === 'super_admin' ? 'SUPER ADMIN TEAM & AUDIT CONTROLS' : 'OPERATIONS AUDIT LOG TRAIL'}
            </Text>
            <KamaloIcon
              name={showSuperAdminPanel ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={showSuperAdminPanel ? colors.background : colors.mutedForeground}
            />
          </Pressable>

          {/* Collapsible Super Admin Management Panel */}
          {showSuperAdminPanel && (
            <SuperAdminControlPanel
              colors={colors}
              currentRole={role}
              users={users}
              auditLogs={auditLogs}
              updateUserRole={updateUserRole}
              deleteUser={deleteUser}
              signUp={signUp}
              clearAuditLogs={clearAuditLogs}
              logActivity={logActivity}
              showToast={showToast}
            />
          )}
        </>
      ) : null}

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.kpiNumber, { color: colors.foreground }]}>{stats.open}</Text>
          <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>OPEN</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: stats.overdue ? colors.destructive : colors.border }]}>
          <Text style={[styles.kpiNumber, { color: stats.overdue ? colors.destructive : colors.foreground }]}>
            {stats.overdue}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>PAST SLA</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.kpiNumber, { color: colors.foreground }]}>{stats.urgent}</Text>
          <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>URGENT</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.kpiNumber, { color: colors.foreground }]}>{stats.total}</Text>
          <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>TOTAL</Text>
        </View>
      </View>

      {/* Search Input Box */}
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <KamaloIcon name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by customer name, email, #..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <KamaloIcon name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setCategoryFilter(cat)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.foreground : colors.card,
                    borderColor: isSelected ? colors.foreground : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? colors.background : colors.mutedForeground },
                  ]}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Status Filter Chips */}
      <View style={styles.statusSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_OPTIONS.map((st) => {
            const isSelected = statusFilter === st;
            return (
              <Pressable
                key={st}
                onPress={() => setStatusFilter(st)}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: isSelected ? colors.foreground : colors.secondary,
                    borderColor: isSelected ? colors.foreground : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    { color: isSelected ? colors.background : colors.foreground },
                  ]}
                >
                  {st.replace('_', ' ').toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Queue Count Header */}
      <View style={styles.queueCountRow}>
        <Text style={[styles.queueCountText, { color: colors.mutedForeground }]}>
          SHOWING {filteredTickets.length} OF {rawTickets.length} TICKETS
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {tickets.isLoading ? (
        <LoadingState label="Loading support operations queue..." />
      ) : tickets.isError ? (
        <ErrorState onRetry={() => tickets.refetch()} label="Support queue unavailable" />
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={tickets.isRefetching}
              onRefresh={() => tickets.refetch()}
              tintColor={colors.foreground}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 50, 70) },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="inbox"
                title="Queue is clear"
                body={
                  categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery
                    ? 'No tickets match the selected filters or search terms.'
                    : 'Customer tickets will arrive here directly from mobile submissions.'
                }
              />
            </View>
          }
          renderItem={({ item }) => (
            <AdminTicketCard
              ticket={item}
              onPreviewImage={(url) => setPreviewImage(url)}
              onUpdate={(data) =>
                update.mutate(
                  { ticketId: item.id, data },
                  {
                    onSuccess: () => {
                      void queryClient.invalidateQueries({ queryKey: getListSupportTicketsQueryKey() });
                      void queryClient.invalidateQueries({ queryKey: getGetSupportTicketQueryKey(item.id) });
                      logActivity(
                        'TICKET_STATUS_UPDATED',
                        `Updated ticket #${item.ticketNumber} status to ${data.status.replace('_', ' ').toUpperCase()}`,
                        item.ticketNumber
                      );
                      showToast({
                        title: `Ticket #${item.ticketNumber} Updated`,
                        message: `Status is now ${data.status.replace('_', ' ')}`,
                        type: 'success',
                      });
                    },
                    onError: () => {
                      showToast({
                        title: 'Update Failed',
                        message: 'The ticket could not be updated.',
                        type: 'error',
                      });
                    },
                  }
                )
              }
              onAnalyze={(mode, onResult) =>
                analyze.mutate(
                  { ticketId: item.id, data: { mode } },
                  {
                    onSuccess: (result) => {
                      onResult(result.draftResolution);
                      logActivity(
                        'AI_DRAFT_GENERATED',
                        `Generated resolution draft for ticket #${item.ticketNumber}`,
                        item.ticketNumber
                      );
                      showToast({
                        title: 'AI Draft Ready',
                        message: 'Draft resolution inserted into editor.',
                        type: 'info',
                      });
                    },
                    onError: () => {
                      showToast({
                        title: 'Draft Unavailable',
                        message: 'Could not prepare AI draft.',
                        type: 'error',
                      });
                    },
                  }
                )
              }
              onRetryEmail={() =>
                retryEmail.mutate(
                  { ticketId: item.id },
                  {
                    onSuccess: () => {
                      void tickets.refetch();
                      logActivity(
                        'EMAIL_RETRIED',
                        `Re-sent customer email for ticket #${item.ticketNumber}`,
                        item.ticketNumber
                      );
                      showToast({
                        title: 'Email Sent',
                        message: 'Notification re-sent to customer.',
                        type: 'success',
                      });
                    },
                    onError: () => {
                      showToast({
                        title: 'Email Failed',
                        message: 'Please try again later.',
                        type: 'error',
                      });
                    },
                  }
                )
              }
              updating={update.isPending || analyze.isPending}
            />
          )}
        />
      )}

      {/* Full-Screen Image Preview Modal */}
      <Modal
        visible={Boolean(previewImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close image preview"
            style={styles.modalCloseButton}
            onPress={() => setPreviewImage(null)}
          >
            <KamaloIcon name="x" size={24} color="#ffffff" />
          </Pressable>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.modalImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

// ─── Super Admin Control Panel with Live Audit Logs ───────────────
function SuperAdminControlPanel({
  colors,
  currentRole,
  users,
  auditLogs,
  updateUserRole,
  deleteUser,
  signUp,
  clearAuditLogs,
  logActivity,
  showToast,
}: {
  colors: ReturnType<typeof useColors>;
  currentRole: UserRole;
  users: ReturnType<typeof useAuth>['users'];
  auditLogs: ReturnType<typeof useAuth>['auditLogs'];
  updateUserRole: ReturnType<typeof useAuth>['updateUserRole'];
  deleteUser: ReturnType<typeof useAuth>['deleteUser'];
  signUp: ReturnType<typeof useAuth>['signUp'];
  clearAuditLogs: () => void;
  logActivity: ReturnType<typeof useAuth>['logActivity'];
  showToast: ReturnType<typeof useToast>['showToast'];
}) {
  const isSuperAdmin = currentRole === 'super_admin';
  const [subTab, setSubTab] = useState<'team' | 'audit'>(isSuperAdmin ? 'team' : 'audit');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('human_reviewer');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  function addMember() {
    if (!newUsername.trim()) {
      Alert.alert('Username Required', 'Please enter a username for the staff member.');
      return;
    }
    if (!newName.trim()) {
      Alert.alert('Name Required', 'Please enter a full name.');
      return;
    }

    const res = signUp(
      newUsername.trim(),
      newPassword.trim() || 'pass123',
      newName.trim(),
      newEmail.trim() || `${newUsername.trim()}@kamalo.in`,
      newRole,
      false
    );

    if (res.success) {
      showToast({
        title: 'Staff Member Added',
        message: `${newName.trim()} (@${newUsername.trim()}) registered as ${newRole.replace('_', ' ')}`,
        type: 'success',
      });
      setNewName('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
    } else {
      Alert.alert('Cannot Add Member', res.error || 'Failed to create user account.');
    }
  }

  function handleRoleChange(username: string, r: UserRole) {
    updateUserRole(username, r);
    showToast({
      title: 'Role Updated',
      message: `@${username} is now ${r.replace('_', ' ').toUpperCase()}`,
      type: 'info',
    });
  }

  function handleDelete(username: string) {
    if (username === 'yash') {
      Alert.alert('Protected', 'Primary Super Admin owner account cannot be deleted.');
      return;
    }
    Alert.alert('Remove Account', `Permanently remove user @${username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deleteUser(username);
          showToast({
            title: 'User Removed',
            message: `Account @${username} was deleted.`,
            type: 'warning',
          });
        },
      },
    ]);
  }

  return (
    <View style={[styles.superAdminBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.superAdminTitleRow}>
        <KamaloIcon name="shield" size={18} color={colors.foreground} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.superAdminHeading, { color: colors.foreground }]}>
            {isSuperAdmin ? 'Super Admin Control Center' : 'Operations Audit Center'}
          </Text>
          <Text style={[styles.superAdminSubheading, { color: colors.mutedForeground }]}>
            {isSuperAdmin
              ? 'Live role governance, account permissions, and real-time activity audit logging'
              : 'Real-time activity audit logging and operational accountability'}
          </Text>
        </View>
      </View>

      {/* Sub Tabs: Team Management vs Live Audit Log (Only shown when Super Admin) */}
      {isSuperAdmin ? (
        <View style={[styles.subTabBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setSubTab('team')}
            style={[
              styles.subTabBtn,
              subTab === 'team' && [styles.subTabBtnActive, { backgroundColor: colors.card }],
            ]}
          >
            <Text
              style={[
                styles.subTabBtnText,
                { color: subTab === 'team' ? colors.foreground : colors.mutedForeground },
              ]}
            >
              Team & Staff ({users.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSubTab('audit')}
            style={[
              styles.subTabBtn,
              subTab === 'audit' && [styles.subTabBtnActive, { backgroundColor: colors.card }],
            ]}
          >
            <Text
              style={[
                styles.subTabBtnText,
                { color: subTab === 'audit' ? colors.foreground : colors.mutedForeground },
              ]}
            >
              Activity Audit Log ({auditLogs.length})
            </Text>
          </Pressable>
        </View>
      ) : null}

      {isSuperAdmin && subTab === 'team' ? (
        /* Team & Role Management */
        <View style={{ gap: 10 }}>
          <Text style={[styles.sectionSmallTitle, { color: colors.mutedForeground }]}>
            REGISTERED ACCOUNTS & ROLE PERMISSIONS
          </Text>

          {users.map((u) => (
            <View key={u.username} style={[styles.userAccountCard, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
              <View style={styles.userCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.foreground }]}>{u.name}</Text>
                  <Text style={[styles.memberRole, { color: colors.mutedForeground }]}>
                    @{u.username} · {u.email}
                  </Text>
                </View>
                <View style={[styles.roleBadgeSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.roleBadgeSmallText, { color: colors.foreground }]}>
                    {u.role.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                {u.username !== 'yash' ? (
                  <Pressable onPress={() => handleDelete(u.username)} hitSlop={8} style={{ paddingLeft: 6 }}>
                    <KamaloIcon name="x" size={15} color={colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </View>

              {/* Quick Role Changer Chips for this user */}
              <View style={styles.quickRoleModifierRow}>
                <Text style={[styles.quickRoleLabel, { color: colors.mutedForeground }]}>Role:</Text>
                {ROLES.map((r) => {
                  const isActive = u.role === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => handleRoleChange(u.username, r)}
                      style={[
                        styles.quickRoleChip,
                        {
                          backgroundColor: isActive ? colors.foreground : colors.card,
                          borderColor: isActive ? colors.foreground : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickRoleChipText,
                          { color: isActive ? colors.background : colors.mutedForeground },
                        ]}
                      >
                        {r === 'super_admin' ? 'Super Admin' : r === 'human_reviewer' ? 'Reviewer' : r}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Add New Staff Input */}
          <Text style={[styles.sectionSmallTitle, { color: colors.mutedForeground, marginTop: 10 }]}>
            CREATE / ASSIGN NEW STAFF ACCOUNT
          </Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Full Name"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
          />
          <TextInput
            value={newUsername}
            onChangeText={setNewUsername}
            placeholder="Unique Username (e.g. alex_ops)"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, marginTop: 6 }]}
          />
          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Staff Email (optional)"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, marginTop: 6 }]}
          />

          <View style={styles.roleChipsRow}>
            {ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setNewRole(r)}
                style={[
                  styles.roleSelectChip,
                  {
                    backgroundColor: newRole === r ? colors.foreground : colors.secondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleSelectText,
                    { color: newRole === r ? colors.background : colors.foreground },
                  ]}
                >
                  {r.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button label="Add Team Member" icon="plus" onPress={addMember} />

          {/* Direct Navigation Links */}
          <View style={styles.quickGrid}>
            <Pressable
              onPress={() => router.push('/admin/knowledge')}
              style={[styles.quickCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <KamaloIcon name="book-open" size={18} color={colors.foreground} />
              <Text style={[styles.quickCardTitle, { color: colors.foreground }]}>Knowledge Admin</Text>
              <Text style={[styles.quickCardSub, { color: colors.mutedForeground }]}>
                Manage verified bot knowledge
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/chat')}
              style={[styles.quickCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <KamaloIcon name="cpu" size={18} color={colors.foreground} />
              <Text style={[styles.quickCardTitle, { color: colors.foreground }]}>Staff Chatbot</Text>
              <Text style={[styles.quickCardSub, { color: colors.mutedForeground }]}>
                Live bot testing workspace
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Live Activity Audit Log Stream */
        <View style={{ gap: 10 }}>
          <View style={styles.auditHeaderRow}>
            <Text style={[styles.sectionSmallTitle, { color: colors.mutedForeground }]}>
              REAL-TIME ACTIONS & AUDIT TRAIL
            </Text>
            {isSuperAdmin && auditLogs.length > 0 ? (
              <Pressable
                onPress={() => {
                  Alert.alert('Clear Logs', 'Clear all audit logs?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: clearAuditLogs },
                  ]);
                }}
                hitSlop={6}
              >
                <Text style={[styles.clearLogsText, { color: colors.mutedForeground }]}>Clear Logs</Text>
              </Pressable>
            ) : null}
          </View>

          {!auditLogs.length ? (
            <View style={[styles.emptyAuditBox, { borderColor: colors.border }]}>
              <KamaloIcon name="clock" size={20} color={colors.mutedForeground} />
              <Text style={[styles.emptyAuditText, { color: colors.mutedForeground }]}>
                No activity recorded yet. Any user actions across the app will appear here in real time.
              </Text>
            </View>
          ) : (
            <View style={styles.auditLogList}>
              {auditLogs.map((log) => (
                <View
                  key={log.id}
                  style={[
                    styles.auditCard,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.auditCardTop}>
                    <View style={styles.auditActorWrap}>
                      <KamaloIcon name="user" size={12} color={colors.foreground} />
                      <Text style={[styles.auditActorName, { color: colors.foreground }]}>
                        @{log.actorUsername}
                      </Text>
                      <View style={[styles.auditRoleBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.auditRoleText, { color: colors.foreground }]}>
                          {log.actorRole.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.auditTimeText, { color: colors.mutedForeground }]}>
                      {formatDate(log.timestamp, true)}
                    </Text>
                  </View>

                  <View style={styles.auditActionRow}>
                    <View style={[styles.actionTag, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.actionTagText, { color: colors.foreground }]}>
                        {log.action}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.auditDetailsText, { color: colors.foreground }]}>
                    {log.details}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Individual Admin Ticket Card ────────────────────────────────
function AdminTicketCard({
  ticket,
  onPreviewImage,
  onUpdate,
  onAnalyze,
  onRetryEmail,
  updating,
}: {
  ticket: SupportTicket;
  onPreviewImage: (url: string) => void;
  onUpdate: (data: {
    status: SupportTicket['status'];
    assignedTo?: string | null;
    resolution?: string | null;
    resolutionSource?: 'human' | 'ai' | null;
  }) => void;
  onAnalyze: (mode: 'human' | 'ai', onResult: (draft: string) => void) => void;
  onRetryEmail: () => void;
  updating: boolean;
}) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { logActivity, role, currentUser } = useAuth();
  const { showToast } = useToast();

  const [resolution, setResolution] = useState(ticket.resolution ?? '');
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo ?? '');
  const [mode, setMode] = useState<'ai' | 'human'>((ticket.resolutionSource as 'ai' | 'human') || 'human');
  const [status, setStatus] = useState<SupportTicket['status']>(ticket.status);
  const [showChatHistory, setShowChatHistory] = useState(false);

  const { customerName, cleanDetails, customerEmail } = parseCustomerInfo(ticket);
  const sla = calculateSlaStatus(ticket.createdAt, ticket.level, ticket.resolvedAt);

  return (
    <Card style={styles.card}>
      {/* Top Details & Badges */}
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <Text style={[styles.ticketNumber, { color: colors.foreground }]}>
            #{ticket.ticketNumber}
          </Text>
          <Badge label={sla.slaLabel} tone={sla.badgeTone} />
          <Badge label={ticket.status.replace('_', ' ').toUpperCase()} tone={statusTone(ticket.status)} />
          <Badge label={ticket.priority.toUpperCase()} tone="neutral" />
        </View>

        <Text style={[styles.ticketTitle, { color: colors.foreground }]}>{ticket.summary}</Text>
      </View>

      {/* Customer Information Section */}
      <View style={[styles.customerInfoBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={styles.customerRow}>
          <View style={styles.customerCol}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>CUSTOMER NAME</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{customerName}</Text>
          </View>
          <View style={styles.customerCol}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>CONTACT EMAIL</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
              {customerEmail}
            </Text>
          </View>
        </View>

        <View style={[styles.customerRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }]}>
          <View style={styles.customerCol}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{ticket.category}</Text>
          </View>
          <View style={styles.customerCol}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>CREATED</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {formatDate(ticket.createdAt, true)}
            </Text>
          </View>
        </View>

        {ticket.resolvedAt ? (
          <View style={[styles.customerRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }]}>
            <View style={styles.customerCol}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>RESOLVED AT</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {formatDate(ticket.resolvedAt, true)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Customer Issue Details */}
      <View style={[styles.issueBox, { borderColor: colors.border }]}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>ISSUE DESCRIPTION</Text>
        <Text style={[styles.issueText, { color: colors.foreground }]}>{cleanDetails}</Text>
      </View>

      {/* Attached Images */}
      {ticket.attachmentIds && ticket.attachmentIds.length > 0 && (
        <View style={styles.evidenceSection}>
          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
            ATTACHED EVIDENCE ({ticket.attachmentIds.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evidenceScroll}>
            {ticket.attachmentIds.map((attId, idx) => {
              const url = getAttachmentUrl(ticket.conversationId, attId);
              return (
                <Pressable
                  key={attId}
                  onPress={() => onPreviewImage(url)}
                  style={[styles.evidenceThumb, { borderColor: colors.border }]}
                >
                  <Image source={{ uri: url }} style={styles.evidenceImg} resizeMode="cover" />
                  <View style={styles.evidenceLabel}>
                    <Text style={styles.evidenceLabelText}>Photo #{idx + 1}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Working Chat & Conversation History Toggle */}
      <Pressable
        onPress={() => setShowChatHistory(!showChatHistory)}
        style={[styles.chatHistoryToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}
      >
        <KamaloIcon name="message-circle" size={16} color={colors.foreground} />
        <Text style={[styles.chatHistoryToggleText, { color: colors.foreground }]}>
          {showChatHistory ? 'Hide Customer Chat History' : 'View Customer Chat History'}
        </Text>
        <KamaloIcon
          name={showChatHistory ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.mutedForeground}
        />
      </Pressable>

      {/* Expanded Conversation History */}
      {showChatHistory && (
        <TicketConversationHistory conversationId={ticket.conversationId} />
      )}

      {/* AI Draft & Analysis Path */}
      <View style={[styles.analysisCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={styles.analysisHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.analysisTitle, { color: colors.foreground }]}>RESOLUTION WORKSPACE</Text>
            <Text style={[styles.analysisSubtitle, { color: colors.mutedForeground }]}>
              Generate AI draft or prepare specialist resolution
            </Text>
          </View>
          <View style={[styles.modeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setMode('ai')}
              style={[
                styles.modeButton,
                { backgroundColor: mode === 'ai' ? colors.foreground : 'transparent' },
              ]}
            >
              <Text style={[styles.modeText, { color: mode === 'ai' ? colors.background : colors.foreground }]}>
                AI
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('human')}
              style={[
                styles.modeButton,
                { backgroundColor: mode === 'human' ? colors.foreground : 'transparent' },
              ]}
            >
              <Text style={[styles.modeText, { color: mode === 'human' ? colors.background : colors.foreground }]}>
                Manual
              </Text>
            </Pressable>
          </View>
        </View>

        <Button
          label={mode === 'ai' ? 'Generate AI Resolution Draft' : 'Prepare Manual Review'}
          icon={mode === 'ai' ? 'cpu' : 'user'}
          onPress={() => onAnalyze(mode, (draft) => setResolution(draft))}
          secondary
        />
      </View>

      {/* Specialist Assignment */}
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ASSIGNED AGENT / SPECIALIST</Text>
      <TextInput
        value={assignedTo}
        onChangeText={setAssignedTo}
        placeholder="e.g. Yash (Super Admin) / Support Team"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
      />

      {/* Verified Resolution Editor */}
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>VERIFIED RESOLUTION TO CUSTOMER</Text>
      <TextInput
        value={resolution}
        onChangeText={setResolution}
        placeholder="Write verified answer. Will be sent via notification to customer..."
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={[styles.resolutionInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
      />

      {/* Status Picker */}
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TICKET STATUS</Text>
      <View style={styles.statusChipsRow}>
        {(['open', 'in_review', 'resolved', 'closed'] as const).map((st) => {
          const isSelected = status === st;
          return (
            <Pressable
              key={st}
              onPress={() => setStatus(st)}
              style={[
                styles.statusSelectChip,
                {
                  backgroundColor: isSelected ? colors.foreground : colors.secondary,
                  borderColor: isSelected ? colors.foreground : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusSelectText,
                  { color: isSelected ? colors.background : colors.foreground },
                ]}
              >
                {st.replace('_', ' ')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Save Action */}
      <Button
        label={status === 'resolved' ? 'Save & Notify Customer' : 'Save Ticket Changes'}
        icon="check"
        onPress={() =>
          onUpdate({
            status,
            assignedTo: assignedTo.trim() || null,
            resolution: resolution.trim() || null,
            resolutionSource: mode,
          })
        }
        loading={updating}
      />

      {/* Escalation Controls */}
      {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
        <View style={styles.escalationSection}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ESCALATION DISPATCH</Text>
          <View style={styles.escalationRow}>
            <Button
              label="Escalate to L2"
              icon="arrow-up-right"
              onPress={() => {
                Alert.alert(
                  'Escalate to L2 Specialist?',
                  'This sets the ticket to Tier 2 specialist SLA (48h). Customer will receive notification.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Confirm L2',
                      onPress: async () => {
                        try {
                          const baseUrl = getApiBaseUrl();
                          await fetch(`${baseUrl}/api/tickets/${ticket.id}/escalate/l2`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-user-role': role,
                              'x-user-id': currentUser?.username || 'yash',
                            },
                            body: JSON.stringify({ reason: 'Escalated by supervisor', reviewerName: assignedTo || 'Super Admin' }),
                          });
                          await queryClient.invalidateQueries({ queryKey: getListSupportTicketsQueryKey() });
                          await queryClient.invalidateQueries({ queryKey: getGetSupportTicketQueryKey(ticket.id) });
                          logActivity('ESCALATION_L2', `Escalated ticket #${ticket.ticketNumber} to L2 specialist`, ticket.ticketNumber);
                          showToast({
                            title: 'Escalated to L2',
                            message: `Ticket #${ticket.ticketNumber} assigned to Tier 2 (48h SLA)`,
                            type: 'warning',
                          });
                        } catch {
                          showToast({ title: 'Error', message: 'Could not escalate ticket.', type: 'error' });
                        }
                      },
                    },
                  ]
                );
              }}
              secondary
            />
            {role === 'super_admin' || role === 'admin' ? (
              <Button
                label="Immediate Supervision"
                icon="alert-circle"
                onPress={() => {
                  Alert.alert(
                    'Escalate to Immediate Supervision?',
                    'Highest urgency level. Flagged for instant resolution.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Escalate I.S.',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const baseUrl = getApiBaseUrl();
                            await fetch(`${baseUrl}/api/tickets/${ticket.id}/escalate/is`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-user-role': role,
                                'x-user-id': currentUser?.username || 'yash',
                              },
                              body: JSON.stringify({ reason: 'Critical supervision needed', reviewerName: assignedTo || 'Super Admin' }),
                            });
                            await queryClient.invalidateQueries({ queryKey: getListSupportTicketsQueryKey() });
                            await queryClient.invalidateQueries({ queryKey: getGetSupportTicketQueryKey(ticket.id) });
                            logActivity('ESCALATION_IS', `Escalated ticket #${ticket.ticketNumber} to Immediate Supervision`, ticket.ticketNumber);
                            showToast({
                              title: 'Immediate Supervision Active',
                              message: `Ticket #${ticket.ticketNumber} marked highest priority`,
                              type: 'warning',
                            });
                          } catch {
                            showToast({ title: 'Error', message: 'Could not escalate ticket.', type: 'error' });
                          }
                        },
                      },
                    ]
                  );
                }}
                secondary
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {ticket.emailStatus === 'failed' ? (
        <View style={{ marginTop: 8 }}>
          <Button label="Resend Customer Email Notification" icon="send" onPress={onRetryEmail} secondary />
        </View>
      ) : null}
    </Card>
  );
}

// ─── Real Live Ticket Conversation History ────────────────────────
function TicketConversationHistory({ conversationId }: { conversationId: string }) {
  const colors = useColors();
  const conversation = useGetConversation(conversationId);
  const messages = conversation.data?.messages || [];

  if (conversation.isLoading) {
    return (
      <View style={[styles.chatBox, { borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.foreground} />
        <Text style={[styles.chatLoadingText, { color: colors.mutedForeground }]}>
          Loading customer message history...
        </Text>
      </View>
    );
  }

  if (!messages.length) {
    return (
      <View style={[styles.chatBox, { borderColor: colors.border }]}>
        <Text style={[styles.chatEmptyText, { color: colors.mutedForeground }]}>
          No prior live chat messages found. The customer raised this ticket directly from the form.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.chatBox, { borderColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground, marginBottom: 8 }]}>
        LIVE THREAD MESSAGES ({messages.length})
      </Text>
      {messages.map((m) => {
        const isUser = m.role === 'user';
        return (
          <View
            key={m.id}
            style={[
              styles.chatMessageItem,
              {
                backgroundColor: isUser ? colors.secondary : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.chatMessageHeader}>
              <View style={styles.chatSenderTag}>
                <KamaloIcon name={isUser ? 'user' : 'cpu'} size={12} color={colors.foreground} />
                <Text style={[styles.chatSenderText, { color: colors.foreground }]}>
                  {isUser ? 'Customer' : 'AI Assistant'}
                </Text>
              </View>
              <Text style={[styles.chatTimestamp, { color: colors.mutedForeground }]}>
                {formatDate(m.createdAt, true)}
              </Text>
            </View>
            <Text style={[styles.chatMessageBody, { color: colors.foreground }]}>
              {m.content}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  listHeaderRoot: {
    paddingBottom: 14,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  navbarLeft: {
    gap: 2,
  },
  navEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  navTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  adminTogglePillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  superAdminBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  superAdminTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 4,
  },
  superAdminHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  superAdminSubheading: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  subTabBar: {
    flexDirection: 'row',
    borderRadius: 9,
    borderWidth: 1,
    padding: 3,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
  },
  subTabBtnActive: {
    elevation: 1,
  },
  subTabBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  sectionSmallTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.1,
    marginTop: 4,
  },
  userAccountCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  memberRole: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  roleBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  roleBadgeSmallText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  quickRoleModifierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  quickRoleLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    marginRight: 2,
  },
  quickRoleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
  },
  quickRoleChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    textTransform: 'capitalize',
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  roleSelectChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleSelectText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  quickCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  quickCardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  quickCardSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  auditHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearLogsText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  emptyAuditBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  emptyAuditText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  auditLogList: {
    gap: 8,
  },
  auditCard: {
    borderWidth: 1,
    borderRadius: 9,
    padding: 10,
    gap: 5,
  },
  auditCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditActorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditActorName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  auditRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  auditRoleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
  },
  auditTimeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  auditActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  actionTagText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  auditDetailsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  kpiNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  kpiLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  filterSection: {
    marginBottom: 8,
  },
  statusSection: {
    marginBottom: 10,
  },
  filterScroll: {
    gap: 6,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusChipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  queueCountRow: {
    paddingVertical: 4,
  },
  queueCountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.1,
  },
  emptyWrap: {
    paddingVertical: 40,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    gap: 12,
  },
  cardHeader: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  ticketNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  ticketTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 2,
  },
  customerInfoBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  customerCol: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  issueBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  issueText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  evidenceSection: {
    gap: 6,
  },
  evidenceScroll: {
    gap: 8,
  },
  evidenceThumb: {
    width: 80,
    height: 64,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  evidenceImg: {
    width: '100%',
    height: '100%',
  },
  evidenceLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  evidenceLabelText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  chatHistoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  chatHistoryToggleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
  },
  chatBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  chatLoadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  chatEmptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  chatMessageItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  chatMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatSenderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chatSenderText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  chatTimestamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  chatMessageBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  analysisCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analysisTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  analysisSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  modeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 6,
    padding: 2,
  },
  modeButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  modeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  fieldLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.1,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  resolutionInput: {
    minHeight: 85,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  statusSelectChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusSelectText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  escalationSection: {
    gap: 6,
    marginTop: 4,
  },
  escalationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  guardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  guardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 20,
  },
  guardCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  guardIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  guardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  guardText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  secondaryButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: '92%',
    height: '80%',
  },
});