"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { BedSingle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { setInternatModeAction, setSessionInternatAction } from "@/lib/actions";
import type { InternatInfo } from "./types";

interface InternatBarProps {
    /** null : aperçu d'un jour à venir (seul le réglage global s'applique). */
    sessionId: number | null;
    internat: InternatInfo;
}

export function InternatBar({ sessionId, internat }: InternatBarProps) {
    const [choosing, setChoosing] = useState(false);
    const [pending, startTransition] = useTransition();

    function run(action: () => Promise<{ error?: string }>, success?: string) {
        startTransition(async () => {
            try {
                const res = await action();
                if (res.error) {
                    toast.error(res.error);
                    return;
                }
                setChoosing(false);
                if (success) toast.success(success);
            } catch {
                toast.error("Échec de la mise à jour.");
            }
        });
    }

    const forSession = (patch: { on?: boolean; hasBed?: boolean }) =>
        run(() => setSessionInternatAction({ sessionId: sessionId!, ...patch }));
    const forGood = (mode: boolean, success: string) =>
        run(() => setInternatModeAction({ mode, sessionId: sessionId ?? undefined }), success);

    if (!internat.available) return null;

    if (!internat.on) {
        return choosing ? (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                    <BedSingle className="size-4" />
                    Activer le mode Internat
                </p>
                <div className="flex flex-wrap gap-2">
                    {sessionId !== null ? (
                        <Button size="sm" variant="outline" disabled={pending} onClick={() => forSession({ on: true })}>
                            Pour cette séance
                        </Button>
                    ) : null}
                    <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => forGood(true, "Mode Internat activé jusqu'à nouvel ordre.")}
                    >
                        Jusqu&apos;à ce que je le désactive
                    </Button>
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => setChoosing(false)}>
                        Annuler
                    </Button>
                    {pending ? <Loader2 className="size-4 animate-spin self-center" /> : null}
                </div>
            </div>
        ) : (
            <Button variant="outline" size="sm" className="self-start" onClick={() => setChoosing(true)}>
                <BedSingle className="size-4" />
                Mode Internat
            </Button>
        );
    }

    return (
        <div className="bg-primary/10 flex flex-col gap-2 rounded-lg p-3 text-sm">
            <p className="text-primary flex items-center gap-1.5 font-medium">
                <BedSingle className="size-4" />
                Mode Internat {internat.global ? "actif" : "— cette séance"}
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            </p>
            <p className="text-muted-foreground text-xs">{internat.anchorNote}</p>
            <div className="flex items-center gap-2">
                <Checkbox
                    id="internat-bed"
                    checked={internat.hasBed}
                    disabled={pending}
                    onCheckedChange={(checked) =>
                        sessionId !== null
                            ? forSession({ hasBed: checked })
                            : run(() => setInternatModeAction({ hasBed: checked }))
                    }
                />
                <Label htmlFor="internat-bed" className="text-xs font-normal">
                    J&apos;ai un lit ou un rebord stable
                </Label>
            </div>
            <div className="flex flex-wrap gap-2">
                {sessionId !== null ? (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => forSession({ on: false })}>
                        Désactiver pour cette séance
                    </Button>
                ) : null}
                {internat.global ? (
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => forGood(false, "Mode Internat désactivé.")}
                    >
                        Désactiver le mode Internat
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
