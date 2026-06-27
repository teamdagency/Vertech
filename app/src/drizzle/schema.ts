import { pgTable, check, uuid, text, timestamp, index, foreignKey, varchar, char, smallint, numeric, boolean, date, uniqueIndex, jsonb, integer, pgEnum, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// citext et tsvector n'ont pas de mapping natif dans Drizzle : on les
// déclare comme types custom pour rester fidèle au schéma PostgreSQL
// (database/schema.sql) sans changer le comportement en base.
const citext = customType<{ data: string }>({ dataType: () => 'citext' });
const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

export const accountRole = pgEnum("account_role", ['member', 'moderator', 'admin'])
export const accountStatus = pgEnum("account_status", ['pending', 'active', 'suspended', 'deleted'])
export const contentVisibility = pgEnum("content_visibility", ['public', 'members', 'private'])
export const groupVisibility = pgEnum("group_visibility", ['public', 'private'])
export const mediaKind = pgEnum("media_kind", ['image', 'video'])
export const membershipRole = pgEnum("membership_role", ['member', 'moderator', 'owner'])
export const membershipStatus = pgEnum("membership_status", ['pending', 'active', 'rejected', 'banned'])
export const postKind = pgEnum("post_kind", ['update', 'question', 'resource', 'project'])
export const profileAvailability = pgEnum("profile_availability", ['unavailable', 'open', 'freelance', 'job'])
export const projectStatus = pgEnum("project_status", ['idea', 'building', 'launched', 'paused', 'archived'])
export const reactionKind = pgEnum("reaction_kind", ['like', 'useful', 'celebrate'])
export const reportReason = pgEnum("report_reason", ['spam', 'abuse', 'harassment', 'fraud', 'impersonation', 'copyright', 'other'])
export const reportStatus = pgEnum("report_status", ['open', 'reviewing', 'resolved', 'rejected'])
export const reportTarget = pgEnum("report_target", ['profile', 'project', 'post', 'comment'])
export const reputationDimension = pgEnum("reputation_dimension", ['technical', 'reliability', 'collaboration', 'leadership', 'community'])
export const reviewStatus = pgEnum("review_status", ['pending', 'published', 'rejected', 'withdrawn'])


export const users = pgTable("users", {
	id: uuid().defaultRandom().notNull(),
	email: citext("email").notNull(),
	passwordHash: text("password_hash"),
	role: accountRole().default('member').notNull(),
	status: accountStatus().default('pending').notNull(),
	emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, mode: 'string' }),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	check("users_email_not_blank", sql`length(TRIM(BOTH FROM (email)::text)) > 3`),
	check("users_local_auth_has_password", sql`(password_hash IS NULL) OR (length(password_hash) >= 20)`),
]);

export const profiles = pgTable("profiles", {
	id: uuid().defaultRandom().notNull(),
	userId: uuid("user_id").notNull(),
	username: citext("username").notNull(),
	displayName: varchar("display_name", { length: 120 }).notNull(),
	headline: varchar({ length: 180 }),
	bio: text(),
	countryCode: char("country_code", { length: 2 }).default('GN').notNull(),
	city: varchar({ length: 120 }),
	avatarUrl: text("avatar_url"),
	githubUrl: text("github_url"),
	linkedinUrl: text("linkedin_url"),
	portfolioUrl: text("portfolio_url"),
	availability: profileAvailability().default('unavailable').notNull(),
	visibility: contentVisibility().default('public').notNull(),
	onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	searchVector: tsvector("search_vector").generatedAlwaysAs(sql`(((setweight(to_tsvector('simple'::regconfig, (COALESCE(display_name, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('simple'::regconfig, (COALESCE(headline, ''::character varying))::text), 'B'::"char")) || setweight(to_tsvector('simple'::regconfig, COALESCE(bio, ''::text)), 'C'::"char")) || setweight(to_tsvector('simple'::regconfig, (COALESCE(city, ''::character varying))::text), 'C'::"char"))`),
}, (table) => [
	index("profiles_created_at_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("profiles_discovery_idx").using("btree", table.countryCode.asc().nullsLast().op("bpchar_ops"), table.city.asc().nullsLast().op("enum_ops"), table.availability.asc().nullsLast().op("enum_ops")).where(sql`((deleted_at IS NULL) AND (visibility = 'public'::content_visibility))`),
	index("profiles_search_idx").using("gin", table.searchVector.asc().nullsLast().op("tsvector_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "profiles_user_id_fkey"
		}).onDelete("restrict"),
	check("profiles_username_format", sql`(username)::text ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$'::text`),
	check("profiles_display_name_not_blank", sql`length(TRIM(BOTH FROM display_name)) > 0`),
	check("profiles_country_code_uppercase", sql`country_code ~ '^[A-Z]{2}$'::text`),
]);

export const profileSkills = pgTable("profile_skills", {
	profileId: uuid("profile_id").notNull(),
	skillId: uuid("skill_id").notNull(),
	level: smallint().notNull(),
	yearsExperience: numeric("years_experience", { precision: 4, scale:  1 }),
	isPrimary: boolean("is_primary").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("profile_skills_primary_idx").using("btree", table.profileId.asc().nullsLast().op("uuid_ops")).where(sql`(is_primary = true)`),
	index("profile_skills_skill_level_idx").using("btree", table.skillId.asc().nullsLast().op("uuid_ops"), table.level.desc().nullsFirst().op("int2_ops"), table.profileId.asc().nullsLast().op("int2_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "profile_skills_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "profile_skills_skill_id_fkey"
		}).onDelete("restrict"),
	check("profile_skills_level_range", sql`(level >= 1) AND (level <= 5)`),
	check("profile_skills_experience_positive", sql`(years_experience IS NULL) OR ((years_experience >= (0)::numeric) AND (years_experience <= (80)::numeric))`),
]);

export const skills = pgTable("skills", {
	id: uuid().defaultRandom().notNull(),
	name: citext("name").notNull(),
	slug: citext("slug").notNull(),
	category: varchar({ length: 80 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	check("skills_name_not_blank", sql`length(TRIM(BOTH FROM (name)::text)) > 0`),
	check("skills_slug_format", sql`(slug)::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text`),
]);

export const projects = pgTable("projects", {
	id: uuid().defaultRandom().notNull(),
	ownerId: uuid("owner_id").notNull(),
	title: varchar({ length: 160 }).notNull(),
	slug: citext("slug").notNull(),
	summary: varchar({ length: 300 }).notNull(),
	description: text().notNull(),
	status: projectStatus().default('idea').notNull(),
	visibility: contentVisibility().default('public').notNull(),
	sourceUrl: text("source_url"),
	demoUrl: text("demo_url"),
	helpNeeded: text("help_needed"),
	startedAt: date("started_at"),
	completedAt: date("completed_at"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	searchVector: tsvector("search_vector").generatedAlwaysAs(sql`((setweight(to_tsvector('simple'::regconfig, (COALESCE(title, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('simple'::regconfig, (COALESCE(summary, ''::character varying))::text), 'B'::"char")) || setweight(to_tsvector('simple'::regconfig, COALESCE(description, ''::text)), 'C'::"char"))`),
}, (table) => [
	index("projects_owner_created_idx").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("projects_search_idx").using("gin", table.searchVector.asc().nullsLast().op("tsvector_ops")),
	index("projects_status_created_idx").using("btree", table.status.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`((deleted_at IS NULL) AND (visibility = 'public'::content_visibility))`),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [profiles.id],
			name: "projects_owner_id_fkey"
		}).onDelete("restrict"),
	check("projects_title_not_blank", sql`length(TRIM(BOTH FROM title)) > 0`),
	check("projects_description_not_blank", sql`length(TRIM(BOTH FROM description)) > 0`),
	check("projects_slug_format", sql`(slug)::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text`),
	check("projects_dates_ordered", sql`(completed_at IS NULL) OR (started_at IS NULL) OR (completed_at >= started_at)`),
]);

export const projectMembers = pgTable("project_members", {
	projectId: uuid("project_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	role: varchar({ length: 120 }).notNull(),
	contribution: text(),
	isOwner: boolean("is_owner").default(false).notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	leftAt: timestamp("left_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	uniqueIndex("project_members_one_owner_idx").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")).where(sql`(is_owner = true)`),
	index("project_members_profile_idx").using("btree", table.profileId.asc().nullsLast().op("timestamptz_ops"), table.joinedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_members_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "project_members_profile_id_fkey"
		}).onDelete("restrict"),
	check("project_members_role_not_blank", sql`length(TRIM(BOTH FROM role)) > 0`),
	check("project_members_dates_ordered", sql`(left_at IS NULL) OR (left_at >= joined_at)`),
]);

export const projectSkills = pgTable("project_skills", {
	projectId: uuid("project_id").notNull(),
	skillId: uuid("skill_id").notNull(),
}, (table) => [
	index("project_skills_skill_idx").using("btree", table.skillId.asc().nullsLast().op("uuid_ops"), table.projectId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_skills_project_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "project_skills_skill_id_fkey"
		}).onDelete("restrict"),
]);

export const projectMedia = pgTable("project_media", {
	id: uuid().defaultRandom().notNull(),
	projectId: uuid("project_id").notNull(),
	kind: mediaKind().notNull(),
	url: text().notNull(),
	altText: varchar("alt_text", { length: 300 }),
	position: smallint().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("project_media_order_idx").using("btree", table.projectId.asc().nullsLast().op("int2_ops"), table.position.asc().nullsLast().op("int2_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_media_project_id_fkey"
		}).onDelete("cascade"),
	check("project_media_url_not_blank", sql`length(TRIM(BOTH FROM url)) > 0`),
	check("project_media_position_positive", sql`"position" >= 0`),
]);

export const communityGroups = pgTable("community_groups", {
	id: uuid().defaultRandom().notNull(),
	ownerId: uuid("owner_id").notNull(),
	name: varchar({ length: 120 }).notNull(),
	slug: citext("slug").notNull(),
	description: text().notNull(),
	visibility: groupVisibility().default('public').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [profiles.id],
			name: "community_groups_owner_id_fkey"
		}).onDelete("restrict"),
	check("groups_name_not_blank", sql`length(TRIM(BOTH FROM name)) > 0`),
	check("groups_slug_format", sql`(slug)::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text`),
]);

export const groupMemberships = pgTable("group_memberships", {
	groupId: uuid("group_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	role: membershipRole().default('member').notNull(),
	status: membershipStatus().default('pending').notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("group_memberships_profile_idx").using("btree", table.profileId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("timestamptz_ops"), table.updatedAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [communityGroups.id],
			name: "group_memberships_group_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "group_memberships_profile_id_fkey"
		}).onDelete("restrict"),
	check("active_membership_has_join_date", sql`(status <> 'active'::membership_status) OR (joined_at IS NOT NULL)`),
]);

export const posts = pgTable("posts", {
	id: uuid().defaultRandom().notNull(),
	authorId: uuid("author_id").notNull(),
	groupId: uuid("group_id"),
	projectId: uuid("project_id"),
	kind: postKind().default('update').notNull(),
	body: text().notNull(),
	visibility: contentVisibility().default('public').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("posts_author_idx").using("btree", table.authorId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("posts_feed_idx").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`((deleted_at IS NULL) AND (visibility = 'public'::content_visibility))`),
	index("posts_group_feed_idx").using("btree", table.groupId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "posts_author_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [communityGroups.id],
			name: "posts_group_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "posts_project_id_fkey"
		}).onDelete("set null"),
	check("posts_body_not_blank", sql`length(TRIM(BOTH FROM body)) > 0`),
]);

export const comments = pgTable("comments", {
	id: uuid().defaultRandom().notNull(),
	postId: uuid("post_id").notNull(),
	authorId: uuid("author_id").notNull(),
	parentId: uuid("parent_id"),
	body: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("comments_parent_idx").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")).where(sql`(parent_id IS NOT NULL)`),
	index("comments_post_idx").using("btree", table.postId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "comments_author_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "comments_parent_id_fkey"
		}).onDelete("cascade"),
	check("comments_body_not_blank", sql`length(TRIM(BOTH FROM body)) > 0`),
]);

export const postReactions = pgTable("post_reactions", {
	postId: uuid("post_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	kind: reactionKind().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "post_reactions_profile_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_reactions_post_id_fkey"
		}).onDelete("cascade"),
]);

export const commentReactions = pgTable("comment_reactions", {
	commentId: uuid("comment_id").notNull(),
	profileId: uuid("profile_id").notNull(),
	kind: reactionKind().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "comment_reactions_comment_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "comment_reactions_profile_id_fkey"
		}).onDelete("cascade"),
]);

export const endorsements = pgTable("endorsements", {
	id: uuid().defaultRandom().notNull(),
	endorserId: uuid("endorser_id").notNull(),
	recipientId: uuid("recipient_id").notNull(),
	skillId: uuid("skill_id").notNull(),
	projectId: uuid("project_id"),
	strength: smallint().default(1).notNull(),
	comment: text(),
	status: reviewStatus().default('published').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("endorsements_recipient_skill_idx").using("btree", table.recipientId.asc().nullsLast().op("uuid_ops"), table.skillId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.endorserId],
			foreignColumns: [profiles.id],
			name: "endorsements_endorser_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [profiles.id],
			name: "endorsements_recipient_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "endorsements_skill_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "endorsements_project_id_fkey"
		}).onDelete("set null"),
	check("endorsements_distinct_profiles", sql`endorser_id <> recipient_id`),
	check("endorsements_strength_range", sql`(strength >= 1) AND (strength <= 3)`),
]);

export const recommendations = pgTable("recommendations", {
	id: uuid().defaultRandom().notNull(),
	authorId: uuid("author_id").notNull(),
	recipientId: uuid("recipient_id").notNull(),
	relationship: varchar({ length: 120 }).notNull(),
	body: text().notNull(),
	status: reviewStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("recommendations_recipient_idx").using("btree", table.recipientId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [profiles.id],
			name: "recommendations_author_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [profiles.id],
			name: "recommendations_recipient_id_fkey"
		}).onDelete("restrict"),
	check("recommendations_distinct_profiles", sql`author_id <> recipient_id`),
	check("recommendations_body_not_blank", sql`length(TRIM(BOTH FROM body)) > 0`),
]);

export const reputationEvents = pgTable("reputation_events", {
	id: uuid().defaultRandom().notNull(),
	profileId: uuid("profile_id").notNull(),
	eventType: varchar("event_type", { length: 80 }).notNull(),
	dimension: reputationDimension().notNull(),
	points: numeric({ precision: 7, scale:  2 }).notNull(),
	evidenceType: varchar("evidence_type", { length: 80 }).notNull(),
	evidenceId: uuid("evidence_id"),
	sourceProfileId: uuid("source_profile_id"),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("reputation_events_evidence_idx").using("btree", table.evidenceType.asc().nullsLast().op("text_ops"), table.evidenceId.asc().nullsLast().op("uuid_ops")).where(sql`(evidence_id IS NOT NULL)`),
	index("reputation_events_profile_idx").using("btree", table.profileId.asc().nullsLast().op("timestamptz_ops"), table.dimension.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "reputation_events_profile_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.sourceProfileId],
			foreignColumns: [profiles.id],
			name: "reputation_events_source_profile_id_fkey"
		}).onDelete("set null"),
	check("reputation_event_type_not_blank", sql`length(TRIM(BOTH FROM event_type)) > 0`),
	check("reputation_evidence_type_not_blank", sql`length(TRIM(BOTH FROM evidence_type)) > 0`),
	check("reputation_points_reasonable", sql`(points >= ('-100'::integer)::numeric) AND (points <= (100)::numeric)`),
	check("reputation_metadata_object", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const reputationScores = pgTable("reputation_scores", {
	profileId: uuid("profile_id").notNull(),
	dimension: reputationDimension().notNull(),
	score: numeric({ precision: 5, scale:  2 }).default('0').notNull(),
	eventCount: integer("event_count").default(0).notNull(),
	calculatedAt: timestamp("calculated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("reputation_scores_leaderboard_idx").using("btree", table.dimension.asc().nullsLast().op("numeric_ops"), table.score.desc().nullsFirst().op("enum_ops"), table.eventCount.desc().nullsFirst().op("enum_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "reputation_scores_profile_id_fkey"
		}).onDelete("cascade"),
	check("reputation_score_range", sql`(score >= (0)::numeric) AND (score <= (100)::numeric)`),
	check("reputation_event_count_positive", sql`event_count >= 0`),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().notNull(),
	recipientId: uuid("recipient_id").notNull(),
	actorId: uuid("actor_id"),
	type: varchar({ length: 80 }).notNull(),
	entityType: varchar("entity_type", { length: 80 }),
	entityId: uuid("entity_id"),
	payload: jsonb().default({}).notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_unread_idx").using("btree", table.recipientId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`(read_at IS NULL)`),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [profiles.id],
			name: "notifications_recipient_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [profiles.id],
			name: "notifications_actor_id_fkey"
		}).onDelete("set null"),
	check("notifications_type_not_blank", sql`length(TRIM(BOTH FROM type)) > 0`),
	check("notifications_payload_object", sql`jsonb_typeof(payload) = 'object'::text`),
]);

export const reports = pgTable("reports", {
	id: uuid().defaultRandom().notNull(),
	reporterId: uuid("reporter_id").notNull(),
	targetType: reportTarget("target_type").notNull(),
	targetId: uuid("target_id").notNull(),
	reason: reportReason().notNull(),
	details: text(),
	status: reportStatus().default('open').notNull(),
	moderatorId: uuid("moderator_id"),
	resolutionNote: text("resolution_note"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("reports_queue_idx").using("btree", table.status.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [profiles.id],
			name: "reports_reporter_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.moderatorId],
			foreignColumns: [profiles.id],
			name: "reports_moderator_id_fkey"
		}).onDelete("set null"),
	check("resolved_report_has_date", sql`(status <> ALL (ARRAY['resolved'::report_status, 'rejected'::report_status])) OR (resolved_at IS NOT NULL)`),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().notNull(),
	actorId: uuid("actor_id"),
	action: varchar({ length: 120 }).notNull(),
	entityType: varchar("entity_type", { length: 80 }).notNull(),
	entityId: uuid("entity_id"),
	beforeState: jsonb("before_state"),
	afterState: jsonb("after_state"),
	requestId: varchar("request_id", { length: 120 }),
	ipHash: varchar("ip_hash", { length: 128 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("audit_logs_entity_idx").using("btree", table.entityType.asc().nullsLast().op("uuid_ops"), table.entityId.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [profiles.id],
			name: "audit_logs_actor_id_fkey"
		}).onDelete("set null"),
]);

export const outboxEvents = pgTable("outbox_events", {
	id: uuid().defaultRandom().notNull(),
	aggregateType: varchar("aggregate_type", { length: 80 }).notNull(),
	aggregateId: uuid("aggregate_id").notNull(),
	eventType: varchar("event_type", { length: 120 }).notNull(),
	payload: jsonb().notNull(),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
	attemptCount: integer("attempt_count").default(0).notNull(),
	lastError: text("last_error"),
}, (table) => [
	index("outbox_unprocessed_idx").using("btree", table.occurredAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(processed_at IS NULL)`),
	check("outbox_payload_object", sql`jsonb_typeof(payload) = 'object'::text`),
	check("outbox_attempt_count_positive", sql`attempt_count >= 0`),
]);
