# ADR-001 : démarrer avec un monolithe modulaire

## Statut

Accepté.

## Contexte

Le produit est au stade MVP, l’équipe et la charge ne sont pas encore établies,
et les frontières métier continueront d’évoluer avec les premiers membres.

## Décision

Construire une seule application déployable, organisée en modules métier avec
des dépendances explicites. Les modules partagent PostgreSQL mais ne modifient
pas directement les tables privées des autres modules hors services définis.

## Alternatives

| Option | Avantages | Inconvénients |
|---|---|---|
| Monolithe modulaire | livraison rapide, transactions simples, exploitation légère | discipline interne nécessaire |
| Microservices | déploiement et montée en charge indépendants | coût réseau, données distribuées, exploitation lourde |
| Backend-as-a-Service seul | prototype rapide | règles de réputation et contrôle d’accès plus difficiles à isoler |

## Conséquences

- les transactions métier restent atomiques ;
- le développement local et le déploiement sont simples ;
- des tests d’architecture devront empêcher les dépendances circulaires ;
- une extraction future reste possible via l’outbox et les frontières métier.

## Déclencheur de révision

Réexaminer si l’équipe backend dépasse dix personnes, si un module nécessite
une disponibilité indépendante, ou si sa charge ne peut plus être absorbée par
une mise à l’échelle horizontale de l’application.
