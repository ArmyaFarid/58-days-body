import { NextResponse } from "next/server";
import { verifyCredentials, createSession } from "@/lib/auth";

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

    const ok = await verifyCredentials(username, password);
    if (!ok) {
        return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    await createSession();
    return NextResponse.json({ ok: true });
}
