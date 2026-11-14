-- Migration — mode « Internat » (entraînement sans mobilier utilisable).
--
-- IDEMPOTENT et purement ADDITIVE : aucune ligne existante n'est modifiée ni
-- supprimée, aucun DROP.
--   * users.internat_mode / users.internat_has_bed : réglage global, une fois
--     pour toutes (défauts = mode désactivé, lit disponible) ;
--   * workout_sessions.internat : état figé de la séance (mode actif, lit,
--     exercices revenus à l'original, substitutions faites). NULL = rien de
--     décidé : les séances existantes s'affichent donc exactement comme avant.
--
-- Compatible avec le code actuellement déployé : à lancer AVANT de déployer le
-- nouveau code. NE PAS passer par `drizzle-kit generate`.

BEGIN;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "internat_mode" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "internat_has_bed" boolean DEFAULT true NOT NULL;

ALTER TABLE "workout_sessions" ADD COLUMN IF NOT EXISTS "internat" jsonb;

COMMIT;
