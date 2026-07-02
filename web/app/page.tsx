'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { FeedPost } from '@/lib/types';
import { PostCard } from '@/components/PostCard';

const STATS = [
  { value: '9', label: 'modules métier' },
  { value: '22', label: 'tables de données' },
  { value: '100%', label: 'réputation vérifiable' },
];

const FEATURES = [
  {
    icon: '◈',
    title: 'Preuves, pas des likes',
    body: 'Chaque compétence est validée par des pairs. Chaque projet est documenté. Ton score est explicable ligne par ligne.',
  },
  {
    icon: '◎',
    title: 'Réputation qui se construit',
    body: 'Technical · Reliability · Collaboration · Leadership · Community — 5 dimensions calculées depuis un journal d\'événements immuable.',
  },
  {
    icon: '◐',
    title: 'Fait pour la Guinée',
    body: 'Conakry d\'abord, Afrique francophone ensuite. Une infrastructure de confiance pour les talents du numérique guinéen.',
  },
];

export default function Home() {
  const { token, profile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    api.get<{ items: FeedPost[] }>('/feed?limit=10', token ?? undefined)
      .then(d => setPosts(d.items))
      .catch(() => {})
      .finally(() => setFeedLoading(false));
  }, [authLoading, token]);

  async function handlePublish(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() || !token) return;
    setPosting(true);
    try {
      await api.post('/posts', { body, kind: 'update' }, token);
      setBody('');
      const d = await api.get<{ items: FeedPost[] }>('/feed?limit=10', token);
      setPosts(d.items);
    } catch {}
    finally { setPosting(false); }
  }

  return (
    <div>
      {/* HERO */}
      {!profile && (
        <section style={{
          padding: '80px 0 64px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '64px',
        }}>
          <div style={{
            display: 'inline-block',
            fontFamily: 'SF Mono, Menlo, monospace',
            fontSize: '11px',
            color: '#C98A2E',
            border: '1px solid rgba(201,138,46,0.3)',
            padding: '4px 12px',
            borderRadius: '20px',
            marginBottom: '24px',
            letterSpacing: '0.08em',
          }}>
            MVP · Conakry, Guinée
          </div>

          <h1 style={{
            fontFamily: 'Iowan Old Style, Palatino Linotype, Georgia, serif',
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '24px',
            color: '#F2EDE4',
          }}>
            La plateforme de confiance<br />
            <span style={{ color: '#C98A2E' }}>des talents tech guinéens.</span>
          </h1>

          <p style={{
            fontSize: '18px',
            lineHeight: 1.7,
            color: 'rgba(242,237,228,0.65)',
            maxWidth: '520px',
            marginBottom: '40px',
          }}>
            Pas un CV. Pas un LinkedIn local. Une infrastructure de réputation construite
            sur des preuves réelles — projets, validations, contributions.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              background: '#C98A2E',
              color: '#14191B',
              padding: '14px 28px',
              borderRadius: '40px',
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}>
              Rejoindre KonfIA →
            </Link>
            <Link href="/search" style={{
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#F2EDE4',
              padding: '14px 28px',
              borderRadius: '40px',
              fontSize: '15px',
              textDecoration: 'none',
            }}>
              Explorer les talents
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '40px',
            marginTop: '56px',
            flexWrap: 'wrap',
          }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{
                  fontFamily: 'Iowan Old Style, Georgia, serif',
                  fontSize: '32px',
                  fontWeight: 600,
                  color: '#F2EDE4',
                  lineHeight: 1,
                }}>{s.value}</div>
                <div style={{
                  fontFamily: 'SF Mono, Menlo, monospace',
                  fontSize: '11px',
                  color: '#8A8378',
                  marginTop: '4px',
                  letterSpacing: '0.05em',
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURES */}
      {!profile && (
        <section style={{ marginBottom: '72px' }}>
          <p style={{
            fontFamily: 'SF Mono, Menlo, monospace',
            fontSize: '11px',
            color: '#8A8378',
            letterSpacing: '0.08em',
            marginBottom: '32px',
          }}>POURQUOI KONFIA</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2px',
          }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                padding: '28px 24px',
              }}>
                <div style={{
                  fontSize: '24px',
                  color: '#C98A2E',
                  marginBottom: '16px',
                  lineHeight: 1,
                }}>{f.icon}</div>
                <div style={{
                  fontFamily: 'Iowan Old Style, Georgia, serif',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#F2EDE4',
                  marginBottom: '10px',
                }}>{f.title}</div>
                <p style={{
                  fontSize: '13px',
                  lineHeight: 1.7,
                  color: 'rgba(242,237,228,0.55)',
                }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEED */}
      <section>
        {profile && (
          <>
            <h2 style={{
              fontFamily: 'Iowan Old Style, Georgia, serif',
              fontSize: '22px',
              marginBottom: '4px',
              color: '#F2EDE4',
            }}>Le fil</h2>
            <p style={{ fontSize: '13px', color: '#8A8378', marginBottom: '24px' }}>
              Ce que la communauté construit, en ce moment.
            </p>

            <form onSubmit={handlePublish} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '32px',
            }}>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Qu'est-ce que tu construis cette semaine ?"
                rows={3}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#F2EDE4',
                  fontSize: '14px',
                  width: '100%',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={posting || !body.trim()}
                  style={{
                    background: '#C98A2E',
                    color: '#14191B',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: (posting || !body.trim()) ? 0.4 : 1,
                  }}
                >
                  {posting ? 'Publication…' : 'Publier'}
                </button>
              </div>
            </form>
          </>
        )}

        {!profile && (
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <p style={{
              fontFamily: 'SF Mono, Menlo, monospace',
              fontSize: '11px',
              color: '#8A8378',
              letterSpacing: '0.08em',
            }}>LE FIL PUBLIC</p>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>
        )}

        {feedLoading ? (
          <p style={{ fontFamily: 'SF Mono, Menlo, monospace', fontSize: '13px', color: '#8A8378' }}>
            Chargement du fil…
          </p>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '32px', marginBottom: '16px' }}>◎</p>
            <p style={{ fontSize: '15px', color: '#F2EDE4', marginBottom: '8px' }}>
              Le fil est encore vierge.
            </p>
            <p style={{ fontSize: '13px', color: '#8A8378', marginBottom: '24px' }}>
              Sois le premier builder guinéen à publier ici.
            </p>
            <Link href="/register" style={{
              background: '#C98A2E',
              color: '#14191B',
              padding: '10px 24px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Rejoindre KonfIA
            </Link>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </section>

      {/* CTA bas de page */}
      {!profile && posts.length > 0 && (
        <section style={{
          marginTop: '64px',
          padding: '48px',
          background: 'rgba(46,58,107,0.15)',
          border: '1px solid rgba(46,58,107,0.3)',
          borderRadius: '16px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: 'Iowan Old Style, Georgia, serif',
            fontSize: '28px',
            color: '#F2EDE4',
            marginBottom: '12px',
          }}>Ta réputation commence ici.</h2>
          <p style={{ fontSize: '15px', color: 'rgba(242,237,228,0.6)', marginBottom: '28px' }}>
            Rejoins les premiers builders qui construisent KonfIA depuis Conakry.
          </p>
          <Link href="/register" style={{
            background: '#C98A2E',
            color: '#14191B',
            padding: '14px 32px',
            borderRadius: '40px',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
          }}>
            Créer mon profil gratuitement →
          </Link>
        </section>
      )}
    </div>
  );
}
