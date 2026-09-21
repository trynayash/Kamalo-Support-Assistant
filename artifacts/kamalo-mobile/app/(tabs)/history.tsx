import React, { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { KamaloIcon } from '@/components/kamalo-icon';
import * as Haptics from 'expo-haptics';
import { getListConversationsQueryKey, useDeleteAllConversations, useDeleteConversation, useListConversations, useUpdateConversation, ConversationSummary } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Card, EmptyState, ErrorState, IconButton, LoadingState, PageHeader, Screen, formatDate } from '@/components/ui';

export default function HistoryScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const conversations = useListConversations();
  const remove = useDeleteConversation();
  const removeAll = useDeleteAllConversations();
  const rename = useUpdateConversation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  function confirmDelete(item: ConversationSummary) {
    Alert.alert('Delete conversation?', 'This removes the conversation from your KAMALO history.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate({ conversationId: item.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() }) }) },
    ]);
  }
  async function saveTitle(conversationId: string) {
    if (!titleDraft.trim() || rename.isPending) return;
    try {
      const updated = await rename.mutateAsync({ conversationId, data: { title: titleDraft.trim() } });
      queryClient.setQueryData<ConversationSummary[]>(getListConversationsQueryKey(), (current) => current?.map((item) => item.id === updated.id ? { ...item, title: updated.title, updatedAt: updated.updatedAt } : item));
      setEditingId(null);
    } catch {
      Alert.alert('Rename failed', 'The conversation could not be renamed. Please try again.');
    }
  }
  function confirmDeleteAll() {
    Alert.alert('Delete all conversations?', 'This removes every conversation from your visible KAMALO history. The internal support record is retained.', [
      { text: 'Keep history', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: () => removeAll.mutate(undefined, { onSuccess: () => { setEditingId(null); void queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() }); }, onError: () => Alert.alert('Delete failed', 'Your history could not be cleared. Please try again.') }) },
    ]);
  }
  return (
    <Screen>
      <PageHeader eyebrow="Your space" title="History" subtitle="Pick up a previous line of thinking." />
      {conversations.data?.length ? <Pressable onPress={confirmDeleteAll} disabled={removeAll.isPending} style={({ pressed }) => [styles.deleteAll, { opacity: removeAll.isPending ? 0.45 : pressed ? 0.7 : 1 }]}><KamaloIcon name="trash-2" size={14} color={colors.destructive} /><Text style={[styles.deleteAllText, { color: colors.destructive }]}>{removeAll.isPending ? 'Removing…' : 'Delete all history'}</Text></Pressable> : null}
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
                 {editingId === item.id ? <View style={styles.editRow}><TextInput value={titleDraft} onChangeText={setTitleDraft} maxLength={120} autoFocus style={[styles.editInput, { color: colors.foreground, borderColor: colors.primary }]} accessibilityLabel="Conversation title" /><IconButton icon="check" label="Save conversation name" onPress={() => { void saveTitle(item.id); }} disabled={!titleDraft.trim() || rename.isPending} /><IconButton icon="x" label="Cancel rename" onPress={() => setEditingId(null)} /></View> : <><Pressable onPress={() => router.push({ pathname: '/', params: { conversationId: item.id } })} style={({ pressed }) => [styles.cardPress, { opacity: pressed ? 0.68 : 1 }]}>
                   <View style={[styles.conversationIcon, { backgroundColor: colors.secondary }]}><KamaloIcon name="message-square" size={17} color={colors.primary} /></View>
                   <View style={styles.cardCopy}><Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{item.title || 'Untitled conversation'}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.messageCount} {item.messageCount === 1 ? 'message' : 'messages'} · {formatDate(item.updatedAt, true)}</Text></View>
                 </Pressable><IconButton icon="check" label={`Rename ${item.title}`} onPress={() => { setEditingId(item.id); setTitleDraft(item.title || ''); }} /><IconButton icon="trash-2" label={`Delete ${item.title}`} onPress={() => { void Haptics.selectionAsync(); confirmDelete(item); }} /></>}
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
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  editInput: { flex: 1, minHeight: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  deleteAll: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 7, marginHorizontal: 16, marginBottom: 12 },
  deleteAllText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  cardPress: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  conversationIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  cardCopy: { flex: 1, paddingRight: 8 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 5 },
});