import { addDays, format, startOfWeek } from "date-fns";
import { SeanceDayNav, type DayInfo } from "@/components/workout/seance-day-nav";
import { getSession } from "@/lib/auth";
import { getActiveProgram, scheduleContext } from "@/lib/data/user-programs";
import { getCompletedSessionDates } from "@/lib/data/workout";
import { todayISO, fromISO } from "@/lib/date";

// Plage couverte par le bandeau des jours : un peu d'historique, quelques mois à venir.
const DAYS_BACK = 120;
const DAYS_AHEAD = 120;

function iso(d: Date): string {
    return format(d, "yyyy-MM-dd");
}

// Le bandeau vit dans le layout : il reste affiché (et réactif) pendant que la
// page de la séance du jour choisi se charge.
export default async function SeanceLayout({ children }: { children: React.ReactNode }) {
    const { userId } = (await getSession())!;
    const { program, row } = (await getActiveProgram(userId))!;
    const today = todayISO();
    const earliest = addDays(fromISO(today), -DAYS_BACK);
    const start = startOfWeek(
        fromISO(row.startDate) > earliest ? fromISO(row.startDate) : earliest,
        { weekStartsOn: 1 },
    );
    const done = new Set(await getCompletedSessionDates(userId, program, iso(start)));

    const days: Record<string, DayInfo> = {};
    for (let d = start; d <= addDays(fromISO(today), DAYS_AHEAD); d = addDays(d, 1)) {
        const date = iso(d);
        const ctx = scheduleContext(row, date);
        if (ctx.dayNumber < 1) continue;
        const phase = program.getPhase(ctx.dayNumber);
        const dayType = program.dayTypeForWeekday(d.getDay(), ctx);
        const session = program.sessions[dayType];
        const training =
            program.isTrainingDay(dayType, phase?.key ?? null) &&
            session != null &&
            session.dayType !== "repos";
        days[date] = {
            training,
            title: training ? session.title : "Repos",
            done: done.has(date),
        };
    }

    return (
        <SeanceDayNav today={today} days={days}>
            {children}
        </SeanceDayNav>
    );
}
