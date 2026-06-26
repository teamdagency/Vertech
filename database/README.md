# Base de données

Le fichier [schema.sql](schema.sql) décrit le MPD PostgreSQL du MVP.

## Exécution locale

```bash
createdb vertech
psql vertech -v ON_ERROR_STOP=1 -f database/schema.sql
```

Charger des données de développement :

```bash
psql vertech -v ON_ERROR_STOP=1 -f database/seeds.sql
```

Valider rapidement les contraintes et triggers :

```bash
createdb vertech_smoke
psql vertech_smoke -v ON_ERROR_STOP=1 -f database/schema.sql
psql vertech_smoke -v ON_ERROR_STOP=1 -f database/smoke_test.sql
```

Prérequis : PostgreSQL 16+ avec les extensions `citext` et `pgcrypto`.

## Passage en développement

Avant d’implémenter l’application :

1. choisir Prisma ou Drizzle selon l’équipe ;
2. convertir ce schéma en migration initiale ;
3. ajouter un jeu de données de développement séparé ;
4. exécuter le schéma sur une base vide dans la CI ;
5. ajouter des tests de contraintes et de permissions ;
6. ne jamais modifier une migration déjà appliquée en production.

Les changements destructifs doivent suivre la stratégie
ajout → migration → bascule → suppression.
