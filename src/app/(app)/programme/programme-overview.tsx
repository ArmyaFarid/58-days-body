import Link from "next/link";
import { addDays, format, startOfWeek } from "date-fns";
import { Check, ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { scheduleContext, type UserProgram } from "@/lib/data/user-programs";
import { youtubeSearchUrl, type Program } from "@/lib/program";
import { fromISO } from "@/lib/date";
import { ExerciseLibrary } from "./exercise-library";

interface ProgrammeOverviewProps {
    program: Program;
    row: UserProgram;
    today: string;
    /** Guide détaillé du programme (sections repliées en bas de page). */
    guide: React.ReactNode;
}

interface Segment {
    key: string;
    label: string;
    description?: string;
    start: number;
    end: number | null;
}

/** Phases du programme, regroupées par jour (la dernière peut être sans fin). */
function phaseSegments(program: Program, dayNumber: number): Segment[] {
    const horizon = program.length ?? Math.max(dayNumber, 1) + 90;
    const segments: Segment[] = [];
    for (let d = 1; d <= horizon; d++) {
        const p = program.getPhase(d);
        if (!p) continue;
        const last = segments.at(-1);
        if (last && last.key === p.key) last.end = d;
        else segments.push({ key: p.key, label: p.label, description: p.description, start: d, end: d });
    }
    if (program.length == null && segments.length) segments[segments.length - 1].end = null;
    return segments;
}

export function ProgrammeOverview({ program, row, today, guide }: ProgrammeOverviewProps) {
    const dayNumber = scheduleContext(row, today).dayNumber;
    const segments = phaseSegments(program, dayNumber);
    const weekStart = startOfWeek(fromISO(today), { weekStartsOn: 1 });
    const week = Array.from({ length: 7 }, (_, i) => {
        const date = format(addDays(weekStart, i), "yyyy-MM-dd");
        const ctx = scheduleContext(row, date);
        if (ctx.dayNumber < 1) return { date, title: null };
        const dayType = program.dayTypeForWeekday(fromISO(date).getDay(), ctx);
        const session = program.sessions[dayType];
        const phase = program.getPhase(ctx.dayNumber);
        const training =
            program.isTrainingDay(dayType, phase?.key ?? null) && session != null && session.dayType !== "repos";
        return { date, title: training ? session.title : null };
    });
    const sessions = Object.values(program.sessions).filter((s) => s.dayType !== "repos");
    const library = Object.entries(program.lexicon).map(([key, e]) => ({
        key,
        name: e.name,
        text: e.text,
        youtubeUrl: youtubeSearchUrl(e.youtubeQuery ?? e.name),
    }));
    const equipmentCount = program.equipment.length + program.equipmentOptional.length;

    return (
        <div className="flex flex-col gap-4 px-5 pt-4 pb-4">
            <div className="flex flex-col gap-1.5">
                <h1 className="font-heading text-[2.125rem] leading-none font-bold tracking-[-0.03125rem]">
                    Programme
                </h1>
                <p className="text-[0.9375rem] font-semibold">{program.label}</p>
                {program.objective ? (
                    <p className="text-muted-foreground text-[0.8125rem] leading-relaxed">{program.objective}</p>
                ) : null}
            </div>

            {segments.length > 0 ? (
                <section className="bg-card flex flex-col gap-3 rounded-3xl p-5">
                    <h2 className="text-muted-foreground text-xs font-bold tracking-[0.0625rem] uppercase">Parcours</h2>
                    <ol className="flex flex-col">
                        {segments.map((s, i) => {
                            const done = s.end != null && dayNumber > s.end;
                            const current = dayNumber >= s.start && (s.end == null || dayNumber <= s.end);
                            return (
                                <li key={`${s.key}-${s.start}`} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <span
                                            className={cn(
                                                "flex size-6 shrink-0 items-center justify-center rounded-full",
                                                done && "bg-brand text-brand-foreground",
                                                current && "border-brand bg-brand/20 border-2",
                                                !done && !current && "border-border border-2",
                                            )}
                                        >
                                            {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
                                        </span>
                                        {i < segments.length - 1 ? (
                                            <span
                                                className={cn("my-1 w-0.5 flex-1", done ? "bg-brand" : "bg-border")}
                                            />
                                        ) : null}
                                    </div>
                                    <div
                                        className={cn(
                                            "flex min-w-0 flex-1 flex-col gap-0.5",
                                            i < segments.length - 1 && "pb-4",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "text-[0.9375rem] font-semibold",
                                                !done && !current && "text-muted-foreground",
                                            )}
                                        >
                                            {s.label}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            {s.end == null
                                                ? `À partir du jour ${s.start}`
                                                : `Jours ${s.start} à ${s.end}`}
                                        </span>
                                        {current ? (
                                            <>
                                                <span className="bg-brand text-brand-foreground mt-1 self-start rounded-md px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.0625rem] uppercase">
                                                    Tu es ici · jour {dayNumber}
                                                </span>
                                                {s.description ? (
                                                    <p className="text-muted-foreground mt-1 text-[0.8125rem] leading-relaxed">
                                                        {s.description}
                                                    </p>
                                                ) : null}
                                            </>
                                        ) : null}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            ) : null}

            <section className="flex flex-col gap-2.5">
                <h2 className="text-[0.9375rem] font-semibold">Cette semaine</h2>
                <div className="grid grid-cols-7 gap-1.5">
                    {week.map((d) => {
                        const isToday = d.date === today;
                        return (
                            <Link
                                key={d.date}
                                href={d.date === today ? "/seance" : `/seance?date=${d.date}`}
                                aria-label={`${new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric" }).format(fromISO(d.date))} — ${d.title ?? "repos"}`}
                                className={cn(
                                    "flex h-16 flex-col items-center justify-center gap-px rounded-[0.875rem]",
                                    isToday ? "bg-brand text-brand-foreground" : "bg-card",
                                    !d.title && !isToday && "text-muted-foreground",
                                )}
                            >
                                <span className="text-[0.6875rem] font-semibold uppercase opacity-80">
                                    {new Intl.DateTimeFormat("fr-CA", { weekday: "narrow" }).format(fromISO(d.date))}
                                </span>
                                <span className="font-heading text-[1.0625rem] leading-tight font-bold">
                                    {fromISO(d.date).getDate()}
                                </span>
                                <span
                                    className={cn(
                                        "size-[5px] rounded-full",
                                        d.title ? (isToday ? "bg-brand-foreground" : "bg-brand") : "bg-transparent",
                                    )}
                                />
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="flex flex-col gap-2.5">
                <h2 className="text-[0.9375rem] font-semibold">Les séances</h2>
                {sessions.map((s) => (
                    <details key={s.dayType} className="bg-card group rounded-[1.125rem]">
                        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="font-semibold">{s.title}</span>
                                <span className="text-muted-foreground text-[0.8125rem]">
                                    {s.focus} · {s.exercises.length} exercices
                                </span>
                            </span>
                            <ChevronRight className="text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-90" />
                        </summary>
                        <ul className="flex flex-col gap-2 border-t px-4 py-3">
                            {s.exercises.map((ex) => (
                                <li key={ex.key} className="flex justify-between gap-3 text-sm">
                                    <span className="min-w-0">{ex.name}</span>
                                    <span className="text-muted-foreground shrink-0 tabular-nums">
                                        {ex.sets} × {ex.reps}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </details>
                ))}
            </section>

            {library.length > 0 ? <ExerciseLibrary entries={library} /> : null}

            <section className="flex flex-col gap-2.5">
                <h2 className="text-[0.9375rem] font-semibold">Guide du programme</h2>
                {guide}
            </section>

            <div className="flex flex-col overflow-hidden rounded-[1.25rem]">
                {equipmentCount > 0 ? (
                    <Link href="/equipement" className="bg-card flex items-center gap-3 border-b px-4 py-3.5">
                        <span className="flex-1 font-medium">Équipement</span>
                        <span className="text-muted-foreground text-[0.8125rem]">{equipmentCount}</span>
                        <ChevronRight className="text-muted-foreground size-4" />
                    </Link>
                ) : null}
                <a href="/api/export" download className="bg-card flex items-center gap-3 px-4 py-3.5">
                    <Download className="text-muted-foreground size-4" />
                    <span className="flex-1 font-medium">Exporter mes données</span>
                    <ChevronRight className="text-muted-foreground size-4" />
                </a>
            </div>
        </div>
    );
}
