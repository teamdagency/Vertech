-- Smoke tests SQL sans framework externe.
-- À exécuter sur une base fraîche après database/schema.sql.

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO users (email, password_hash, status, email_verified_at)
VALUES
  ('smoke.owner@example.com', '$2b$12$smokeownerhash0000000000000000000000000000000000', 'active', now()),
  ('smoke.peer@example.com', '$2b$12$smokepeerhash00000000000000000000000000000000000', 'active', now());

INSERT INTO profiles (user_id, username, display_name, headline, city, availability, onboarding_completed_at)
SELECT id, 'smokeowner', 'Smoke Owner', 'Backend developer', 'Conakry', 'open', now()
FROM users
WHERE email = 'smoke.owner@example.com';

INSERT INTO profiles (user_id, username, display_name, headline, city, availability, onboarding_completed_at)
SELECT id, 'smokepeer', 'Smoke Peer', 'Frontend developer', 'Conakry', 'open', now()
FROM users
WHERE email = 'smoke.peer@example.com';

INSERT INTO skills (name, slug, category)
VALUES ('Smoke PostgreSQL', 'smoke-postgresql', 'database');

INSERT INTO profile_skills (profile_id, skill_id, level, years_experience, is_primary)
SELECT p.id, s.id, 4, 2.0, true
FROM profiles p
JOIN skills s ON s.slug = 'smoke-postgresql'
WHERE p.username = 'smokeowner';

INSERT INTO projects (owner_id, title, slug, summary, description, status)
SELECT id, 'Smoke Project', 'smoke-project', 'Projet de validation DB.', 'Projet utilisé pour valider les contraintes et triggers SQL.', 'building'
FROM profiles
WHERE username = 'smokeowner';

DO $$
DECLARE
  owner_memberships integer;
BEGIN
  SELECT count(*) INTO owner_memberships
  FROM project_members pm
  JOIN projects pr ON pr.id = pm.project_id
  JOIN profiles p ON p.id = pm.profile_id
  WHERE pr.slug = 'smoke-project'
    AND p.username = 'smokeowner'
    AND pm.is_owner = true
    AND pm.role = 'Owner';

  IF owner_memberships <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one owner membership, got %', owner_memberships;
  END IF;
END;
$$;

DO $$
BEGIN
  INSERT INTO project_members (project_id, profile_id, role, is_owner)
  SELECT pr.id, p.id, 'Second Owner', true
  FROM projects pr
  JOIN profiles p ON p.username = 'smokepeer'
  WHERE pr.slug = 'smoke-project';

  RAISE EXCEPTION 'Second project owner should have failed';
EXCEPTION
  WHEN unique_violation THEN
    NULL;
END;
$$;

DO $$
BEGIN
  INSERT INTO endorsements (endorser_id, recipient_id, skill_id)
  SELECT p.id, p.id, s.id
  FROM profiles p
  JOIN skills s ON s.slug = 'smoke-postgresql'
  WHERE p.username = 'smokeowner';

  RAISE EXCEPTION 'Self endorsement should have failed';
EXCEPTION
  WHEN check_violation THEN
    NULL;
END;
$$;

INSERT INTO posts (author_id, kind, body)
SELECT id, 'question', 'Comment valider les commentaires imbriqués ?'
FROM profiles
WHERE username = 'smokeowner';

INSERT INTO comments (post_id, author_id, body)
SELECT po.id, pr.id, 'Commentaire parent valide.'
FROM posts po
JOIN profiles pr ON pr.username = 'smokepeer'
WHERE po.body = 'Comment valider les commentaires imbriqués ?';

INSERT INTO posts (author_id, kind, body)
SELECT id, 'question', 'Second post pour test parent invalide.'
FROM profiles
WHERE username = 'smokeowner';

DO $$
DECLARE
  parent_comment_id uuid;
  second_post_id uuid;
  peer_profile_id uuid;
BEGIN
  SELECT c.id INTO parent_comment_id
  FROM comments c
  JOIN posts p ON p.id = c.post_id
  WHERE p.body = 'Comment valider les commentaires imbriqués ?';

  SELECT id INTO second_post_id
  FROM posts
  WHERE body = 'Second post pour test parent invalide.';

  SELECT id INTO peer_profile_id
  FROM profiles
  WHERE username = 'smokepeer';

  INSERT INTO comments (post_id, author_id, parent_id, body)
  VALUES (second_post_id, peer_profile_id, parent_comment_id, 'Réponse invalide cross-post.');

  RAISE EXCEPTION 'Cross-post child comment should have failed';
EXCEPTION
  WHEN raise_exception THEN
    NULL;
END;
$$;

DO $$
DECLARE
  matching_profiles integer;
  matching_projects integer;
BEGIN
  SELECT count(*) INTO matching_profiles
  FROM profiles
  WHERE search_vector @@ plainto_tsquery('simple', 'Backend');

  SELECT count(*) INTO matching_projects
  FROM projects
  WHERE search_vector @@ plainto_tsquery('simple', 'validation');

  IF matching_profiles < 1 THEN
    RAISE EXCEPTION 'Expected FTS to find at least one profile';
  END IF;

  IF matching_projects < 1 THEN
    RAISE EXCEPTION 'Expected FTS to find at least one project';
  END IF;
END;
$$;

ROLLBACK;
