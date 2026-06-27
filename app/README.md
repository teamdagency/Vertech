# Vertech API

Socle backend du monolithe modulaire (ADR-001) : NestJS + TypeScript,
PostgreSQL comme source de vérité (ADR-002), Drizzle ORM.

## État actuel

Squelette fonctionnel : les 9 modules métier (Identity, Profiles, Skills,
Projects, Community, Trust, Search, Notifications, Moderation) existent
comme modules NestJS vides, prêts à recevoir providers/controllers au fil
de l'implémentation du [contrat API](../docs/api/README.md). Le endpoint
`GET /api/v1/health` est implémenté et vérifie une vraie connexion à
PostgreSQL.

## Pourquoi Drizzle plutôt que Prisma

`docs/architecture/README.md` laissait le choix ouvert. Drizzle a été
retenu au bootstrap : pas de moteur binaire à télécharger (contrainte de
l'environnement de build), schéma TypeScript généré par introspection
directe de `database/schema.sql`, ce qui garantit l'alignement avec le MPD.

## Lancer en local

```bash
cp .env.example .env
npm install

# Option A — tout via Docker (Postgres + API)
docker compose -f ../docker-compose.yml up --build

# Option B — Postgres local existant, API en mode dev
createdb vertech
psql vertech -v ON_ERROR_STOP=1 -f ../database/schema.sql
psql vertech -v ON_ERROR_STOP=1 -f ../database/seeds.sql
npm run dev
```

Vérifier que tout fonctionne :

```bash
curl http://localhost:3000/api/v1/health
# {"status":"ok","db":"connected","timestamp":"..."}
```

## Resynchroniser le schéma Drizzle après une migration SQL

`database/schema.sql` reste la source de vérité (MERISE). Après toute
modification de ce fichier :

```bash
npm run drizzle:pull
```

Cela régénère `src/drizzle/schema.ts` par introspection. Les colonnes
`citext` et `tsvector` ne sont pas reconnues nativement par Drizzle : elles
sont déclarées comme types custom en haut du fichier généré — à reporter
manuellement si le fichier est régénéré.

## Scripts

| Commande | Effet |
|---|---|
| `npm run build` | Compile TypeScript vers `dist/` |
| `npm run dev` | Lance l'API en mode watch |
| `npm run start` | Lance la version compilée |
| `npm run drizzle:pull` | Resynchronise le schéma depuis PostgreSQL |
| `npm run drizzle:studio` | Ouvre l'explorateur de données Drizzle Studio |
