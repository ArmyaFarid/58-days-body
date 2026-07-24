"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Eye, Loader2 } from "lucide-react";
import { switchBackAction } from "@/lib/actions";

export function ImpersonationBanner({ username }: { username: string }) {
    const [pending, startTransition] = useTransition();

    function back() {
        startTransition(async () => {
            try {
                await switchBackAction();
            } catch {
                toast.error("Retour impossible.");
            }
        });
    }

    return (
        <div className="bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center gap-2 px-4 py-2 text-sm">
            <Eye className="size-4 shrink-0" />
            <span className="flex-1">
                Tu consultes le compte de <strong>{username}</strong>.
            </span>
            <button
                type="button"
                onClick={back}
                disabled={pending}
                className="font-medium underline underline-offset-2"
            >
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Revenir à mon compte"}
            </button>
        </div>
    );
}
