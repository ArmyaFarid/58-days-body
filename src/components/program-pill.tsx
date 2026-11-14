"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveProgramAction } from "@/lib/actions";

interface ProgramPillProps {
    programs: { id: string; label: string }[];
    current: string;
}

const ADD = "__add__";

/** Pastille du programme affiché ; la liste native permet de basculer ou d'en ajouter un. */
export function ProgramPill({ programs, current }: ProgramPillProps) {
    const router = useRouter();
    const [selected, setSelected] = useState(current);
    const [pending, startTransition] = useTransition();
    const label = programs.find((p) => p.id === selected)?.label ?? "";

    function onChange(id: string) {
        if (id === ADD) {
            router.push("/parametres#programmes");
            return;
        }
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
        <label
            className={cn(
                "bg-card relative flex h-11 max-w-[9.5rem] min-w-0 items-center gap-1.5 rounded-full border px-3.5 text-[0.8125rem] font-semibold",
                pending && "opacity-70",
            )}
        >
            <span className="min-w-0 truncate">{label}</span>
            <ChevronDown className="size-3.5 shrink-0" strokeWidth={2.5} />
            <select
                value={selected}
                onChange={(e) => onChange(e.target.value)}
                aria-label="Changer de programme"
                className="absolute inset-0 cursor-pointer opacity-0"
            >
                {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.label}
                    </option>
                ))}
                <option value={ADD}>+ Ajouter un programme…</option>
            </select>
        </label>
    );
}
