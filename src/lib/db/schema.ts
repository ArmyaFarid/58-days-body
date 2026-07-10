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

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    passwordHashB64: text("password_hash_b64").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// user_id est nullable pour permettre la migration (backfill) des données
// existantes ; l'app le renseigne et filtre dessus systématiquement.
const userRef = () => integer("user_id").references(() => users.id, { onDelete: "cascade" });

export const settings = pgTable("settings", {
    id: serial("id").primaryKey(),
    userId: userRef().unique(),
    startDate: date("start_date").notNull(),
    // Objectifs nutrition (nullable : NULL ⇒ défauts applicatifs 140 g / 3000 kcal).
    proteinGoal: integer("protein_goal"),
    calorieGoal: integer("calorie_goal"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weightLogs = pgTable(
    "weight_logs",
    {
        id: serial("id").primaryKey(),
        userId: userRef(),
        date: date("date").notNull(),
        weightKg: real("weight_kg").notNull(),
    },
    (t) => [unique("weight_logs_user_date").on(t.userId, t.date)],
);

export const workoutSessions = pgTable(
    "workout_sessions",
    {
        id: serial("id").primaryKey(),
        userId: userRef(),
        date: date("date").notNull(),
        dayType: text("day_type").notNull(),
        phase: text("phase").notNull(),
        completed: boolean("completed").default(false).notNull(),
        completedAt: timestamp("completed_at"),
    },
    (t) => [unique("workout_sessions_user_date").on(t.userId, t.date)],
);

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

export const habitLogs = pgTable(
    "habit_logs",
    {
        id: serial("id").primaryKey(),
        userId: userRef(),
        date: date("date").notNull(),
        creatine: boolean("creatine").default(false).notNull(),
        kcal3000: boolean("kcal3000").default(false).notNull(),
        protein140: boolean("protein140").default(false).notNull(),
        sleepBefore23: boolean("sleep_before_23").default(false).notNull(),
    },
    (t) => [unique("habit_logs_user_date").on(t.userId, t.date)],
);

// Portions d'aliments consommées, indexées par jour. Reset « à minuit » implicite
// (nouvelle date = nouvelles lignes) ; l'historique quotidien reste conservé.
export const foodLogs = pgTable(
    "food_logs",
    {
        id: serial("id").primaryKey(),
        userId: userRef(),
        date: date("date").notNull(),
        foodKey: text("food_key").notNull(),
        portions: integer("portions").notNull().default(0),
    },
    (t) => [unique("food_logs_user_date_food").on(t.userId, t.date, t.foodKey)],
);

export const photos = pgTable("photos", {
    id: serial("id").primaryKey(),
    userId: userRef(),
    date: date("date").notNull(),
    pose: text("pose").notNull(),
    blobUrl: text("blob_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const measurements = pgTable(
    "measurements",
    {
        id: serial("id").primaryKey(),
        userId: userRef(),
        date: date("date").notNull(),
        shoulders: real("shoulders"),
        chest: real("chest"),
        arm: real("arm"),
        waist: real("waist"),
        thigh: real("thigh"),
    },
    (t) => [unique("measurements_user_date").on(t.userId, t.date)],
);
