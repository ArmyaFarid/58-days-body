import { NextResponse } from "next/server";
import { signup, createSession } from "@/lib/auth";

export async function POST(request: Request) {
    let username = "";
    let password = "";
    let inviteCode = "";
    let programId = "";
    try {
        const body = await request.json();
        username = String(body.username ?? "").trim();
        password = String(body.password ?? "");
        inviteCode = String(body.inviteCode ?? "");
        programId = String(body.programId ?? "");
    } catch {
        return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const result = await signup(username, password, inviteCode, programId);
    if (result.error || !result.user) {
        return NextResponse.json({ error: result.error ?? "Inscription impossible." }, { status: 400 });
    }

    await createSession(result.user);
    return NextResponse.json({ ok: true });
}
