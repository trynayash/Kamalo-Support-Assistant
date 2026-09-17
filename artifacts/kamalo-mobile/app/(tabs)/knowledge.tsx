import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getListKnowledgeArticlesQueryKey, useListKnowledgeArticles, KnowledgeArticle } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Badge, Card, EmptyState, ErrorState, IconButton, LoadingState, PageHeader, Screen } from '@/components/ui';

export default function KnowledgeScreen() {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const articleParams = { search: search.trim() || undefined, status: 'approved' as const };
  const articles = useListKnowledgeArticles(articleParams, { query: { queryKey: getListKnowledgeArticlesQueryKey(articleParams) } });
  return (
    <Screen>
      <PageHeader eyebrow="The KAMALO guide" title="Knowledge" subtitle="Approved answers, kept clear and current." action="Test admin" onAction={() => router.push('/admin')} />
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="search" size={17} color={colors.mutedForeground} /><TextInput value={search} onChangeText={setSearch} placeholder="Search the guide" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" /><IconButton icon="x" label="Clear search" onPress={() => setSearch('')} /></View>
      {articles.isLoading ? <LoadingState label="Loading approved knowledge" /> : articles.isError ? <ErrorState onRetry={() => articles.refetch()} /> : !articles.data?.length ? <EmptyState icon="book-open" title="No matching articles" body={search ? 'Try a different phrase or browse the full guide.' : 'Approved KAMALO knowledge will appear here.'} /> : <FlatList data={articles.data} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={articles.isRefetching} onRefresh={() => articles.refetch()} tintColor={colors.primary} />} contentContainerStyle={styles.list} renderItem={({ item }) => <ArticleCard article={item} open={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} />} />}
    </Screen>
  );
}

function ArticleCard({ article, open, onToggle }: { article: KnowledgeArticle; open: boolean; onToggle: () => void }) {
  const colors = useColors();
  return <Card onPress={onToggle} style={styles.article}><View style={styles.articleTop}><View style={styles.articleCopy}><View style={styles.articleMeta}><Badge label={article.category} tone="amber" /><Text style={[styles.version, { color: colors.mutedForeground }]}>v{article.version}</Text></View><Text style={[styles.articleTitle, { color: colors.foreground }]}>{article.title}</Text></View><Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} /></View>{open ? <Text style={[styles.articleContent, { color: colors.foreground, borderTopColor: colors.border }]}>{article.content}</Text> : null}</Card>;
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, marginHorizontal: 16, marginBottom: 14, paddingLeft: 13, paddingRight: 3 },
  searchInput: { flex: 1, height: 46, paddingHorizontal: 9, fontFamily: 'Inter_400Regular', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
  article: { padding: 15 },
  articleTop: { flexDirection: 'row', alignItems: 'flex-start' },
  articleCopy: { flex: 1, paddingRight: 12 },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  version: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  articleTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 21 },
  articleContent: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, paddingTop: 15, marginTop: 14, borderTopWidth: 1 },
});