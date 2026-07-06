import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function HomePage() {
    const session = await getSession();
    if (!session) redirect("/login");

    return (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-2xl font-semibold">Programme 58 jours</h1>
            <p className="text-muted-foreground max-w-sm">
                Connecté en tant que <span className="font-medium">{session.sub}</span>. Le tableau de
                bord arrive à l&apos;étape 3.
            </p>
            <LogoutButton />
        </main>
    );
}
