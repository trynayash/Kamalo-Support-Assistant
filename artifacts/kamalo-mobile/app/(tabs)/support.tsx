import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  getListMySupportTicketsQueryKey,
  useCreateConversation,
  useCreateSupportTicket,
  useListConversations,
  useListMySupportTickets,
  SupportTicket,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Button, Card, EmptyState, ErrorState, Field, LoadingState, PageHeader, Screen, Badge, formatDate, statusTone } from '@/components/ui';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const categories = ['Account access', 'Billing', 'Product question', 'Technical issue', 'Other'];

export default function SupportScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const tickets = useListMySupportTickets();
  const conversations = useListConversations();
  const createConversation = useCreateConversation();
  const createTicket = useCreateSupportTicket();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState(categories[0]);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit() {
    const nextErrors: Record<string, string> = {};
    if (summary.trim().length < 3) nextErrors.summary = 'Add a short summary.';
    if (details.trim().length < 3) nextErrors.details = 'Add a little more detail so the team can help.';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Use a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      let conversationId = conversations.data?.[0]?.id;
      if (!conversationId) conversationId = (await createConversation.mutateAsync({ data: { title: summary.trim().slice(0, 64) } })).id;
      await createTicket.mutateAsync({ data: { conversationId, category, summary: summary.trim(), details: details.trim(), contactEmail: email.trim() || null } });
      await queryClient.invalidateQueries({ queryKey: getListMySupportTicketsQueryKey() });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSummary('');
      setDetails('');
      setEmail('');
      setShowForm(false);
      Alert.alert('Ticket raised', 'Your request is now in the KAMALO support queue.');
    } catch {
      Alert.alert('Could not raise ticket', 'Please check your connection and try again.');
    }
  }

  if (showForm) {
    return (
      <Screen>
        <PageHeader eyebrow="Support" title="Raise a ticket" subtitle="A little context helps us route your request well." action="Cancel" onAction={() => setShowForm(false)} />
        <KeyboardAwareScrollViewCompat contentContainerStyle={styles.form} bottomOffset={22}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>WHAT CAN WE HELP WITH?</Text>
          <View style={styles.categoryWrap}>{categories.map((item) => <Text key={item} onPress={() => setCategory(item)} style={[styles.category, { backgroundColor: category === item ? colors.primary : colors.secondary, color: category === item ? colors.primaryForeground : colors.foreground }]}>{item}</Text>)}</View>
          <Field label="Summary" value={summary} onChangeText={setSummary} placeholder="What is happening?" maxLength={180} error={errors.summary} />
          <Field label="Details" value={details} onChangeText={setDetails} placeholder="Tell us what you expected and what you saw." multiline numberOfLines={6} textAlignVertical="top" style={styles.details} error={errors.details} />
          <Field label="Email (optional)" value={email} onChangeText={setEmail} placeholder="Where should we follow up?" autoCapitalize="none" keyboardType="email-address" error={errors.email} />
          <Button label="Submit ticket" icon="arrow-up-right" onPress={submit} loading={createTicket.isPending} />
        </KeyboardAwareScrollViewCompat>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader eyebrow="Help, when you need it" title="Support" subtitle="Track requests and keep the conversation moving." action="New ticket" onAction={() => setShowForm(true)} />
      {tickets.isLoading ? <LoadingState /> : tickets.isError ? <ErrorState onRetry={() => tickets.refetch()} /> : !tickets.data?.length ? <EmptyState icon="life-buoy" title="Nothing in the queue" body="If KAMALO cannot answer a question, raise a ticket and we will keep it moving." action={<Button label="Raise a ticket" icon="plus" onPress={() => setShowForm(true)} />} /> : (
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
  return <Card onPress={onPress} style={styles.ticketCard}><View style={styles.ticketHeader}><Text style={[styles.ticketNumber, { color: colors.primary }]}>{ticket.ticketNumber}</Text><Badge label={ticket.status.replace('_', ' ')} tone={statusTone(ticket.status)} /></View><Text style={[styles.ticketSummary, { color: colors.foreground }]} numberOfLines={2}>{ticket.summary}</Text><View style={styles.ticketMeta}><Text style={[styles.meta, { color: colors.mutedForeground }]}>{ticket.category}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{formatDate(ticket.updatedAt, true)}</Text><Feather name="chevron-right" size={15} color={colors.mutedForeground} /></View></Card>;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
  ticketCard: { padding: 15 },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketNumber: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1 },
  ticketSummary: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 21, marginTop: 12 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, flex: 1 },
  form: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.1, marginBottom: 9 },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  category: { overflow: 'hidden', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 9, fontFamily: 'Inter_500Medium', fontSize: 12 },
  details: { minHeight: 124 },
});