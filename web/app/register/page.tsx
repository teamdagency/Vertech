'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, ApiError } from '@/lib/auth';
import { Field } from '@/components/Field';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K) {
    return (value: string) => setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(form);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "L'inscription a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-1 font-display text-2xl text-paper">Rejoindre KonfIA</h1>
      <p className="mb-6 font-body text-sm text-muted">Ta réputation se construit sur des preuves, pas des likes.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nom affiché" type="text" value={form.displayName} onChange={set('displayName')} autoComplete="name" />
        <Field
          label="Nom d'utilisateur"
          type="text"
          value={form.username}
          onChange={set('username')}
          autoComplete="username"
          hint="3-30 caractères : lettres, chiffres, - ou _"
        />
        <Field label="E-mail" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        <Field
          label="Mot de passe"
          type="password"
          value={form.password}
          onChange={set('password')}
          autoComplete="new-password"
          hint="8 caractères minimum"
        />
        {error && <p className="font-body text-sm text-ochre">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-indigo py-2.5 font-body text-sm font-medium text-paper disabled:opacity-40"
        >
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="mt-6 font-body text-sm text-muted">
        Déjà inscrit ?{' '}
        <Link href="/login" className="text-ochre hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
