"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { BedSingle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { setInternatModeAction, setSessionInternatAction } from "@/lib/actions";
import type { InternatInfo } from "./types";

interface InternatBarProps {
    /** null : aperçu d'un jour à venir (seul le réglage global s'applique). */
    sessionId: number | null;
    internat: InternatInfo;
}

export function InternatBar({ sessionId, internat }: InternatBarProps) {
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    function run(action: () => Promise<{ error?: string }>, success?: string) {
        startTransition(async () => {
            try {
                const res = await action();
                if (res.error) {
                    toast.error(res.error);
                    return;
                }
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

    const panel = !internat.on ? (
        <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
                Remplace les exercices qui demandent du mobilier : sol, bande et bord du lit seulement.
            </p>
            <div className="flex flex-col gap-2">
                {sessionId !== null ? (
                    <Button
                        variant="outline"
                        className="h-11"
                        disabled={pending}
                        onClick={() => forSession({ on: true })}
                    >
                        Pour cette séance
                    </Button>
                ) : null}
                <Button
                    className="h-11"
                    disabled={pending}
                    onClick={() => forGood(true, "Mode Internat activé jusqu'à nouvel ordre.")}
                >
                    Jusqu&apos;à ce que je le désactive
                </Button>
            </div>
        </div>
    ) : (
        <div className="flex flex-col gap-3 text-sm">
            <p className="text-primary font-medium">Mode Internat {internat.global ? "actif" : "— cette séance"}</p>
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
                <Label htmlFor="internat-bed" className="text-sm font-normal">
                    J&apos;ai un lit ou un rebord stable
                </Label>
            </div>
            <div className="flex flex-col gap-2">
                {sessionId !== null ? (
                    <Button
                        variant="outline"
                        className="h-11"
                        disabled={pending}
                        onClick={() => forSession({ on: false })}
                    >
                        Désactiver pour cette séance
                    </Button>
                ) : null}
                {internat.global ? (
                    <Button
                        variant="ghost"
                        className="h-11"
                        disabled={pending}
                        onClick={() => forGood(false, "Mode Internat désactivé.")}
                    >
                        Désactiver le mode Internat
                    </Button>
                ) : null}
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <button
                        type="button"
                        className={cn(
                            "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap",
                            internat.on ? "border-brand bg-brand/15 text-primary" : "bg-card",
                        )}
                    >
                        <BedSingle className="size-3.5" />
                        Internat
                        {internat.on ? <Check className="size-3.5" strokeWidth={3} /> : null}
                    </button>
                }
            />
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Mode Internat
                        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                    </DialogTitle>
                </DialogHeader>
                {panel}
            </DialogContent>
        </Dialog>
    );
}
