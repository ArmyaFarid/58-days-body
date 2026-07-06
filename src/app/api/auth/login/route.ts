import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";

export async function POST(request: Request) {
    let username = "";
    let password = "";
    try {
        const body = await request.json();
        username = String(body.username ?? "");
        password = String(body.password ?? "");
    } catch {
        return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const user = await authenticate(username, password);
    if (!user) {
        return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    await createSession(user);
    return NextResponse.json({ ok: true });
}
