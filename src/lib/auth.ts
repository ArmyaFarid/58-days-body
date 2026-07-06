import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
    getUserByUsername,
    getUserById,
    createUser,
    updateUserPassword,
} from "@/lib/data/users";
import { backfillOrphanData } from "@/lib/data/migrate";

const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secret() {
    const s = process.env.AUTH_SECRET;
    if (!s) throw new Error("AUTH_SECRET manquant.");
    return new TextEncoder().encode(s);
}

export function hashPasswordB64(password: string): string {
    return Buffer.from(bcrypt.hashSync(password, 10), "utf8").toString("base64");
}

export async function verifyPasswordB64(password: string, hashB64: string): Promise<boolean> {
    const hash = Buffer.from(hashB64, "base64").toString("utf8");
    return bcrypt.compare(password, hash);
}

/** Vérifie le mot de passe contre les identifiants d'environnement (bootstrap). */
async function matchesEnvCredentials(username: string, password: string): Promise<boolean> {
    if (username !== process.env.AUTH_USERNAME) return false;
    const hashB64 = process.env.AUTH_PASSWORD_HASH_B64;
    if (hashB64) return verifyPasswordB64(password, hashB64);
    const plain = process.env.AUTH_PASSWORD;
    return Boolean(plain) && password === plain;
}

export interface SessionUser {
    userId: number;
    username: string;
}

/**
 * Authentifie un utilisateur. Si le compte n'existe pas encore mais que les
 * identifiants correspondent à l'environnement, on le crée (migration douce).
 */
export async function authenticate(
    username: string,
    password: string,
): Promise<SessionUser | null> {
    if (!username || !password) return null;

    const user = await getUserByUsername(username);
    if (user) {
        const ok = await verifyPasswordB64(password, user.passwordHashB64);
        return ok ? { userId: user.id, username: user.username } : null;
    }

    // Bootstrap : premier login avec les identifiants d'env -> création du compte,
    // et rattachement des données mono-utilisateur existantes à ce compte.
    if (await matchesEnvCredentials(username, password)) {
        const created = await createUser(username, hashPasswordB64(password));
        await backfillOrphanData(created.id);
        return { userId: created.id, username: created.username };
    }

    return null;
}

export async function signup(
    username: string,
    password: string,
    inviteCode: string,
): Promise<{ user?: SessionUser; error?: string }> {
    const expected = process.env.SIGNUP_INVITE_CODE;
    if (!expected) return { error: "Inscription désactivée." };
    if (inviteCode !== expected) return { error: "Code d'invitation invalide." };
    if (username.length < 3) return { error: "Identifiant trop court (min 3)." };
    if (password.length < 4) return { error: "Mot de passe trop court (min 4)." };
    const existing = await getUserByUsername(username);
    if (existing) return { error: "Identifiant déjà pris." };

    const created = await createUser(username, hashPasswordB64(password));
    return { user: { userId: created.id, username: created.username } };
}

export async function changePassword(
    userId: number,
    current: string,
    next: string,
): Promise<{ error?: string }> {
    const user = await getUserById(userId);
    if (!user) return { error: "Utilisateur introuvable." };
    const ok = await verifyPasswordB64(current, user.passwordHashB64);
    if (!ok) return { error: "Mot de passe actuel incorrect." };
    if (next.length < 4) return { error: "Nouveau mot de passe trop court (min 4)." };
    await updateUserPassword(userId, hashPasswordB64(next));
    return {};
}

export async function createSession(user: SessionUser): Promise<void> {
    const token = await new SignJWT({ sub: user.username, uid: user.userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secret());

    const store = await cookies();
    store.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE,
    });
}

export async function destroySession(): Promise<void> {
    const store = await cookies();
    store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secret());
        if (typeof payload.uid !== "number") return null;
        return { userId: payload.uid, username: String(payload.sub) };
    } catch {
        return null;
    }
}

/** Renvoie l'userId courant ou lève (pour les Server Actions). */
export async function requireUserId(): Promise<number> {
    const session = await getSession();
    if (!session) throw new Error("Non authentifié.");
    return session.userId;
}
