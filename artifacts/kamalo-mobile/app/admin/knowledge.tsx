import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { KamaloIcon } from '@/components/kamalo-icon';
import {
  getListKnowledgeArticlesQueryKey,
  useApproveKnowledgeArticle,
  useArchiveKnowledgeArticle,
  useCreateKnowledgeArticle,
  useListKnowledgeArticles,
  useUpdateKnowledgeArticle,
  KnowledgeArticle,
  ListKnowledgeArticlesParams,
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

import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

type ArticleFilterStatus = 'all' | 'draft' | 'approved' | 'archived';

interface ArticleEditorForm {
  id?: string;
  title: string;
  category: string;
  content: string;
}

const emptyForm: ArticleEditorForm = {
  title: '',
  category: '',
  content: '',
};

export default function AdminKnowledgeScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { isStaff, role, logActivity } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleFilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<ArticleEditorForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (!isStaff) {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 24, alignItems: 'center', backgroundColor: colors.card, width: '100%', gap: 12 }}>
            <KamaloIcon name="shield" size={32} color={colors.foreground} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.foreground }}>Staff Only Area</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.mutedForeground, textAlign: 'center' }}>
              Knowledge Base Administration is restricted to Super Admins, Admins, and Content Editors.
            </Text>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={{ width: '100%', height: 44, borderRadius: 8, backgroundColor: colors.foreground, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.background }}>Go to Home</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  if (role === 'human_reviewer') {
    return (
      <Screen>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 24, alignItems: 'center', backgroundColor: colors.card, width: '100%', gap: 12 }}>
            <KamaloIcon name="book-open" size={32} color={colors.foreground} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.foreground }}>Support Reviewer Access</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.mutedForeground, textAlign: 'center' }}>
              Your role focuses on reviewing tickets and drafting verified resolutions. Knowledge Base administration is reserved for Content Editors, Admins, and Super Admins.
            </Text>
            <Pressable
              onPress={() => router.replace('/admin')}
              style={{ width: '100%', height: 44, borderRadius: 8, backgroundColor: colors.foreground, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.background }}>Go to Operations Queue</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  const params = useMemo<ListKnowledgeArticlesParams>(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
    }),
    [search, statusFilter, categoryFilter]
  );

  const articlesQuery = useListKnowledgeArticles(params, {
    query: { queryKey: getListKnowledgeArticlesQueryKey(params) },
  });

  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const approveArticle = useApproveKnowledgeArticle();
  const archiveArticle = useArchiveKnowledgeArticle();

  const articles = articlesQuery.data || [];

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => set.add(a.category));
    return ['all', ...Array.from(set).sort()];
  }, [articles]);

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setEditorOpen(true);
  }

  function openEdit(article: KnowledgeArticle) {
    setForm({
      id: article.id,
      title: article.title,
      category: article.category,
      content: article.content,
    });
    setFormErrors({});
    setEditorOpen(true);
  }

  async function handleSave() {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.category.trim()) errors.category = 'Category is required';
    if (!form.content.trim()) errors.content = 'Content is required';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      if (form.id) {
        await updateArticle.mutateAsync({
          articleId: form.id,
          data: {
            title: form.title.trim(),
            category: form.category.trim(),
            content: form.content.trim(),
          },
        });
      } else {
        await createArticle.mutateAsync({
          data: {
            title: form.title.trim(),
            category: form.category.trim(),
            content: form.content.trim(),
            status: 'draft',
          },
        });
      }
      await queryClient.invalidateQueries({ queryKey: getListKnowledgeArticlesQueryKey() });
      const actionName = form.id ? 'KNOWLEDGE_UPDATED' : 'KNOWLEDGE_CREATED';
      logActivity(actionName, `Article "${form.title.trim()}" in ${form.category.trim()}`);
      showToast({
        title: form.id ? 'Article Updated' : 'Article Created',
        message: `"${form.title.trim()}" saved.`,
        type: 'success',
      });
      setEditorOpen(false);
      setForm(emptyForm);
      Alert.alert('Success', form.id ? 'Article updated.' : 'Draft article created.');
    } catch {
      Alert.alert('Error', 'Could not save the article. Please try again.');
    }
  }

  async function handleApprove(article: KnowledgeArticle) {
    try {
      await approveArticle.mutateAsync({ articleId: article.id });
      await queryClient.invalidateQueries({ queryKey: getListKnowledgeArticlesQueryKey() });
      logActivity('KNOWLEDGE_APPROVED', `Article "${article.title}" approved for live bot grounding`);
      showToast({
        title: 'Article Approved',
        message: `"${article.title}" is now live in AI knowledge.`,
        type: 'success',
      });
      Alert.alert('Approved', `"${article.title}" is now approved and grounded in AI chat.`);
    } catch {
      Alert.alert('Error', 'Failed to approve article.');
    }
  }

  async function handleArchive(article: KnowledgeArticle) {
    Alert.alert('Archive Article', `Are you sure you want to archive "${article.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveArticle.mutateAsync({ articleId: article.id });
            await queryClient.invalidateQueries({ queryKey: getListKnowledgeArticlesQueryKey() });
            logActivity('KNOWLEDGE_ARCHIVED', `Article "${article.title}" moved to archive`);
            showToast({
              title: 'Article Archived',
              message: `"${article.title}" removed from active guidance.`,
              type: 'info',
            });
            Alert.alert('Archived', 'Article moved to archive.');
          } catch {
            Alert.alert('Error', 'Failed to archive article.');
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Operations"
        title="Knowledge Base"
        subtitle="Manage approved guidance and ground KAMALO AI answers."
        action="New Article"
        onAction={openCreate}
      />

      {/* Search Bar */}
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <KamaloIcon name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search articles & guidance"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          returnKeyType="search"
        />
        {search ? <IconButton icon="x" label="Clear search" onPress={() => setSearch('')} /> : null}
      </View>

      {/* Status Filters */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'draft', 'approved', 'archived'] as const).map((st) => (
            <Pressable
              key={st}
              onPress={() => setStatusFilter(st)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: statusFilter === st ? colors.primary : colors.secondary,
                  borderColor: statusFilter === st ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: statusFilter === st ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {st.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Articles List */}
      {articlesQuery.isLoading ? (
        <LoadingState label="Loading knowledge articles" />
      ) : articlesQuery.isError ? (
        <ErrorState onRetry={() => articlesQuery.refetch()} label="Could not load articles" />
      ) : !articles.length ? (
        <EmptyState
          icon="book-open"
          title="No articles found"
          body={search ? 'No articles match your search criteria.' : 'Create an article to ground KAMALO AI answers.'}
          action={<Button label="Create an article" icon="plus" onPress={openCreate} />}
        />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={articlesQuery.isRefetching}
              onRefresh={() => articlesQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.articleCard}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryRow}>
                  <Badge label={item.category} tone="amber" />
                  <Badge label={item.status} tone={statusTone(item.status)} />
                  <Text style={[styles.version, { color: colors.mutedForeground }]}>v{item.version}</Text>
                </View>
                <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                  {formatDate(item.updatedAt, false)}
                </Text>
              </View>

              <Text style={[styles.articleTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.articleSnippet, { color: colors.mutedForeground }]} numberOfLines={3}>
                {item.content}
              </Text>

              <View style={styles.cardActions}>
                <Button label="Edit" icon="edit-3" onPress={() => openEdit(item)} secondary />
                {item.status === 'draft' && (
                  <Button
                    label="Approve"
                    icon="check"
                    onPress={() => handleApprove(item)}
                    loading={approveArticle.isPending}
                  />
                )}
                {item.status !== 'archived' && (
                  <Button
                    label="Archive"
                    icon="trash-2"
                    onPress={() => handleArchive(item)}
                    loading={archiveArticle.isPending}
                    secondary
                  />
                )}
              </View>
            </Card>
          )}
        />
      )}

      {/* Article Editor Modal */}
      <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={() => setEditorOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {form.id ? 'Edit Article' : 'New Article'}
              </Text>
              <IconButton icon="x" label="Close" onPress={() => setEditorOpen(false)} />
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>ARTICLE TITLE</Text>
              <TextInput
                value={form.title}
                onChangeText={(text) => setForm((c) => ({ ...c, title: text }))}
                placeholder="e.g. How Coins work in KAMALO"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.textInput,
                  { color: colors.foreground, borderColor: formErrors.title ? colors.destructive : colors.border },
                ]}
              />
              {formErrors.title && <Text style={styles.errorText}>{formErrors.title}</Text>}

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>CATEGORY / ENGINE</Text>
              <TextInput
                value={form.category}
                onChangeText={(text) => setForm((c) => ({ ...c, category: text }))}
                placeholder="e.g. Coins, Auto KAMALO, Fincado, Transactions"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.textInput,
                  { color: colors.foreground, borderColor: formErrors.category ? colors.destructive : colors.border },
                ]}
              />
              {formErrors.category && <Text style={styles.errorText}>{formErrors.category}</Text>}

              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>KNOWLEDGE CONTENT</Text>
              <TextInput
                value={form.content}
                onChangeText={(text) => setForm((c) => ({ ...c, content: text }))}
                placeholder="Write the clear, authoritative explanation the AI assistant should ground answers on..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                style={[
                  styles.textArea,
                  { color: colors.foreground, borderColor: formErrors.content ? colors.destructive : colors.border },
                ]}
              />
              {formErrors.content && <Text style={styles.errorText}>{formErrors.content}</Text>}

              <View style={styles.modalActions}>
                <Button
                  label={form.id ? 'Save changes' : 'Create draft'}
                  icon="check"
                  onPress={handleSave}
                  loading={createArticle.isPending || updateArticle.isPending}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingLeft: 13,
    paddingRight: 3,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 9,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  articleCard: {
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  version: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  dateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  articleTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  articleSnippet: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  modalBody: {
    paddingBottom: 30,
  },
  inputLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.1,
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 140,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  modalActions: {
    marginTop: 20,
  },
});
