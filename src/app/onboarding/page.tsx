import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserProgramId } from "@/lib/data/users";
import { getActiveProgram, getAbandonedProgramIds } from "@/lib/data/user-programs";
import { getProgram, CATALOG } from "@/lib/program";
import { todayISO } from "@/lib/date";
import { OnboardingForm } from "./onboarding-form";
import { ProgramPickerForm } from "./program-picker-form";

export default async function OnboardingPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    if (await getActiveProgram(session.userId)) redirect("/");

    // Tous les programmes abandonnés : on en choisit un (catalogue + abandonnés).
    const abandonedIds = await getAbandonedProgramIds(session.userId);
    if (abandonedIds.length > 0) {
        const programs = [
            ...abandonedIds.map((id) => getProgram(id)),
            ...CATALOG.filter((p) => !abandonedIds.includes(p.id)),
        ];
        return (
            <ProgramPickerForm
                defaultDate={todayISO()}
                catalog={programs.map((p) => ({
                    id: p.id,
                    label: p.label,
                    objective: p.objective,
                    equipment: p.equipment,
                    equipmentOptional: p.equipmentOptional,
                }))}
            />
        );
    }

    const program = getProgram(await getUserProgramId(session.userId));

    return (
        <OnboardingForm
            defaultDate={todayISO()}
            askTargetWeight={program.features.targetWeight}
            photosReminder={program.features.photos}
        />
    );
}
