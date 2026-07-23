import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getStartDate } from "@/lib/data/settings";
import { getUserProgramId } from "@/lib/data/users";
import { getProgram } from "@/lib/program";
import { todayISO } from "@/lib/date";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const startDate = await getStartDate(session.userId);
    if (startDate) redirect("/");

    const program = getProgram(await getUserProgramId(session.userId));

    return (
        <OnboardingForm
            defaultDate={todayISO()}
            askTargetWeight={program.features.targetWeight}
            photosReminder={program.features.photos}
        />
    );
}
