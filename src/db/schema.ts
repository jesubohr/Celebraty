import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const friends = sqliteTable("friends", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  birthMonth: integer("birth_month").notNull(),
  birthDay: integer("birth_day").notNull(),
  birthYear: integer("birth_year"),
  createdAt: integer("created_at").notNull(),
})

export type Friend = typeof friends.$inferSelect
export type NewFriend = typeof friends.$inferInsert

export const loginTokens = sqliteTable("login_tokens", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: integer("expires_at").notNull(),
  consumedAt: integer("consumed_at"),
  createdAt: integer("created_at").notNull(),
})

export type LoginToken = typeof loginTokens.$inferSelect
export type NewLoginToken = typeof loginTokens.$inferInsert

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  email: text("email").notNull(),
  friendId: text("friend_id").references(() => friends.id),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
})

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
