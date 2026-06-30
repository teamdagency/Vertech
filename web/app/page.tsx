'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { FeedPost } from '@/lib/types';
import { PostCard } from '@/components/PostCard';

export default function FeedPage() {
  const { token, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFeed() {
    setLoading(true);
    try {
      const data = await api.get<{ items: FeedPost[] }>('/feed?limit=20', token ?? undefined);
      setPosts(data.items);
    } catch {
      setError('Le feed est momentanément indisponible.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function handlePublish(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || !token) return;
    setPosting(true);
    setError(null);
    try {
      await api.post('/posts', { body, kind: 'update' }, token);
      setBody('');
      await loadFeed();
    } catch {
      setError("La publication n'a pas pu être envoyée.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl text-paper">Le fil</h1>
      <p className="mb-8 font-body text-sm text-muted">
        Ce que la communauté tech guinéenne construit, en ce moment.
      </p>

      {token && (
        <form onSubmit={handlePublish} className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Qu'est-ce que tu construis cette semaine ?"
            rows={3}
            className="w-full resize-none bg-transparent font-body text-[15px] text-paper placeholder:text-muted focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={posting || !body.trim()}
              className="rounded-full bg-ochre px-4 py-1.5 font-body text-sm font-medium text-ink disabled:opacity-40"
            >
              {posting ? 'Publication…' : 'Publier'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mb-4 font-body text-sm text-ochre">{error}</p>}

      {loading ? (
        <p className="font-mono text-sm text-muted">Chargement du fil…</p>
      ) : posts.length === 0 ? (
        <p className="font-body text-sm text-muted">
          Rien à lire pour l&apos;instant. Sois le premier à publier quelque chose.
        </p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
