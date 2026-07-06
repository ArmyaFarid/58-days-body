import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Init paresseuse : on ne crée la connexion (et on ne lit DATABASE_URL) qu'à la
// première requête. Ça évite de faire planter le build (ex. premier déploiement
// Vercel avant que les variables d'env soient posées).
const globalForDb = globalThis as unknown as {
    client?: ReturnType<typeof postgres>;
    drizzle?: PostgresJsDatabase<typeof schema>;
};

function getDb(): PostgresJsDatabase<typeof schema> {
    if (globalForDb.drizzle) return globalForDb.drizzle;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error(
            "DATABASE_URL manquant. Configure Vercel Postgres puis `vercel env pull .env.local`.",
        );
    }

    const client = globalForDb.client ?? postgres(connectionString, { prepare: false });
    globalForDb.client = client;
    globalForDb.drizzle = drizzle(client, { schema });
    return globalForDb.drizzle;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
    get(_target, prop) {
        const instance = getDb();
        const value = instance[prop as keyof typeof instance];
        return typeof value === "function" ? value.bind(instance) : value;
    },
});

export { schema };
