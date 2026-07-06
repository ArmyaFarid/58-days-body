import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell, Settings } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getStartDate } from "@/lib/data/settings";
import { AppNav } from "@/components/app-nav";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (!session) redirect("/login");

    const startDate = await getStartDate(session.userId);
    if (!startDate) redirect("/onboarding");

    return (
        <div className="mx-auto flex min-h-full w-full max-w-xl flex-col">
            <header className="bg-background/95 sticky top-0 z-30 flex items-center justify-between border-b px-4 py-2 backdrop-blur">
                <span className="flex items-center gap-2 font-semibold">
                    <Dumbbell className="size-4 text-primary" />
                    58 jours
                </span>
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <Button
                        render={<Link href="/parametres" />}
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        aria-label="Paramètres"
                    >
                        <Settings className="size-5" />
                    </Button>
                    <LogoutButton />
                </div>
            </header>
            <main className="flex-1 pb-24">{children}</main>
            <AppNav />
        </div>
    );
}
