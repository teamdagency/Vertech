/**
 * Curseur opaque basé sur (createdAt, id) : stable même si plusieurs lignes
 * partagent le même timestamp. Utilisé pour feed/commentaires/notifications
 * (cf. docs/api/README.md : "pagination par curseur").
 */
export function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): { createdAt: string; id: string } | undefined {
  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    if (!createdAt || !id) return undefined;
    return { createdAt, id };
  } catch {
    return undefined;
  }
}
