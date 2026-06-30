'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function NavBar() {
  const { profile, logout, loading } = useAuth();

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-paper">
          Konf<span className="text-ochre">IA</span>
        </Link>

        <nav className="flex items-center gap-5 font-body text-sm text-muted">
          <Link href="/search" className="hover:text-paper">
            Rechercher
          </Link>

          {loading ? null : profile ? (
            <>
              <Link href={`/profiles/${profile.username}`} className="hover:text-paper">
                {profile.username}
              </Link>
              <button onClick={logout} className="hover:text-paper">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-paper">
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-indigo px-3 py-1.5 text-paper hover:bg-indigo/80"
              >
                Rejoindre
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
