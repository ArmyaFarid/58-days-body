import type { Program } from "@/lib/program";
import { Guide, GuideItem } from "./guide";

/** Guide généré depuis la définition du programme (sections de résumé). */
export function SummaryGuide({ program }: { program: Program }) {
    return (
        <Guide>
            {(program.summary ?? []).map((section) => (
                <GuideItem key={section.title} title={section.title}>
                    {section.items.map((t) => (
                        <p key={t} className="text-muted-foreground">
                            {t}
                        </p>
                    ))}
                </GuideItem>
            ))}
        </Guide>
    );
}
