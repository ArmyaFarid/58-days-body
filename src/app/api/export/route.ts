import { NextResponse } from "next/server";
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

    const [s, w, ws, sl, h, p, m] = await Promise.all([
        db.select().from(settings),
        db.select().from(weightLogs),
        db.select().from(workoutSessions),
        db.select().from(setLogs),
        db.select().from(habitLogs),
        db.select().from(photos),
        db.select().from(measurements),
    ]);

    const data = {
        app: "programme-58-jours",
        exportedAt: new Date().toISOString(),
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
