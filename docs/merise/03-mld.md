# Modèle logique de données — MLD

Notation : `#` clé primaire, `*` clé étrangère, `UQ` contrainte unique.

```text
USER(
  #id, email UQ, password_hash, role, status,
  email_verified_at, last_login_at, created_at, updated_at, deleted_at
)

PROFILE(
  #id, *user_id UQ, username UQ, display_name, headline, bio,
  country_code, city, avatar_url, github_url, linkedin_url, portfolio_url,
  availability, visibility, onboarding_completed_at,
  created_at, updated_at, deleted_at
)

SKILL(
  #id, name UQ, slug UQ, category, is_active, created_at, updated_at
)

PROFILE_SKILL(
  #*profile_id, #*skill_id, level, years_experience, is_primary,
  created_at, updated_at
)

PROJECT(
  #id, *owner_id, title, slug UQ, summary, description, status,
  visibility, source_url, demo_url, help_needed, started_at, completed_at,
  created_at, updated_at, deleted_at
)

PROJECT_MEMBER(
  #*project_id, #*profile_id, role, contribution, is_owner,
  joined_at, left_at
)

PROJECT_SKILL(#*project_id, #*skill_id)

PROJECT_MEDIA(
  #id, *project_id, kind, url, alt_text, position, created_at
)

COMMUNITY_GROUP(
  #id, *owner_id, name, slug UQ, description, visibility,
  created_at, updated_at, deleted_at
)

GROUP_MEMBERSHIP(
  #*group_id, #*profile_id, role, status, joined_at, updated_at
)

POST(
  #id, *author_id, *group_id?, *project_id?, kind, body,
  visibility, created_at, updated_at, deleted_at
)

COMMENT(
  #id, *post_id, *author_id, *parent_id?, body,
  created_at, updated_at, deleted_at
)

POST_REACTION(
  #*post_id, #*profile_id, #kind, created_at
)

COMMENT_REACTION(
  #*comment_id, #*profile_id, #kind, created_at
)

ENDORSEMENT(
  #id, *endorser_id, *recipient_id, *skill_id, *project_id?,
  strength, comment, status, created_at, updated_at,
  UQ(endorser_id, recipient_id, skill_id)
)

RECOMMENDATION(
  #id, *author_id, *recipient_id, relationship, body, status,
  created_at, updated_at,
  UQ(author_id, recipient_id)
)

REPUTATION_EVENT(
  #id, *profile_id, event_type, dimension, points,
  evidence_type, evidence_id?, source_profile_id?, metadata, created_at
)

REPUTATION_SCORE(
  #*profile_id, #dimension, score, event_count, calculated_at
)

NOTIFICATION(
  #id, *recipient_id, actor_id?, type, entity_type, entity_id?,
  payload, read_at, created_at
)

REPORT(
  #id, *reporter_id, target_type, target_id, reason, details,
  status, moderator_id?, resolution_note?, created_at, resolved_at
)
```

## Dépendances fonctionnelles principales

- `user.id -> toutes les propriétés du compte`
- `user.email -> user.id`
- `profile.user_id -> profile.id`
- `profile.username -> profile.id`
- `(profile_id, skill_id) -> niveau déclaré`
- `project.slug -> project.id`
- `(project_id, profile_id) -> rôle de contribution`
- `(group_id, profile_id) -> rôle et statut d’adhésion`
- `(endorser_id, recipient_id, skill_id) -> validation`
- `(profile_id, dimension) -> score agrégé courant`

Le modèle est en troisième forme normale pour les données métier. Les scores
agrégés sont une dénormalisation contrôlée, reconstruite depuis le journal des
événements de réputation.
