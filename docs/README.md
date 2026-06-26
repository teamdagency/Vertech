# Dossier de conception Vertech

Ce dossier transforme la vision produit en un socle fonctionnel et technique
implémentable. Le périmètre principal est le MVP Guinée.

## Parcours de lecture

1. [Cadrage et règles métier](merise/00-cadrage.md)
2. [Dictionnaire des données](merise/01-dictionnaire-donnees.md)
3. [Modèle conceptuel de données — MCD](merise/02-mcd.md)
4. [Modèle logique de données — MLD](merise/03-mld.md)
5. [Traitements — MCT et MOT](merise/04-traitements.md)
6. [Architecture applicative](architecture/README.md)
7. [Contrat API initial](api/README.md)
8. [Schéma PostgreSQL exécutable](../database/schema.sql)

## Décisions d’architecture

- [ADR-001 — Monolithe modulaire](architecture/adr/001-monolithe-modulaire.md)
- [ADR-002 — PostgreSQL](architecture/adr/002-postgresql.md)
- [ADR-003 — Réputation explicable](architecture/adr/003-reputation-explicable.md)

## Statut

Ces documents constituent une base de conception versionnée. Les règles de
réputation restent volontairement simples pour le MVP et devront être validées
sur des données réelles avant d’être utilisées comme signal de recrutement.
