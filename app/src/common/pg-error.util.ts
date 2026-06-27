import { BadRequestException, ConflictException } from '@nestjs/common';

interface PgError {
  code?: string;
  constraint?: string;
  cause?: PgError;
}

function findPgError(err: unknown): PgError | undefined {
  let current = err as PgError | undefined;
  while (current) {
    if (current.code) return current;
    current = current.cause;
  }
  return undefined;
}

/**
 * Drizzle enveloppe l'erreur pg native dans une DrizzleQueryError dont la
 * cause porte le vrai code SQLSTATE. À utiliser dans un catch de service :
 *   catch (err) { throw mapPgError(err); }
 * Si l'erreur n'est pas une violation de contrainte connue, elle est
 * renvoyée telle quelle pour remonter en 500 (cas non prévu).
 */
export function mapPgError(err: unknown, constraintMessages: Record<string, string> = {}): unknown {
  const pgErr = findPgError(err);
  if (!pgErr) return err;

  const known = pgErr.constraint ? constraintMessages[pgErr.constraint] : undefined;

  if (pgErr.code === '23505') {
    return new ConflictException(known ?? 'Ressource déjà existante.');
  }
  if (pgErr.code === '23514' || pgErr.code === '23503') {
    return new BadRequestException(known ?? 'Données invalides.');
  }
  return err;
}
