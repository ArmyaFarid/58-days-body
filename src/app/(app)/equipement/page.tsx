import Link from "next/link";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import { getActiveProgram } from "@/lib/data/user-programs";
import { EQUIPMENT, BAND_TIP } from "@/lib/program/reference";

export default async function EquipementPage() {
    const { userId } = (await getSession())!;
    const { program } = (await getActiveProgram(userId))!;
    // Le programme 58 jours a une fiche détaillée ; les autres listent leur matériel.
    const items =
        program.id === "programme-58"
            ? EQUIPMENT.map((e) => ({ name: e.name, note: e.note, optional: e.name.includes("optionnel") }))
            : [
                  ...program.equipment.map((name) => ({ name, note: "Indispensable", optional: false })),
                  ...program.equipmentOptional.map((name) => ({ name, note: "Optionnel", optional: true })),
              ];

    return (
        <div className="flex flex-col gap-4 px-5 pt-4 pb-4">
            <div className="flex items-center gap-3">
                <Link
                    href="/programme"
                    aria-label="Retour au programme"
                    className="bg-card flex size-11 shrink-0 items-center justify-center rounded-full"
                >
                    <ChevronLeft className="size-5" strokeWidth={2.4} />
                </Link>
                <h1 className="font-heading text-[1.75rem] font-bold tracking-[-0.03125rem]">Équipement</h1>
            </div>

            <div className="bg-card flex flex-col overflow-hidden rounded-[1.25rem]">
                {items.map((e) => (
                    <div key={e.name} className="flex items-start gap-3 border-b px-4 py-3.5 last:border-0">
                        <span
                            className={cn(
                                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                                e.optional ? "bg-muted text-muted-foreground" : "bg-brand text-brand-foreground",
                            )}
                        >
                            <Check className="size-4" strokeWidth={3} />
                        </span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="font-medium">{e.name}</span>
                            <span className="text-muted-foreground text-[0.8125rem]">{e.note}</span>
                        </div>
                    </div>
                ))}
            </div>

            {program.id === "programme-58" ? (
                <section className="bg-card flex flex-col gap-2 rounded-[1.25rem] p-4">
                    <h2 className="text-[0.9375rem] font-semibold">Réglage de la charge (bandes)</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">{BAND_TIP}</p>
                </section>
            ) : null}
        </div>
    );
}
