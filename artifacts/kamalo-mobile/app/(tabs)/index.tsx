import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { fetch } from 'expo/fetch';
import { KamaloIcon } from '@/components/kamalo-icon';
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
import { AssistantResponseOutcome, streamConversationMessage } from '@/lib/stream';
import {
  getSpeechRecognitionModule,
  useOptionalSpeechRecognitionEvent,
} from '@/lib/speechRecognition';
import { EmptyState, IconButton, LoadingState, Screen, ToastNotification } from '@/components/ui';
import { NavigationMenu } from '@/components/NavigationMenu';
import { FeedbackOverlay } from '@/components/FeedbackOverlay';

let messageCounter = 0;
type ChatLanguage = 'en' | 'hi' | 'mr';

const chatLanguages: Array<{ value: ChatLanguage; label: string; voiceLocale: string }> = [
  { value: 'en', label: 'English', voiceLocale: 'en-IN' },
  { value: 'hi', label: 'हिन्दी', voiceLocale: 'hi-IN' },
  { value: 'mr', label: 'मराठी', voiceLocale: 'mr-IN' },
];
const UNKNOWN_KAMALO_RESPONSE =
  "I am not able to confirm that from the KAMALO knowledge I have right now. Please raise a ticket so our team can review your query and get back to you.";

function isUnknownKamaloResponse(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  return normalized.includes("raise a ticket")
    || normalized.includes("i am not able to confirm that from the kamalo knowledge")
    || normalized.includes("i don't have confirmed information about that in the kamalo information available to me");
}

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
  const [responseOutcomes, setResponseOutcomes] = useState<Record<string, AssistantResponseOutcome>>({});
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<ChatMessage['attachments'][number] | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<{ message: ChatMessage; rating: 'helpful' | 'not_helpful' } | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<ChatLanguage>('en');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const voiceInputMode = useRef<'text' | 'voice'>('text');
  const voiceBaseDraft = useRef('');
  const voicePausedRef = useRef(false);
  const [ticketToast, setTicketToast] = useState<{ title: string; message: string } | null>(null);
  const handledTicketToast = useRef<string | null>(null);
  const params = useLocalSearchParams<{ conversationId?: string; ticketRaised?: string; ticketNumber?: string }>();
  const ticketRaised = typeof params.ticketRaised === 'string' ? params.ticketRaised : params.ticketRaised?.[0];
  const ticketNumber = typeof params.ticketNumber === 'string' ? params.ticketNumber : params.ticketNumber?.[0];

  useOptionalSpeechRecognitionEvent('start', () => {
    voicePausedRef.current = false;
    setIsVoicePaused(false);
    setIsListening(true);
  });
  useOptionalSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    if (!voicePausedRef.current) setIsVoicePaused(false);
  });
  useOptionalSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (!transcript) return;
    const base = voiceBaseDraft.current.trim();
    setDraft(`${base}${base ? ' ' : ''}${transcript}`.slice(0, 4000));
  });
  useOptionalSpeechRecognitionEvent('error', (event) => {
    voicePausedRef.current = false;
    setIsListening(false);
    setIsVoicePaused(false);
    if (event.error !== 'aborted') setVoiceError(event.error === 'not-allowed' ? 'Microphone access is blocked. Allow microphone access and try again.' : 'Voice input could not hear that. Please try again.');
  });

  useEffect(() => {
    if (params.conversationId) {
      setConversationId(params.conversationId);
      setInitialized(true);
    }
  }, [params.conversationId]);

  useEffect(() => {
    if (ticketRaised !== '1') return;
    const toastKey = ticketNumber || 'ticket-raised';
    if (handledTicketToast.current === toastKey) return;
    handledTicketToast.current = toastKey;
    setTicketToast({
      title: 'Ticket raised',
      message: ticketNumber
        ? `${ticketNumber} is in the support queue. KAMALO will help resolve it shortly.`
        : 'Your request is in the support queue. KAMALO will help resolve it shortly.',
    });
    const timeout = setTimeout(() => setTicketToast(null), 5200);
    return () => clearTimeout(timeout);
  }, [ticketNumber, ticketRaised]);

  useEffect(() => {
    if (!initialized && conversations) setInitialized(true);
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
    setVoiceError(null);
    voiceInputMode.current = 'text';
    voicePausedRef.current = false;
    setIsVoicePaused(false);
    if (isListening || isVoicePaused) getSpeechRecognitionModule()?.stop();
  }

  function stopVoiceInput() {
    voicePausedRef.current = false;
    setIsVoicePaused(false);
    setIsListening(false);
    getSpeechRecognitionModule()?.stop();
  }

  function pauseVoiceInput() {
    if (!isListening) return;
    voicePausedRef.current = true;
    setIsVoicePaused(true);
    setIsListening(false);
    getSpeechRecognitionModule()?.stop();
  }

  async function startVoiceInput() {
    if (isStreaming) return;
    setVoiceError(null);
    const speechRecognitionModule = getSpeechRecognitionModule();
    if (!speechRecognitionModule) {
      setVoiceError('Voice input is not available in this Expo Go simulator. You can still type your question.');
      return;
    }
    if (isListening) {
      speechRecognitionModule.stop();
      return;
    }
    voicePausedRef.current = false;
    setIsVoicePaused(false);
    try {
      const permission = await speechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        if (permission.canAskAgain === false && Platform.OS !== 'web') {
          Alert.alert(
            'Microphone access is blocked',
            'Allow microphone and speech recognition access in Settings, then try again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => { try { Linking.openSettings(); } catch { /* Settings deep link unavailable on this device. */ } } },
            ],
          );
        }
        setVoiceError(
          permission.canAskAgain === false
            ? 'Microphone and speech recognition access is blocked. Open Settings to allow it, then try again.'
            : 'Microphone and speech recognition permission are required for voice input.',
        );
        return;
      }
      voiceBaseDraft.current = draft.trim();
      voiceInputMode.current = 'voice';
      speechRecognitionModule.start({
        lang: chatLanguages.find((language) => language.value === selectedLanguage)?.voiceLocale || 'en-IN',
        interimResults: true,
        continuous: false,
        contextualStrings: ['KAMALO', 'Coins', 'Silver', 'Gold', 'FINCADO', 'Guru'],
      });
    } catch {
      setVoiceError('Voice input is not available on this device.');
    }
  }

  async function toggleVoiceInput() {
    if (isStreaming) return;
    if (isListening) {
      stopVoiceInput();
      return;
    }
    if (isVoicePaused) {
      await startVoiceInput();
      return;
    }
    await startVoiceInput();
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
    if (isListening || isVoicePaused) stopVoiceInput();
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
      let assistantMessageId: string | null = null;
      const response = await streamConversationMessage(activeId, text, attachment?.id ?? null, (chunk) => {
        answer += chunk;
        if (!assistantAdded) {
          assistantAdded = true;
          const message = localMessage('assistant', answer, activeId!);
          assistantMessageId = message.id;
          setMessages((previous) => [...previous, message]);
        } else {
          setMessages((previous) => previous.map((message) => message.id === assistantMessageId ? { ...message, content: answer } : message));
        }
      }, voiceInputMode.current, selectedLanguage);
      if (assistantMessageId && response.outcome) setResponseOutcomes((current) => ({ ...current, [assistantMessageId as string]: response.outcome as AssistantResponseOutcome }));
      await queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(activeId) });
      await queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    } catch (error) {
      setStreamError(friendlyChatError(error));
    } finally {
      setIsStreaming(false);
      voiceInputMode.current = 'text';
    }
  }

  function openFeedback(message: ChatMessage, rating: 'helpful' | 'not_helpful') {
    setFeedbackError(null);
    setActiveFeedback({ message, rating });
  }

  function raiseTicketFromUnknown(message: ChatMessage) {
    router.push({
      pathname: '/(tabs)/support',
      params: {
        conversationId: message.conversationId,
        messageId: message.id,
        feedbackRating: 'not_helpful',
        feedbackSummary: 'KAMALO could not confirm an answer',
        feedbackNote: `Question needs specialist review.\n\nAssistant response:\n${message.content}`,
      },
    });
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

  function dismissTicketToast() {
    setTicketToast(null);
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
        {conversationsLoading && !conversationId ? <LoadingState label="Preparing your assistant" /> : messages.length === 0 && !isStreaming ? (
          <FlatList
            data={[]}
            renderItem={() => null}
            scrollEnabled={false}
            style={styles.listViewport}
            ListEmptyComponent={
              <EmptyState icon="message-square" illustration={require('../../assets/kamalo-welcome-illustration.png')} title="How can I help you today?" body="Ask a question. KAMALO answers from approved product knowledge and keeps your earlier conversations in History." />
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
              <MessageBubble message={item} colors={colors} onRate={(rating) => openFeedback(item, rating)} onRaiseTicket={responseOutcomes[item.id] === 'unknown' || isUnknownKamaloResponse(item.content) ? () => raiseTicketFromUnknown(item) : undefined} />
            )}
          />
        )}
        <View style={[styles.composerShell, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 10) }]}>
          {streamError ? <Pressable onPress={() => setStreamError(null)} style={[styles.errorBanner, { backgroundColor: colors.destructive + '16' }]}><KamaloIcon name="alert-circle" size={14} color={colors.destructive} /><Text style={[styles.errorBannerText, { color: colors.destructive }]} numberOfLines={2}>{streamError}</Text></Pressable> : null}
          {voiceError ? <Pressable onPress={() => setVoiceError(null)} style={[styles.errorBanner, { backgroundColor: colors.destructive + '16' }]}><KamaloIcon name="alert-circle" size={14} color={colors.destructive} /><Text style={[styles.errorBannerText, { color: colors.destructive }]} numberOfLines={2}>{voiceError}</Text></Pressable> : null}
          {attachment ? <View style={[styles.attachmentPill, { backgroundColor: colors.secondary }]}><KamaloIcon name="paperclip" size={14} color={colors.primary} /><Text style={[styles.attachmentText, { color: colors.foreground }]} numberOfLines={1}>{attachment.filename}</Text><IconButton icon="x" label="Remove attachment" onPress={() => setAttachment(null)} /></View> : null}
           <View style={styles.composerTools}>
           <IconButton icon="paperclip" label="Attach an image" onPress={chooseImage} disabled={isStreaming} />
           <Pressable
            testID="language-picker"
            accessibilityRole="button"
            accessibilityLabel={`Chat language: ${chatLanguages.find((language) => language.value === selectedLanguage)?.label ?? 'English'}`}
            accessibilityHint="Opens the language menu"
            accessibilityState={{ expanded: languageMenuOpen, disabled: isStreaming || isListening }}
            disabled={isStreaming || isListening}
            onPress={() => setLanguageMenuOpen(true)}
            style={({ pressed }) => [
              styles.languagePicker,
              { backgroundColor: colors.secondary, borderColor: colors.border, opacity: isStreaming || isListening ? 0.48 : pressed ? 0.72 : 1 },
            ]}
          >
            <KamaloIcon name="globe" size={15} color={colors.primary} />
            <Text style={[styles.languagePickerText, { color: colors.foreground }]}>
              {chatLanguages.find((language) => language.value === selectedLanguage)?.label ?? 'English'}
            </Text>
            <KamaloIcon name="chevron-down" size={15} color={colors.mutedForeground} />
           </Pressable>
           </View>
          <View style={[styles.composer, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
            {isListening || isVoicePaused ? (
              <>
                <IconButton
                  icon={isVoicePaused ? 'mic' : 'pause'}
                  label={isVoicePaused ? 'Resume voice input' : 'Pause voice input'}
                  onPress={() => { if (isVoicePaused) void toggleVoiceInput(); else pauseVoiceInput(); }}
                  disabled={isStreaming}
                />
                <IconButton icon="square" label="Stop voice input" onPress={stopVoiceInput} disabled={isStreaming} />
              </>
            ) : (
              <IconButton icon="mic" label="Start voice input" onPress={() => { void toggleVoiceInput(); }} disabled={isStreaming} />
            )}
             <Pressable accessibilityRole="button" accessibilityLabel="Send question" disabled={isStreaming || (!draft.trim() && !attachment)} onPress={send} style={({ pressed }) => [styles.send, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: isStreaming || (!draft.trim() && !attachment) ? 0.32 : pressed ? 0.7 : 1 }]}><KamaloIcon name="arrow-up" size={18} color={colors.primaryForeground} /></Pressable>
          </View>
          <Text style={[styles.composerNote, { color: colors.mutedForeground }]}>KAMALO answers from approved knowledge only.</Text>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={languageMenuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLanguageMenuOpen(false)}
      >
        <View style={styles.languageModalRoot}>
          <Pressable
            accessibilityLabel="Close language menu"
            onPress={() => setLanguageMenuOpen(false)}
            style={styles.languageBackdrop}
          />
          <View
            style={[
              styles.languageMenu,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: insets.bottom + 14,
              },
            ]}
          >
            <View style={styles.languageMenuHeader}>
              <View>
                <Text style={[styles.languageMenuEyebrow, { color: colors.primary }]}>LANGUAGE</Text>
                <Text style={[styles.languageMenuTitle, { color: colors.foreground }]}>Choose a language</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close language menu"
                onPress={() => setLanguageMenuOpen(false)}
                hitSlop={10}
                style={({ pressed }) => ({ opacity: pressed ? 0.58 : 1 })}
              >
                <KamaloIcon name="x" size={21} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={styles.languageMenuOptions}>
              {chatLanguages.map((language) => {
                const selected = selectedLanguage === language.value;
                return (
                  <Pressable
                    key={language.value}
                    testID={`language-option-${language.value}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Use ${language.label}`}
                    onPress={() => {
                      setSelectedLanguage(language.value);
                      setLanguageMenuOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.languageMenuOption,
                      {
                        backgroundColor: selected ? colors.secondary : 'transparent',
                        opacity: pressed ? 0.68 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.languageMenuOptionText, { color: selected ? colors.primary : colors.foreground }]}>
                      {language.label}
                    </Text>
                    {selected ? <KamaloIcon name="check" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
      <FeedbackOverlay
        visible={Boolean(activeFeedback)}
        rating={activeFeedback?.rating ?? 'helpful'}
        submitting={feedback.isPending}
        error={feedbackError}
        onClose={() => setActiveFeedback(null)}
        onSubmit={(score, note) => { void submitFeedback(score, note); }}
        onRaiseTicket={(score, note) => { void raiseTicketFromFeedback(score, note); }}
      />
      {ticketToast ? <ToastNotification title={ticketToast.title} message={ticketToast.message} topOffset={insets.top + 10} onDismiss={dismissTicketToast} /> : null}
    </Screen>
  );
}

function TypingIndicator() {
  const colors = useColors();
  return <View style={[styles.typing, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.dot, { backgroundColor: colors.accent }]} /><Text style={[styles.typingText, { color: colors.mutedForeground }]}>KAMALO is thinking</Text></View>;
}

function MessageBubble({ message, colors, onRate, onRaiseTicket }: { message: ChatMessage; colors: ReturnType<typeof useColors>; onRate: (rating: 'helpful' | 'not_helpful') => void; onRaiseTicket?: () => void }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
      {!isUser ? <View style={[styles.assistantDot, { backgroundColor: colors.accent }]} /> : null}
      <View style={styles.bubbleColumn}>
        <View style={[styles.bubble, isUser ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.messageText, { color: isUser ? colors.primaryForeground : colors.foreground }]}>{message.content}</Text>
          {message.attachments.length > 0 ? <View style={styles.attachmentMessage}><KamaloIcon name="paperclip" size={12} color={isUser ? colors.primaryForeground : colors.primary} /><Text style={[styles.attachmentMessageText, { color: isUser ? colors.primaryForeground : colors.mutedForeground }]}>{message.attachments[0].filename}</Text></View> : null}
          {!isUser && onRaiseTicket ? <View style={[styles.escalationCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '35' }]}>
             <View style={styles.escalationCopy}><KamaloIcon name="life-buoy" size={15} color={colors.primary} /><View style={styles.escalationText}><Text style={[styles.escalationTitle, { color: colors.foreground }]}>I don’t have confirmed knowledge for this yet.</Text><Text style={[styles.escalationBody, { color: colors.mutedForeground }]}>If you want, I can raise a ticket for a specialist to review it.</Text></View></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Raise a support ticket" onPress={onRaiseTicket} style={({ pressed }) => [styles.escalationButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}><KamaloIcon name="life-buoy" size={13} color={colors.primaryForeground} /><Text style={[styles.escalationButtonText, { color: colors.primaryForeground }]}>Raise a ticket</Text></Pressable>
          </View> : null}
        </View>
        {!isUser ? <View style={styles.feedbackRow}><Text style={[styles.feedbackHint, { color: colors.mutedForeground }]}>Was this useful?</Text><Pressable accessibilityRole="button" accessibilityLabel="Helpful answer" onPress={() => onRate('helpful')} hitSlop={7}><KamaloIcon name="thumbs-up" size={14} color={message.feedback === 'helpful' ? colors.primary : colors.mutedForeground} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Not helpful answer" onPress={() => onRate('not_helpful')} hitSlop={7}><KamaloIcon name="thumbs-down" size={14} color={message.feedback === 'not_helpful' ? colors.destructive : colors.mutedForeground} /></Pressable></View> : null}
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
  escalationCard: { borderWidth: 1, borderRadius: 9, padding: 10, marginTop: 11, gap: 9 },
  escalationCopy: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  escalationText: { flex: 1 },
  escalationTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  escalationBody: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: 2 },
  escalationButton: { minHeight: 32, borderRadius: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, alignSelf: 'flex-start' },
  escalationButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  typing: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9, marginHorizontal: 25, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  typingText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  composerShell: { paddingHorizontal: 14, paddingTop: 8 },
  composerTools: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderRadius: 13, minHeight: 58, paddingHorizontal: 5, paddingVertical: 6 },
  composerInput: { flex: 1, minHeight: 40, maxHeight: 100, paddingHorizontal: 9, paddingVertical: 9, fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 20 },
  send: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  composerNote: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', marginTop: 8, marginBottom: 2 },
  languagePicker: { alignSelf: 'flex-start', minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, marginBottom: 7 },
  languagePickerText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  languageModalRoot: { flex: 1, justifyContent: 'flex-end' },
  languageBackdrop: { flex: 1, backgroundColor: 'rgba(21, 35, 33, 0.38)' },
  languageMenu: { borderTopWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 18 },
  languageMenuHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  languageMenuEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.4 },
  languageMenuTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.4, marginTop: 5 },
  languageMenuOptions: { gap: 7, marginTop: 20 },
  languageMenuOption: { minHeight: 50, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  languageMenuOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  attachmentPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 8, paddingLeft: 10, marginBottom: 7, maxWidth: '92%' },
  attachmentText: { fontFamily: 'Inter_500Medium', fontSize: 12, marginLeft: 6, maxWidth: 180 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  errorBannerText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12 },
});
