"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExerciseSvg, hasExerciseSvg } from "@/components/exercise-svg";

export interface LibraryEntry {
    key: string;
    name: string;
    text: string;
    youtubeUrl: string;
}

const SHOWN = 6;

/** Bibliothèque des exercices : pictogramme + fiche (texte, vidéo). */
export function ExerciseLibrary({ entries }: { entries: LibraryEntry[] }) {
    const [all, setAll] = useState(false);
    return (
        <section className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between">
                <h2 className="text-[0.9375rem] font-semibold">Exercices</h2>
                <span className="text-muted-foreground text-[0.8125rem]">{entries.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                {(all ? entries : entries.slice(0, SHOWN)).map((e) => (
                    <ExerciseCard key={e.key} entry={e} />
                ))}
            </div>
            {entries.length > SHOWN ? (
                <button
                    type="button"
                    onClick={() => setAll((v) => !v)}
                    className="bg-card h-11 rounded-[0.875rem] text-sm font-semibold"
                >
                    {all ? "Réduire" : `Voir les ${entries.length} exercices`}
                </button>
            ) : null}
        </section>
    );
}

function ExerciseCard({ entry }: { entry: LibraryEntry }) {
    const [open, setOpen] = useState(false);
    const picture = hasExerciseSvg(entry.key);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <button type="button" className="bg-card flex flex-col gap-2 rounded-[1.125rem] p-3 text-left">
                        <span className="bg-muted flex h-20 items-center justify-center overflow-hidden rounded-xl px-1">
                            {picture ? (
                                <ExerciseSvg lexiconKey={entry.key} />
                            ) : (
                                <span className="text-muted-foreground text-xs">Pas d’illustration</span>
                            )}
                        </span>
                        <span className="line-clamp-2 text-[0.8125rem] leading-tight font-semibold">{entry.name}</span>
                    </button>
                }
            />
            <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto overscroll-contain">
                <DialogHeader>
                    <DialogTitle className="pr-8">{entry.name}</DialogTitle>
                </DialogHeader>
                {picture ? (
                    <div className="bg-muted rounded-xl p-2">
                        <ExerciseSvg lexiconKey={entry.key} />
                    </div>
                ) : null}
                <p className="text-sm leading-relaxed">{entry.text}</p>
                <a
                    href={entry.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-muted flex h-11 items-center justify-center gap-2 rounded-[0.875rem] text-sm font-semibold"
                >
                    <PlayCircle className="size-4" />
                    Voir sur YouTube
                </a>
            </DialogContent>
        </Dialog>
    );
}
