# Dictionnaire des données

Les identifiants sont des UUID. Les dates sont stockées en `TIMESTAMPTZ` en
UTC. Les noms SQL sont en anglais pour rester compatibles avec les conventions
des frameworks, tandis que la documentation métier reste en français.

## Identité et profil

| Donnée | Type logique | Contraintes | Description |
|---|---|---|---|
| user.id | UUID | PK | Identifiant technique du compte |
| user.email | texte | unique, obligatoire | Adresse de connexion normalisée |
| user.password_hash | texte | nullable | Secret haché si authentification locale |
| user.role | enum | obligatoire | member, moderator ou admin |
| user.status | enum | obligatoire | pending, active, suspended ou deleted |
| profile.username | texte | unique, obligatoire | Identifiant public |
| profile.display_name | texte | obligatoire | Nom affiché |
| profile.bio | texte | nullable | Présentation courte |
| profile.country_code | code ISO | obligatoire | Pays du membre, GN par défaut |
| profile.city | texte | nullable | Ville |
| profile.availability | enum | obligatoire | unavailable, open, freelance ou job |
| profile.visibility | enum | obligatoire | public, members ou private |
| profile.github_url | URL | nullable | Profil GitHub |
| profile.linkedin_url | URL | nullable | Profil LinkedIn |
| profile.portfolio_url | URL | nullable | Portfolio personnel |

## Compétences

| Donnée | Type logique | Contraintes | Description |
|---|---|---|---|
| skill.id | UUID | PK | Compétence du référentiel |
| skill.name | texte | unique | Nom canonique |
| skill.slug | texte | unique | Clé URL |
| skill.category | texte | obligatoire | Domaine : backend, design, data, etc. |
| profile_skill.level | entier | 1 à 5 | Niveau déclaré |
| profile_skill.years_experience | décimal | positif | Expérience indicative |
| profile_skill.is_primary | booléen | défaut false | Compétence mise en avant |

## Projets

| Donnée | Type logique | Contraintes | Description |
|---|---|---|---|
| project.id | UUID | PK | Projet publié |
| project.owner_id | UUID | FK profile | Propriétaire |
| project.title | texte | obligatoire | Titre |
| project.slug | texte | unique | URL publique |
| project.summary | texte | obligatoire | Résumé court |
| project.description | texte | obligatoire | Description détaillée |
| project.status | enum | obligatoire | idea, building, launched, paused, archived |
| project.visibility | enum | obligatoire | public, members, private |
| project.source_url | URL | nullable | Dépôt de code |
| project.demo_url | URL | nullable | Démonstration |
| project.help_needed | texte | nullable | Besoin de collaboration |
| project_member.role | texte | obligatoire | Rôle réel du contributeur |
| project_member.is_owner | booléen | obligatoire | Droit de gestion principal |
| project_media.kind | enum | obligatoire | image ou video |
| project_media.url | URL | obligatoire | Adresse du média |

## Communauté

| Donnée | Type logique | Contraintes | Description |
|---|---|---|---|
| group.id | UUID | PK | Groupe thématique |
| group.slug | texte | unique | URL du groupe |
| group.visibility | enum | obligatoire | public, private |
| membership.role | enum | obligatoire | member, moderator, owner |
| membership.status | enum | obligatoire | pending, active, rejected, banned |
| post.author_id | UUID | FK profile | Auteur |
| post.group_id | UUID | nullable, FK group | Groupe éventuel |
| post.kind | enum | obligatoire | update, question, resource, project |
| post.body | texte | obligatoire | Contenu |
| comment.parent_id | UUID | nullable, FK comment | Réponse imbriquée |
| reaction.kind | enum | obligatoire | like, useful, celebrate |

## Confiance et modération

| Donnée | Type logique | Contraintes | Description |
|---|---|---|---|
| endorsement.endorser_id | UUID | FK profile | Validateur |
| endorsement.recipient_id | UUID | FK profile | Profil validé |
| endorsement.skill_id | UUID | FK skill | Compétence validée |
| endorsement.project_id | UUID | nullable, FK project | Preuve associée |
| endorsement.strength | entier | 1 à 3 | Force de la validation |
| recommendation.body | texte | obligatoire | Témoignage circonstancié |
| reputation_event.event_type | texte | obligatoire | Nature du signal |
| reputation_event.dimension | enum | obligatoire | Domaine de réputation |
| reputation_event.points | décimal | signé | Variation appliquée |
| reputation_event.evidence_type | texte | obligatoire | Type de preuve |
| reputation_event.evidence_id | UUID | nullable | Ressource source |
| reputation_score.score | décimal | 0 à 100 | Score matérialisé |
| report.target_type | enum | obligatoire | profile, project, post, comment |
| report.reason | enum | obligatoire | spam, abuse, fraud, etc. |
| report.status | enum | obligatoire | open, reviewing, resolved, rejected |

## Données techniques transversales

| Donnée | Type logique | Contraintes | Description |
|---|---|---|---|
| created_at | date-heure | obligatoire | Date de création |
| updated_at | date-heure | obligatoire | Dernière modification |
| deleted_at | date-heure | nullable | Archivage logique |
| notification.read_at | date-heure | nullable | Date de lecture |
| metadata | JSON | défaut objet | Extension non critique et non recherchée |

Le JSON est réservé aux métadonnées techniques variables. Les informations
métier utilisées dans les filtres, contraintes ou calculs restent normalisées.
