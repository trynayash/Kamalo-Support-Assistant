import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { fetch } from 'expo/fetch';
import { useQueryClient } from '@tanstack/react-query';
import { KamaloIcon } from '@/components/kamalo-icon';
import * as Haptics from 'expo-haptics';
import {
  getListMySupportTicketsQueryKey,
  getGetConversationQueryKey,
  ImageAttachment,
  uploadConversationImage,
  useCreateConversation,
  useCreateSupportTicket,
  useListConversations,
  useListMySupportTickets,
  SupportTicket,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Button, Card, EmptyState, ErrorState, Field, LoadingState, PageHeader, Screen, Badge, formatDate, statusTone } from '@/components/ui';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { SUPPORT_CATEGORIES, SupportCategory, calculateSlaStatus } from '@/lib/ticketLevels';

export default function SupportScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const tickets = useListMySupportTickets();
  const conversations = useListConversations();
  const createConversation = useCreateConversation();
  const createTicket = useCreateSupportTicket();
  const params = useLocalSearchParams<{
    conversationId?: string;
    messageId?: string;
    feedbackRating?: 'helpful' | 'not_helpful';
    feedbackScore?: string;
    feedbackNote?: string;
    feedbackSummary?: string;
  }>();
  const [showForm, setShowForm] = useState(Boolean(params.feedbackRating === 'not_helpful'));
  const [category, setCategory] = useState<string>(SUPPORT_CATEGORIES[0]);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [linkedConversationId, setLinkedConversationId] = useState<string | null>(params.conversationId ?? null);
  const [linkedMessageId, setLinkedMessageId] = useState<string | null>(params.messageId ?? null);
  const [feedbackRating, setFeedbackRating] = useState<'helpful' | 'not_helpful' | null>(params.feedbackRating ?? null);
  const [attachment, setAttachment] = useState<{ item: ImageAttachment; previewUri: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (params.conversationId) setLinkedConversationId(params.conversationId);
    if (params.messageId) setLinkedMessageId(params.messageId);
    if (params.feedbackRating) setFeedbackRating(params.feedbackRating);
    if (params.feedbackRating === 'not_helpful') {
      setShowForm(true);
      setCategory('Others');
      setSummary(params.feedbackSummary || 'KAMALO answer was not helpful');
      setDetails(params.feedbackNote || '');
    }
  }, [params.conversationId, params.feedbackNote, params.feedbackRating, params.feedbackSummary, params.messageId]);

  function resetForm() {
    setSummary('');
    setDetails('');
    setEmail('');
    setCategory(SUPPORT_CATEGORIES[0]);
    setLinkedConversationId(null);
    setLinkedMessageId(null);
    setFeedbackRating(null);
    setAttachment(null);
    setErrors({});
  }

  function leaveForm() {
    const destinationConversationId = linkedConversationId;
    resetForm();
    setShowForm(false);
    if (destinationConversationId) {
      router.replace({ pathname: '/', params: { conversationId: destinationConversationId } });
    }
  }

  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos permission needed', 'Allow photo access to attach a screenshot or reference image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82, allowsEditing: true });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      const activeConversationId = linkedConversationId || conversations.data?.[0]?.id || (await createConversation.mutateAsync({ data: { title: summary.trim().slice(0, 64) || 'Support request' } })).id;
      if (!linkedConversationId) setLinkedConversationId(activeConversationId);
      const asset = result.assets[0];
      const blob = await (await fetch(asset.uri)).blob();
      const uploaded = await uploadConversationImage(activeConversationId, { file: blob });
      setAttachment({ item: uploaded, previewUri: asset.uri });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Attachment failed', 'That image could not be attached. Please try another screenshot.');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    const nextErrors: Record<string, string> = {};
    if (summary.trim().length < 3) nextErrors.summary = 'Add a short summary.';
    if (details.trim().length < 3) nextErrors.details = 'Add a little more detail so the team can help.';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Use a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      let conversationId = linkedConversationId || conversations.data?.[0]?.id;
      if (!conversationId) conversationId = (await createConversation.mutateAsync({ data: { title: summary.trim().slice(0, 64) } })).id;
      const createdTicket = await createTicket.mutateAsync({
        data: {
          conversationId,
          messageId: linkedMessageId,
          category,
          summary: summary.trim(),
          details: details.trim(),
          contactEmail: email.trim() || null,
          feedbackRating,
          attachmentIds: attachment ? [attachment.item.id] : undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId) });
      await queryClient.invalidateQueries({ queryKey: getListMySupportTicketsQueryKey() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const ticketNumber = createdTicket.ticketNumber;
      resetForm();
      setShowForm(false);
      router.replace({ pathname: '/', params: { conversationId, ticketRaised: '1', ticketNumber } });
    } catch {
      Alert.alert('Could not raise ticket', 'Please check your connection and try again.');
    }
  }

  if (showForm) {
    return (
      <Screen>
        <PageHeader eyebrow="Support" title="Raise a ticket" subtitle="A little context helps us route your request to the right engine." action="Cancel" onAction={leaveForm} />
        <KeyboardAwareScrollViewCompat contentContainerStyle={styles.form} bottomOffset={22}>
          <View style={[styles.slaBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <View style={styles.slaBannerHeader}>
              <KamaloIcon name="clock" size={14} color={colors.primary} />
              <Text style={[styles.slaBannerTitle, { color: colors.primary }]}>RESOLUTION TIMELINE (SLA)</Text>
            </View>
            <Text style={[styles.slaBannerText, { color: colors.foreground }]}>
              • L1 (24h SLA) for standard requests & general issues{'\n'}
              • L2 (48h SLA) for Coins / Fincado / Commission engine queries{'\n'}
              • I.S. (Immediate) for transactions & critical alerts
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TICKET CATEGORY</Text>
          <View style={styles.categoryWrap}>
            {SUPPORT_CATEGORIES.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: category === item }}
                style={[
                  styles.category,
                  { backgroundColor: category === item ? colors.primary : colors.secondary, borderColor: category === item ? colors.primary : colors.border },
                ]}
              >
                <Text style={[styles.categoryText, { color: category === item ? colors.primaryForeground : colors.foreground }]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <Field label="Summary" value={summary} onChangeText={setSummary} placeholder="What is happening?" maxLength={180} error={errors.summary} />
          <Field label="Details" value={details} onChangeText={setDetails} placeholder="Tell us what you expected and what you saw." multiline numberOfLines={6} textAlignVertical="top" style={styles.details} error={errors.details} />
          <View style={styles.evidenceSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REFERENCE IMAGE / EVIDENCE</Text>
            {attachment ? (
              <View style={[styles.attachmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Image source={{ uri: attachment.previewUri }} style={styles.attachmentPreview} />
                <View style={styles.attachmentCopy}>
                  <Text style={[styles.attachmentName, { color: colors.foreground }]} numberOfLines={1}>{attachment.item.filename}</Text>
                  <Text style={[styles.attachmentMeta, { color: colors.mutedForeground }]}>Attached to this ticket</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Remove reference image" onPress={() => setAttachment(null)} hitSlop={8}>
                  <KamaloIcon name="x" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={chooseImage}
                disabled={uploading}
                style={({ pressed }) => [styles.uploadButton, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: uploading ? 0.5 : pressed ? 0.68 : 1 }]}
              >
                <KamaloIcon name={uploading ? 'loader' : 'image'} size={17} color={colors.primary} />
                <View style={styles.uploadCopy}>
                  <Text style={[styles.uploadTitle, { color: colors.foreground }]}>{uploading ? 'Uploading image…' : 'Add screenshot or transaction proof'}</Text>
                  <Text style={[styles.uploadMeta, { color: colors.mutedForeground }]}>JPG or PNG, optional</Text>
                </View>
                <KamaloIcon name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Field label="Email (optional)" value={email} onChangeText={setEmail} placeholder="Where should we follow up?" autoCapitalize="none" keyboardType="email-address" error={errors.email} />
          <Button label="Submit ticket" icon="arrow-up-right" onPress={submit} loading={createTicket.isPending || uploading} />
        </KeyboardAwareScrollViewCompat>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader eyebrow="Help, when you need it" title="Support" subtitle="Track requests, SLA timelines, and resolved issues." action="New ticket" onAction={() => setShowForm(true)} />
      {tickets.isLoading ? <LoadingState /> : tickets.isError ? <ErrorState onRetry={() => tickets.refetch()} /> : !tickets.data?.length ? (
        <EmptyState
          icon="life-buoy"
          title="Nothing in the queue"
          body="If KAMALO cannot answer a question, raise a ticket and our review team will resolve it within SLA."
          action={<Button label="Raise a ticket" icon="plus" onPress={() => setShowForm(true)} />}
        />
      ) : (
        <FlatList
          data={tickets.data}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={tickets.isRefetching} onRefresh={() => tickets.refetch()} tintColor={colors.primary} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <TicketRow ticket={item} onPress={() => router.push(`/ticket/${item.id}`)} />}
        />
      )}
    </Screen>
  );
}

function TicketRow({ ticket, onPress }: { ticket: SupportTicket; onPress: () => void }) {
  const colors = useColors();
  const sla = calculateSlaStatus(ticket.createdAt, ticket.level, ticket.resolvedAt);

  return (
    <Card onPress={onPress} style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.numberRow}>
          <Text style={[styles.ticketNumber, { color: colors.primary }]}>{ticket.ticketNumber}</Text>
          <Badge label={sla.slaLabel} tone={sla.badgeTone} />
        </View>
        <Badge label={ticket.status.replace('_', ' ')} tone={statusTone(ticket.status)} />
      </View>
      <Text style={[styles.ticketSummary, { color: colors.foreground }]} numberOfLines={2}>{ticket.summary}</Text>
      <View style={styles.ticketMeta}>
        <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>{ticket.category}</Text>
        <Text style={[styles.slaMeta, { color: sla.isOverdue ? colors.destructive : colors.primary }]}>
          {sla.statusText}
        </Text>
        <KamaloIcon name="chevron-right" size={15} color={colors.mutedForeground} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
  ticketCard: { padding: 15 },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketNumber: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1 },
  ticketSummary: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 21, marginTop: 12 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, flex: 1 },
  slaMeta: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  form: { paddingHorizontal: 20, paddingBottom: 40 },
  slaBanner: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 18 },
  slaBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  slaBannerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.1 },
  slaBannerText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.1, marginBottom: 9 },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  category: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  categoryText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  details: { minHeight: 124 },
  evidenceSection: { marginBottom: 16 },
  attachmentCard: { borderWidth: 1, borderRadius: 10, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  attachmentPreview: { width: 48, height: 48, borderRadius: 7, backgroundColor: '#dfe8e3' },
  attachmentCopy: { flex: 1 },
  attachmentName: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  attachmentMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  uploadButton: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadCopy: { flex: 1 },
  uploadTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  uploadMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
});