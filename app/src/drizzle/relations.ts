import { relations } from "drizzle-orm/relations";
import { users, profiles, profileSkills, skills, projects, projectMembers, projectSkills, projectMedia, communityGroups, groupMemberships, posts, comments, postReactions, commentReactions, endorsements, recommendations, reputationEvents, reputationScores, notifications, reports, auditLogs } from "./schema";

export const profilesRelations = relations(profiles, ({one, many}) => ({
	user: one(users, {
		fields: [profiles.userId],
		references: [users.id]
	}),
	profileSkills: many(profileSkills),
	projects: many(projects),
	projectMembers: many(projectMembers),
	communityGroups: many(communityGroups),
	groupMemberships: many(groupMemberships),
	posts: many(posts),
	comments: many(comments),
	postReactions: many(postReactions),
	commentReactions: many(commentReactions),
	endorsements_endorserId: many(endorsements, {
		relationName: "endorsements_endorserId_profiles_id"
	}),
	endorsements_recipientId: many(endorsements, {
		relationName: "endorsements_recipientId_profiles_id"
	}),
	recommendations_authorId: many(recommendations, {
		relationName: "recommendations_authorId_profiles_id"
	}),
	recommendations_recipientId: many(recommendations, {
		relationName: "recommendations_recipientId_profiles_id"
	}),
	reputationEvents_profileId: many(reputationEvents, {
		relationName: "reputationEvents_profileId_profiles_id"
	}),
	reputationEvents_sourceProfileId: many(reputationEvents, {
		relationName: "reputationEvents_sourceProfileId_profiles_id"
	}),
	reputationScores: many(reputationScores),
	notifications_recipientId: many(notifications, {
		relationName: "notifications_recipientId_profiles_id"
	}),
	notifications_actorId: many(notifications, {
		relationName: "notifications_actorId_profiles_id"
	}),
	reports_reporterId: many(reports, {
		relationName: "reports_reporterId_profiles_id"
	}),
	reports_moderatorId: many(reports, {
		relationName: "reports_moderatorId_profiles_id"
	}),
	auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({many}) => ({
	profiles: many(profiles),
}));

export const profileSkillsRelations = relations(profileSkills, ({one}) => ({
	profile: one(profiles, {
		fields: [profileSkills.profileId],
		references: [profiles.id]
	}),
	skill: one(skills, {
		fields: [profileSkills.skillId],
		references: [skills.id]
	}),
}));

export const skillsRelations = relations(skills, ({many}) => ({
	profileSkills: many(profileSkills),
	projectSkills: many(projectSkills),
	endorsements: many(endorsements),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	profile: one(profiles, {
		fields: [projects.ownerId],
		references: [profiles.id]
	}),
	projectMembers: many(projectMembers),
	projectSkills: many(projectSkills),
	projectMedias: many(projectMedia),
	posts: many(posts),
	endorsements: many(endorsements),
}));

export const projectMembersRelations = relations(projectMembers, ({one}) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id]
	}),
	profile: one(profiles, {
		fields: [projectMembers.profileId],
		references: [profiles.id]
	}),
}));

export const projectSkillsRelations = relations(projectSkills, ({one}) => ({
	project: one(projects, {
		fields: [projectSkills.projectId],
		references: [projects.id]
	}),
	skill: one(skills, {
		fields: [projectSkills.skillId],
		references: [skills.id]
	}),
}));

export const projectMediaRelations = relations(projectMedia, ({one}) => ({
	project: one(projects, {
		fields: [projectMedia.projectId],
		references: [projects.id]
	}),
}));

export const communityGroupsRelations = relations(communityGroups, ({one, many}) => ({
	profile: one(profiles, {
		fields: [communityGroups.ownerId],
		references: [profiles.id]
	}),
	groupMemberships: many(groupMemberships),
	posts: many(posts),
}));

export const groupMembershipsRelations = relations(groupMemberships, ({one}) => ({
	communityGroup: one(communityGroups, {
		fields: [groupMemberships.groupId],
		references: [communityGroups.id]
	}),
	profile: one(profiles, {
		fields: [groupMemberships.profileId],
		references: [profiles.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	profile: one(profiles, {
		fields: [posts.authorId],
		references: [profiles.id]
	}),
	communityGroup: one(communityGroups, {
		fields: [posts.groupId],
		references: [communityGroups.id]
	}),
	project: one(projects, {
		fields: [posts.projectId],
		references: [projects.id]
	}),
	comments: many(comments),
	postReactions: many(postReactions),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	profile: one(profiles, {
		fields: [comments.authorId],
		references: [profiles.id]
	}),
	comment: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "comments_parentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentId_comments_id"
	}),
	commentReactions: many(commentReactions),
}));

export const postReactionsRelations = relations(postReactions, ({one}) => ({
	profile: one(profiles, {
		fields: [postReactions.profileId],
		references: [profiles.id]
	}),
	post: one(posts, {
		fields: [postReactions.postId],
		references: [posts.id]
	}),
}));

export const commentReactionsRelations = relations(commentReactions, ({one}) => ({
	comment: one(comments, {
		fields: [commentReactions.commentId],
		references: [comments.id]
	}),
	profile: one(profiles, {
		fields: [commentReactions.profileId],
		references: [profiles.id]
	}),
}));

export const endorsementsRelations = relations(endorsements, ({one}) => ({
	profile_endorserId: one(profiles, {
		fields: [endorsements.endorserId],
		references: [profiles.id],
		relationName: "endorsements_endorserId_profiles_id"
	}),
	profile_recipientId: one(profiles, {
		fields: [endorsements.recipientId],
		references: [profiles.id],
		relationName: "endorsements_recipientId_profiles_id"
	}),
	skill: one(skills, {
		fields: [endorsements.skillId],
		references: [skills.id]
	}),
	project: one(projects, {
		fields: [endorsements.projectId],
		references: [projects.id]
	}),
}));

export const recommendationsRelations = relations(recommendations, ({one}) => ({
	profile_authorId: one(profiles, {
		fields: [recommendations.authorId],
		references: [profiles.id],
		relationName: "recommendations_authorId_profiles_id"
	}),
	profile_recipientId: one(profiles, {
		fields: [recommendations.recipientId],
		references: [profiles.id],
		relationName: "recommendations_recipientId_profiles_id"
	}),
}));

export const reputationEventsRelations = relations(reputationEvents, ({one}) => ({
	profile_profileId: one(profiles, {
		fields: [reputationEvents.profileId],
		references: [profiles.id],
		relationName: "reputationEvents_profileId_profiles_id"
	}),
	profile_sourceProfileId: one(profiles, {
		fields: [reputationEvents.sourceProfileId],
		references: [profiles.id],
		relationName: "reputationEvents_sourceProfileId_profiles_id"
	}),
}));

export const reputationScoresRelations = relations(reputationScores, ({one}) => ({
	profile: one(profiles, {
		fields: [reputationScores.profileId],
		references: [profiles.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	profile_recipientId: one(profiles, {
		fields: [notifications.recipientId],
		references: [profiles.id],
		relationName: "notifications_recipientId_profiles_id"
	}),
	profile_actorId: one(profiles, {
		fields: [notifications.actorId],
		references: [profiles.id],
		relationName: "notifications_actorId_profiles_id"
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	profile_reporterId: one(profiles, {
		fields: [reports.reporterId],
		references: [profiles.id],
		relationName: "reports_reporterId_profiles_id"
	}),
	profile_moderatorId: one(profiles, {
		fields: [reports.moderatorId],
		references: [profiles.id],
		relationName: "reports_moderatorId_profiles_id"
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	profile: one(profiles, {
		fields: [auditLogs.actorId],
		references: [profiles.id]
	}),
}));