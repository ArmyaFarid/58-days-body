"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Eye, Loader2, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { switchToUserAction, switchBackAction } from "@/lib/actions";

interface Account {
    id: number;
    username: string;
}

interface AccountSwitcherProps {
    users: Account[];
    currentUserId: number;
    ownerUserId: number;
    ownerUsername: string;
    isImpersonating: boolean;
}

export function AccountSwitcher({
    users,
    currentUserId,
    ownerUserId,
    ownerUsername,
    isImpersonating,
}: AccountSwitcherProps) {
    const [pending, startTransition] = useTransition();

    function view(id: number) {
        startTransition(async () => {
            try {
                await switchToUserAction(id);
            } catch {
                toast.error("Bascule impossible.");
            }
        });
    }

    function back() {
        startTransition(async () => {
            try {
                await switchBackAction();
            } catch {
                toast.error("Retour impossible.");
            }
        });
    }

    return (
        <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
                Consulte le compte d&apos;une personne que tu as invitée (lecture de ses données).
            </p>

            <Row
                active={currentUserId === ownerUserId}
                icon={<User className="size-4" />}
                label={`${ownerUsername} (mon compte)`}
                action={
                    currentUserId === ownerUserId ? null : (
                        <Button type="button" variant="outline" size="sm" onClick={back} disabled={pending}>
                            Revenir
                        </Button>
                    )
                }
            />

            {users.map((u) => (
                <Row
                    key={u.id}
                    active={currentUserId === u.id}
                    icon={<Eye className="size-4" />}
                    label={u.username}
                    action={
                        currentUserId === u.id ? null : (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => view(u.id)}
                                disabled={pending}
                            >
                                {pending ? <Loader2 className="size-4 animate-spin" /> : "Voir"}
                            </Button>
                        )
                    }
                />
            ))}

            {isImpersonating ? (
                <p className="text-muted-foreground text-xs">
                    Tu consultes actuellement un autre compte — pense à revenir au tien.
                </p>
            ) : null}
        </div>
    );
}

function Row({
    active,
    icon,
    label,
    action,
}: {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    action: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5",
                active ? "border-primary/50 bg-primary/10" : "border-border",
            )}
        >
            <span className="text-muted-foreground">{icon}</span>
            <span className="flex-1 text-sm font-medium">{label}</span>
            {active ? (
                <span className="text-primary flex items-center gap-1 text-xs font-medium">
                    <Check className="size-3.5" /> actif
                </span>
            ) : (
                action
            )}
        </div>
    );
}
