'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Project } from '@/lib/types';
import { Stamp } from '@/components/Stamp';

const STATUS_LABELS: Record<string, string> = {
  idea: 'Idée',
  building: 'En construction',
  launched: 'Lancé',
  paused: 'En pause',
  archived: 'Archivé',
};

export default function ProjectPage() {
  const params = useParams<{ slug: string }>();
  const { token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get<Project>(`/projects/${params.slug}`, token ?? undefined)
      .then(setProject)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      });
  }, [params.slug, token]);

  if (notFound) {
    return <p className="font-body text-sm text-muted">Ce projet n&apos;existe pas, ou n&apos;est pas accessible.</p>;
  }
  if (!project) {
    return <p className="font-mono text-sm text-muted">Chargement du projet…</p>;
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <h1 className="font-display text-3xl text-paper">{project.title}</h1>
        <Stamp label="statut" value={STATUS_LABELS[project.status] ?? project.status} />
      </div>
      <p className="mb-6 font-body text-[15px] text-paper/80">{project.summary}</p>

      <div className="mb-6 flex gap-4 font-mono text-xs">
        {project.sourceUrl && (
          <a href={project.sourceUrl} target="_blank" rel="noreferrer" className="text-indigo hover:underline">
            code source ↗
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-ochre hover:underline">
            démo ↗
          </a>
        )}
      </div>

      <section className="mb-8">
        <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-paper/80">{project.description}</p>
      </section>

      {project.skills.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg text-paper">Stack technique</h2>
          <div className="flex flex-wrap gap-2">
            {project.skills.map((s) => (
              <span key={s.skillId} className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-xs text-muted">
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg text-paper">Contributeurs</h2>
        <ul className="space-y-1.5">
          {project.members.map((m) => (
            <li key={m.profileId} className="font-body text-sm text-paper/90">
              <Link href={`/profiles/${m.username}`} className="hover:text-ochre">
                {m.displayName}
              </Link>
              <span className="ml-2 font-mono text-[11px] text-muted">{m.role}</span>
              {m.isOwner && <span className="ml-2 font-mono text-[11px] text-jade">propriétaire</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
