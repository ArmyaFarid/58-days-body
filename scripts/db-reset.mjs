import { config } from "dotenv";
import postgres from "postgres";

// Charge .env.local SANS écraser un DATABASE_URL déjà défini inline
// (permet `DATABASE_URL="<prod>" npm run db:reset`).
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL manquant.");
    process.exit(1);
}

const host = (() => {
    try {
        return new URL(url).host;
    } catch {
        return "?";
    }
})();

const needsSsl = url.includes("neon.tech") || url.includes("sslmode=require");
const sql = postgres(url, {
    prepare: false,
    ssl: needsSsl ? "require" : undefined,
    max: 1,
    onnotice: () => {}, // masque les notices "drop cascades to…"
});

try {
    console.log(`⚠️  Réinitialisation de la base : ${host}`);
    await sql.unsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("Schéma vidé et recréé. Recréation des tables…");
} catch (e) {
    console.error("Erreur:", e.message);
    process.exit(1);
} finally {
    await sql.end();
}
