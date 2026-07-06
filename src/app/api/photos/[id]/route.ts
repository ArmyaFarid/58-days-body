import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth";
import { getPhotoById } from "@/lib/data/photos";
import { getBlobToken } from "@/lib/blob-token";

export const runtime = "nodejs";

// Sert une photo privée : accessible uniquement authentifié. Récupère le blob
// côté serveur (avec le token) et relaie son flux au navigateur.
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const { id } = await params;
    const photoId = Number(id);
    if (!Number.isInteger(photoId) || photoId <= 0) {
        return NextResponse.json({ error: "Id invalide." }, { status: 400 });
    }

    const photo = await getPhotoById(session.userId, photoId);
    if (!photo) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

    const token = getBlobToken();
    if (!token) return NextResponse.json({ error: "Token Blob introuvable." }, { status: 500 });

    const result = await get(photo.blobUrl, { access: "private", token });
    if (!result) return NextResponse.json({ error: "Image introuvable." }, { status: 404 });

    return new Response(result.stream, {
        headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "private, max-age=3600",
        },
    });
}
