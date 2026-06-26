# Contrat API initial

Préfixe recommandé : `/api/v1`. Les réponses d’erreur suivent un format stable :

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La requête est invalide.",
    "details": {},
    "requestId": "..."
  }
}
```

## Ressources principales

| Méthode | Route | Usage |
|---|---|---|
| POST | `/auth/register` | Créer un compte |
| POST | `/auth/login` | Ouvrir une session |
| GET | `/profiles/{username}` | Consulter un profil |
| PATCH | `/me/profile` | Modifier son profil |
| PUT | `/me/skills/{skillId}` | Déclarer une compétence |
| GET | `/profiles` | Rechercher des talents |
| POST | `/projects` | Créer un projet |
| GET | `/projects/{slug}` | Consulter un projet |
| PATCH | `/projects/{id}` | Modifier un projet autorisé |
| POST | `/projects/{id}/members` | Ajouter un contributeur |
| GET | `/feed` | Lire le fil personnalisé |
| POST | `/posts` | Publier |
| POST | `/posts/{id}/comments` | Commenter |
| PUT | `/posts/{id}/reactions/{kind}` | Réagir de manière idempotente |
| DELETE | `/posts/{id}/reactions/{kind}` | Retirer une réaction |
| GET | `/groups` | Lister les groupes |
| POST | `/groups/{id}/memberships` | Demander ou créer une adhésion |
| POST | `/profiles/{id}/endorsements` | Valider une compétence |
| POST | `/profiles/{id}/recommendations` | Recommander un membre |
| GET | `/profiles/{id}/reputation` | Obtenir score et facteurs |
| GET | `/notifications` | Lister ses notifications |
| PATCH | `/notifications/{id}/read` | Marquer comme lue |
| POST | `/reports` | Signaler une ressource |

## Conventions

- pagination par curseur pour feed, commentaires et notifications ;
- pagination classique possible pour les référentiels administratifs ;
- clés d’idempotence sur les créations sensibles ;
- filtres explicites : `skill`, `country`, `city`, `availability`, `level` ;
- date ISO 8601 UTC ;
- contrôle de version par `updated_at` ou ETag sur les modifications ;
- limites de taille sur texte, médias et nombre de compétences ;
- réponses publiques sans e-mail ni données d’authentification.

## Exemple de recherche

```http
GET /api/v1/profiles?skill=react&country=GN&availability=freelance&limit=20
```

## Exemple de réputation

```json
{
  "profileId": "4a1f...",
  "scores": [
    {
      "dimension": "technical",
      "score": 72.5,
      "eventCount": 14,
      "factors": [
        { "type": "project_published", "count": 3 },
        { "type": "skill_endorsed", "count": 8 }
      ]
    }
  ],
  "calculatedAt": "2026-06-26T12:00:00Z"
}
```
