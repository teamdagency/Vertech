-- Vertech MVP - PostgreSQL 16+
-- Source de vérité du MPD. À convertir ensuite en migrations versionnées.

BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE account_role AS ENUM ('member', 'moderator', 'admin');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'deleted');
CREATE TYPE profile_availability AS ENUM ('unavailable', 'open', 'freelance', 'job');
CREATE TYPE content_visibility AS ENUM ('public', 'members', 'private');
CREATE TYPE project_status AS ENUM ('idea', 'building', 'launched', 'paused', 'archived');
CREATE TYPE media_kind AS ENUM ('image', 'video');
CREATE TYPE group_visibility AS ENUM ('public', 'private');
CREATE TYPE membership_role AS ENUM ('member', 'moderator', 'owner');
CREATE TYPE membership_status AS ENUM ('pending', 'active', 'rejected', 'banned');
CREATE TYPE post_kind AS ENUM ('update', 'question', 'resource', 'project');
CREATE TYPE reaction_kind AS ENUM ('like', 'useful', 'celebrate');
CREATE TYPE review_status AS ENUM ('pending', 'published', 'rejected', 'withdrawn');
CREATE TYPE reputation_dimension AS ENUM (
  'technical',
  'reliability',
  'collaboration',
  'leadership',
  'community'
);
CREATE TYPE report_target AS ENUM ('profile', 'project', 'post', 'comment');
CREATE TYPE report_reason AS ENUM (
  'spam',
  'abuse',
  'harassment',
  'fraud',
  'impersonation',
  'copyright',
  'other'
);
CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'rejected');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text,
  role account_role NOT NULL DEFAULT 'member',
  status account_status NOT NULL DEFAULT 'pending',
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT users_email_not_blank CHECK (length(trim(email::text)) > 3),
  CONSTRAINT users_local_auth_has_password CHECK (
    password_hash IS NULL OR length(password_hash) >= 20
  )
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  username citext NOT NULL UNIQUE,
  display_name varchar(120) NOT NULL,
  headline varchar(180),
  bio text,
  country_code char(2) NOT NULL DEFAULT 'GN',
  city varchar(120),
  avatar_url text,
  github_url text,
  linkedin_url text,
  portfolio_url text,
  availability profile_availability NOT NULL DEFAULT 'unavailable',
  visibility content_visibility NOT NULL DEFAULT 'public',
  onboarding_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(headline, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(bio, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(city, '')), 'C')
  ) STORED,
  CONSTRAINT profiles_username_format CHECK (
    username::text ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$'
  ),
  CONSTRAINT profiles_display_name_not_blank CHECK (length(trim(display_name)) > 0),
  CONSTRAINT profiles_country_code_uppercase CHECK (country_code ~ '^[A-Z]{2}$')
);

CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name citext NOT NULL UNIQUE,
  slug citext NOT NULL UNIQUE,
  category varchar(80) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skills_name_not_blank CHECK (length(trim(name::text)) > 0),
  CONSTRAINT skills_slug_format CHECK (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE profile_skills (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  level smallint NOT NULL,
  years_experience numeric(4,1),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, skill_id),
  CONSTRAINT profile_skills_level_range CHECK (level BETWEEN 1 AND 5),
  CONSTRAINT profile_skills_experience_positive CHECK (
    years_experience IS NULL OR years_experience BETWEEN 0 AND 80
  )
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title varchar(160) NOT NULL,
  slug citext NOT NULL UNIQUE,
  summary varchar(300) NOT NULL,
  description text NOT NULL,
  status project_status NOT NULL DEFAULT 'idea',
  visibility content_visibility NOT NULL DEFAULT 'public',
  source_url text,
  demo_url text,
  help_needed text,
  started_at date,
  completed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) STORED,
  CONSTRAINT projects_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT projects_description_not_blank CHECK (length(trim(description)) > 0),
  CONSTRAINT projects_slug_format CHECK (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT projects_dates_ordered CHECK (
    completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at
  )
);

CREATE TABLE project_members (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  role varchar(120) NOT NULL,
  contribution text,
  is_owner boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (project_id, profile_id),
  CONSTRAINT project_members_role_not_blank CHECK (length(trim(role)) > 0),
  CONSTRAINT project_members_dates_ordered CHECK (
    left_at IS NULL OR left_at >= joined_at
  )
);

CREATE TABLE project_skills (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind media_kind NOT NULL,
  url text NOT NULL,
  alt_text varchar(300),
  position smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_media_url_not_blank CHECK (length(trim(url)) > 0),
  CONSTRAINT project_media_position_positive CHECK (position >= 0)
);

CREATE TABLE community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  name varchar(120) NOT NULL,
  slug citext NOT NULL UNIQUE,
  description text NOT NULL,
  visibility group_visibility NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT groups_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT groups_slug_format CHECK (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE group_memberships (
  group_id uuid NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  role membership_role NOT NULL DEFAULT 'member',
  status membership_status NOT NULL DEFAULT 'pending',
  joined_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, profile_id),
  CONSTRAINT active_membership_has_join_date CHECK (
    status <> 'active' OR joined_at IS NOT NULL
  )
);

CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  group_id uuid REFERENCES community_groups(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  kind post_kind NOT NULL DEFAULT 'update',
  body text NOT NULL,
  visibility content_visibility NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT posts_body_not_blank CHECK (length(trim(body)) > 0)
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT comments_body_not_blank CHECK (length(trim(body)) > 0)
);

CREATE TABLE post_reactions (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind reaction_kind NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, profile_id, kind)
);

CREATE TABLE comment_reactions (
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind reaction_kind NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, profile_id, kind)
);

CREATE TABLE endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  strength smallint NOT NULL DEFAULT 1,
  comment text,
  status review_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (endorser_id, recipient_id, skill_id),
  CONSTRAINT endorsements_distinct_profiles CHECK (endorser_id <> recipient_id),
  CONSTRAINT endorsements_strength_range CHECK (strength BETWEEN 1 AND 3)
);

CREATE TABLE recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  relationship varchar(120) NOT NULL,
  body text NOT NULL,
  status review_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (author_id, recipient_id),
  CONSTRAINT recommendations_distinct_profiles CHECK (author_id <> recipient_id),
  CONSTRAINT recommendations_body_not_blank CHECK (length(trim(body)) > 0)
);

CREATE TABLE reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  event_type varchar(80) NOT NULL,
  dimension reputation_dimension NOT NULL,
  points numeric(7,2) NOT NULL,
  evidence_type varchar(80) NOT NULL,
  evidence_id uuid,
  source_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reputation_event_type_not_blank CHECK (length(trim(event_type)) > 0),
  CONSTRAINT reputation_evidence_type_not_blank CHECK (
    length(trim(evidence_type)) > 0
  ),
  CONSTRAINT reputation_points_reasonable CHECK (points BETWEEN -100 AND 100),
  CONSTRAINT reputation_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE reputation_scores (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dimension reputation_dimension NOT NULL,
  score numeric(5,2) NOT NULL DEFAULT 0,
  event_count integer NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, dimension),
  CONSTRAINT reputation_score_range CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT reputation_event_count_positive CHECK (event_count >= 0)
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type varchar(80) NOT NULL,
  entity_type varchar(80),
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_not_blank CHECK (length(trim(type)) > 0),
  CONSTRAINT notifications_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  target_type report_target NOT NULL,
  target_id uuid NOT NULL,
  reason report_reason NOT NULL,
  details text,
  status report_status NOT NULL DEFAULT 'open',
  moderator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT resolved_report_has_date CHECK (
    status NOT IN ('resolved', 'rejected') OR resolved_at IS NOT NULL
  )
);

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type varchar(80) NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type varchar(120) NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  CONSTRAINT outbox_payload_object CHECK (jsonb_typeof(payload) = 'object'),
  CONSTRAINT outbox_attempt_count_positive CHECK (attempt_count >= 0)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action varchar(120) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  request_id varchar(120),
  ip_hash varchar(128),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes de recherche et de navigation.
CREATE INDEX profiles_search_idx ON profiles USING gin (search_vector);
CREATE INDEX profiles_discovery_idx
  ON profiles (country_code, city, availability)
  WHERE deleted_at IS NULL AND visibility = 'public';
CREATE INDEX profiles_created_at_idx ON profiles (created_at DESC);

CREATE INDEX profile_skills_skill_level_idx
  ON profile_skills (skill_id, level DESC, profile_id);
CREATE INDEX profile_skills_primary_idx
  ON profile_skills (profile_id)
  WHERE is_primary = true;

CREATE INDEX projects_search_idx ON projects USING gin (search_vector);
CREATE INDEX projects_owner_created_idx ON projects (owner_id, created_at DESC);
CREATE INDEX projects_status_created_idx
  ON projects (status, created_at DESC)
  WHERE deleted_at IS NULL AND visibility = 'public';
CREATE INDEX project_members_profile_idx ON project_members (profile_id, joined_at DESC);
CREATE UNIQUE INDEX project_members_one_owner_idx
  ON project_members (project_id)
  WHERE is_owner = true;
CREATE INDEX project_skills_skill_idx ON project_skills (skill_id, project_id);
CREATE INDEX project_media_order_idx ON project_media (project_id, position);

CREATE INDEX group_memberships_profile_idx
  ON group_memberships (profile_id, status, updated_at DESC);
CREATE INDEX posts_feed_idx
  ON posts (created_at DESC)
  WHERE deleted_at IS NULL AND visibility = 'public';
CREATE INDEX posts_group_feed_idx
  ON posts (group_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX posts_author_idx ON posts (author_id, created_at DESC);
CREATE INDEX comments_post_idx
  ON comments (post_id, created_at)
  WHERE deleted_at IS NULL;
CREATE INDEX comments_parent_idx ON comments (parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX endorsements_recipient_skill_idx
  ON endorsements (recipient_id, skill_id, status, created_at DESC);
CREATE INDEX recommendations_recipient_idx
  ON recommendations (recipient_id, status, created_at DESC);
CREATE INDEX reputation_events_profile_idx
  ON reputation_events (profile_id, dimension, created_at DESC);
CREATE INDEX reputation_events_evidence_idx
  ON reputation_events (evidence_type, evidence_id)
  WHERE evidence_id IS NOT NULL;
CREATE INDEX reputation_scores_leaderboard_idx
  ON reputation_scores (dimension, score DESC, event_count DESC);

CREATE INDEX notifications_unread_idx
  ON notifications (recipient_id, created_at DESC)
  WHERE read_at IS NULL;
CREATE INDEX reports_queue_idx ON reports (status, created_at);
CREATE INDEX outbox_unprocessed_idx
  ON outbox_events (occurred_at)
  WHERE processed_at IS NULL;
CREATE INDEX audit_logs_entity_idx
  ON audit_logs (entity_type, entity_id, created_at DESC);

-- Maintient updated_at sans dépendre de l’ORM.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER skills_set_updated_at
BEFORE UPDATE ON skills
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profile_skills_set_updated_at
BEFORE UPDATE ON profile_skills
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER groups_set_updated_at
BEFORE UPDATE ON community_groups
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER memberships_set_updated_at
BEFORE UPDATE ON group_memberships
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER posts_set_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER comments_set_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER endorsements_set_updated_at
BEFORE UPDATE ON endorsements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER recommendations_set_updated_at
BEFORE UPDATE ON recommendations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Le créateur est automatiquement membre propriétaire du projet.
CREATE OR REPLACE FUNCTION add_project_owner_as_member()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO project_members (project_id, profile_id, role, is_owner)
  VALUES (NEW.id, NEW.owner_id, 'Owner', true)
  ON CONFLICT (project_id, profile_id) DO UPDATE
  SET
    role = 'Owner',
    is_owner = true,
    left_at = NULL;

  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_add_owner
AFTER INSERT ON projects
FOR EACH ROW EXECUTE FUNCTION add_project_owner_as_member();

-- Empêche un commentaire enfant de pointer vers un autre post.
CREATE OR REPLACE FUNCTION validate_comment_parent()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  parent_post_id uuid;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT post_id INTO parent_post_id
  FROM comments
  WHERE id = NEW.parent_id;

  IF parent_post_id IS DISTINCT FROM NEW.post_id THEN
    RAISE EXCEPTION 'A child comment must belong to the same post as its parent';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER comments_validate_parent
BEFORE INSERT OR UPDATE OF parent_id, post_id ON comments
FOR EACH ROW EXECUTE FUNCTION validate_comment_parent();

COMMIT;
