-- Migration — ressenti de fin de séance (Facile / Juste bien / Dur).
--
-- IDEMPOTENT et purement ADDITIVE : aucune ligne existante n'est modifiée ni
-- supprimée, aucun DROP.
--   * workout_sessions.feeling : "facile" | "juste" | "dur". NULL = pas noté,
--     donc les séances existantes restent exactement comme avant.
--
-- Compatible avec le code actuellement déployé : à lancer AVANT de déployer le
-- nouveau code. NE PAS passer par `drizzle-kit generate`.

BEGIN;

ALTER TABLE "workout_sessions" ADD COLUMN IF NOT EXISTS "feeling" text;

COMMIT;
