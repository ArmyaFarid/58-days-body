import Link from "next/link";
import {
    BedSingle,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    KeyRound,
    Palette,
    SlidersHorizontal,
    Target,
    Ticket,
    TriangleAlert,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutRow } from "@/components/logout-button";
import type { SettingsSection } from "@/components/settings-view";
import { loadSettings } from "./load";

interface Row {
    section: SettingsSection;
    label: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
    danger?: boolean;
}

function Group({ title, rows }: { title: string; rows: Row[] }) {
    if (rows.length === 0) return null;
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-muted-foreground px-1 text-xs font-bold tracking-[0.0625rem] uppercase">{title}</h2>
            <div className="bg-card flex flex-col overflow-hidden rounded-[1.25rem]">
                {rows.map(({ section, label, hint, icon: Icon, danger }) => (
                    <Link
                        key={section}
                        href={`/parametres/${section}`}
                        className="flex items-center gap-3 border-b px-4 py-3 last:border-0"
                    >
                        <span
                            className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                                danger ? "bg-destructive/15 text-destructive" : "bg-muted",
                            )}
                        >
                            <Icon className="size-[1.125rem]" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className={cn("font-medium", danger && "text-destructive")}>{label}</span>
                            <span className="text-muted-foreground truncate text-[0.8125rem]">{hint}</span>
                        </span>
                        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default async function ParametresPage() {
    const { program, props } = await loadSettings();
    const { features, settings, internat, accounts, programs } = props;
    const impersonating = accounts.isImpersonating;
    const followed = programs.followed.length;

    const programme: Row[] = [
        {
            section: "programmes",
            label: "Mes programmes",
            hint: `${followed} suivi${followed > 1 ? "s" : ""} · ${program.label}`,
            icon: Dumbbell,
        },
        {
            section: "internat",
            label: "Mode Internat",
            hint: internat.mode ? "Activé" : "Désactivé",
            icon: BedSingle,
        },
        ...(features.holdPhase1 || features.creatine
            ? [
                  {
                      section: "options" as const,
                      label: "Options du programme",
                      hint: program.label,
                      icon: SlidersHorizontal,
                  },
              ]
            : []),
        {
            section: "objectifs",
            label: "Objectifs nutrition",
            hint: `${settings.phase1.proteinGoal} g protéines · ${settings.phase1.calorieGoal.toLocaleString("fr-FR")} kcal`,
            icon: Target,
        },
    ];
    const app: Row[] = [
        { section: "apparence", label: "Apparence", hint: "Thème, couleur, taille du texte", icon: Palette },
    ];
    const compte: Row[] = [
        ...(accounts.users.length > 0 || impersonating
            ? [{ section: "comptes" as const, label: "Comptes", hint: "Basculer vers un compte invité", icon: Users }]
            : []),
        ...(!impersonating
            ? [
                  {
                      section: "inviter" as const,
                      label: "Inviter quelqu’un",
                      hint: "Code d’invitation à usage unique",
                      icon: Ticket,
                  },
                  {
                      section: "motdepasse" as const,
                      label: "Mot de passe",
                      hint: "Changer le mot de passe",
                      icon: KeyRound,
                  },
                  {
                      section: "danger" as const,
                      label: "Zone sensible",
                      hint: "Réinitialiser mes données",
                      icon: TriangleAlert,
                      danger: true,
                  },
              ]
            : []),
    ];

    return (
        <div className="flex flex-col gap-5 px-5 pt-4 pb-4">
            <div className="flex items-center gap-3">
                <Link
                    href="/"
                    aria-label="Retour à l’accueil"
                    className="bg-card flex size-11 shrink-0 items-center justify-center rounded-full"
                >
                    <ChevronLeft className="size-5" strokeWidth={2.4} />
                </Link>
                <h1 className="font-heading text-[1.75rem] font-bold tracking-[-0.03125rem]">Paramètres</h1>
            </div>
            <Group title="Programme" rows={programme} />
            <Group title="Application" rows={app} />
            <Group title="Compte" rows={compte} />
            <LogoutRow />
        </div>
    );
}
