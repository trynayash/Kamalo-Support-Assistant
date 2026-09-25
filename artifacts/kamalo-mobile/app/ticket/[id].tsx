import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { KamaloIcon } from '@/components/kamalo-icon';
import {
  getGetSupportTicketQueryKey,
  getListMySupportTicketsQueryKey,
  useGetSupportTicket,
  useRetrySupportTicketEmail,
} from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NavigationMenu } from '@/components/NavigationMenu';
import { Badge, Button, ErrorState, LoadingState, Screen, formatDate, statusTone } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { calculateSlaStatus } from '@/lib/ticketLevels';
import { getAttachmentUrl, getApiBaseUrl } from '@/lib/apiConfig';

interface EscalationEntry {
  id: string;
  ticketId: string;
  fromLevel: number | null;
  toLevel: number;
  fromStatus: string | null;
  toStatus: string;
  actor: string;
  actorName: string | null;
  reason: string | null;
  resolution: string | null;
  slaDeadline: string | null;
  createdAt: string;
}

function getActorIcon(actor: string): 'cpu' | 'user' | 'shield' | 'check' | 'alert-circle' {
  if (actor === 'ai') return 'cpu';
  if (actor === 'super_admin') return 'shield';
  if (actor === 'system') return 'check';
  return 'user';
}

function getActorColor(actor: string, colors: ReturnType<typeof useColors>): string {
  if (actor === 'ai') return colors.foreground;
  if (actor === 'super_admin') return colors.foreground;
  if (actor === 'system') return colors.foreground;
  if (actor === 'l2_reviewer') return colors.foreground;
  return colors.foreground;
}

function getLevelLabel(level: number): string {
  if (level >= 4) return 'Immediate Supervision';
  if (level >= 2) return 'Specialist Team';
  return 'Customer Care';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TicketDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { role, currentUser } = useAuth();
  const { showToast } = useToast();

  const previousStateRef = useRef<{ status: string; resolution: string | null; level: number } | null>(null);

  const ticket = useGetSupportTicket(id ?? '', {
    query: {
      enabled: Boolean(id),
      queryKey: getGetSupportTicketQueryKey(id ?? ''),
      refetchInterval: 3500, // Live poll resolution
    },
  });

  const retryEmail = useRetrySupportTicketEmail();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [escalations, setEscalations] = useState<EscalationEntry[]>([]);
  const [escalationsLoading, setEscalationsLoading] = useState(true);

  const fetchEscalations = useCallback(async () => {
    if (!id) return;
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/tickets/${id}/escalations`, {
        headers: {
          'x-user-role': role || 'customer',
          'x-user-id': currentUser?.username || 'customer',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEscalations(data);
      }
    } catch {
      // Non-blocking
    } finally {
      setEscalationsLoading(false);
    }
  }, [id, role, currentUser]);

  useEffect(() => {
    if (!ticket.data) return;
    const current = ticket.data;

    if (!previousStateRef.current) {
      previousStateRef.current = {
        status: current.status,
        resolution: current.resolution ?? null,
        level: current.level ?? 1,
      };
      return;
    }

    const prev = previousStateRef.current;
    if (prev.status !== 'resolved' && current.status === 'resolved') {
      showToast({
        title: `Ticket Resolved 🎉`,
        message: current.resolution ? current.resolution.slice(0, 100) : 'Verified answer provided by support team.',
        type: 'success',
        icon: 'check-circle',
        duration: 6000,
      });
      void fetchEscalations();
    } else if (prev.status === 'open' && current.status === 'in_review') {
      showToast({
        title: `Under Review`,
        message: 'A support specialist is actively working on your ticket.',
        type: 'info',
        icon: 'life-buoy',
        duration: 4000,
      });
      void fetchEscalations();
    } else if ((current.level ?? 1) > (prev.level ?? 1)) {
      showToast({
        title: `Priority Elevated`,
        message: `Ticket escalated to ${getLevelLabel(current.level ?? 2)}.`,
        type: 'warning',
        icon: 'alert-circle',
        duration: 4500,
      });
      void fetchEscalations();
    }

    previousStateRef.current = {
      status: current.status,
      resolution: current.resolution ?? null,
      level: current.level ?? 1,
    };
  }, [ticket.data, showToast, fetchEscalations]);

  useEffect(() => {
    void fetchEscalations();
    // Poll every 5 seconds for live escalation timeline updates
    const interval = setInterval(() => { void fetchEscalations(); }, 5000);
    return () => clearInterval(interval);
  }, [fetchEscalations]);

  const onRefresh = useCallback(async () => {
    await Promise.all([ticket.refetch(), fetchEscalations()]);
  }, [ticket, fetchEscalations]);

  if (ticket.isLoading) return <Screen><LoadingState label="Loading ticket details..." /></Screen>;
  if (ticket.isError || !ticket.data) return <Screen><ErrorState onRetry={() => ticket.refetch()} label="Could not load this ticket" /></Screen>;

  const item = ticket.data;
  const sla = calculateSlaStatus(item.createdAt, item.level, item.resolvedAt);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
        refreshControl={<RefreshControl refreshing={ticket.isRefetching} onRefresh={() => { void onRefresh(); }} tintColor={colors.primary} />}
      >
        {/* Ticket Header & Status */}
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Text style={[styles.number, { color: colors.foreground }]}>{item.ticketNumber}</Text>
            <View style={styles.topRightActions}>
              <ThemeToggle />
              <NavigationMenu />
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

        {/* Live Status Updates */}
        <View style={[styles.lifecycleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.lifecycleHeader}>
            <Text style={[styles.lifecycleTitle, { color: colors.foreground }]}>LIVE STATUS UPDATES</Text>
            <View style={[styles.liveDot, { backgroundColor: item.status !== 'resolved' && item.status !== 'closed' ? '#22c55e' : colors.mutedForeground }]} />
            <Text style={[styles.liveLabel, { color: item.status !== 'resolved' && item.status !== 'closed' ? '#22c55e' : colors.mutedForeground }]}>
              {item.status !== 'resolved' && item.status !== 'closed' ? 'LIVE' : 'CLOSED'}
            </Text>
          </View>

          {escalationsLoading ? (
            <View style={styles.timelineLoading}>
              <Text style={[styles.timelineLoadingText, { color: colors.mutedForeground }]}>Loading timeline...</Text>
            </View>
          ) : escalations.length > 0 ? (
            <View style={styles.timeline}>
              {escalations.map((entry, index) => {
                const actorColor = getActorColor(entry.actor, colors);
                const isLast = index === escalations.length - 1;
                return (
                  <View key={entry.id} style={[styles.timelineStep, { borderLeftColor: colors.border }, isLast && { borderLeftWidth: 0 }]}>
                    <View style={[styles.timelineIcon, { backgroundColor: actorColor + '20' }]}>
                      <KamaloIcon name={getActorIcon(entry.actor)} size={13} color={actorColor} />
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineTopRow}>
                        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                          {entry.actorName || entry.actor.replace('_', ' ')}
                        </Text>
                        <Text style={[styles.timelineTime, { color: colors.mutedForeground }]}>
                          {relativeTime(entry.createdAt)}
                        </Text>
                      </View>
                      {entry.reason ? (
                        <Text style={[styles.stepMeta, { color: colors.mutedForeground }]}>{entry.reason}</Text>
                      ) : null}
                      {entry.toStatus !== entry.fromStatus ? (
                        <View style={styles.statusChange}>
                          <Badge label={entry.toStatus.replace('_', ' ')} tone={statusTone(entry.toStatus)} />
                          {entry.toLevel !== entry.fromLevel && entry.fromLevel !== null ? (
                            <Text style={[styles.levelChange, { color: actorColor }]}>
                              Level {entry.fromLevel} → {entry.toLevel} ({getLevelLabel(entry.toLevel)})
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                      {entry.slaDeadline ? (
                        <Text style={[styles.slaMeta, { color: colors.primary }]}>
                          SLA Deadline: {formatDate(entry.slaDeadline, true)}
                        </Text>
                      ) : null}
                      <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>{formatDate(entry.createdAt, true)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* Fallback: legacy 4-step timeline */
            <View style={styles.timeline}>
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
          )}
        </View>

        {/* Ticket Details */}
        <Section label="Category" value={item.category} />
        <Section label="Customer Description" value={item.details} />
        <Section label="Current Assignee" value={item.assignedTo || 'Unassigned'} />

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
                VERIFIED RESOLUTION ({item.resolutionSource === 'ai' ? 'AI AUTO-RESOLVED' : 'HUMAN SPECIALIST'})
              </Text>
            </View>
            <Text style={[styles.resolutionBody, { color: colors.foreground }]}>{item.resolution}</Text>
            {item.assignedTo ? (
              <Text style={[styles.resolutionAuthor, { color: colors.mutedForeground }]}>
                Verified by {item.assignedTo}
              </Text>
            ) : null}
            {item.resolvedAt ? (
              <Text style={[styles.resolvedTime, { color: colors.mutedForeground }]}>
                Resolved on {formatDate(item.resolvedAt, true)}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={[styles.waiting, { backgroundColor: colors.secondary }]}>
            <KamaloIcon name="clock" size={18} color={colors.primary} />
            <View style={styles.waitingCopy}>
              <Text style={[styles.waitingTitle, { color: colors.foreground }]}>Under Review</Text>
              <Text style={[styles.waitingBody, { color: colors.mutedForeground }]}>
                {item.assignedTo?.includes('AI') 
                  ? 'KAMALO AI is running 10 confidence checks to auto-resolve your ticket within 15 minutes.'
                  : item.assignedTo?.includes('L2')
                    ? 'An L2 specialist is reviewing your request. Target resolution: 48 hours.'
                    : item.assignedTo?.includes('I.S.')
                      ? 'Immediate Supervision team is actively working on your request right now.'
                      : `The support team is actively reviewing your request. Target SLA: ${sla.slaLabel}.`}
              </Text>
              <Text style={[styles.waitingTimestamp, { color: colors.primary }]}>
                Last updated: {formatDate(item.updatedAt, true)}
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close full size image"
              style={[styles.modalCloseButton, { top: Math.max(insets.top + 14, 48) }]}
              onPress={() => setPreviewImage(null)}
              hitSlop={12}
            >
              <KamaloIcon name="x" size={22} color="#ffffff" />
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
  topRightActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  number: { fontFamily: 'Inter_600SemiBold', fontSize: 13, letterSpacing: 1.1 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30, marginTop: 4 },
  slaBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  slaText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  date: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  divider: { height: 1, marginVertical: 20 },
  lifecycleCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 22 },
  lifecycleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  lifecycleTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2, flex: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1 },
  timelineLoading: { padding: 20, alignItems: 'center' },
  timelineLoadingText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  timeline: { paddingLeft: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 16, borderLeftWidth: 2, paddingLeft: 16, marginLeft: 8 },
  timelineIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginLeft: -28, marginRight: 10 },
  timelineContent: { flex: 1 },
  timelineTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  timelineTime: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  stepTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  stepMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 2 },
  statusChange: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  levelChange: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  slaMeta: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 3 },
  timestamp: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  section: { marginBottom: 20 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.1, marginBottom: 7 },
  value: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23 },
  attachmentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  evidenceThumb: { width: 100, height: 80, borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  thumbOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 4 },
  thumbText: { color: '#ffffff', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  resolutionCard: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 },
  resolutionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  resolutionTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.1 },
  resolutionBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  resolutionAuthor: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 10 },
  resolvedTime: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  waiting: { flexDirection: 'row', padding: 16, borderRadius: 12, gap: 12, marginTop: 4, marginBottom: 20 },
  waitingCopy: { flex: 1 },
  waitingTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  waitingBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 4 },
  waitingTimestamp: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 6 },
  retry: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10, marginTop: 4 },
  retryText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  modalCloseButton: { position: 'absolute', right: 20, zIndex: 10, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  modalImage: { width: '92%', height: '80%' },
});