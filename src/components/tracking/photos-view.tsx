"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { POSES, poseLabel } from "@/lib/photos-meta";
import { deletePhotoAction } from "@/lib/actions";
import { formatShort } from "@/lib/date";
import type { Photo } from "@/lib/data/photos";

interface PhotosViewProps {
    today: string;
    photos: Photo[];
}

export function PhotosView({ today, photos }: PhotosViewProps) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const poseRef = useRef<string>(POSES[0].key);
    const [uploading, setUploading] = useState(false);
    const [comparePose, setComparePose] = useState(POSES[0].key);

    function pick(pose: string) {
        poseRef.current = pose;
        fileRef.current?.click();
    }

    async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        try {
            // Force le JPEG : évite les soucis de HEIC (iPhone) et garantit un
            // type accepté par la route d'upload.
            const compressed = await imageCompression(file, {
                maxSizeMB: 0.4,
                maxWidthOrHeight: 1600,
                useWebWorker: true,
                fileType: "image/jpeg",
            });
            const params = new URLSearchParams({ pose: poseRef.current, date: today });
            const res = await fetch(`/api/photos/upload?${params}`, {
                method: "POST",
                headers: { "Content-Type": "image/jpeg" },
                body: compressed,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? `Erreur ${res.status}`);
            }
            toast.success("Photo ajoutée.");
            router.refresh();
        } catch (err) {
            console.error("Upload photo:", err);
            toast.error(err instanceof Error ? err.message : "Upload impossible.");
        } finally {
            setUploading(false);
        }
    }

    async function onDelete(id: number) {
        try {
            await deletePhotoAction(id);
            toast.success("Photo supprimée.");
            router.refresh();
        } catch {
            toast.error("Suppression impossible.");
        }
    }

    const byPose = (pose: string) =>
        photos.filter((p) => p.pose === pose).sort((a, b) => a.date.localeCompare(b.date));
    const first = byPose(comparePose)[0];
    const last = byPose(comparePose).at(-1);

    // Galerie groupée par date (récent d'abord).
    const dates = [...new Set(photos.map((p) => p.date))].sort((a, b) => b.localeCompare(a));

    return (
        <div className="flex flex-col gap-4">
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFile}
                className="hidden"
            />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Ajouter une photo</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                    {POSES.map((p) => (
                        <Button
                            key={p.key}
                            variant="outline"
                            className="h-11 justify-start"
                            disabled={uploading}
                            onClick={() => pick(p.key)}
                        >
                            {uploading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Camera className="size-4" />
                            )}
                            {p.label}
                        </Button>
                    ))}
                </CardContent>
            </Card>

            {photos.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Comparaison</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-1.5">
                            {POSES.map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => setComparePose(p.key)}
                                    className={cn(
                                        "rounded-full px-3 py-1 text-sm transition-colors",
                                        comparePose === p.key
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted",
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {first ? (
                            <div className="grid grid-cols-2 gap-2">
                                <Figure label={`Jour 1 · ${formatShort(first.date)}`} url={first.blobUrl} />
                                {last && last.id !== first.id ? (
                                    <Figure
                                        label={`Dernière · ${formatShort(last.date)}`}
                                        url={last.blobUrl}
                                    />
                                ) : (
                                    <div className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed text-center text-xs">
                                        Ajoute une 2ᵉ photo pour comparer
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Aucune photo « {poseLabel(comparePose)} » pour l&apos;instant.
                            </p>
                        )}
                    </CardContent>
                </Card>
            ) : null}

            <div className="flex flex-col gap-4">
                {dates.map((date) => (
                    <div key={date}>
                        <p className="text-muted-foreground mb-2 text-sm font-medium">
                            {formatShort(date)}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {photos
                                .filter((p) => p.date === date)
                                .map((p) => (
                                    <div key={p.id} className="group relative">
                                        <Figure label={poseLabel(p.pose)} url={p.blobUrl} />
                                        <button
                                            onClick={() => onDelete(p.id)}
                                            className="bg-background/80 absolute right-1.5 top-1.5 rounded-md p-1.5 backdrop-blur"
                                            aria-label="Supprimer"
                                        >
                                            <Trash2 className="text-destructive size-4" />
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Figure({ label, url }: { label: string; url: string }) {
    return (
        <figure className="flex flex-col gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt={label}
                loading="lazy"
                className="aspect-[3/4] w-full rounded-lg object-cover"
            />
            <figcaption className="text-muted-foreground text-xs">{label}</figcaption>
        </figure>
    );
}
