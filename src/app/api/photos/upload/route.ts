import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";

// Génère un token d'upload client sécurisé (auth requise). L'écriture en base
// est faite côté client après upload via addPhotoAction (fonctionne aussi en local).
export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => {
                const session = await getSession();
                if (!session) throw new Error("Non authentifié.");
                return {
                    allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
                    maximumSizeInBytes: 4 * 1024 * 1024,
                };
            },
            onUploadCompleted: async () => {
                // No-op : l'enregistrement en base est déclenché côté client.
            },
        });
        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload impossible." },
            { status: 400 },
        );
    }
}
