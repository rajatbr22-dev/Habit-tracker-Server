import { pgTable, text, timestamp, boolean, integer, uuid, primaryKey, pgEnum, time, date } from "drizzle-orm/pg-core";

export const habitStatusEnum = pgEnum('habit_status', ['active', 'archived', 'deleted']);
export const frequencyEnum = pgEnum('frequency', ['daily', 'weekly', 'custom']);
export const categoryEnum = pgEnum('category', ['health', 'productivity', 'fitness', 'mindfulness', 'financial', 'social', 'other']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['none', 'active', 'expired', 'past_due', 'trialing']);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash").notNull(),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("none").notNull(),
  premiumUntil: timestamp("premium_until"),
  adaptyId: text("adapty_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  adaptyProfileId: text("adapty_profile_id"),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(), // Store full JSON payload as string
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color").notNull(),
  category: categoryEnum("category").notNull(), 
  frequency: frequencyEnum("frequency").notNull(), 
  targetCount: integer("target_count").default(1).notNull(),
  customDays: text("custom_days").array(), // Array of days like ['Mon', 'Wed']
  goalLabel: text("goal_label"),
  goalValue: integer("goal_value"),
  goalUnit: text("goal_unit"),
  status: habitStatusEnum("status").default("active").notNull(),
  reminderTime: time("reminder_time"),

  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastCompletedAt: date("last_completed_at"),


  notes: text("notes"),
  meta: text("meta"),


  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),

  habitId: uuid("habit_id").references(() => habits.id).notNull(),

  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),

  date: date("date").notNull(),
  
  completed: boolean("completed").default(true).notNull(),
  value: integer("value"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});