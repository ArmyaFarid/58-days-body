"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { setProgramAction } from "@/lib/actions";
import { PROGRAM_OPTIONS } from "@/lib/program";

export function ProgramSelector({ current }: { current: string }) {
    const router = useRouter();
    const [selected, setSelected] = useState(current);
    const [saving, startSaving] = useTransition();

    function onSave() {
        startSaving(async () => {
            try {
                await setProgramAction(selected);
                toast.success("Programme mis à jour.");
                router.refresh();
            } catch {
                toast.error("Échec du changement de programme.");
            }
        });
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                {PROGRAM_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelected(opt.id)}
                        className={cn(
                            "rounded-lg border p-3 text-left text-sm transition-colors",
                            selected === opt.id
                                ? "border-primary bg-primary/10 font-medium"
                                : "border-border",
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <Button
                type="button"
                className="h-11"
                onClick={onSave}
                disabled={saving || selected === current}
            >
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Changer de programme"}
            </Button>
        </div>
    );
}
