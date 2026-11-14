"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, BookOpen } from "lucide-react";
import { DumbbellIcon } from "@/components/dumbbell-icon";
import { cn } from "@/lib/utils";

const ITEMS = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/seance", label: "Séance", icon: DumbbellIcon },
    { href: "/suivi", label: "Suivi", icon: TrendingUp },
    { href: "/programme", label: "Programme", icon: BookOpen },
];

export function AppNav() {
    const pathname = usePathname();

    return (
        <nav className="from-background fixed inset-x-0 bottom-0 z-40 bg-linear-to-t from-50% to-transparent px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="bg-nav mx-auto flex h-[4.25rem] max-w-xl items-center justify-around rounded-3xl border">
                {ITEMS.map(({ href, label, icon: Icon }) => {
                    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex min-w-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors select-none [-webkit-touch-callout:none]",
                                active ? "text-primary" : "text-muted-foreground",
                            )}
                        >
                            <Icon className="size-6" strokeWidth={active ? 2.4 : 2} />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
