# ADR-002 : utiliser PostgreSQL comme source de vérité

## Statut

Accepté.

## Contexte

Le domaine contient de nombreuses relations, des contraintes d’unicité, des
transactions multi-entités, de la recherche et un historique de réputation
qui doit rester cohérent et auditable.

## Décision

Utiliser PostgreSQL 16 ou supérieur. Exploiter les contraintes relationnelles,
les index partiels, la recherche plein texte et JSONB uniquement pour les
métadonnées variables.

## Alternatives

| Option | Avantages | Inconvénients |
|---|---|---|
| PostgreSQL | intégrité, requêtes riches, FTS, écosystème mature | administration plus lourde que SQLite |
| SQLite | simplicité et faible coût | concurrence, exploitation multi-instance et recherche plus limitées |
| Base documentaire | schéma flexible | relations et cohérence de réputation plus complexes |

## Conséquences

- le modèle relationnel devient le contrat d’intégrité central ;
- une base managée est recommandée en production ;
- les clés UUID facilitent les imports et une distribution future ;
- les migrations doivent suivre une stratégie compatible sans interruption.

## Déclencheur de révision

Réexaminer uniquement si un besoin mesuré ne peut être satisfait par
PostgreSQL, ses extensions ou des projections spécialisées.
