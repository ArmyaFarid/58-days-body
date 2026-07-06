import { parseISO } from "date-fns";

/** Fuseau de l'utilisateur (Chicoutimi, QC). Les dates « du jour » s'y réfèrent. */
export const TIMEZONE = "America/Toronto";

/** Date du jour au format YYYY-MM-DD dans le fuseau de l'utilisateur. */
export function todayISO(): string {
    // en-CA formate en YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

/** Convertit une date ISO (YYYY-MM-DD) en Date locale (minuit local). */
export function fromISO(iso: string): Date {
    return parseISO(iso);
}

/** Formatage court lisible, ex. « lun. 6 juil. ». */
export function formatShort(iso: string): string {
    return new Intl.DateTimeFormat("fr-CA", {
        weekday: "short",
        day: "numeric",
        month: "short",
    }).format(parseISO(iso));
}
