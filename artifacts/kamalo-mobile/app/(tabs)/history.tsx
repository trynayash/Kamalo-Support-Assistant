import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { KamaloIcon } from '@/components/kamalo-icon';
import * as Haptics from 'expo-haptics';
import {
  getListConversationsQueryKey,
  getListMySupportTicketsQueryKey,
  useDeleteAllConversations,
  useDeleteConversation,
  useListConversations,
  useListMySupportTickets,
  useUpdateConversation,
  ConversationSummary,
  SupportTicket,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  PageHeader,
  Screen,
  formatDate,
  statusTone,
} from '@/components/ui';
import { calculateSlaStatus } from '@/lib/ticketLevels';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function HistoryScreen() {
  const colors = useColors();
  const { isDark } = useTheme();
  const { isStaff } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'tickets' | 'chats'>('tickets');
  
  // Live poll user tickets every 3.5 seconds
  const tickets = useListMySupportTickets({
    query: {
      queryKey: getListMySupportTicketsQueryKey(),
      refetchInterval: 3500,
    },
  });

  const conversations = useListConversations();
  const remove = useDeleteConversation();
  const removeAll = useDeleteAllConversations();
  const rename = useUpdateConversation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');

  // Track ticket state changes to display real-time toast notifications
  const previousTicketsRef = useRef<Map<string, { status: string; resolution: string | null; level: number }>>(new Map());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!tickets.data) return;

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      const map = new Map<string, { status: string; resolution: string | null; level: number }>();
      tickets.data.forEach((t) => {
        map.set(t.id, { status: t.status, resolution: t.resolution ?? null, level: t.level ?? 1 });
      });
      previousTicketsRef.current = map;
      return;
    }

    const prevMap = previousTicketsRef.current;
    const newMap = new Map<string, { status: string; resolution: string | null; level: number }>();

    tickets.data.forEach((t) => {
      newMap.set(t.id, { status: t.status, resolution: t.resolution ?? null, level: t.level ?? 1 });
      const prev = prevMap.get(t.id);
      if (prev) {
        // Status transitioned to resolved
        if (prev.status !== 'resolved' && t.status === 'resolved') {
          showToast({
            title: `Ticket #${t.ticketNumber} Resolved 🎉`,
            message: t.resolution
              ? (t.resolution.length > 95 ? t.resolution.slice(0, 95) + '...' : t.resolution)
              : 'Verified answer provided by support team.',
            type: 'success',
            icon: 'check-circle',
            duration: 6000,
          });
        } else if (prev.status === 'open' && t.status === 'in_review') {
          showToast({
            title: `Ticket #${t.ticketNumber} In Review`,
            message: 'A support specialist is actively investigating your request.',
            type: 'info',
            icon: 'life-buoy',
            duration: 4000,
          });
        } else if ((t.level ?? 1) > (prev.level ?? 1)) {
          showToast({
            title: `Ticket #${t.ticketNumber} Priority Elevated`,
            message: 'Ticket assigned to specialized support tier.',
            type: 'warning',
            icon: 'alert-circle',
            duration: 4500,
          });
        }
      }
    });

    previousTicketsRef.current = newMap;
  }, [tickets.data, showToast]);

  function confirmDelete(item: ConversationSummary) {
    Alert.alert('Delete conversation?', 'This removes the conversation from your KAMALO history.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(
            { conversationId: item.id },
            { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() }) }
          ),
      },
    ]);
  }

  async function saveTitle(conversationId: string) {
    if (!titleDraft.trim() || rename.isPending) return;
    try {
      const updated = await rename.mutateAsync({ conversationId, data: { title: titleDraft.trim() } });
      queryClient.setQueryData<ConversationSummary[]>(getListConversationsQueryKey(), (current) =>
        current?.map((item) =>
          item.id === updated.id ? { ...item, title: updated.title, updatedAt: updated.updatedAt } : item
        )
      );
      setEditingId(null);
    } catch {
      Alert.alert('Rename failed', 'The conversation could not be renamed. Please try again.');
    }
  }

  function confirmDeleteAll() {
    Alert.alert(
      'Delete all conversations?',
      'This removes every conversation from your visible history. Support tickets remain saved.',
      [
        { text: 'Keep history', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () =>
            removeAll.mutate(undefined, {
              onSuccess: () => {
                setEditingId(null);
                void queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
              },
              onError: () => Alert.alert('Delete failed', 'Could not clear history. Please try again.'),
            }),
        },
      ]
    );
  }

  const onRefresh = async () => {
    if (activeTab === 'tickets') {
      await tickets.refetch();
    } else {
      await conversations.refetch();
    }
  };

  return (
    <Screen>
      <PageHeader
        title="History"
        subtitle="Track your raised tickets and previous questions."
      />

      {/* Segmented Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'tickets' }}
          onPress={() => {
            void Haptics.selectionAsync();
            setActiveTab('tickets');
          }}
          style={[
            styles.tabItem,
            activeTab === 'tickets' && [
              styles.tabItemActive,
              { backgroundColor: colors.card },
            ],
          ]}
        >
          <KamaloIcon
            name="life-buoy"
            size={15}
            color={activeTab === 'tickets' ? colors.foreground : colors.mutedForeground}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'tickets' ? colors.foreground : colors.mutedForeground },
            ]}
          >
            My Tickets ({tickets.data?.length || 0})
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'chats' }}
          onPress={() => {
            void Haptics.selectionAsync();
            setActiveTab('chats');
          }}
          style={[
            styles.tabItem,
            activeTab === 'chats' && [
              styles.tabItemActive,
              { backgroundColor: colors.card },
            ],
          ]}
        >
          <KamaloIcon
            name="message-circle"
            size={15}
            color={activeTab === 'chats' ? colors.foreground : colors.mutedForeground}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'chats' ? colors.foreground : colors.mutedForeground },
            ]}
          >
            Saved Chats ({conversations.data?.length || 0})
          </Text>
        </Pressable>
      </View>

      {/* Active Tab View */}
      {activeTab === 'tickets' ? (
        tickets.isLoading ? (
          <LoadingState label="Loading your tickets..." />
        ) : tickets.isError ? (
          <ErrorState onRetry={() => tickets.refetch()} label="Could not load tickets" />
        ) : !tickets.data?.length ? (
          <EmptyState
            icon="life-buoy"
            title="No tickets raised yet"
            body="When you need help with coins, transactions, or your account, raise a ticket and track it here."
            action={
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)')}
                style={[styles.raiseBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.raiseBtnText, { color: colors.primaryForeground }]}>
                  Raise a Ticket
                </Text>
              </Pressable>
            }
          />
        ) : (
          <FlatList
            data={tickets.data}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={tickets.isRefetching}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <TicketCard ticket={item} />}
          />
        )
      ) : (
        /* Saved Chats Tab */
        <>
          {conversations.data?.length ? (
            <Pressable
              onPress={confirmDeleteAll}
              disabled={removeAll.isPending}
              style={({ pressed }) => [
                styles.deleteAll,
                { opacity: removeAll.isPending ? 0.45 : pressed ? 0.7 : 1 },
              ]}
            >
              <KamaloIcon name="trash-2" size={14} color={colors.destructive} />
              <Text style={[styles.deleteAllText, { color: colors.destructive }]}>
                {removeAll.isPending ? 'Clearing…' : 'Clear all chats'}
              </Text>
            </Pressable>
          ) : null}

          {conversations.isLoading ? (
            <LoadingState label="Loading chat history..." />
          ) : conversations.isError ? (
            <ErrorState onRetry={() => conversations.refetch()} label="Could not load chats" />
          ) : !conversations.data?.length ? (
            <EmptyState
              icon="clock"
              title="No saved chats yet"
              body="Questions you ask will be saved here so you can revisit them anytime."
            />
          ) : (
            <FlatList
              data={conversations.data}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={conversations.isRefetching}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              }
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <Card style={styles.card}>
                  <View style={styles.cardTop}>
                    {editingId === item.id ? (
                      <View style={styles.editRow}>
                        <TextInput
                          value={titleDraft}
                          onChangeText={setTitleDraft}
                          maxLength={120}
                          autoFocus
                          style={[
                            styles.editInput,
                            { color: colors.foreground, borderColor: colors.border },
                          ]}
                          accessibilityLabel="Conversation title"
                        />
                        <IconButton
                          icon="check"
                          label="Save name"
                          onPress={() => {
                            void saveTitle(item.id);
                          }}
                          disabled={!titleDraft.trim() || rename.isPending}
                        />
                        <IconButton
                          icon="x"
                          label="Cancel"
                          onPress={() => setEditingId(null)}
                        />
                      </View>
                    ) : (
                      <>
                        <Pressable
                          onPress={() =>
                            router.push({ pathname: '/chat', params: { conversationId: item.id } })
                          }
                          style={({ pressed }) => [
                            styles.cardPress,
                            { opacity: pressed ? 0.68 : 1 },
                          ]}
                        >
                          <View
                            style={[
                              styles.conversationIcon,
                              { backgroundColor: colors.secondary },
                            ]}
                          >
                            <KamaloIcon name="message-square" size={17} color={colors.foreground} />
                          </View>
                          <View style={styles.cardCopy}>
                            <Text
                              style={[styles.title, { color: colors.foreground }]}
                              numberOfLines={2}
                            >
                              {item.title || 'Untitled question'}
                            </Text>
                            <Text
                              style={[styles.meta, { color: colors.mutedForeground }]}
                            >
                              {item.messageCount} {item.messageCount === 1 ? 'message' : 'messages'} ·{' '}
                              {formatDate(item.updatedAt, true)}
                            </Text>
                          </View>
                        </Pressable>
                        <IconButton
                          icon="check"
                          label={`Rename ${item.title}`}
                          onPress={() => {
                            setEditingId(item.id);
                            setTitleDraft(item.title || '');
                          }}
                        />
                        <IconButton
                          icon="trash-2"
                          label={`Delete ${item.title}`}
                          onPress={() => {
                            void Haptics.selectionAsync();
                            confirmDelete(item);
                          }}
                        />
                      </>
                    )}
                  </View>
                </Card>
              )}
            />
          )}
        </>
      )}
    </Screen>
  );
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const colors = useColors();
  const sla = calculateSlaStatus(ticket.createdAt, ticket.level, ticket.resolvedAt);

  return (
    <Card
      onPress={() => router.push(`/ticket/${ticket.id}`)}
      style={styles.ticketCard}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.numberRow}>
          <Text style={[styles.ticketNumber, { color: colors.foreground }]}>
            {ticket.ticketNumber}
          </Text>
          <Badge label={sla.slaLabel} tone={sla.badgeTone} />
        </View>
        <Badge
          label={ticket.status.replace('_', ' ')}
          tone={statusTone(ticket.status)}
        />
      </View>

      <Text
        style={[styles.ticketSummary, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {ticket.summary}
      </Text>

      {ticket.resolution ? (
        <View style={[styles.resolutionBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={styles.resolutionHeader}>
            <KamaloIcon name="check-circle" size={13} color={colors.foreground} />
            <Text style={[styles.resolutionTitle, { color: colors.foreground }]}>Verified Resolution</Text>
          </View>
          <Text style={[styles.resolutionSnippet, { color: colors.foreground }]} numberOfLines={2}>
            {ticket.resolution}
          </Text>
        </View>
      ) : null}

      <View style={styles.ticketFooter}>
        <Text style={[styles.categoryTag, { color: colors.mutedForeground }]}>
          {ticket.category}
        </Text>
        <View style={styles.statusPill}>
          <Text
            style={[
              styles.slaStatusText,
              { color: sla.isOverdue ? colors.destructive : colors.primary },
            ]}
          >
            {sla.statusText}
          </Text>
          <KamaloIcon name="chevron-right" size={14} color={colors.mutedForeground} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    borderRadius: 9,
  },
  tabItemActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 10,
  },
  ticketCard: {
    padding: 15,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  ticketSummary: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 10,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
  categoryTag: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slaStatusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  raiseBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  raiseBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  card: {
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  deleteAll: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 7,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  deleteAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  cardPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  cardCopy: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 5,
  },
  resolutionBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resolutionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  resolutionSnippet: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
});