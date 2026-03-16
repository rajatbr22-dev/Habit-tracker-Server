import { pgTable, text, timestamp, boolean, integer, uuid, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color").notNull(),
  category: text("category").notNull(), // e.g., 'health', 'productivity'
  frequency: text("frequency").notNull(), // 'daily', 'weekly', 'custom'
  targetCount: integer("target_count").default(1).notNull(),
  customDays: text("custom_days").array(), // Array of days like ['Mon', 'Wed']
  goalLabel: text("goal_label"),
  goalValue: integer("goal_value"),
  goalUnit: text("goal_unit"),
  status: text("status").default("active").notNull(),
  reminderTime: text("reminder_time"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  habitId: uuid("habit_id").references(() => habits.id).notNull(),
  date: text("date").notNull(), // ISO Date String YYYY-MM-DD
  completed: boolean("completed").default(true).notNull(),
  value: integer("value"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});