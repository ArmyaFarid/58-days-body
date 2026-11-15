"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CloudOff } from "lucide-react";
import { flushPendingSets, pendingSets, PENDING_EVENT } from "@/lib/offline-sets";

function subscribe(onChange: () => void) {
    window.addEventListener(PENDING_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
        window.removeEventListener(PENDING_EVENT, onChange);
        window.removeEventListener("storage", onChange);
    };
}

/** Envoie les séries notées hors ligne dès que le réseau revient, et le signale. */
export function PendingSetsSync() {
    const router = useRouter();
    const count = useSyncExternalStore(
        subscribe,
        () => pendingSets().length,
        () => 0,
    );

    useEffect(() => {
        async function flush() {
            const sent = await flushPendingSets();
            if (sent > 0) {
                toast.success(sent > 1 ? `${sent} séries envoyées.` : "Série envoyée.");
                router.refresh();
            }
        }
        flush();
        window.addEventListener("online", flush);
        return () => window.removeEventListener("online", flush);
    }, [router]);

    if (count === 0) return null;
    return (
        <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[60] flex justify-center">
            <span className="bg-card text-foreground flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-lg">
                <CloudOff className="text-streak size-3.5" />
                {count > 1 ? `${count} séries en attente du réseau` : "1 série en attente du réseau"}
            </span>
        </div>
    );
}
