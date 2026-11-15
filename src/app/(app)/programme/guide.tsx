import { ChevronRight } from "lucide-react";

/** Liste de sections repliables (guide détaillé d'un programme). */
export function Guide({ children }: { children: React.ReactNode }) {
    return <div className="bg-card flex flex-col overflow-hidden rounded-[1.25rem]">{children}</div>;
}

export function GuideItem({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <details className="group border-b last:border-0">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                <span className="flex-1 font-medium">{title}</span>
                <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-90" />
            </summary>
            <div className="flex flex-col gap-2 px-4 pb-4 text-sm">{children}</div>
        </details>
    );
}
