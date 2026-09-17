import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { fetch } from 'expo/fetch';
import { Feather } from '@expo/vector-icons';
import {
  ChatMessage,
  getGetConversationQueryKey,
  getListConversationsQueryKey,
  uploadConversationImage,
  useCreateConversation,
  useCreateMessageFeedback,
  useGetConversation,
  useListConversations,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { streamConversationMessage } from '@/lib/stream';
import { EmptyState, IconButton, LoadingState, Screen } from '@/components/ui';
import { NavigationMenu } from '@/components/NavigationMenu';
import { FeedbackOverlay } from '@/components/FeedbackOverlay';

let messageCounter = 0;
function localMessage(role: ChatMessage['role'], content: string, conversationId: string, attachment?: ChatMessage['attachments']): ChatMessage {
  messageCounter += 1;
  return { id: `mobile-${Date.now()}-${messageCounter}`, conversationId, role, content, createdAt: new Date().toISOString(), attachments: attachment ?? [] };
}

function friendlyChatError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  const normalized = message.toLowerCase();
  if (normalized.includes('fetch failed') || normalized.includes('network request failed') || normalized.includes('network error')) {
    return 'KAMALO could not reach the support server. Check your connection and try again.';
  }
  return message || 'The assistant could not respond. Please try again.';
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);
  const { data: conversations, isLoading: conversationsLoading } = useListConversations();
  const createConversation = useCreateConversation();
  const feedback = useCreateMessageFeedback();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<ChatMessage['attachments'][number] | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<{ message: ChatMessage; rating: 'helpful' | 'not_helpful' } | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const params = useLocalSearchParams<{ conversationId?: string }>();

  useEffect(() => {
    if (params.conversationId) {
      setConversationId(params.conversationId);
      setInitialized(true);
    }
  }, [params.conversationId]);

  useEffect(() => {
    if (!initialized && conversations && conversations.length > 0) {
      setConversationId(conversations[0].id);
      setInitialized(true);
    } else if (!initialized && conversations && conversations.length === 0) {
      setInitialized(true);
    }
  }, [conversations, initialized]);

  const conversationQuery = useGetConversation(conversationId ?? '', {
    query: { enabled: Boolean(conversationId), queryKey: getGetConversationQueryKey(conversationId ?? '') },
  });

  useEffect(() => {
    if (conversationQuery.data?.messages) setMessages(conversationQuery.data.messages);
  }, [conversationQuery.data?.messages]);

  async function startNewChat() {
    await Haptics.selectionAsync();
    setConversationId(null);
    setMessages([]);
    setAttachment(null);
    setDraft('');
    setStreamError(null);
  }

  async function chooseImage() {
    if (!conversationId) {
      Alert.alert('Start with a question', 'Send a text question first, then attach an image to continue the same conversation.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos permission needed', 'Allow photo access to attach a product image to your question.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82, allowsEditing: true });
    if (result.canceled || !result.assets[0]) return;
    try {
      const asset = result.assets[0];
      const blob = await (await fetch(asset.uri)).blob();
      const uploaded = await uploadConversationImage(conversationId, { file: blob });
      setAttachment(uploaded);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Attachment failed', 'That image could not be attached. Please try another photo.');
    }
  }

  async function send() {
    const text = draft.trim();
    if ((!text && !attachment) || isStreaming) return;
    Keyboard.dismiss();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStreamError(null);
    let activeId = conversationId;
    try {
      if (!activeId) {
        const created = await createConversation.mutateAsync({ data: { title: text.slice(0, 64) || 'Image question' } });
        activeId = created.id;
        setConversationId(activeId);
      }
      const attachmentForMessage = attachment ? [attachment] : [];
      setMessages((previous) => [...previous, localMessage('user', text || 'Image attachment sent.', activeId!, attachmentForMessage)]);
      setDraft('');
      setAttachment(null);
      setIsStreaming(true);
      let answer = '';
      let assistantAdded = false;
      await streamConversationMessage(activeId, text, attachment?.id ?? null, (chunk) => {
        answer += chunk;
        if (!assistantAdded) {
          assistantAdded = true;
          setMessages((previous) => [...previous, localMessage('assistant', answer, activeId!)]);
        } else {
          setMessages((previous) => previous.map((message, index) => index === previous.length - 1 ? { ...message, content: answer } : message));
        }
      });
      await queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(activeId) });
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    } catch (error) {
      setStreamError(friendlyChatError(error));
    } finally {
      setIsStreaming(false);
    }
  }

  function openFeedback(message: ChatMessage, rating: 'helpful' | 'not_helpful') {
    setFeedbackError(null);
    setActiveFeedback({ message, rating });
  }

  async function submitFeedback(score: number, note: string) {
    if (!activeFeedback) return;
    setFeedbackError(null);
    try {
      await feedback.mutateAsync({
        messageId: activeFeedback.message.id,
        data: { rating: activeFeedback.rating, score, feedback: note || null },
      });
      setMessages((previous) => previous.map((message) => message.id === activeFeedback.message.id ? { ...message, feedback: activeFeedback.rating } : message));
      setActiveFeedback(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Thanks for the feedback', 'Your review was submitted to KAMALO.');
    } catch (error) {
      setFeedbackError(friendlyChatError(error));
    }
  }

  async function raiseTicketFromFeedback(score: number, note: string) {
    if (!activeFeedback) return;
    try {
      await feedback.mutateAsync({
        messageId: activeFeedback.message.id,
        data: { rating: 'not_helpful', score, feedback: note || null },
      });
    } catch {
      // The ticket still contains the answer context and can be submitted if review delivery is unavailable.
    }
    const message = activeFeedback.message;
    setActiveFeedback(null);
    router.push({
      pathname: '/(tabs)/support',
      params: {
        conversationId: message.conversationId,
        messageId: message.id,
        feedbackRating: 'not_helpful',
        feedbackScore: String(score),
        feedbackNote: note,
        feedbackSummary: 'KAMALO answer was not helpful',
      },
    });
  }

  const visibleMessages = [...messages].reverse();

  return (
    <Screen>
      <View style={[styles.topBar, { paddingTop: insets.top + 10, borderBottomColor: colors.border }]}>
        <View style={styles.brandLockup}>
          <Image source={require('../../assets/images/icon.png')} style={styles.brandLogo} accessibilityLabel="KAMALO logo" />
          <View><Text style={[styles.brandName, { color: colors.foreground }]}>KAMALO</Text><Text style={[styles.brandMeta, { color: colors.mutedForeground }]}>Product guide</Text></View>
        </View>
        <View style={styles.topActions}>
          <NavigationMenu />
          <IconButton icon="plus" label="Start a new chat" onPress={startNewChat} tone="filled" />
        </View>
      </View>
      <KeyboardAvoidingView style={styles.chat} behavior="padding" keyboardVerticalOffset={0}>
        {conversationsLoading && !conversationId ? <LoadingState label="Preparing your assistant" /> : messages.length === 0 ? (
          <FlatList
            data={[]}
            renderItem={() => null}
            scrollEnabled={false}
            style={styles.listViewport}
            ListEmptyComponent={
              <EmptyState icon="message-square" title="Ask KAMALO anything" body="Answers are grounded in approved product knowledge. Start with a specific question or describe what you are seeing." />
            }
            contentContainerStyle={styles.emptyList}
          />
        ) : (
          <FlatList
            data={visibleMessages}
            inverted
            style={styles.listViewport}
            keyExtractor={(item) => item.id}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.messageList}
            ListHeaderComponent={isStreaming ? <TypingIndicator /> : null}
            renderItem={({ item }) => (
              <MessageBubble message={item} colors={colors} onRate={(rating) => openFeedback(item, rating)} />
            )}
          />
        )}
        <View style={[styles.composerShell, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 10) }]}>
          {streamError ? <Pressable onPress={() => setStreamError(null)} style={[styles.errorBanner, { backgroundColor: colors.destructive + '16' }]}><Feather name="alert-circle" size={14} color={colors.destructive} /><Text style={[styles.errorBannerText, { color: colors.destructive }]} numberOfLines={2}>{streamError}</Text></Pressable> : null}
          {attachment ? <View style={[styles.attachmentPill, { backgroundColor: colors.secondary }]}><Feather name="paperclip" size={14} color={colors.primary} /><Text style={[styles.attachmentText, { color: colors.foreground }]} numberOfLines={1}>{attachment.filename}</Text><IconButton icon="x" label="Remove attachment" onPress={() => setAttachment(null)} /></View> : null}
          <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconButton icon="paperclip" label="Attach an image" onPress={chooseImage} disabled={isStreaming} />
            <TextInput
              ref={inputRef}
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask about KAMALO"
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={4000}
              blurOnSubmit={false}
              style={[styles.composerInput, { color: colors.foreground }]}
              onSubmitEditing={send}
              editable={!isStreaming}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Send question" disabled={isStreaming || (!draft.trim() && !attachment)} onPress={send} style={({ pressed }) => [styles.send, { backgroundColor: colors.primary, opacity: isStreaming || (!draft.trim() && !attachment) ? 0.32 : pressed ? 0.7 : 1 }]}><Feather name="arrow-up" size={18} color={colors.primaryForeground} /></Pressable>
          </View>
          <Text style={[styles.composerNote, { color: colors.mutedForeground }]}>KAMALO answers from approved knowledge only.</Text>
        </View>
      </KeyboardAvoidingView>
      <FeedbackOverlay
        visible={Boolean(activeFeedback)}
        rating={activeFeedback?.rating ?? 'helpful'}
        submitting={feedback.isPending}
        error={feedbackError}
        onClose={() => setActiveFeedback(null)}
        onSubmit={(score, note) => { void submitFeedback(score, note); }}
        onRaiseTicket={(score, note) => { void raiseTicketFromFeedback(score, note); }}
      />
    </Screen>
  );
}

function TypingIndicator() {
  const colors = useColors();
  return <View style={[styles.typing, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.dot, { backgroundColor: colors.accent }]} /><Text style={[styles.typingText, { color: colors.mutedForeground }]}>KAMALO is thinking</Text></View>;
}

function MessageBubble({ message, colors, onRate }: { message: ChatMessage; colors: ReturnType<typeof useColors>; onRate: (rating: 'helpful' | 'not_helpful') => void }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
      {!isUser ? <View style={[styles.assistantDot, { backgroundColor: colors.accent }]} /> : null}
      <View style={styles.bubbleColumn}>
        <View style={[styles.bubble, isUser ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.messageText, { color: isUser ? colors.primaryForeground : colors.foreground }]}>{message.content}</Text>
          {message.attachments.length > 0 ? <View style={styles.attachmentMessage}><Feather name="paperclip" size={12} color={isUser ? colors.primaryForeground : colors.primary} /><Text style={[styles.attachmentMessageText, { color: isUser ? colors.primaryForeground : colors.mutedForeground }]}>{message.attachments[0].filename}</Text></View> : null}
        </View>
        {!isUser ? <View style={styles.feedbackRow}><Text style={[styles.feedbackHint, { color: colors.mutedForeground }]}>Was this useful?</Text><Pressable accessibilityRole="button" accessibilityLabel="Helpful answer" onPress={() => onRate('helpful')} hitSlop={7}><Feather name="thumbs-up" size={14} color={message.feedback === 'helpful' ? colors.primary : colors.mutedForeground} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Not helpful answer" onPress={() => onRate('not_helpful')} hitSlop={7}><Feather name="thumbs-down" size={14} color={message.feedback === 'not_helpful' ? colors.destructive : colors.mutedForeground} /></Pressable></View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 36, height: 36, borderRadius: 10, overflow: 'hidden' },
  brandName: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 1.4 },
  brandMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 2 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chat: { flex: 1 },
  listViewport: { flex: 1 },
  emptyList: { flex: 1, justifyContent: 'center' },
  messageList: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 18 },
  messageRow: { flexDirection: 'row', marginBottom: 17, maxWidth: '92%' },
  userRow: { alignSelf: 'flex-end' },
  assistantRow: { alignSelf: 'flex-start' },
  assistantDot: { width: 7, height: 7, borderRadius: 4, marginTop: 10, marginRight: 8 },
  bubbleColumn: { flexShrink: 1 },
  bubble: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  messageText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  attachmentMessage: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  attachmentMessageText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  feedbackRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 7, paddingLeft: 4 },
  feedbackHint: { fontFamily: 'Inter_400Regular', fontSize: 10, marginRight: 2 },
  typing: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9, marginHorizontal: 25, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  typingText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  composerShell: { paddingHorizontal: 14, paddingTop: 8 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderRadius: 13, minHeight: 58, paddingHorizontal: 5, paddingVertical: 6 },
  composerInput: { flex: 1, minHeight: 40, maxHeight: 100, paddingHorizontal: 9, paddingVertical: 9, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 20 },
  send: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  composerNote: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 8, marginBottom: 2 },
  attachmentPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 8, paddingLeft: 10, marginBottom: 7, maxWidth: '92%' },
  attachmentText: { fontFamily: 'Inter_500Medium', fontSize: 12, marginLeft: 6, maxWidth: 180 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  errorBannerText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12 },
});
