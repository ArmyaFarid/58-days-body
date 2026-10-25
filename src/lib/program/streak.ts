import { addDays, format, startOfWeek, subWeeks } from "date-fns";
import { getDayNumber } from "./index";
import type { Program } from "./types";
import { fromISO } from "@/lib/date";

export interface WeeklyStreak {
    /** Semaines consécutives où toutes les séances prévues ont été faites. */
    weeks: number;
    /** Séances faites / prévues cette semaine. */
    doneThisWeek: number;
    plannedThisWeek: number;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** Jours d'entraînement prévus dans la semaine (lundi → dimanche), à partir du jour 1. */
function plannedDays(program: Program, startDate: string, holdPhase1: boolean, monday: Date): string[] {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
        const d = addDays(monday, i);
        const dayNumber = getDayNumber(startDate, d);
        if (dayNumber < 1) continue;
        const ctx = { dayNumber, holdPhase1 };
        const dayType = program.dayTypeForWeekday(d.getDay(), ctx);
        const phaseKey = program.getPhase(dayNumber)?.key ?? null;
        if (program.isTrainingDay(dayType, phaseKey)) days.push(iso(d));
    }
    return days;
}

/**
 * Série de semaines complètes. La semaine en cours ne casse jamais la série :
 * elle s'y ajoute seulement une fois toutes ses séances faites. Une semaine
 * passée compte si le nombre de séances faites atteint le rythme le moins
 * exigeant (avec ou sans « rester en phase 1 ») : changer ce réglage ne casse
 * pas rétroactivement la série.
 */
export function computeWeeklyStreak(
    program: Program,
    startDate: string,
    holdPhase1: boolean,
    completedDates: string[],
    today: string,
): WeeklyStreak {
    const done = new Set(completedDates);
    const thisMonday = startOfWeek(fromISO(today), { weekStartsOn: 1 });
    const firstMonday = startOfWeek(fromISO(startDate), { weekStartsOn: 1 });

    const current = plannedDays(program, startDate, holdPhase1, thisMonday);
    const doneThisWeek = current.filter((d) => done.has(d)).length;

    let weeks = current.length > 0 && doneThisWeek === current.length ? 1 : 0;
    for (let monday = subWeeks(thisMonday, 1); monday >= firstMonday; monday = subWeeks(monday, 1)) {
        const withHold = plannedDays(program, startDate, true, monday);
        const withoutHold = plannedDays(program, startDate, false, monday);
        const required = Math.min(withHold.length, withoutHold.length);
        if (required === 0) continue;
        const week = new Set([...withHold, ...withoutHold]);
        const doneCount = [...week].filter((d) => done.has(d)).length;
        if (doneCount < required) break;
        weeks++;
    }
    return { weeks, doneThisWeek, plannedThisWeek: current.length };
}
