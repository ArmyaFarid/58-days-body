import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { addPhoto } from "@/lib/data/photos";
import { getBlobToken } from "@/lib/blob-token";
import { POSES } from "@/lib/photos-meta";

export const runtime = "nodejs";

// Upload côté serveur, corps brut (pas de multipart) : le navigateur envoie
// l'image compressée en corps de requête, pose/date en paramètres d'URL. La
// route écrit dans Vercel Blob avec put() (serveur-à-serveur, sans CORS) puis
// enregistre la photo en base.
export async function POST(request: Request): Promise<NextResponse> {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const token = getBlobToken();
    if (!token) {
        return NextResponse.json(
            { error: "Token Blob introuvable (aucune variable *BLOB_READ_WRITE_TOKEN)." },
            { status: 500 },
        );
    }

    const { searchParams } = new URL(request.url);
    const pose = searchParams.get("pose") ?? "";
    const date = searchParams.get("date") ?? "";

    if (!POSES.some((p) => p.key === pose)) {
        return NextResponse.json({ error: "Pose invalide." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: "Date invalide." }, { status: 400 });
    }

    let bytes: ArrayBuffer;
    try {
        bytes = await request.arrayBuffer();
    } catch {
        return NextResponse.json({ error: "Corps de requête illisible." }, { status: 400 });
    }
    if (!bytes || bytes.byteLength === 0) {
        return NextResponse.json({ error: "Fichier vide." }, { status: 400 });
    }

    try {
        const blob = await put(`photos/${date}-${pose}.jpg`, Buffer.from(bytes), {
            access: "private",
            contentType: "image/jpeg",
            addRandomSuffix: true,
            token,
        });
        await addPhoto(session.userId, date, pose, blob.url);
        return NextResponse.json({ url: blob.url });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload impossible." },
            { status: 500 },
        );
    }
}
