import { useEffect, useMemo, useRef, useState } from 'react';
import type { KnowledgeArticle, ListKnowledgeArticlesParams } from '@workspace/api-client-react';
import {
  getListKnowledgeArticlesQueryKey,
  useApproveKnowledgeArticle,
  useArchiveKnowledgeArticle,
  useCreateKnowledgeArticle,
  useListKnowledgeArticles,
  useUpdateKnowledgeArticle,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { HiOutlineArchiveBox, HiOutlineCheck, HiOutlineChevronDown, HiOutlineDocumentPlus, HiOutlineFunnel, HiOutlineMagnifyingGlass, HiOutlinePencilSquare, HiOutlineArrowPath, HiOutlineXMark } from 'react-icons/hi2';
import { KamaloShell, KnowledgeIcon, SectionLabel } from '@/components/kamalo-shell';

type ArticleStatus = 'all' | 'draft' | 'approved' | 'archived';
type EditorState = { title: string; category: string; content: string };
const emptyEditor: EditorState = { title: '', category: '', content: '' };

const statusTone: Record<string, string> = {
  draft: 'border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.14)] text-[hsl(31_60%_35%)]',
  approved: 'border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.1)] text-primary',
  archived: 'border-border bg-muted text-muted-foreground',
};

function ArticleSkeleton() {
  return <div className="space-y-2">{[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-[82px] rounded-lg" />)}</div>;
}

function ArticleEditor({ article, saving, onClose, onSave }: { article: KnowledgeArticle | null; saving: boolean; onClose: () => void; onSave: (data: EditorState) => void }) {
  const [form, setForm] = useState<EditorState>(article ? { title: article.title, category: article.category, content: article.content } : emptyEditor);
  const [formError, setFormError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const savingRef = useRef(saving);
  onCloseRef.current = onClose;
  savingRef.current = saving;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, input, textarea, select, [href]')).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('tabindex') !== '-1');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);
  const update = (key: keyof EditorState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (!form.title.trim() || !form.category.trim() || !form.content.trim()) {
      setFormError('Title, category, and article content are required.');
      return;
    }
    setFormError('');
    onSave(form);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--sidebar)/.52)] p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="presentation" data-testid="dialog-article-editor">
       <div ref={dialogRef} className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-[0_22px_70px_hsl(var(--foreground)/.2)] sm:rounded-xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="article-editor-title" aria-describedby="article-editor-description">
         <div className="flex items-start justify-between gap-4"><div><SectionLabel>{article ? 'Edit article' : 'New article'}</SectionLabel><h2 id="article-editor-title" className="mt-3 text-2xl font-extrabold tracking-[-.045em]">{article ? 'Refine the source' : 'Add to the source'}</h2><p id="article-editor-description" className="mt-2 text-[12px] text-muted-foreground">Approved articles become available to KAMALO AI.</p></div><button ref={closeButtonRef} onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close editor" data-testid="button-close-editor"><HiOutlineXMark size={18} /></button></div>
        <div className="mt-7 space-y-5">
          <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Title</span><input value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={180} placeholder="How Auto KAMALO works" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-[13px] outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-article-title" /></label>
          <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Category</span><input value={form.category} onChange={(event) => update('category', event.target.value)} maxLength={60} placeholder="Auto KAMALO" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-[13px] outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-article-category" /></label>
          <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Content</span><textarea value={form.content} onChange={(event) => update('content', event.target.value)} maxLength={20000} rows={10} placeholder="Write the clear, trustworthy explanation the assistant should use..." className="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-[13px] leading-6 outline-none transition-shadow focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-article-content" /></label>
          {formError && <p className="text-[11px] text-destructive" data-testid="status-editor-error">{formError}</p>}
        </div>
        <div className="safe-bottom mt-7 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end"><button onClick={onClose} className="rounded-lg px-4 py-2.5 text-[12px] font-semibold text-muted-foreground hover:bg-muted" data-testid="button-cancel-editor">Cancel</button><button onClick={submit} disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-[12px] font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-save-article">{saving ? 'Saving…' : article ? 'Save changes' : 'Create draft'}</button></div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${statusTone[status] || statusTone.archived}`} data-testid={`status-article-${status}`}>{status}</span>;
}

function ArticleRow({ article, onEdit, onApprove, onArchive, approving, archiving }: { article: KnowledgeArticle; onEdit: (article: KnowledgeArticle) => void; onApprove: (article: KnowledgeArticle) => void; onArchive: (article: KnowledgeArticle) => void; approving: boolean; archiving: boolean }) {
  return (
    <div className="grid gap-3 px-4 py-4 transition-colors hover:bg-muted/30 xl:grid-cols-[minmax(0,1.4fr)_150px_120px_150px] xl:items-center xl:gap-4 xl:px-5" data-testid={`row-article-${article.id}`}>
      <div className="flex min-w-0 items-start gap-3"><KnowledgeIcon /><div className="min-w-0"><div className="truncate text-[13px] font-bold">{article.title}</div><div className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{article.content}</div><div className="mt-2 font-mono text-[9px] text-muted-foreground/70">v{article.version} · Updated {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(article.updatedAt))}</div></div></div>
      <div className="pl-[52px] text-[11px] text-muted-foreground xl:pl-0"><span className="mr-2 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground/60 xl:hidden">Category</span>{article.category}</div>
      <div className="pl-[52px] xl:pl-0"><span className="mr-2 font-mono text-[9px] uppercase tracking-[.12em] text-muted-foreground/60 xl:hidden">Status</span><StatusPill status={article.status} /></div>
      <div className="flex items-center gap-1 pl-[52px] xl:justify-end xl:pl-0"><button onClick={() => onEdit(article)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${article.title}`} data-testid={`button-edit-article-${article.id}`}><HiOutlinePencilSquare size={14} /></button>{article.status === 'draft' && <button onClick={() => onApprove(article)} disabled={approving} className="rounded-lg p-2 text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Approve ${article.title}`} data-testid={`button-approve-article-${article.id}`}><HiOutlineCheck size={15} /></button>}{article.status !== 'archived' && <button onClick={() => onArchive(article)} disabled={archiving} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Archive ${article.title}`} data-testid={`button-archive-article-${article.id}`}><HiOutlineArchiveBox size={14} /></button>}</div>
    </div>
  );
}

export function KnowledgePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('all');
  const [editorArticle, setEditorArticle] = useState<KnowledgeArticle | null | undefined>(undefined);
  const [notice, setNotice] = useState('');
  const params = useMemo<ListKnowledgeArticlesParams>(() => ({ search: search || undefined, category: category || undefined, status: status === 'all' ? undefined : status }), [search, category, status]);
  const articlesQuery = useListKnowledgeArticles(params, { query: { queryKey: getListKnowledgeArticlesQueryKey(params) } });
  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const approveArticle = useApproveKnowledgeArticle();
  const archiveArticle = useArchiveKnowledgeArticle();
  const articles = articlesQuery.data || [];
  const isSaving = createArticle.isPending || updateArticle.isPending;
  const hasFilters = Boolean(search || category || status !== 'all');

  const refresh = async () => queryClient.invalidateQueries({ queryKey: getListKnowledgeArticlesQueryKey(params) });
  const showNotice = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2800); };
  const saveArticle = async (data: EditorState) => {
    try {
      if (editorArticle) await updateArticle.mutateAsync({ articleId: editorArticle.id, data });
      else await createArticle.mutateAsync({ data: { ...data, status: 'draft' } });
      await refresh();
      setEditorArticle(undefined);
      showNotice(editorArticle ? 'Article updated.' : 'Draft created.');
    } catch {
      showNotice('The article could not be saved. Try again.');
    }
  };
  const approve = async (article: KnowledgeArticle) => {
    try { await approveArticle.mutateAsync({ articleId: article.id }); await refresh(); showNotice('Article approved and available to KAMALO AI.'); } catch { showNotice('Approval could not be completed.'); }
  };
  const archive = async (article: KnowledgeArticle) => {
    if (!window.confirm(`Archive “${article.title}”?`)) return;
    try { await archiveArticle.mutateAsync({ articleId: article.id }); await refresh(); showNotice('Article archived.'); } catch { showNotice('Archive could not be completed.'); }
  };
  const clearFilters = () => { setSearch(''); setCategory(''); setStatus('all'); };

  return (
    <KamaloShell>
       <div className="mx-auto min-h-[calc(100dvh-57px)] max-w-[1320px] px-4 pb-12 sm:px-6 md:min-h-[100dvh] md:px-9 md:py-8 lg:px-12">
         <header className="flex flex-col gap-5 border-b border-border/70 pb-7 pt-5 lg:flex-row lg:items-end lg:justify-between lg:pt-0">
          <div><SectionLabel>Operations / Knowledge base</SectionLabel><h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-none tracking-[-.06em]">The source of truth.</h1><p className="mt-4 max-w-xl text-[13px] leading-6 text-muted-foreground">Keep KAMALO AI clear, accurate, and close to the product. Only approved guidance is used in customer answers.</p></div>
          <button onClick={() => setEditorArticle(null)} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[12px] font-bold text-primary-foreground shadow-[0_7px_18px_hsl(var(--primary)/.16)] transition-transform hover:-translate-y-0.5" data-testid="button-new-article"><HiOutlineDocumentPlus size={16} /> New article</button>
        </header>

         <div className="mt-7 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full lg:max-w-[460px]"><HiOutlineMagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or article content" className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-[12px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-search-articles" /></div>
          <div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-2 text-muted-foreground"><HiOutlineFunnel size={14} /><span className="font-mono text-[10px] uppercase tracking-[.13em]">Filter</span></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 max-w-[calc(50vw-24px)] rounded-lg border border-input bg-card px-3 text-[11px] outline-none focus:border-primary" data-testid="select-article-category"><option value="">All categories</option>{Array.from(new Set(articles.map((article) => article.category))).sort().map((item) => <option value={item} key={item}>{item}</option>)}</select><div className="relative"><select value={status} onChange={(event) => setStatus(event.target.value as ArticleStatus)} className="h-10 appearance-none rounded-lg border border-input bg-card py-0 pl-3 pr-8 text-[11px] capitalize outline-none focus:border-primary"><option value="all">All statuses</option><option value="draft">Draft</option><option value="approved">Approved</option><option value="archived">Archived</option></select><HiOutlineChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" /></div>{hasFilters && <button onClick={clearFilters} className="flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-clear-article-filters"><HiOutlineArrowPath size={13} /> Reset</button>}</div>
        </div>

        {notice && <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-[11px] text-primary animate-rise" data-testid="status-knowledge-notice">{notice}</div>}
        <div className="mt-7 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-sm)]">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_150px_120px_150px] gap-4 border-b border-border bg-muted/40 px-5 py-3 font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground xl:grid"><span>Article</span><span>Category</span><span>Status</span><span className="text-right">Actions</span></div>
           {articlesQuery.isLoading ? <div className="p-4" role="status" aria-live="polite"><span className="sr-only">Loading knowledge articles</span><ArticleSkeleton /></div> : articlesQuery.isError ? <div className="p-10 text-center" role="alert" aria-live="assertive"><p className="text-[13px] font-semibold">Knowledge base unavailable</p><p className="mt-2 text-[12px] text-muted-foreground">We could not load the source articles.</p><button onClick={() => void articlesQuery.refetch()} className="mt-4 rounded-lg border border-border px-4 py-2 text-[11px] font-bold hover:bg-muted" data-testid="button-retry-articles">Try again</button></div> : articles.length === 0 ? <div className="p-12 text-center" role="region" aria-label="Empty knowledge base"><KnowledgeIcon /><h3 className="mt-4 text-xl font-extrabold tracking-[-.03em]">Nothing here yet.</h3><p className="mx-auto mt-2 max-w-sm text-[12px] leading-6 text-muted-foreground">{hasFilters ? 'No articles match these filters.' : 'Create the first article to give KAMALO AI a reliable source to work from.'}</p><button onClick={hasFilters ? clearFilters : () => setEditorArticle(null)} className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-[11px] font-bold text-primary-foreground" data-testid={hasFilters ? 'button-clear-empty-filters' : 'button-create-first-article'}>{hasFilters ? 'Clear filters' : 'Create an article'}</button></div> : <div className="divide-y divide-border/80">{articles.map((article) => <ArticleRow key={article.id} article={article} onEdit={setEditorArticle} onApprove={(item) => void approve(item)} onArchive={(item) => void archive(item)} approving={approveArticle.isPending} archiving={archiveArticle.isPending} />)}</div>}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-sm bg-primary" /> <span data-testid="text-article-count">{articles.length} {articles.length === 1 ? 'article' : 'articles'} in view</span><span className="mx-1 opacity-40">·</span> Changes are reflected in new answers</div>
      </div>
      {editorArticle !== undefined && <ArticleEditor article={editorArticle} saving={isSaving} onClose={() => setEditorArticle(undefined)} onSave={saveArticle} />}
    </KamaloShell>
  );
}