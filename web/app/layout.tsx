import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'KonfIA — talents tech vérifiés de Guinée',
  description:
    'Profils, projets et réputation construits sur des preuves réelles pour les talents tech guinéens.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-body text-paper antialiased">
        <AuthProvider>
          <NavBar />
          <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
