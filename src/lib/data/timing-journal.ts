import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { timingJournal } from "@/lib/db/schema";
import type { TimingOutcome } from "@/lib/program/plancher-pelvien";

export interface TimingEntry {
  id: number;
  date: string;
  level: number;
  signals: string[];
  outcome: TimingOutcome;
  note: string | null;
}

export interface NewTimingEntry {
  date: string;
  level: number;
  signals: string[];
  outcome: TimingOutcome;
  note: string | null;
}

export async function addTimingEntry(
  userId: number,
  entry: NewTimingEntry,
): Promise<void> {
  await db.insert(timingJournal).values({ userId, ...entry });
}

/** Dernière note du journal (la plus récente). */
export async function getLastTimingEntry(
  userId: number,
): Promise<TimingEntry | null> {
  const [r] = await db
    .select()
    .from(timingJournal)
    .where(eq(timingJournal.userId, userId))
    .orderBy(desc(timingJournal.date), desc(timingJournal.id))
    .limit(1);
  return r
    ? {
        id: r.id,
        date: r.date,
        level: r.level,
        signals: r.signals,
        outcome: r.outcome as TimingOutcome,
        note: r.note,
      }
    : null;
}
