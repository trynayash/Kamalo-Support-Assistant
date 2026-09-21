import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { KamaloIcon } from '@/components/kamalo-icon';
import {
  getGetSupportTicketQueryKey,
  getListMySupportTicketsQueryKey,
  useGetSupportTicket,
  useRetrySupportTicketEmail,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Badge, Button, ErrorState, LoadingState, Screen, formatDate, statusTone } from '@/components/ui';

export default function TicketDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const ticket = useGetSupportTicket(id ?? '', { query: { enabled: Boolean(id), queryKey: getGetSupportTicketQueryKey(id ?? '') } });
  const retryEmail = useRetrySupportTicketEmail();
  if (ticket.isLoading) return <Screen><LoadingState label="Loading ticket" /></Screen>;
  if (ticket.isError || !ticket.data) return <Screen><ErrorState onRetry={() => ticket.refetch()} label="Ticket could not be loaded" /></Screen>;
  const item = ticket.data;
  return <Screen><ScrollView contentContainerStyle={styles.scroll}>
    <View style={styles.hero}><Text style={[styles.number, { color: colors.primary }]}>{item.ticketNumber}</Text><Badge label={item.status.replace('_', ' ')} tone={statusTone(item.status)} /><Text style={[styles.title, { color: colors.foreground }]}>{item.summary}</Text><Text style={[styles.date, { color: colors.mutedForeground }]}>Opened {formatDate(item.createdAt, true)}</Text></View>
    <View style={[styles.divider, { backgroundColor: colors.border }]} />
    <Section label="Category" value={item.category} />
    <Section label="Details" value={item.details} />
    {item.resolution ? <Section label="Resolution" value={item.resolution} /> : <View style={[styles.waiting, { backgroundColor: colors.secondary }]}><KamaloIcon name="clock" size={18} color={colors.primary} /><View style={styles.waitingCopy}><Text style={[styles.waitingTitle, { color: colors.foreground }]}>Still in progress</Text><Text style={[styles.waitingBody, { color: colors.mutedForeground }]}>The support team has this request and will update it here.</Text></View></View>}
    {item.contactEmail && item.emailStatus === 'failed' ? <View style={styles.retry}><Text style={[styles.retryText, { color: colors.destructive }]}>The follow-up email did not send.</Text><Button label="Retry email" icon="send" onPress={() => retryEmail.mutate({ ticketId: item.id }, { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: getGetSupportTicketQueryKey(item.id) }); void queryClient.invalidateQueries({ queryKey: getListMySupportTicketsQueryKey() }); }, onError: () => Alert.alert('Could not retry', 'Please try again later.') })} loading={retryEmail.isPending} secondary /></View> : null}
  </ScrollView></Screen>;
}

function Section({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View style={styles.section}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text><Text style={[styles.value, { color: colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 42 },
  hero: { gap: 10 },
  number: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1.1 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30, marginTop: 2 },
  date: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  divider: { height: 1, marginVertical: 23 },
  section: { marginBottom: 22 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.1, marginBottom: 7 },
  value: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23 },
  waiting: { flexDirection: 'row', padding: 14, borderRadius: 10, gap: 11, marginTop: 4 },
  waitingCopy: { flex: 1 },
  waitingTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  waitingBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 4 },
  retry: { gap: 10, marginTop: 4 },
  retryText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
});