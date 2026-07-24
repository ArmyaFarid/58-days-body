import { SettingsView } from "@/components/settings-view";
import { getSession } from "@/lib/auth";
import { getSettingsView } from "@/lib/data/settings";
import { getUserProgramId } from "@/lib/data/users";
import { getInviteCodes, getInvitedUsers } from "@/lib/data/invite-codes";
import { getProgram } from "@/lib/program";

export default async function ParametresPage() {
    const session = (await getSession())!;
    const userId = session.userId;
    const [settings, programId, inviteCodes, invitedUsers] = await Promise.all([
        getSettingsView(userId),
        getUserProgramId(userId),
        getInviteCodes(userId),
        getInvitedUsers(session.ownerUserId),
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
            accounts={{
                users: invitedUsers,
                currentUserId: session.userId,
                ownerUserId: session.ownerUserId,
                ownerUsername: session.ownerUsername,
                isImpersonating: session.isImpersonating,
            }}
        />
    );
}
