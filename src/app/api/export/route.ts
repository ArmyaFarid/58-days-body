import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    settings,
    weightLogs,
    workoutSessions,
    setLogs,
    habitLogs,
    photos,
    measurements,
} from "@/lib/db/schema";

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    const userId = session.userId;

    const [s, w, ws, h, p, m] = await Promise.all([
        db.select().from(settings).where(eq(settings.userId, userId)),
        db.select().from(weightLogs).where(eq(weightLogs.userId, userId)),
        db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId)),
        db.select().from(habitLogs).where(eq(habitLogs.userId, userId)),
        db.select().from(photos).where(eq(photos.userId, userId)),
        db.select().from(measurements).where(eq(measurements.userId, userId)),
    ]);

    const sessionIds = ws.map((r) => r.id);
    const sl = sessionIds.length
        ? await db.select().from(setLogs).where(inArray(setLogs.sessionId, sessionIds))
        : [];

    const data = {
        app: "programme-58-jours",
        exportedAt: new Date().toISOString(),
        user: session.username,
        settings: s,
        weightLogs: w,
        workoutSessions: ws,
        setLogs: sl,
        habitLogs: h,
        photos: p,
        measurements: m,
    };

    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="programme-58-export-${stamp}.json"`,
        },
    });
}
