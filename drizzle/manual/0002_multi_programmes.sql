-- Migration — programmes multiples et simultanés, programme « fessiers-posture ».
--
-- IDEMPOTENT. Aucune ligne existante n'est modifiée ni supprimée :
--   * colonnes ajoutées NULLABLE (ou avec défaut) ⇒ lignes existantes intactes ;
--   * nouvelle table `user_programs`, remplie par l'app au premier accès à partir
--     de `settings` (qui n'est jamais modifiée) ;
--   * seule opération non additive : la contrainte unique (user_id, date) de
--     `workout_sessions` est REMPLACÉE par (user_id, program_id, date) pour
--     permettre deux séances le même jour sous deux programmes. Aucune donnée
--     n'est touchée : la nouvelle contrainte est posée AVANT de retirer
--     l'ancienne, et elle est plus permissive (les lignes existantes, toutes à
--     program_id NULL, restent uniques par jour grâce à NULLS NOT DISTINCT).
--
-- Requiert PostgreSQL ≥ 15 (NULLS NOT DISTINCT).
-- Compatible avec le code actuellement déployé : il peut tourner AVANT le
-- déploiement du nouveau code. NE PAS passer par `drizzle-kit generate`.

BEGIN;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active_program_id" text;

ALTER TABLE "workout_sessions" ADD COLUMN IF NOT EXISTS "program_id" text;

ALTER TABLE "measurements" ADD COLUMN IF NOT EXISTS "hips" real;

CREATE TABLE IF NOT EXISTS "user_programs" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "program_id" text NOT NULL,
    "start_date" date NOT NULL,
    "status" text DEFAULT 'active' NOT NULL,
    "hold_phase1" boolean DEFAULT false NOT NULL,
    "creatine" boolean DEFAULT false NOT NULL,
    "protein_goal" integer,
    "calorie_goal" integer,
    "fat_goal" integer,
    "protein_goal_2" integer,
    "calorie_goal_2" integer,
    "fat_goal_2" integer,
    "target_weight_kg" real,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "user_programs_user_program" UNIQUE ("user_id", "program_id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workout_sessions_user_program_date'
    ) THEN
        ALTER TABLE "workout_sessions"
            ADD CONSTRAINT "workout_sessions_user_program_date"
            UNIQUE NULLS NOT DISTINCT ("user_id", "program_id", "date");
    END IF;
END $$;

ALTER TABLE "workout_sessions" DROP CONSTRAINT IF EXISTS "workout_sessions_user_date";

COMMIT;
