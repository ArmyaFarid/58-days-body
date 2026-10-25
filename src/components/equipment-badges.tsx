import { Badge } from "@/components/ui/badge";
import type { Program } from "@/lib/program";

/** Équipement requis (plein) puis optionnel (contour). */
export function EquipmentBadges({ program }: { program: Pick<Program, "equipment" | "equipmentOptional"> }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {program.equipment.map((e) => (
                <Badge key={e} variant="secondary">
                    {e}
                </Badge>
            ))}
            {program.equipmentOptional.map((e) => (
                <Badge key={e} variant="outline" className="text-muted-foreground">
                    {e} · optionnel
                </Badge>
            ))}
        </div>
    );
}
