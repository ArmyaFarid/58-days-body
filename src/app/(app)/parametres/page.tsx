import { SettingsView } from "@/components/settings-view";
import { getSession } from "@/lib/auth";
import { getSettingsView } from "@/lib/data/settings";
import { getUserProgramId } from "@/lib/data/users";
import { getInviteCodes } from "@/lib/data/invite-codes";
import { getProgram } from "@/lib/program";

export default async function ParametresPage() {
    const { userId } = (await getSession())!;
    const [settings, programId, inviteCodes] = await Promise.all([
        getSettingsView(userId),
        getUserProgramId(userId),
        getInviteCodes(userId),
    ]);
    const program = getProgram(programId);

    return (
        <SettingsView
            features={{
                trackFat: program.features.trackFat,
                targetWeight: program.features.targetWeight,
                multiPhase: program.nutritionPhase2Key != null,
            }}
            settings={settings}
            inviteCodes={inviteCodes.map((c) => ({ code: c.code, used: c.usedBy != null }))}
        />
    );
}
