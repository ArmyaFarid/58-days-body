// Applique drizzle/manual/0004_ressenti.sql et vérifie que les données
// existantes sont intactes : nombre de lignes + md5 des colonnes d'origine de
// chaque table, avant/après. Usage :
//   TARGET_DATABASE_URL=… node scripts/migrate-ressenti.mjs
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.TARGET_DATABASE_URL;
if (!url) throw new Error("TARGET_DATABASE_URL manquant.");
const sql = postgres(url, { max: 1, onnotice: () => {} });

const NEW_COLUMNS = new Set(["workout_sessions.feeling"]);

async function fingerprint() {
    const out = {};
    const tables = await sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`;
    for (const { table_name: t } of tables) {
        const cols = (
            await sql`SELECT column_name FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = ${t} ORDER BY ordinal_position`
        )
            .map((c) => c.column_name)
            .filter((c) => !NEW_COLUMNS.has(`${t}.${c}`));
        const list = cols.map((c) => `"${c}"`).join(", ");
        const [r] = await sql.unsafe(
            `SELECT count(*)::int AS n, coalesce(md5(string_agg(row(${list})::text, '|' ORDER BY id)), '-') AS h FROM "${t}"`,
        );
        out[t] = `${r.n} ${r.h}`;
    }
    return out;
}

const before = await fingerprint();
await sql.unsafe(readFileSync(new URL("../drizzle/manual/0004_ressenti.sql", import.meta.url), "utf8"));
const after = await fingerprint();

let ok = true;
for (const t of Object.keys(before)) {
    const same = before[t] === after[t];
    ok &&= same;
    console.log(`${same ? "OK " : "KO "} ${t.padEnd(18)} ${before[t]}${same ? "" : `  →  ${after[t]}`}`);
}
const cols = await sql`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (table_name, column_name) IN (('workout_sessions','feeling'))`;
console.log(`Colonnes ajoutées : ${cols.length}/1`);
console.log(ok && cols.length === 1 ? "Migration OK — données existantes intactes." : "ÉCART DÉTECTÉ — ne pas déployer.");
await sql.end();
