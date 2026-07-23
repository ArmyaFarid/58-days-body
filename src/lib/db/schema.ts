import {
    pgTable,
    serial,
    integer,
    text,
    boolean,
    timestamp,
    date,
    real,
    jsonb,
    unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    passwordHashB64: text("password_hash_b64").notNull(),
    // Programme suivi par l'utilisateur. NULL ⇒ « programme-58 » (défaut, compte
    // historique). Renseigné au signup pour les nouveaux comptes.
    programId: text("program_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Codes d'invitation à usage unique, générés par un utilisateur pour en inviter
// un autre. Le programme est choisi par l'invité au signup (code neutre).
export const inviteCodes = pgTable("invite_codes", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "cascade" }),
    usedBy: integer("used_by").references(() => users.id, { onDelete: "set null" }),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// user_id est nullable pour permettre la migration (backfill) des données
// existantes ; l'app le renseigne et filtre dessus systématiquement.
const userRef = () => integer("user_id").references(() => users.id, { onDelete: "cascade" });

export const settings = pgTable("settings", {
    id: serial("id").primaryKey(),
    userId: userRef().unique(),
    startDate: date("start_date").notNull(),
    // Objectifs nutrition (nullable : NULL ⇒ défauts du programme).
    // proteinGoal/calorieGoal/fatGoal = phase 1 ; les *_2 = phase 2 (programmes
    // multi-phases comme « masse-femme »). fatGoal nullable : NULL ⇒ pas de suivi
    // lipides pour ce programme.
    proteinGoal: integer("protein_goal"),
    calorieGoal: integer("calorie_goal"),
    fatGoal: integer("fat_goal"),
    proteinGoal2: integer("protein_goal_2"),
    calorieGoal2: integer("calorie_goal_2"),
    fatGoal2: integer("fat_goal_2"),
    // Poids cible (kg) — programmes ouverts sans date de fin (« masse-femme »).
    targetWeightKg: real("target_weight_kg"),
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

// Aliments personnalisés ajoutés par l'utilisateur (le catalogue de base vit en
// config TS ; ceux-ci s'y ajoutent au runtime). `key` = slug stable référencé
// par food_logs (ex. « custom-<uuid> »).
export const customFoods = pgTable(
    "custom_foods",
    {
        id: serial("id").primaryKey(),
        userId: userRef(),
        key: text("key").notNull(),
        name: text("name").notNull(),
        portionLabel: text("portion_label").notNull(),
        metric: text("metric").notNull().default(""),
        protein: real("protein").notNull(),
        calories: real("calories").notNull(),
        category: text("category").notNull(),
        // Lipides (g) par portion. Nullable : NULL ⇒ non renseigné (0 au calcul).
        fat: real("fat"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => [unique("custom_foods_user_key").on(t.userId, t.key)],
);

// Repas (presets) personnalisés : une liste d'ingrédients (aliment + portions)
// que l'utilisateur applique en un clic. `items` référence des clés d'aliments
// (catalogue de base ou custom_foods).
export const customPresets = pgTable("custom_presets", {
    id: serial("id").primaryKey(),
    userId: userRef(),
    name: text("name").notNull(),
    items: jsonb("items").$type<{ foodKey: string; portions: number }[]>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
        // Macros par portion figées à la saisie (snapshot). Nullable pour les
        // lignes antérieures ; on retombe alors sur le catalogue courant.
        protein: real("protein"),
        calories: real("calories"),
        fat: real("fat"),
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
