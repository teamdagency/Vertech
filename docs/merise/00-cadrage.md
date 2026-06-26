# Cadrage fonctionnel et règles métier

## Objectif du MVP

Le MVP doit prouver une boucle de valeur courte :

1. un talent crée un profil ;
2. il ajoute des compétences et publie un projet vérifiable ;
3. la communauté apporte des retours et des validations ;
4. le profil devient plus facile à découvrir ;
5. une collaboration ou une opportunité réelle en résulte.

Le produit initial cible la Guinée. L’internationalisation et l’ouverture à
l’Afrique francophone sont prévues dans le modèle, mais ne pilotent pas la
complexité du MVP.

## Acteurs

| Acteur | Responsabilités principales |
|---|---|
| Visiteur | Consulter les profils et projets publics |
| Membre | Gérer son profil, publier, commenter, rejoindre des groupes |
| Porteur de projet | Publier un projet et gérer ses contributeurs |
| Validateur | Valider une compétence sur la base d’une preuve |
| Modérateur | Traiter les signalements et appliquer les règles |
| Administrateur | Administrer référentiels, rôles et paramètres |
| Recruteur | Rechercher des talents ; rôle fonctionnel prévu pour la phase 2 |

## Périmètre MVP

Inclus :

- compte et profil public ;
- compétences et niveaux déclarés ;
- projets, médias, technologies et contributeurs ;
- publications, commentaires et réactions ;
- groupes et adhésions ;
- validation simple des compétences ;
- recommandations écrites ;
- recherche par texte, compétence et localisation ;
- notifications internes ;
- réputation auditable et explicable ;
- signalement et modération de base.

Hors périmètre initial :

- paiement, marketplace et commission ;
- vente de formations ;
- messagerie temps réel complète ;
- matching automatique par IA ;
- visioconférence ;
- microservices ;
- application mobile native.

## Hypothèses structurantes

- Les profils et projets sont publics par défaut, avec possibilité de brouillon.
- Une adresse e-mail ne peut appartenir qu’à un compte.
- Un pseudonyme public est unique sans tenir compte de la casse.
- Une compétence appartient à un référentiel administré.
- Une validation de compétence doit désigner une compétence et peut référencer
  un projet servant de preuve.
- Un membre ne peut valider qu’une fois la même compétence d’un même profil.
- Un membre ne peut pas valider sa propre compétence ni se recommander.
- Un projet possède au moins un propriétaire.
- Une publication peut être globale ou rattachée à un groupe.
- Un groupe privé exige une adhésion acceptée pour consulter son contenu.
- Toute variation de réputation provient d’un événement conservé dans un
  journal ; les scores agrégés peuvent être recalculés.
- Les likes et réactions ont un poids nul ou très faible dans la réputation.
- Les suppressions fonctionnelles sensibles utilisent un archivage logique.

## Règles de gestion

| ID | Règle |
|---|---|
| RG-01 | Un compte possède exactement un profil membre |
| RG-02 | Un profil peut déclarer plusieurs compétences |
| RG-03 | Le couple profil-compétence est unique |
| RG-04 | Un projet possède un propriétaire et peut avoir plusieurs contributeurs |
| RG-05 | Le couple projet-membre est unique |
| RG-06 | Le couple projet-compétence est unique |
| RG-07 | Une adhésion à un groupe est unique par membre |
| RG-08 | Une réaction est unique par acteur, cible et type |
| RG-09 | Une validation de compétence est unique par validateur, profil et compétence |
| RG-10 | Une recommandation est unique par auteur et bénéficiaire |
| RG-11 | Un score visible est borné entre 0 et 100 |
| RG-12 | Un événement de réputation est immuable après création |
| RG-13 | Seuls les modérateurs peuvent clôturer un signalement |
| RG-14 | Une ressource archivée n’apparaît plus dans les recherches publiques |
| RG-15 | Les décisions automatiques de réputation doivent rester explicables |

## Critères de succès du MVP

- 30 à 100 membres fondateurs avec profil renseigné ;
- au moins 50 % des membres ayant publié une preuve de travail ;
- au moins 20 projets recevant un retour qualifié ;
- recherches de talents utilisées chaque semaine ;
- premières mises en relation documentées ;
- absence de score impossible à expliquer à partir du journal d’événements.
