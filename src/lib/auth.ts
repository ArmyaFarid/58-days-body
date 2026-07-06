import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getStoredPasswordHashB64 } from "@/lib/data/credentials";

const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function secret() {
    const s = process.env.AUTH_SECRET;
    if (!s) throw new Error("AUTH_SECRET manquant.");
    return new TextEncoder().encode(s);
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
    if (!username || !password) return false;
    if (username !== process.env.AUTH_USERNAME) return false;

    // Un mot de passe changé depuis l'app (stocké en base) prime sur l'env.
    const dbHash = await getStoredPasswordHashB64();
    const hashB64 = dbHash ?? process.env.AUTH_PASSWORD_HASH_B64;
    if (hashB64) {
        const hash = Buffer.from(hashB64, "base64").toString("utf8");
        return bcrypt.compare(password, hash);
    }

    const plain = process.env.AUTH_PASSWORD;
    return Boolean(plain) && password === plain;
}

export async function createSession(): Promise<void> {
    const token = await new SignJWT({ sub: process.env.AUTH_USERNAME })
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

export async function getSession(): Promise<{ sub: string } | null> {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secret());
        return { sub: String(payload.sub) };
    } catch {
        return null;
    }
}
