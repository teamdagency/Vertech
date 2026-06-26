-- Données de développement Vertech.
-- À lancer après database/schema.sql sur une base locale vide.

BEGIN;

INSERT INTO users (email, password_hash, status, email_verified_at)
VALUES
  ('aminatabah@example.com', '$2b$12$devhashaminatabah0000000000000000000000000000000000', 'active', now()),
  ('mamadoudiallo@example.com', '$2b$12$devhashmamadoudiallo000000000000000000000000000000', 'active', now()),
  ('fatoumataconte@example.com', '$2b$12$devhashfatoumataconte00000000000000000000000000', 'active', now()),
  ('ousmanekaba@example.com', '$2b$12$devhashousmanekaba0000000000000000000000000000', 'active', now()),
  ('mariamasow@example.com', '$2b$12$devhashmariamasow000000000000000000000000000000', 'active', now()),
  ('ibrahimacamara@example.com', '$2b$12$devhashibrahimacamara0000000000000000000000000', 'active', now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (
  user_id,
  username,
  display_name,
  headline,
  bio,
  city,
  github_url,
  linkedin_url,
  portfolio_url,
  availability,
  onboarding_completed_at
)
SELECT
  u.id,
  seed.username,
  seed.display_name,
  seed.headline,
  seed.bio,
  seed.city,
  seed.github_url,
  seed.linkedin_url,
  seed.portfolio_url,
  seed.availability::profile_availability,
  now()
FROM (
  VALUES
    ('aminatabah', 'Aminata Bah', 'Développeuse frontend React / Next.js', 'Construit des interfaces web rapides pour startups locales.', 'Conakry', 'https://github.com/aminatabah', 'https://linkedin.com/in/aminatabah', 'https://aminatabah.dev', 'freelance'),
    ('mamadoudiallo', 'Mamadou Diallo', 'Backend developer Node.js / PostgreSQL', 'Travaille sur APIs, bases de données et intégrations paiement.', 'Conakry', 'https://github.com/mamadoudiallo', 'https://linkedin.com/in/mamadoudiallo', 'https://mamadou.dev', 'job'),
    ('fatoumataconte', 'Fatoumata Conté', 'Designer UI/UX produit', 'Conçoit des parcours simples pour produits web et mobile.', 'Kankan', 'https://github.com/fatoumataconte', 'https://linkedin.com/in/fatoumataconte', 'https://fatoumata.design', 'freelance'),
    ('ousmanekaba', 'Ousmane Kaba', 'Développeur mobile Flutter', 'Développe des applications mobiles pour éducation et commerce.', 'Labé', 'https://github.com/ousmanekaba', 'https://linkedin.com/in/ousmanekaba', 'https://ousmanekaba.dev', 'open'),
    ('mariamasow', 'Mariama Sow', 'Data analyst junior', 'Analyse données, dashboards et automatisations Python.', 'Conakry', 'https://github.com/mariamasow', 'https://linkedin.com/in/mariamasow', 'https://mariamasow.dev', 'open'),
    ('ibrahimacamara', 'Ibrahima Camara', 'Étudiant IA / automatisation', 'Expérimente avec Python, LLMs et outils no-code.', 'Nzérékoré', 'https://github.com/ibrahimacamara', 'https://linkedin.com/in/ibrahimacamara', 'https://ibrahimacamara.dev', 'open')
) AS seed(username, display_name, headline, bio, city, github_url, linkedin_url, portfolio_url, availability)
JOIN users u ON u.email = seed.username || '@example.com'
ON CONFLICT (username) DO NOTHING;

INSERT INTO skills (name, slug, category)
VALUES
  ('React', 'react', 'frontend'),
  ('Next.js', 'next-js', 'frontend'),
  ('Node.js', 'node-js', 'backend'),
  ('PostgreSQL', 'postgresql', 'database'),
  ('Flutter', 'flutter', 'mobile'),
  ('UI/UX Design', 'ui-ux-design', 'design'),
  ('Python', 'python', 'data'),
  ('Data Analysis', 'data-analysis', 'data'),
  ('Prompt Engineering', 'prompt-engineering', 'ai'),
  ('DevOps', 'devops', 'infrastructure')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO profile_skills (profile_id, skill_id, level, years_experience, is_primary)
SELECT p.id, s.id, seed.level, seed.years_experience, seed.is_primary
FROM (
  VALUES
    ('aminatabah', 'react', 4, 2.5, true),
    ('aminatabah', 'next-js', 4, 2.0, true),
    ('mamadoudiallo', 'node-js', 4, 3.0, true),
    ('mamadoudiallo', 'postgresql', 4, 2.5, true),
    ('fatoumataconte', 'ui-ux-design', 5, 4.0, true),
    ('ousmanekaba', 'flutter', 4, 2.0, true),
    ('mariamasow', 'python', 3, 1.5, true),
    ('mariamasow', 'data-analysis', 3, 1.5, true),
    ('ibrahimacamara', 'python', 3, 1.0, true),
    ('ibrahimacamara', 'prompt-engineering', 3, 1.0, true)
) AS seed(username, skill_slug, level, years_experience, is_primary)
JOIN profiles p ON p.username = seed.username
JOIN skills s ON s.slug = seed.skill_slug
ON CONFLICT (profile_id, skill_id) DO UPDATE
SET
  level = EXCLUDED.level,
  years_experience = EXCLUDED.years_experience,
  is_primary = EXCLUDED.is_primary;

INSERT INTO projects (
  owner_id,
  title,
  slug,
  summary,
  description,
  status,
  source_url,
  demo_url,
  help_needed,
  started_at
)
SELECT
  p.id,
  seed.title,
  seed.slug,
  seed.summary,
  seed.description,
  seed.status::project_status,
  seed.source_url,
  seed.demo_url,
  seed.help_needed,
  seed.started_at::date
FROM (
  VALUES
    ('aminatabah', 'Conakry Market UI', 'conakry-market-ui', 'Interface e-commerce pour vendeurs locaux.', 'Prototype frontend Next.js pour catalogue, panier et suivi de commandes.', 'building', 'https://github.com/aminatabah/conakry-market-ui', 'https://conakry-market-ui.example.com', 'Recherche un backend developer pour connecter paiements et livraison.', '2026-01-15'),
    ('mamadoudiallo', 'API Talents Guinée', 'api-talents-guinee', 'API de profils et matching simple pour talents tech.', 'Service Node.js/PostgreSQL exposant profils, compétences et projets.', 'building', 'https://github.com/mamadoudiallo/api-talents-guinee', 'https://api-talents-guinee.example.com', 'Besoin de tests API et documentation OpenAPI.', '2026-02-01'),
    ('fatoumataconte', 'Design System Vertech', 'design-system-vertech', 'Kit UI pour la future plateforme Vertech.', 'Composants, tokens et règles UX pour profils, projets et feed.', 'idea', 'https://github.com/fatoumataconte/design-system-vertech', 'https://vertech-design.example.com', 'Recherche développeur frontend pour implémentation React.', '2026-03-05'),
    ('ousmanekaba', 'EduMobile GN', 'edumobile-gn', 'Application Flutter de ressources éducatives hors ligne.', 'MVP mobile pour consulter fiches, vidéos compressées et quiz.', 'launched', 'https://github.com/ousmanekaba/edumobile-gn', 'https://edumobile-gn.example.com', NULL, '2025-11-10'),
    ('mariamasow', 'Dashboard Startup Metrics', 'dashboard-startup-metrics', 'Dashboard data pour suivre acquisition et rétention.', 'Pipeline Python simple et visualisation des métriques produit.', 'building', 'https://github.com/mariamasow/dashboard-startup-metrics', 'https://startup-metrics.example.com', 'Besoin de données anonymisées pour benchmark.', '2026-04-12')
) AS seed(username, title, slug, summary, description, status, source_url, demo_url, help_needed, started_at)
JOIN profiles p ON p.username = seed.username
ON CONFLICT (slug) DO NOTHING;

INSERT INTO project_skills (project_id, skill_id)
SELECT pr.id, s.id
FROM (
  VALUES
    ('conakry-market-ui', 'react'),
    ('conakry-market-ui', 'next-js'),
    ('api-talents-guinee', 'node-js'),
    ('api-talents-guinee', 'postgresql'),
    ('design-system-vertech', 'ui-ux-design'),
    ('edumobile-gn', 'flutter'),
    ('dashboard-startup-metrics', 'python'),
    ('dashboard-startup-metrics', 'data-analysis')
) AS seed(project_slug, skill_slug)
JOIN projects pr ON pr.slug = seed.project_slug
JOIN skills s ON s.slug = seed.skill_slug
ON CONFLICT (project_id, skill_id) DO NOTHING;

INSERT INTO community_groups (owner_id, name, slug, description)
SELECT p.id, seed.name, seed.slug, seed.description
FROM (
  VALUES
    ('mamadoudiallo', 'Développement Web', 'developpement-web', 'React, Next.js, APIs, bases de données et bonnes pratiques web.'),
    ('fatoumataconte', 'Design Produit', 'design-produit', 'UI, UX, recherche utilisateur et design systems.'),
    ('mariamasow', 'Data & IA', 'data-ia', 'Python, data analysis, IA appliquée et automatisation.')
) AS seed(username, name, slug, description)
JOIN profiles p ON p.username = seed.username
ON CONFLICT (slug) DO NOTHING;

INSERT INTO group_memberships (group_id, profile_id, role, status, joined_at)
SELECT g.id, p.id, seed.role::membership_role, 'active'::membership_status, now()
FROM (
  VALUES
    ('developpement-web', 'mamadoudiallo', 'owner'),
    ('developpement-web', 'aminatabah', 'member'),
    ('design-produit', 'fatoumataconte', 'owner'),
    ('design-produit', 'aminatabah', 'member'),
    ('data-ia', 'mariamasow', 'owner'),
    ('data-ia', 'ibrahimacamara', 'member')
) AS seed(group_slug, username, role)
JOIN community_groups g ON g.slug = seed.group_slug
JOIN profiles p ON p.username = seed.username
ON CONFLICT (group_id, profile_id) DO UPDATE
SET
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  joined_at = COALESCE(group_memberships.joined_at, EXCLUDED.joined_at);

INSERT INTO posts (author_id, group_id, project_id, kind, body)
SELECT p.id, g.id, pr.id, seed.kind::post_kind, seed.body
FROM (
  VALUES
    ('aminatabah', 'developpement-web', 'conakry-market-ui', 'project', 'Je cherche un retour sur la structure du panier et le flow de checkout.'),
    ('mamadoudiallo', 'developpement-web', 'api-talents-guinee', 'resource', 'J’ai documenté une base API pour profils, compétences et projets. Feedback bienvenu.'),
    ('fatoumataconte', 'design-produit', 'design-system-vertech', 'question', 'Quels composants faut-il absolument stabiliser avant le premier MVP ?'),
    ('mariamasow', 'data-ia', 'dashboard-startup-metrics', 'update', 'Je teste un dashboard simple pour suivre acquisition, activation et rétention.')
) AS seed(username, group_slug, project_slug, kind, body)
JOIN profiles p ON p.username = seed.username
LEFT JOIN community_groups g ON g.slug = seed.group_slug
LEFT JOIN projects pr ON pr.slug = seed.project_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM posts existing
  WHERE existing.author_id = p.id
    AND existing.body = seed.body
);

INSERT INTO endorsements (endorser_id, recipient_id, skill_id, project_id, strength, comment)
SELECT endorser.id, recipient.id, s.id, pr.id, seed.strength, seed.comment
FROM (
  VALUES
    ('mamadoudiallo', 'aminatabah', 'react', 'conakry-market-ui', 2, 'Interface claire et composants bien découpés.'),
    ('aminatabah', 'mamadoudiallo', 'postgresql', 'api-talents-guinee', 2, 'Bonne modélisation et contraintes SQL propres.'),
    ('aminatabah', 'fatoumataconte', 'ui-ux-design', 'design-system-vertech', 3, 'Très bonne cohérence UX et composants réutilisables.'),
    ('mariamasow', 'ibrahimacamara', 'prompt-engineering', NULL, 1, 'Bonne curiosité et progrès rapides sur les workflows IA.')
) AS seed(endorser_username, recipient_username, skill_slug, project_slug, strength, comment)
JOIN profiles endorser ON endorser.username = seed.endorser_username
JOIN profiles recipient ON recipient.username = seed.recipient_username
JOIN skills s ON s.slug = seed.skill_slug
LEFT JOIN projects pr ON pr.slug = seed.project_slug
ON CONFLICT (endorser_id, recipient_id, skill_id) DO UPDATE
SET
  project_id = EXCLUDED.project_id,
  strength = EXCLUDED.strength,
  comment = EXCLUDED.comment,
  status = 'published';

INSERT INTO reputation_scores (profile_id, dimension, score, event_count)
SELECT p.id, seed.dimension::reputation_dimension, seed.score, seed.event_count
FROM (
  VALUES
    ('aminatabah', 'technical', 72.00, 4),
    ('aminatabah', 'collaboration', 66.00, 3),
    ('mamadoudiallo', 'technical', 76.00, 5),
    ('mamadoudiallo', 'reliability', 70.00, 3),
    ('fatoumataconte', 'technical', 74.00, 4),
    ('fatoumataconte', 'collaboration', 71.00, 4),
    ('ousmanekaba', 'technical', 68.00, 3),
    ('mariamasow', 'technical', 63.00, 3),
    ('ibrahimacamara', 'community', 58.00, 2)
) AS seed(username, dimension, score, event_count)
JOIN profiles p ON p.username = seed.username
ON CONFLICT (profile_id, dimension) DO UPDATE
SET
  score = EXCLUDED.score,
  event_count = EXCLUDED.event_count,
  calculated_at = now();

COMMIT;
