import {
    pgTable,
    serial,
    integer,
    text,
    boolean,
    timestamp,
    date,
    real,
    unique,
} from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
    id: serial("id").primaryKey(),
    startDate: date("start_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weightLogs = pgTable("weight_logs", {
    id: serial("id").primaryKey(),
    date: date("date").notNull().unique(),
    weightKg: real("weight_kg").notNull(),
});

export const workoutSessions = pgTable("workout_sessions", {
    id: serial("id").primaryKey(),
    date: date("date").notNull().unique(),
    dayType: text("day_type").notNull(),
    phase: text("phase").notNull(),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
});

export const setLogs = pgTable(
    "set_logs",
    {
        id: serial("id").primaryKey(),
        sessionId: integer("session_id")
            .notNull()
            .references(() => workoutSessions.id, { onDelete: "cascade" }),
        exerciseKey: text("exercise_key").notNull(),
        setIndex: integer("set_index").notNull(),
        reps: integer("reps"),
        band: text("band"),
        variant: text("variant"),
        notes: text("notes"),
    },
    (t) => [unique("set_logs_session_exercise_set").on(t.sessionId, t.exerciseKey, t.setIndex)],
);

export const habitLogs = pgTable("habit_logs", {
    id: serial("id").primaryKey(),
    date: date("date").notNull().unique(),
    creatine: boolean("creatine").default(false).notNull(),
    kcal3000: boolean("kcal3000").default(false).notNull(),
    protein140: boolean("protein140").default(false).notNull(),
    sleepBefore23: boolean("sleep_before_23").default(false).notNull(),
});

export const photos = pgTable("photos", {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    pose: text("pose").notNull(),
    blobUrl: text("blob_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const measurements = pgTable("measurements", {
    id: serial("id").primaryKey(),
    date: date("date").notNull().unique(),
    shoulders: real("shoulders"),
    chest: real("chest"),
    arm: real("arm"),
    waist: real("waist"),
    thigh: real("thigh"),
});
