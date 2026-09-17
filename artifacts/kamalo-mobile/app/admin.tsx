import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetSupportTicketQueryKey,
  getListSupportTicketsQueryKey,
  useAnalyzeSupportTicket,
  useListSupportTickets,
  useRetrySupportTicketEmail,
  useUpdateSupportTicket,
  SupportTicket,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, formatDate, statusTone } from '@/components/ui';

const statuses: SupportTicket['status'][] = ['open', 'in_review', 'resolved', 'closed'];

export default function AdminScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const tickets = useListSupportTickets();
  const update = useUpdateSupportTicket();
  const analyze = useAnalyzeSupportTicket();
  const retryEmail = useRetrySupportTicketEmail();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.intro, { backgroundColor: colors.foreground }]}>
        <Text style={[styles.introEyebrow, { color: colors.accent }]}>VISIBLE TEST WORKSPACE</Text>
        <Text style={[styles.introTitle, { color: colors.primaryForeground }]}>Support queue</Text>
        <Text style={[styles.introBody, { color: colors.secondary }]}>Review requests, route ownership, and record a resolution. This workspace uses live demo data.</Text>
      </View>
      {tickets.isLoading ? <LoadingState /> : tickets.isError ? <ErrorState onRetry={() => tickets.refetch()} /> : !tickets.data?.length ? <EmptyState icon="inbox" title="Queue is clear" body="New customer tickets will appear here." /> : <FlatList data={tickets.data} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={tickets.isRefetching} onRefresh={() => tickets.refetch()} tintColor={colors.primary} />} contentContainerStyle={styles.list} renderItem={({ item }) => <AdminTicket ticket={item} onUpdate={(data) => update.mutate({ ticketId: item.id, data }, { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: getListSupportTicketsQueryKey() }); void queryClient.invalidateQueries({ queryKey: getGetSupportTicketQueryKey(item.id) }); }, onError: () => Alert.alert('Update failed', 'The ticket could not be updated.') })} onAnalyze={(mode) => analyze.mutate({ ticketId: item.id, data: { mode } }, { onSuccess: (result) => Alert.alert('Draft resolution', result.draftResolution), onError: () => Alert.alert('Analysis unavailable', 'Please try again later.') })} onRetryEmail={() => retryEmail.mutate({ ticketId: item.id }, { onSuccess: () => { void tickets.refetch(); }, onError: () => Alert.alert('Email retry failed', 'Please try again later.') })} updating={update.isPending || analyze.isPending} />} />}
    </View>
  );
}

function AdminTicket({ ticket, onUpdate, onAnalyze, onRetryEmail, updating }: { ticket: SupportTicket; onUpdate: (data: { status: SupportTicket['status']; assignedTo?: string | null; resolution?: string | null; resolutionSource?: 'human' | 'ai' | null }) => void; onAnalyze: (mode: 'human' | 'ai') => void; onRetryEmail: () => void; updating: boolean }) {
  const colors = useColors();
  const [resolution, setResolution] = useState(ticket.resolution ?? '');
  const nextStatus = statuses[(statuses.indexOf(ticket.status) + 1) % statuses.length];
  return <Card style={styles.ticket}><View style={styles.ticketTop}><View style={styles.ticketCopy}><Text style={[styles.number, { color: colors.primary }]}>{ticket.ticketNumber}</Text><Text style={[styles.summary, { color: colors.foreground }]}>{ticket.summary}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{ticket.category} · {formatDate(ticket.createdAt, true)}</Text></View><Badge label={ticket.status.replace('_', ' ')} tone={statusTone(ticket.status)} /></View><View style={styles.signalRow}>{ticket.feedbackRating ? <Badge label={`${ticket.feedbackRating === 'not_helpful' ? 'Thumbs down' : 'Thumbs up'} review`} tone={ticket.feedbackRating === 'not_helpful' ? 'red' : 'teal'} /> : null}{ticket.attachmentIds.length > 0 ? <Text style={[styles.attachmentSignal, { color: colors.mutedForeground }]}><Text style={{ color: colors.primary }}>●</Text> {ticket.attachmentIds.length} reference image{ticket.attachmentIds.length === 1 ? '' : 's'}</Text> : null}</View><Text style={[styles.details, { color: colors.mutedForeground }]} numberOfLines={3}>{ticket.details}</Text><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>RESOLUTION NOTE</Text><TextInput value={resolution} onChangeText={setResolution} placeholder="Add what was done..." placeholderTextColor={colors.mutedForeground} multiline style={[styles.resolution, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /><View style={styles.actions}><Button label={`Move to ${nextStatus.replace('_', ' ')}`} icon="arrow-right" onPress={() => onUpdate({ status: nextStatus, resolution: resolution || null, resolutionSource: resolution ? 'human' : null })} loading={updating} /><View style={styles.smallActions}><Button label="AI draft" icon="cpu" onPress={() => onAnalyze('ai')} secondary /><Button label="Save note" icon="check" onPress={() => onUpdate({ status: ticket.status, resolution: resolution || null, resolutionSource: resolution ? 'human' : null })} secondary /></View>{ticket.emailStatus === 'failed' ? <Button label="Retry customer email" icon="send" onPress={onRetryEmail} secondary /> : null}</View></Card>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  intro: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 22 },
  introEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.35 },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, marginTop: 8 },
  introBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 7 },
  list: { padding: 16, paddingBottom: 34, gap: 12 },
  ticket: { padding: 15 },
  ticketTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ticketCopy: { flex: 1 },
  signalRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9, marginTop: 12 },
  attachmentSignal: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  number: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1 },
  summary: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 21, marginTop: 7 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 6 },
  details: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 14 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.1, marginTop: 16, marginBottom: 7 },
  resolution: { minHeight: 74, borderWidth: 1, borderRadius: 8, padding: 10, fontFamily: 'Inter_400Regular', fontSize: 13, textAlignVertical: 'top' },
  actions: { gap: 9, marginTop: 12 },
  smallActions: { flexDirection: 'row', gap: 9 },
});