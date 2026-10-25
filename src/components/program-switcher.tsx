"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveProgramAction } from "@/lib/actions";

interface ProgramSwitcherProps {
    programs: { id: string; label: string }[];
    current: string;
}

/** Bascule la vue de l'app d'un programme suivi à l'autre, en un geste. */
export function ProgramSwitcher({ programs, current }: ProgramSwitcherProps) {
    const router = useRouter();
    const [selected, setSelected] = useState(current);
    const [pending, startTransition] = useTransition();

    function select(id: string) {
        if (id === selected) return;
        const previous = selected;
        setSelected(id);
        startTransition(async () => {
            try {
                await setActiveProgramAction(id);
                router.refresh();
            } catch {
                setSelected(previous);
                toast.error("Bascule impossible.");
            }
        });
    }

    return (
        <nav
            aria-label="Programme affiché"
            className={cn("flex items-center gap-1.5 overflow-x-auto", pending && "opacity-80")}
        >
            {programs.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => select(p.id)}
                    aria-pressed={selected === p.id}
                    className={cn(
                        "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                        selected === p.id ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                >
                    {p.label}
                </button>
            ))}
            <Link
                href="/parametres#programmes"
                aria-label="Ajouter un programme"
                className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full"
            >
                <Plus className="size-4" />
            </Link>
        </nav>
    );
}
