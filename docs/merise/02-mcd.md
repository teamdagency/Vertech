# Modèle conceptuel de données — MCD

## Diagramme principal

```mermaid
erDiagram
    USER ||--|| PROFILE : possède
    PROFILE ||--o{ PROFILE_SKILL : déclare
    SKILL ||--o{ PROFILE_SKILL : qualifie

    PROFILE ||--o{ PROJECT : crée
    PROJECT ||--|{ PROJECT_MEMBER : mobilise
    PROFILE ||--o{ PROJECT_MEMBER : contribue
    PROJECT ||--o{ PROJECT_SKILL : utilise
    SKILL ||--o{ PROJECT_SKILL : caractérise
    PROJECT ||--o{ PROJECT_MEDIA : illustre

    PROFILE ||--o{ GROUP_MEMBERSHIP : adhère
    COMMUNITY_GROUP ||--o{ GROUP_MEMBERSHIP : accueille
    PROFILE ||--o{ POST : publie
    COMMUNITY_GROUP o|--o{ POST : contient
    PROJECT o|--o{ POST : annonce
    POST ||--o{ COMMENT : reçoit
    PROFILE ||--o{ COMMENT : écrit
    COMMENT o|--o{ COMMENT : répond
    POST ||--o{ POST_REACTION : reçoit
    PROFILE ||--o{ POST_REACTION : réagit
    COMMENT ||--o{ COMMENT_REACTION : reçoit
    PROFILE ||--o{ COMMENT_REACTION : réagit

    PROFILE ||--o{ ENDORSEMENT : reçoit
    PROFILE ||--o{ ENDORSEMENT : émet
    SKILL ||--o{ ENDORSEMENT : concerne
    PROJECT o|--o{ ENDORSEMENT : prouve
    PROFILE ||--o{ RECOMMENDATION : reçoit
    PROFILE ||--o{ RECOMMENDATION : écrit

    PROFILE ||--o{ REPUTATION_EVENT : bénéficie
    PROFILE ||--o{ REPUTATION_SCORE : possède
    PROFILE ||--o{ NOTIFICATION : reçoit
    PROFILE ||--o{ REPORT : signale
```

## Cardinalités structurantes

| Association | Cardinalité | Justification |
|---|---|---|
| USER — PROFILE | 1,1 — 1,1 | Tout compte applicatif représente un membre |
| PROFILE — SKILL | 0,n — 0,n | Un talent et une compétence sont indépendants |
| PROFILE — PROJECT | 0,n — 1,1 | Tout projet a un créateur responsable |
| PROJECT — PROFILE | 1,n — 0,n | Un projet peut avoir plusieurs contributeurs |
| GROUP — PROFILE | 0,n — 0,n | Adhésion avec rôle et statut |
| GROUP — POST | 0,n — 0,1 | Un post global n’appartient à aucun groupe |
| POST — COMMENT | 0,n — 1,1 | Tout commentaire cible un post |
| PROFILE — ENDORSEMENT | 0,n — 1,1 | L’émetteur et le bénéficiaire sont obligatoires |
| SKILL — ENDORSEMENT | 0,n — 1,1 | Toute validation concerne une compétence |
| PROFILE — REPUTATION_EVENT | 0,n — 1,1 | Chaque signal bénéficie à un profil |

## Contraintes non représentables par les cardinalités

- l’émetteur d’une validation diffère de son bénéficiaire ;
- l’auteur d’une recommandation diffère de son bénéficiaire ;
- un propriétaire de projet est aussi présent dans `PROJECT_MEMBER` ;
- une réaction ne peut exister qu’une fois par type, acteur et cible ;
- un score agrégé est dérivé des événements, jamais l’inverse ;
- un contenu privé n’est accessible qu’aux acteurs autorisés ;
- une preuve référencée par un événement doit exister au moment de l’émission.
