import { SettingsView } from "@/components/settings-view";
import type { FollowedProgram } from "@/components/my-programs";
import { getSession } from "@/lib/auth";
import { getSettingsView } from "@/lib/data/settings";
import { getActiveProgram, getAbandonedProgramIds, scheduleContext } from "@/lib/data/user-programs";
import { getInviteCodes, getInvitedUsers } from "@/lib/data/invite-codes";
import { getProgram, CATALOG, type Program } from "@/lib/program";
import type { UserProgram } from "@/lib/data/user-programs";
import { todayISO, formatShort } from "@/lib/date";

function progressText(program: Program, row: UserProgram): string {
    const ctx = scheduleContext(row);
    if (ctx.dayNumber < 1) return `Démarre le ${formatShort(row.startDate)}`;
    const phase = program.trainingPhase?.(ctx)?.label ?? program.getPhase(ctx.dayNumber)?.label;
    const day = program.length != null ? `Jour ${ctx.dayNumber} / ${program.length}` : `Jour ${ctx.dayNumber}`;
    return phase ? `${day} · ${phase}` : day;
}

export default async function ParametresPage() {
    const session = (await getSession())!;
    const userId = session.userId;
    const [settings, active, abandonedIds, inviteCodes, invitedUsers] = await Promise.all([
        getSettingsView(userId),
        getActiveProgram(userId),
        getAbandonedProgramIds(userId),
        getInviteCodes(userId),
        getInvitedUsers(session.ownerUserId),
    ]);
    const { program, row, all } = active!;

    const followed: FollowedProgram[] = all.map((r) => {
        const p = getProgram(r.programId);
        return {
            id: p.id,
            label: p.label,
            paused: r.status === "paused",
            isCurrent: r.programId === row.programId,
            progress: progressText(p, r),
            equipment: p.equipment,
            equipmentOptional: p.equipmentOptional,
        };
    });
    // Catalogue + programmes abandonnés (reprenables même s'ils ont quitté le catalogue).
    const offered = [
        ...CATALOG,
        ...abandonedIds.map((id) => getProgram(id)).filter((p) => !CATALOG.includes(p)),
    ];
    const catalog = offered.filter((p) => !all.some((r) => r.programId === p.id)).map((p) => ({
        id: p.id,
        label: p.label,
        objective: p.objective,
        equipment: p.equipment,
        equipmentOptional: p.equipmentOptional,
    }));

    return (
        // Remonte la vue quand le programme affiché change (pause, abandon, bascule) :
        // sinon les champs garderaient les objectifs de l'ancien programme.
        <SettingsView
            key={program.id}
            programLabel={program.label}
            programs={{ followed, catalog, today: todayISO() }}
            features={{
                trackFat: program.features.trackFat,
                targetWeight: program.features.targetWeight,
                multiPhase: program.nutritionPhase2Key != null,
                holdPhase1: program.trainingPhase != null,
                creatine: program.features.creatineOptional === true,
            }}
            phaseLabels={{
                phase1: program.getPhase(1)?.label ?? "Phase 1",
                phase2: program.getPhase(9999)?.label ?? "Phase 2",
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
