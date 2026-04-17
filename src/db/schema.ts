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
