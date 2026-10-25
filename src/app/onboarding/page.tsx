import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserProgramId } from "@/lib/data/users";
import { getActiveProgram } from "@/lib/data/user-programs";
import { getProgram } from "@/lib/program";
import { todayISO } from "@/lib/date";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    if (await getActiveProgram(session.userId)) redirect("/");

    const program = getProgram(await getUserProgramId(session.userId));

    return (
        <OnboardingForm
            defaultDate={todayISO()}
            askTargetWeight={program.features.targetWeight}
            photosReminder={program.features.photos}
        />
    );
}
