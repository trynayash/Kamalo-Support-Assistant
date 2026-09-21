import React from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { KamaloIcon } from '@/components/kamalo-icon';
import * as Haptics from 'expo-haptics';
import { getListConversationsQueryKey, useDeleteConversation, useListConversations, ConversationSummary } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Card, EmptyState, ErrorState, IconButton, LoadingState, PageHeader, Screen, formatDate } from '@/components/ui';

export default function HistoryScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const conversations = useListConversations();
  const remove = useDeleteConversation();
  function confirmDelete(item: ConversationSummary) {
    Alert.alert('Delete conversation?', 'This removes the conversation from your KAMALO history.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate({ conversationId: item.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() }) }) },
    ]);
  }
  return (
    <Screen>
      <PageHeader eyebrow="Your space" title="History" subtitle="Pick up a previous line of thinking." />
      {conversations.isLoading ? <LoadingState /> : conversations.isError ? <ErrorState onRetry={() => conversations.refetch()} /> : !conversations.data?.length ? (
        <EmptyState icon="clock" title="No saved conversations yet" body="Your questions and grounded answers will appear here once you start a chat." />
      ) : (
        <FlatList
          data={conversations.data}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={conversations.isRefetching} onRefresh={() => conversations.refetch()} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <Pressable onPress={() => router.push({ pathname: '/', params: { conversationId: item.id } })} style={({ pressed }) => [styles.cardPress, { opacity: pressed ? 0.68 : 1 }]}>
                    <View style={[styles.conversationIcon, { backgroundColor: colors.secondary }]}><KamaloIcon name="message-square" size={17} color={colors.primary} /></View>
                    <View style={styles.cardCopy}><Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{item.title || 'Untitled conversation'}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.messageCount} {item.messageCount === 1 ? 'message' : 'messages'} · {formatDate(item.updatedAt, true)}</Text></View>
                  </Pressable>
                  <IconButton icon="trash-2" label={`Delete ${item.title}`} onPress={() => { void Haptics.selectionAsync(); confirmDelete(item); }} />
                </View>
              </Card>
            )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 10 },
  card: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardPress: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  conversationIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  cardCopy: { flex: 1, paddingRight: 8 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 5 },
});