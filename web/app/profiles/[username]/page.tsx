'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { ProfileDetail, DeclaredSkill, ReputationResponse } from '@/lib/types';
import { Stamp } from '@/components/Stamp';

const DIMENSION_LABELS: Record<string, string> = {
  technical: 'Technique',
  reliability: 'Fiabilité',
  collaboration: 'Collaboration',
  leadership: 'Leadership',
  community: 'Communauté',
};

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [skills, setSkills] = useState<DeclaredSkill[]>([]);
  const [reputation, setReputation] = useState<ReputationResponse | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const p = await api.get<ProfileDetail>(`/profiles/${params.username}`);
        setProfile(p);
        const [skillsData, repData] = await Promise.all([
          api.get<DeclaredSkill[]>(`/profiles/${p.id}/skills`),
          api.get<ReputationResponse>(`/profiles/${p.id}/reputation`),
        ]);
        setSkills(skillsData);
        setReputation(repData);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      }
    }
    load();
  }, [params.username]);

  if (notFound) {
    return <p className="font-body text-sm text-muted">Ce profil n&apos;existe pas, ou n&apos;est pas accessible.</p>;
  }
  if (!profile) {
    return <p className="font-mono text-sm text-muted">Chargement du profil…</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-paper">{profile.displayName}</h1>
        <p className="font-mono text-sm text-muted">@{profile.username}</p>
        {profile.headline && <p className="mt-3 font-body text-[15px] text-paper/90">{profile.headline}</p>}
        <p className="mt-1 font-body text-sm text-muted">
          {[profile.city, profile.countryCode].filter(Boolean).join(', ')}
        </p>
        {profile.bio && <p className="mt-4 max-w-prose font-body text-sm leading-relaxed text-paper/80">{profile.bio}</p>}
      </div>

      {reputation && reputation.scores.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg text-paper">Réputation</h2>
          <div className="space-y-2">
            {reputation.scores.map((s) => (
              <div key={s.dimension} className="flex items-center gap-3">
                <span className="w-28 shrink-0 font-body text-sm text-muted">
                  {DIMENSION_LABELS[s.dimension] ?? s.dimension}
                </span>
                <div className="h-1.5 flex-1 rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-jade"
                    style={{ width: `${Math.min(100, s.score)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs text-jade">{s.score.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg text-paper">Compétences déclarées</h2>
        {skills.length === 0 ? (
          <p className="font-body text-sm text-muted">Aucune compétence déclarée pour l&apos;instant.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <Stamp key={s.skillId} label={s.name} value={`niv. ${s.level}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
