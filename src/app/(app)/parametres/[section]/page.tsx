import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SettingsView, type SettingsSection } from "@/components/settings-view";
import { loadSettings } from "../load";

const TITLES: Record<SettingsSection, string> = {
    programmes: "Mes programmes",
    internat: "Mode Internat",
    options: "Options du programme",
    objectifs: "Objectifs nutrition",
    apparence: "Apparence",
    comptes: "Comptes",
    inviter: "Inviter quelqu’un",
    motdepasse: "Mot de passe",
    danger: "Zone sensible",
};

export default async function SettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
    const { section } = await params;
    if (!(section in TITLES)) notFound();
    const key = section as SettingsSection;
    const { program, props } = await loadSettings();

    return (
        <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-3 px-5">
                <Link
                    href="/parametres"
                    aria-label="Retour aux paramètres"
                    className="bg-card flex size-11 shrink-0 items-center justify-center rounded-full"
                >
                    <ChevronLeft className="size-5" strokeWidth={2.4} />
                </Link>
                <h1 className="font-heading min-w-0 truncate text-2xl font-bold tracking-[-0.03125rem]">
                    {TITLES[key]}
                </h1>
            </div>
            {/* Remonte la vue quand le programme affiché change : les champs suivent le nouveau programme. */}
            {/* Le titre de la page remplace celui de la carte. */}
            <div className="[&_[data-slot=card-header]]:hidden [&_[data-slot=card]]:pt-4">
                <SettingsView key={program.id} section={key} {...props} />
            </div>
        </div>
    );
}
