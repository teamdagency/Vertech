# ADR-003 : construire une réputation explicable à partir d’événements

## Statut

Accepté pour le MVP.

## Contexte

La réputation différencie Vertech, mais un score opaque ou dominé par la
popularité nuirait directement à la confiance et pourrait pénaliser les
nouveaux membres.

## Décision

Conserver chaque signal admissible dans `reputation_events`, avec sa dimension,
son poids, sa source et sa preuve. Matérialiser les scores courants dans
`reputation_scores`, entièrement recalculables.

Les dimensions initiales sont :

- technical ;
- reliability ;
- collaboration ;
- leadership ;
- community.

Les réactions sociales n’accordent aucun point direct au lancement. Les
validations, projets documentés, contributions confirmées et actions de
modération constituent les premiers signaux.

## Garde-fous

- aucune auto-validation ;
- poids réduit pour les comptes nouveaux ou non vérifiés ;
- plafonnement des signaux répétés entre deux mêmes personnes ;
- historique immuable et audit des ajustements manuels ;
- affichage des facteurs contribuant au score ;
- mécanisme de contestation ;
- pas de classement public global avant validation statistique.

## Conséquences

- le calcul est plus facile à expliquer, tester et corriger ;
- le stockage d’événements augmente le volume, acceptable au stade MVP ;
- le score doit être présenté comme un signal, jamais comme une vérité absolue.

## Déclencheur de révision

Réviser les poids après un volume suffisant de collaborations confirmées et une
analyse des biais par ancienneté, genre, localisation et taille de réseau.
