-- Migration — journal timing du programme « plancher-pelvien ».
--
-- IDEMPOTENT et purement ADDITIVE : nouvelle table, aucune ligne existante
-- n'est modifiée ni supprimée, aucun DROP.
--   * timing_journal : une ligne par note (niveau max 1–10, signaux remarqués,
--     issue de l'intervention, note libre). Privée : lue par user_id seulement.
--
-- Compatible avec le code actuellement déployé : à lancer AVANT de déployer le
-- nouveau code. NE PAS passer par `drizzle-kit generate`.

BEGIN;

CREATE TABLE IF NOT EXISTS "timing_journal" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "date" date NOT NULL,
    "level" integer NOT NULL,
    "signals" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "outcome" text NOT NULL DEFAULT 'none',
    "note" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "timing_journal_user_date" ON "timing_journal" ("user_id", "date");

COMMIT;
