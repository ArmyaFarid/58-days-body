-- Migration additive — 2e programme (« masse-femme »), multi-utilisateur par code
-- d'invitation, et suivi des lipides.
--
-- 100 % NON DESTRUCTIF et IDEMPOTENT : uniquement ADD COLUMN IF NOT EXISTS et
-- CREATE TABLE IF NOT EXISTS. Aucune colonne/table existante n'est modifiée ou
-- supprimée. Les colonnes ajoutées sont NULLABLE ⇒ les lignes existantes restent
-- intactes (le compte historique = programme 58 par défaut quand program_id IS NULL).
--
-- À appliquer AVANT de déployer le code (sinon le nouveau code interroge des
-- colonnes absentes). NE PAS passer par `drizzle-kit generate` (meta périmée).

-- users : programme suivi (NULL ⇒ programme-58)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "program_id" text;

-- settings : objectifs phase 2, lipides, poids cible
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "fat_goal" integer;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "protein_goal_2" integer;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "calorie_goal_2" integer;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "fat_goal_2" integer;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "target_weight_kg" real;

-- nutrition : lipides par portion (snapshot + aliments perso)
ALTER TABLE "custom_foods" ADD COLUMN IF NOT EXISTS "fat" real;
ALTER TABLE "food_logs" ADD COLUMN IF NOT EXISTS "fat" real;

-- codes d'invitation à usage unique
CREATE TABLE IF NOT EXISTS "invite_codes" (
    "id" serial PRIMARY KEY,
    "code" text NOT NULL UNIQUE,
    "created_by" integer REFERENCES "users"("id") ON DELETE CASCADE,
    "used_by" integer REFERENCES "users"("id") ON DELETE SET NULL,
    "used_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);
