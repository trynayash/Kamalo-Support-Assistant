import React, { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { calculateSlaStatus } from '@/lib/ticketLevels';
import { getAttachmentUrl } from '@/lib/apiConfig';

export default function TicketDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const ticket = useGetSupportTicket(id ?? '', { query: { enabled: Boolean(id), queryKey: getGetSupportTicketQueryKey(id ?? '') } });
  const retryEmail = useRetrySupportTicketEmail();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (ticket.isLoading) return <Screen><LoadingState label="Loading ticket details" /></Screen>;
  if (ticket.isError || !ticket.data) return <Screen><ErrorState onRetry={() => ticket.refetch()} label="Ticket could not be loaded" /></Screen>;

  const item = ticket.data;
  const sla = calculateSlaStatus(item.createdAt, item.level, item.resolvedAt);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Ticket Header & Status */}
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Text style={[styles.number, { color: colors.primary }]}>{item.ticketNumber}</Text>
            <View style={styles.badges}>
              <Badge label={sla.slaLabel} tone={sla.badgeTone} />
              <Badge label={item.status.replace('_', ' ')} tone={statusTone(item.status)} />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{item.summary}</Text>
          <View style={styles.slaBanner}>
            <KamaloIcon name="clock" size={14} color={sla.isOverdue ? colors.destructive : colors.primary} />
            <Text style={[styles.slaText, { color: sla.isOverdue ? colors.destructive : colors.primary }]}>
              {sla.statusText}
            </Text>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              · Opened {formatDate(item.createdAt, true)}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Closed-Loop Reviewer & Checker Timeline */}
        <View style={[styles.lifecycleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.lifecycleTitle, { color: colors.foreground }]}>CLOSED-LOOP AUDIT LOG</Text>
          <View style={styles.timeline}>
            {/* Step 1: Customer Creation */}
            <View style={styles.timelineStep}>
              <View style={[styles.timelineIcon, { backgroundColor: colors.primary + '20' }]}>
                <KamaloIcon name="check" size={13} color={colors.primary} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>1. Ticket Raised</Text>
                <Text style={[styles.stepMeta, { color: colors.mutedForeground }]}>
                  Customer inquiry under category {item.category}
                </Text>
                <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{formatDate(item.createdAt, true)}</Text>
              </View>
            </View>

            {/* Step 2: AI Triage & Classification */}
            <View style={styles.timelineStep}>
              <View style={[styles.timelineIcon, { backgroundColor: colors.accent + '30' }]}>
                <KamaloIcon name="cpu" size={13} color={colors.accentForeground} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>2. AI Triage & Routing</Text>
                <Text style={[styles.stepMeta, { color: colors.mutedForeground }]}>
                  Classified as {sla.slaLabel} · Routed to {item.assignedTo || 'Specialist Queue'}
                </Text>
              </View>
            </View>

            {/* Step 3: Human Reviewer / Checker */}
            <View style={styles.timelineStep}>
              <View style={[styles.timelineIcon, { backgroundColor: item.resolutionSource ? colors.primary + '20' : colors.secondary }]}>
                <KamaloIcon name="user" size={13} color={item.resolutionSource ? colors.primary : colors.mutedForeground} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>3. Reviewer Verification</Text>
                <Text style={[styles.stepMeta, { color: colors.mutedForeground }]}>
                  {item.resolutionSource
                    ? `Verified via ${item.resolutionSource.toUpperCase()} by ${item.assignedTo || 'Assigned Agent'}`
                    : 'Awaiting human reviewer / checker verification'}
                </Text>
              </View>
            </View>

            {/* Step 4: Resolution */}
            <View style={[styles.timelineStep, { borderLeftWidth: 0 }]}>
              <View style={[styles.timelineIcon, { backgroundColor: item.status === 'resolved' ? colors.primary : colors.secondary }]}>
                <KamaloIcon name={item.status === 'resolved' ? 'check' : 'clock'} size={13} color={item.status === 'resolved' ? colors.primaryForeground : colors.mutedForeground} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>4. Resolution & Customer Notice</Text>
                <Text style={[styles.stepMeta, { color: colors.mutedForeground }]}>
                  {item.status === 'resolved'
                    ? `Resolved on ${formatDate(item.resolvedAt || item.updatedAt, true)} · Email ${item.emailStatus}`
                    : 'Will be closed once reviewer publishes verified answer'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ticket Details */}
        <Section label="Category" value={item.category} />
        <Section label="Customer Description" value={item.details} />

        {/* Evidence Attachments Viewer */}
        {item.attachmentIds && item.attachmentIds.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>ATTACHED EVIDENCE ({item.attachmentIds.length})</Text>
            <View style={styles.attachmentsGrid}>
              {item.attachmentIds.map((attId, idx) => {
                const url = getAttachmentUrl(item.conversationId, attId);
                return (
                  <Pressable
                    key={attId}
                    onPress={() => setPreviewImage(url)}
                    style={[styles.evidenceThumb, { borderColor: colors.border }]}
                  >
                    <Image source={{ uri: url }} style={styles.thumbImage} resizeMode="cover" />
                    <View style={[styles.thumbOverlay, { backgroundColor: colors.foreground + '25' }]}>
                      <KamaloIcon name="maximize" size={14} color="#ffffff" />
                      <Text style={styles.thumbText}>View #{idx + 1}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Resolution Section */}
        {item.resolution ? (
          <View style={[styles.resolutionCard, { backgroundColor: colors.card, borderColor: colors.primary + '40' }]}>
            <View style={styles.resolutionHeader}>
              <KamaloIcon name="check-circle" size={18} color={colors.primary} />
              <Text style={[styles.resolutionTitle, { color: colors.primary }]}>
                VERIFIED RESOLUTION ({item.resolutionSource === 'ai' ? 'AI DRAFT REVIEWED' : 'HUMAN SPECIALIST'})
              </Text>
            </View>
            <Text style={[styles.resolutionBody, { color: colors.foreground }]}>{item.resolution}</Text>
            {item.assignedTo ? (
              <Text style={[styles.resolutionAuthor, { color: colors.mutedForeground }]}>
                Verified by {item.assignedTo}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={[styles.waiting, { backgroundColor: colors.secondary }]}>
            <KamaloIcon name="clock" size={18} color={colors.primary} />
            <View style={styles.waitingCopy}>
              <Text style={[styles.waitingTitle, { color: colors.foreground }]}>Under Review</Text>
              <Text style={[styles.waitingBody, { color: colors.mutedForeground }]}>
                The support team is actively reviewing your request. Target SLA: {sla.slaLabel}.
              </Text>
            </View>
          </View>
        )}

        {/* Email Notification Retry */}
        {item.contactEmail && item.emailStatus === 'failed' ? (
          <View style={[styles.retry, { backgroundColor: colors.destructive + '10', borderColor: colors.destructive + '30' }]}>
            <Text style={[styles.retryText, { color: colors.destructive }]}>
              Email notification to {item.contactEmail} encountered a delivery issue.
            </Text>
            <Button
              label="Retry email notification"
              icon="send"
              onPress={() =>
                retryEmail.mutate(
                  { ticketId: item.id },
                  {
                    onSuccess: () => {
                      void queryClient.invalidateQueries({ queryKey: getGetSupportTicketQueryKey(item.id) });
                      void queryClient.invalidateQueries({ queryKey: getListMySupportTicketsQueryKey() });
                      Alert.alert('Email Sent', 'The follow-up resolution email was re-sent.');
                    },
                    onError: () => Alert.alert('Could not retry', 'Please try again later.'),
                  }
                )
              }
              loading={retryEmail.isPending}
              secondary
            />
          </View>
        ) : null}

        {/* Image Full-screen Preview Modal */}
        <Modal
          visible={Boolean(previewImage)}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewImage(null)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalCloseButton} onPress={() => setPreviewImage(null)}>
              <KamaloIcon name="x" size={24} color="#ffffff" />
            </Pressable>
            {previewImage && (
              <Image source={{ uri: previewImage }} style={styles.modalImage} resizeMode="contain" />
            )}
          </View>
        </Modal>
      </ScrollView>
    </Screen>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 42 },
  hero: { gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  number: { fontFamily: 'Inter_600SemiBold', fontSize: 13, letterSpacing: 1.1 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30, marginTop: 4 },
  slaBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  slaText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  date: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  divider: { height: 1, marginVertical: 20 },
  lifecycleCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 22 },
  lifecycleTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2, marginBottom: 16 },
  timeline: { paddingLeft: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 16, borderLeftWidth: 2, borderLeftColor: '#e2e8f0', paddingLeft: 16, marginLeft: 8 },
  timelineIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginLeft: -28, marginRight: 10 },
  timelineContent: { flex: 1 },
  stepTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  stepMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 2 },
  timestamp: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  section: { marginBottom: 20 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.1, marginBottom: 7 },
  value: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23 },
  attachmentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  evidenceThumb: { width: 100, height: 80, borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  thumbOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 4 },
  thumbText: { color: '#ffffff', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  resolutionCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  resolutionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  resolutionTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.1 },
  resolutionBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  resolutionAuthor: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 10 },
  waiting: { flexDirection: 'row', padding: 16, borderRadius: 12, gap: 12, marginTop: 4, marginBottom: 20 },
  waitingCopy: { flex: 1 },
  waitingTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  waitingBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 4 },
  retry: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10, marginTop: 4 },
  retryText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  modalCloseButton: { position: 'absolute', top: 50, right: 24, zIndex: 10, padding: 8 },
  modalImage: { width: '92%', height: '80%' },
});