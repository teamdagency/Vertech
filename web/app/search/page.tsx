'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { SearchResults } from '@/lib/types';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await api.get<SearchResults>(`/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-paper">Rechercher</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Un nom, une compétence, un projet…"
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-sm text-paper placeholder:text-muted focus:border-ochre/60 focus:outline-none"
        />
      </form>

      {loading && <p className="font-mono text-sm text-muted">Recherche en cours…</p>}

      {results && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-display text-lg text-paper">Profils</h2>
            {results.profiles.length === 0 ? (
              <p className="font-body text-sm text-muted">Aucun profil ne correspond.</p>
            ) : (
              <ul className="space-y-2">
                {results.profiles.map((p) => (
                  <li key={p.id}>
                    <Link href={`/profiles/${p.username}`} className="font-body text-sm text-paper hover:text-ochre">
                      {p.displayName}
                    </Link>
                    {p.headline && <span className="ml-2 font-body text-sm text-muted">— {p.headline}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg text-paper">Projets</h2>
            {results.projects.length === 0 ? (
              <p className="font-body text-sm text-muted">Aucun projet ne correspond.</p>
            ) : (
              <ul className="space-y-2">
                {results.projects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.slug}`} className="font-body text-sm text-paper hover:text-ochre">
                      {p.title}
                    </Link>
                    <span className="ml-2 font-body text-sm text-muted">— {p.summary}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
