"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, TrendingUp, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/seance", label: "Séance", icon: Dumbbell },
    { href: "/suivi", label: "Suivi", icon: TrendingUp },
    { href: "/programme", label: "Programme", icon: BookOpen },
];

export function AppNav() {
    const pathname = usePathname();

    return (
        <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur">
            <div className="mx-auto flex max-w-xl items-stretch justify-around">
                {ITEMS.map(({ href, label, icon: Icon }) => {
                    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                                active ? "text-primary" : "text-muted-foreground",
                            )}
                        >
                            <Icon className="size-5" />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
