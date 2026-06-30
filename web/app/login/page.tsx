'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, ApiError } from '@/lib/auth';
import { Field } from '@/components/Field';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 font-display text-2xl text-paper">Se connecter</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field label="Mot de passe" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <p className="font-body text-sm text-ochre">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-indigo py-2.5 font-body text-sm font-medium text-paper disabled:opacity-40"
        >
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="mt-6 font-body text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-ochre hover:underline">
          Rejoindre KonfIA
        </Link>
      </p>
    </div>
  );
}

