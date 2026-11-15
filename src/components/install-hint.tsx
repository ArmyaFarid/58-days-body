"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Share, Smartphone, X } from "lucide-react";

const DISMISS_KEY = "install-hint-dismissed";

interface InstallPromptEvent extends Event {
    prompt: () => Promise<void>;
}

function noop() {
    return () => {};
}

/** Où en est l'installation : déjà installée, iPhone (consigne Partager) ou rien à proposer. */
function installState(): "installed" | "ios" | "other" {
    const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return "installed";
    return /iPhone|iPad|iPod/.test(navigator.userAgent) ? "ios" : "other";
}

function dismissed(): boolean {
    try {
        return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
        return true;
    }
}

/** Carte « Installe l'app » : une fois, tant que l'app tourne dans le navigateur. */
export function InstallHint() {
    const state = useSyncExternalStore(noop, installState, () => "installed" as const);
    const wasDismissed = useSyncExternalStore(noop, dismissed, () => true);
    const [closed, setClosed] = useState(false);
    // Android / Chrome : l'invite native d'installation, quand le navigateur la propose.
    const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

    useEffect(() => {
        function onPrompt(e: Event) {
            e.preventDefault();
            setPrompt(e as InstallPromptEvent);
        }
        window.addEventListener("beforeinstallprompt", onPrompt);
        return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    }, []);

    function close() {
        setClosed(true);
        try {
            localStorage.setItem(DISMISS_KEY, "1");
        } catch {
            // Stockage indisponible : la carte reviendra au prochain lancement.
        }
    }

    if (closed || wasDismissed || state === "installed") return null;
    if (state === "other" && !prompt) return null;

    return (
        <section className="bg-card border-brand/30 relative flex items-start gap-3 rounded-[1.25rem] border p-4">
            <span className="bg-brand text-brand-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                <Smartphone className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1 pr-6">
                <span className="text-[0.9375rem] font-semibold">Installe l’app sur ton téléphone</span>
                {state === "ios" ? (
                    <span className="text-muted-foreground text-[0.8125rem] leading-relaxed">
                        Touche <Share className="inline size-4 align-text-bottom" aria-label="Partager" /> puis « Sur
                        l’écran d’accueil ». Elle s’ouvrira en plein écran, comme une vraie app.
                    </span>
                ) : (
                    <>
                        <span className="text-muted-foreground text-[0.8125rem]">Plein écran, accès en un geste.</span>
                        <button
                            type="button"
                            onClick={async () => {
                                await prompt?.prompt();
                                close();
                            }}
                            className="bg-brand text-brand-foreground mt-1 h-10 self-start rounded-[0.75rem] px-4 text-sm font-bold"
                        >
                            Installer
                        </button>
                    </>
                )}
            </div>
            <button
                type="button"
                onClick={close}
                aria-label="Masquer"
                className="text-muted-foreground absolute top-3 right-3 flex size-8 items-center justify-center rounded-full"
            >
                <X className="size-4" />
            </button>
        </section>
    );
}
