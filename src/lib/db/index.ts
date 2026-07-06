import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL manquant. Configure Vercel Postgres puis `vercel env pull .env.local`.");
}

// Réutilise la connexion entre invocations serverless pour éviter d'épuiser le pool.
const globalForDb = globalThis as unknown as {
    client?: ReturnType<typeof postgres>;
};

const client = globalForDb.client ?? postgres(connectionString, { prepare: false });
globalForDb.client = client;

export const db = drizzle(client, { schema });
export { schema };
