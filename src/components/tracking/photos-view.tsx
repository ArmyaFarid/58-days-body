"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { differenceInCalendarDays } from "date-fns";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { POSES, poseLabel } from "@/lib/photos-meta";
import { deletePhotoAction } from "@/lib/actions";
import { formatShort, fromISO } from "@/lib/date";
import type { Photo } from "@/lib/data/photos";

interface PhotosViewProps {
    today: string;
    startDate: string | null;
    photos: Photo[];
}

// Libellé court d'une photo : jour du programme (« J23 ») ou date.
function dayTag(startDate: string | null, date: string, today: string): string {
    const when = date === today ? "auj." : formatShort(date);
    if (!startDate) return when;
    const day = differenceInCalendarDays(fromISO(date), fromISO(startDate)) + 1;
    return day >= 1 ? `J${day} · ${when}` : when;
}

export function PhotosView({ today, startDate, photos }: PhotosViewProps) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const poseRef = useRef<string>(POSES[0].key);
    const [uploading, setUploading] = useState<string | null>(null);
    const [comparePose, setComparePose] = useState(POSES[0].key);

    function pick(pose: string) {
        poseRef.current = pose;
        fileRef.current?.click();
    }

    async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(poseRef.current);
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
            setUploading(null);
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

    const byPose = photos.filter((p) => p.pose === comparePose).sort((a, b) => a.date.localeCompare(b.date));
    const first = byPose[0];
    const last = byPose.at(-1);
    const todayPoses = new Set(photos.filter((p) => p.date === today).map((p) => p.pose));
    const dates = [...new Set(photos.map((p) => p.date))].sort((a, b) => b.localeCompare(a));

    return (
        <div className="flex flex-col gap-4 pb-4">
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

            <section className="bg-card flex flex-col gap-3 rounded-3xl p-3">
                <div className="grid grid-cols-2 gap-2">
                    <ComparePanel
                        photo={first ?? null}
                        tag={first ? dayTag(startDate, first.date, today) : null}
                        empty="Pas encore de photo"
                    />
                    <ComparePanel
                        photo={last && last.id !== first?.id ? last : null}
                        tag={last && last.id !== first?.id ? dayTag(startDate, last.date, today) : null}
                        empty="Ajoute une 2ᵉ photo pour comparer"
                        latest
                    />
                </div>
                <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {POSES.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => setComparePose(p.key)}
                            aria-pressed={comparePose === p.key}
                            className={cn(
                                "h-9 shrink-0 rounded-full px-3 text-xs font-semibold whitespace-nowrap",
                                comparePose === p.key ? "bg-foreground text-background" : "border",
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="bg-card flex flex-col gap-3 rounded-[1.25rem] p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-[0.9375rem] font-semibold">Photos du jour</h2>
                    <span className="text-muted-foreground text-[0.8125rem] tabular-nums">
                        {todayPoses.size} / {POSES.length}
                    </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {POSES.map((p) => {
                        const done = todayPoses.has(p.key);
                        return (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => pick(p.key)}
                                disabled={uploading != null}
                                aria-label={`${done ? "Remplacer" : "Prendre"} la photo ${p.label}`}
                                className={cn(
                                    "flex h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-[0.875rem] p-1 text-center text-[0.625rem] leading-tight font-semibold",
                                    done
                                        ? "bg-brand text-brand-foreground"
                                        : "text-muted-foreground border-[1.5px] border-dashed border-muted-foreground/40",
                                )}
                            >
                                {uploading === p.key ? (
                                    <Loader2 className="size-5 animate-spin" />
                                ) : done ? (
                                    <Check className="size-5" strokeWidth={3} />
                                ) : (
                                    <Plus className="size-5" strokeWidth={2.4} />
                                )}
                                {p.label}
                            </button>
                        );
                    })}
                </div>
                <span className="text-muted-foreground text-xs">
                    Même lumière, même heure : la comparaison sera juste.
                </span>
            </section>

            {dates.length > 0 ? (
                <section className="flex flex-col gap-3">
                    <h2 className="text-[0.9375rem] font-semibold">Historique</h2>
                    {dates.map((date) => (
                        <div key={date} className="flex flex-col gap-2">
                            <span className="text-muted-foreground text-[0.8125rem]">
                                {dayTag(startDate, date, today)}
                            </span>
                            <div className="grid grid-cols-4 gap-2">
                                {photos
                                    .filter((p) => p.date === date)
                                    .map((p) => (
                                        <div key={p.id} className="relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`/api/photos/${p.id}`}
                                                alt={poseLabel(p.pose)}
                                                loading="lazy"
                                                className="aspect-[3/4] w-full rounded-xl object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => onDelete(p.id)}
                                                className="bg-background/80 absolute top-1 right-1 rounded-lg p-1.5 backdrop-blur"
                                                aria-label={`Supprimer la photo ${poseLabel(p.pose)}`}
                                            >
                                                <Trash2 className="text-destructive size-3.5" />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </section>
            ) : null}
        </div>
    );
}

function ComparePanel({
    photo,
    tag,
    empty,
    latest = false,
}: {
    photo: Photo | null;
    tag: string | null;
    empty: string;
    latest?: boolean;
}) {
    return (
        <div className="bg-muted relative flex h-[14.75rem] items-center justify-center overflow-hidden rounded-2xl">
            {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/photos/${photo.id}`} alt={tag ?? ""} className="size-full object-cover" />
            ) : (
                <span className="text-muted-foreground px-3 text-center text-xs">{empty}</span>
            )}
            {tag ? (
                <span
                    className={cn(
                        "absolute top-2.5 left-2.5 rounded-lg px-2 py-1 text-xs font-bold",
                        latest ? "bg-brand text-brand-foreground" : "bg-background/80",
                    )}
                >
                    {tag}
                </span>
            ) : null}
        </div>
    );
}
