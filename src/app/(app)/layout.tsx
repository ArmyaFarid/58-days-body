import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getActiveProgram } from "@/lib/data/user-programs";
import { AppNav } from "@/components/app-nav";
import { ThemePicker } from "@/components/theme-picker";
import { PendingSetsSync } from "@/components/pending-sets-sync";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (!session) redirect("/login");

    const active = await getActiveProgram(session.userId);
    if (!active) redirect("/onboarding");

    return (
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col overflow-x-clip">
            {session.isImpersonating ? <ImpersonationBanner username={session.username} /> : null}
            <main className="flex-1 pt-[env(safe-area-inset-top)] pb-[calc(7rem+env(safe-area-inset-bottom))]">
                {children}
            </main>
            <AppNav />
            <ThemePicker />
            <PendingSetsSync />
        </div>
    );
}
