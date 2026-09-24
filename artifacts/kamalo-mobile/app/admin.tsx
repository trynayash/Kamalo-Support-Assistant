import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { KamaloIcon } from '@/components/kamalo-icon';
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
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  PageHeader,
  Screen,
  formatDate,
  statusTone,
} from '@/components/ui';
import {
  SUPPORT_CATEGORIES,
  calculateSlaStatus,
} from '@/lib/ticketLevels';
import { getAttachmentUrl } from '@/lib/apiConfig';

const statuses: SupportTicket['status'][] = ['open', 'in_review', 'resolved', 'closed'];

export default function AdminScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const tickets = useListSupportTickets();
  const update = useUpdateSupportTicket();
  const analyze = useAnalyzeSupportTicket();
  const retryEmail = useRetrySupportTicketEmail();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const rawTickets = tickets.data || [];

  const filteredTickets = useMemo(() => {
    return rawTickets.filter((t) => {
      const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchCat && matchStatus;
    });
  }, [rawTickets, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    let overdueCount = 0;
    let urgentCount = 0;
    rawTickets.forEach((t) => {
      if (t.status !== 'resolved' && t.status !== 'closed') {
        const sla = calculateSlaStatus(t.createdAt, t.level, t.resolvedAt);
        if (sla.isOverdue) overdueCount++;
        if (sla.slaCode === 'IS') urgentCount++;
      }
    });
    return {
      total: rawTickets.length,
      open: rawTickets.filter((t) => t.status === 'open').length,
      overdue: overdueCount,
      urgent: urgentCount,
    };
  }, [rawTickets]);

  return (
    <Screen>
      <PageHeader
        eyebrow="Operations Control Room"
        title="Support Queue"
        subtitle="Closed-loop reviewer workspace: AI triage, human checker, SLA escalation."
        action="Knowledge Base"
        onAction={() => router.push('/admin/knowledge')}
      />

      {/* SLA Escalation KPI Summary Banner */}
      <View style={styles.kpiContainer}>
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.kpiValue, { color: colors.foreground }]}>{stats.open}</Text>
          <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>OPEN QUEUE</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: stats.overdue ? colors.destructive : colors.border }]}>
          <Text style={[styles.kpiValue, { color: stats.overdue ? colors.destructive : colors.foreground }]}>{stats.overdue}</Text>
          <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>PAST SLA</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: stats.urgent ? colors.accent : colors.border }]}>
          <Text style={[styles.kpiValue, { color: stats.urgent ? colors.accentForeground : colors.foreground }]}>{stats.urgent}</Text>
          <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>I.S. URGENT</Text>
        </View>
      </View>

      {/* Filter Category Tabs (Whiteboard Categories) */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['all', ...SUPPORT_CATEGORIES].map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategoryFilter(cat)}
              style={[
                styles.chip,
                {
                  backgroundColor: categoryFilter === cat ? colors.primary : colors.secondary,
                  borderColor: categoryFilter === cat ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: categoryFilter === cat ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Filter Status Tabs */}
      <View style={styles.statusFilterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['all', 'open', 'in_review', 'resolved', 'closed'].map((st) => (
            <Pressable
              key={st}
              onPress={() => setStatusFilter(st)}
              style={[
                styles.smallChip,
                {
                  backgroundColor: statusFilter === st ? colors.foreground : colors.card,
                  borderColor: statusFilter === st ? colors.foreground : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.smallChipText,
                  { color: statusFilter === st ? colors.background : colors.mutedForeground },
                ]}
              >
                {st.replace('_', ' ').toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Ticket List */}
      {tickets.isLoading ? (
        <LoadingState label="Loading support queue" />
      ) : tickets.isError ? (
        <ErrorState onRetry={() => tickets.refetch()} label="Ticket queue unavailable" />
      ) : !filteredTickets.length ? (
        <EmptyState
          icon="inbox"
          title="Queue is clear"
          body={categoryFilter !== 'all' || statusFilter !== 'all' ? 'No tickets match the selected filters.' : 'New customer support tickets will appear here.'}
        />
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={tickets.isRefetching}
              onRefresh={() => tickets.refetch()}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AdminTicketCard
              ticket={item}
              onPreviewImage={(url) => setPreviewImage(url)}
              onUpdate={(data) =>
                update.mutate(
                  { ticketId: item.id, data },
                  {
                    onSuccess: () => {
                      void queryClient.invalidateQueries({ queryKey: getListSupportTicketsQueryKey() });
                      void queryClient.invalidateQueries({ queryKey: getGetSupportTicketQueryKey(item.id) });
                      Alert.alert('Saved', 'Ticket was updated successfully.');
                    },
                    onError: () => Alert.alert('Update failed', 'The ticket could not be updated.'),
                  }
                )
              }
              onAnalyze={(mode, onResult) =>
                analyze.mutate(
                  { ticketId: item.id, data: { mode } },
                  {
                    onSuccess: (result) => {
                      onResult(result.draftResolution);
                      Alert.alert('AI Draft Ready', 'The AI resolution draft has been inserted into the editor.');
                    },
                    onError: () => Alert.alert('Analysis unavailable', 'Could not prepare AI draft.'),
                  }
                )
              }
              onRetryEmail={() =>
                retryEmail.mutate(
                  { ticketId: item.id },
                  {
                    onSuccess: () => {
                      void tickets.refetch();
                      Alert.alert('Email Sent', 'Notification re-sent to customer.');
                    },
                    onError: () => Alert.alert('Email retry failed', 'Please try again later.'),
                  }
                )
              }
              updating={update.isPending || analyze.isPending}
            />
          )}
        />
      )}

      {/* Image Preview Modal */}
      <Modal visible={Boolean(previewImage)} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalCloseButton} onPress={() => setPreviewImage(null)}>
            <KamaloIcon name="x" size={24} color="#ffffff" />
          </Pressable>
          {previewImage && <Image source={{ uri: previewImage }} style={styles.modalImage} resizeMode="contain" />}
        </View>
      </Modal>
    </Screen>
  );
}

function AdminTicketCard({
  ticket,
  onPreviewImage,
  onUpdate,
  onAnalyze,
  onRetryEmail,
  updating,
}: {
  ticket: SupportTicket;
  onPreviewImage: (url: string) => void;
  onUpdate: (data: {
    status: SupportTicket['status'];
    assignedTo?: string | null;
    resolution?: string | null;
    resolutionSource?: 'human' | 'ai' | null;
  }) => void;
  onAnalyze: (mode: 'human' | 'ai', onResult: (draft: string) => void) => void;
  onRetryEmail: () => void;
  updating: boolean;
}) {
  const colors = useColors();
  const [resolution, setResolution] = useState(ticket.resolution ?? '');
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo ?? '');
  const [mode, setMode] = useState<'ai' | 'human'>((ticket.resolutionSource as 'ai' | 'human') || 'human');
  const [status, setStatus] = useState<SupportTicket['status']>(ticket.status);

  const sla = calculateSlaStatus(ticket.createdAt, ticket.level, ticket.resolvedAt);

  return (
    <Card style={styles.ticketCard}>
      {/* Top Header */}
      <View style={styles.ticketTop}>
        <View style={styles.ticketCopy}>
          <View style={styles.badgeRow}>
            <Text style={[styles.number, { color: colors.primary }]}>{ticket.ticketNumber}</Text>
            <Badge label={sla.slaLabel} tone={sla.badgeTone} />
            <Badge label={ticket.status.replace('_', ' ')} tone={statusTone(ticket.status)} />
          </View>
          <Text style={[styles.summary, { color: colors.foreground }]}>{ticket.summary}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {ticket.category} · {formatDate(ticket.createdAt, true)}
            </Text>
            <Text style={[styles.slaAlert, { color: sla.isOverdue ? colors.destructive : colors.primary }]}>
              {sla.statusText}
            </Text>
          </View>
        </View>
      </View>

      {/* Customer Description */}
      <View style={[styles.briefBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.briefLabel, { color: colors.mutedForeground }]}>CUSTOMER ISSUE BRIEF</Text>
        <Text style={[styles.briefContent, { color: colors.foreground }]}>{ticket.details}</Text>
      </View>

      {/* Evidence Images */}
      {ticket.attachmentIds && ticket.attachmentIds.length > 0 && (
        <View style={styles.evidenceContainer}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            ATTACHED EVIDENCE ({ticket.attachmentIds.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.evidenceScroll}>
            {ticket.attachmentIds.map((attId, idx) => {
              const url = getAttachmentUrl(ticket.conversationId, attId);
              return (
                <Pressable
                  key={attId}
                  onPress={() => onPreviewImage(url)}
                  style={[styles.evidenceThumb, { borderColor: colors.border }]}
                >
                  <Image source={{ uri: url }} style={styles.thumbImg} resizeMode="cover" />
                  <View style={styles.thumbLabel}>
                    <Text style={styles.thumbText}>Img #{idx + 1}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Closed Loop Analysis Path Selector */}
      <View style={[styles.analysisCard, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '25' }]}>
        <View style={styles.analysisHeader}>
          <View>
            <Text style={[styles.analysisTitle, { color: colors.primary }]}>ANALYSIS PATH</Text>
            <Text style={[styles.analysisSubtitle, { color: colors.mutedForeground }]}>
              Choose AI draft or Human Specialist review
            </Text>
          </View>
          <View style={[styles.modeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setMode('ai')}
              style={[
                styles.modeButton,
                { backgroundColor: mode === 'ai' ? colors.primary : 'transparent' },
              ]}
            >
              <Text style={[styles.modeText, { color: mode === 'ai' ? colors.primaryForeground : colors.foreground }]}>
                AI
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('human')}
              style={[
                styles.modeButton,
                { backgroundColor: mode === 'human' ? colors.primary : 'transparent' },
              ]}
            >
              <Text style={[styles.modeText, { color: mode === 'human' ? colors.primaryForeground : colors.foreground }]}>
                Human
              </Text>
            </Pressable>
          </View>
        </View>

        <Button
          label={mode === 'ai' ? 'Prepare AI draft' : 'Assign Human Review'}
          icon={mode === 'ai' ? 'cpu' : 'user'}
          onPress={() => onAnalyze(mode, (draft) => setResolution(draft))}
          secondary
        />
      </View>

      {/* Reviewer / Assignee */}
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ASSIGNED SPECIALIST</Text>
      <TextInput
        value={assignedTo}
        onChangeText={setAssignedTo}
        placeholder="e.g. L1 Triage / Human Specialist"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
      />

      {/* Resolution Editor */}
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>VERIFIED RESOLUTION TO SEND</Text>
      <TextInput
        value={resolution}
        onChangeText={setResolution}
        placeholder="Write the verified resolution answer for the customer..."
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={[styles.resolutionInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
      />

      {/* Status Picker Chips */}
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>UPDATE TICKET STATUS</Text>
      <View style={styles.statusChipsRow}>
        {statuses.map((st) => (
          <Pressable
            key={st}
            onPress={() => setStatus(st)}
            style={[
              styles.statusSelectChip,
              {
                backgroundColor: status === st ? colors.primary : colors.secondary,
                borderColor: status === st ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.statusSelectText,
                { color: status === st ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {st.replace('_', ' ')}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          label={status === 'resolved' ? 'Save & Notify Customer' : 'Save Ticket Update'}
          icon="check"
          onPress={() =>
            onUpdate({
              status,
              assignedTo: assignedTo.trim() || null,
              resolution: resolution.trim() || null,
              resolutionSource: mode,
            })
          }
          loading={updating}
        />

        {ticket.emailStatus === 'failed' ? (
          <Button label="Retry Customer Email" icon="send" onPress={onRetryEmail} secondary />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  kpiValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  kpiLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  filterSection: {
    marginBottom: 8,
  },
  statusFilterSection: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  smallChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 14,
  },
  ticketCard: {
    padding: 16,
    borderRadius: 12,
  },
  ticketTop: {
    marginBottom: 12,
  },
  ticketCopy: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  number: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
  },
  summary: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  slaAlert: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  briefBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  briefLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  briefContent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  evidenceContainer: {
    marginBottom: 12,
  },
  evidenceScroll: {
    gap: 8,
    marginTop: 4,
  },
  evidenceThumb: {
    width: 80,
    height: 64,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  thumbText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  analysisCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  analysisTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  analysisSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  modeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 7,
    padding: 2,
  },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  modeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  resolutionInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  statusSelectChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusSelectText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  modalImage: {
    width: '92%',
    height: '80%',
  },
});