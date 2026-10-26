"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setProgramStatusAction } from "@/lib/actions";

export function ResumeProgramButton({ programId }: { programId: string }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    function onResume() {
        startTransition(async () => {
            try {
                const { error } = await setProgramStatusAction(programId, false);
                if (error) {
                    toast.error(error);
                    return;
                }
                toast.success("Programme réactivé.");
                router.refresh();
            } catch {
                toast.error("Échec de la réactivation.");
            }
        });
    }

    return (
        <Button type="button" size="sm" onClick={onResume} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            Réactiver
        </Button>
    );
}
