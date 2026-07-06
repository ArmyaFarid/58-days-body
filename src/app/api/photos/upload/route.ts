import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { addPhoto } from "@/lib/data/photos";
import { POSES } from "@/lib/photos-meta";

// Upload côté serveur : le navigateur envoie le fichier (déjà compressé) à cette
// route, qui l'écrit dans Vercel Blob avec put() (serveur-à-serveur, sans CORS)
// puis enregistre la photo en base.
export async function POST(request: Request): Promise<NextResponse> {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
            { error: "BLOB_READ_WRITE_TOKEN absent côté serveur." },
            { status: 500 },
        );
    }

    let file: File | null = null;
    let pose = "";
    let date = "";
    try {
        const form = await request.formData();
        file = form.get("file") as File | null;
        pose = String(form.get("pose") ?? "");
        date = String(form.get("date") ?? "");
    } catch {
        return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    if (!file) return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
    if (!POSES.some((p) => p.key === pose)) {
        return NextResponse.json({ error: "Pose invalide." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    }

    try {
        const blob = await put(`photos/${date}-${pose}.jpg`, file, {
            access: "public",
            contentType: "image/jpeg",
            addRandomSuffix: true,
        });
        await addPhoto(date, pose, blob.url);
        return NextResponse.json({ url: blob.url });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload impossible." },
            { status: 500 },
        );
    }
}
