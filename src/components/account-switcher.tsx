"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Eye, Loader2, User, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { switchToUserAction, switchBackAction, deleteUserAction } from "@/lib/actions";

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
    const [toDelete, setToDelete] = useState<Account | null>(null);
    const [deleting, startDelete] = useTransition();

    // Suppression proposée seulement depuis son propre compte (pas en consultation).
    const atHome = currentUserId === ownerUserId;

    function view(id: number) {
        startTransition(async () => {
            try {
                await switchToUserAction(id);
                window.location.assign("/");
            } catch {
                toast.error("Bascule impossible.");
            }
        });
    }

    function back() {
        startTransition(async () => {
            try {
                await switchBackAction();
                window.location.assign("/");
            } catch {
                toast.error("Retour impossible.");
            }
        });
    }

    function confirmDelete() {
        if (!toDelete) return;
        const id = toDelete.id;
        startDelete(async () => {
            try {
                await deleteUserAction(id);
                setToDelete(null);
                window.location.assign("/parametres");
            } catch {
                toast.error("Suppression impossible.");
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

            {users.map((u) => {
                const isActive = currentUserId === u.id;
                const showDelete = atHome && !isActive;
                const action =
                    !isActive || showDelete ? (
                        <div className="flex items-center gap-1">
                            {!isActive ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => view(u.id)}
                                    disabled={pending}
                                >
                                    {pending ? <Loader2 className="size-4 animate-spin" /> : "Voir"}
                                </Button>
                            ) : null}
                            {showDelete ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-9"
                                    onClick={() => setToDelete(u)}
                                    aria-label={`Supprimer ${u.username}`}
                                >
                                    <Trash2 className="text-destructive size-4" />
                                </Button>
                            ) : null}
                        </div>
                    ) : null;
                return (
                    <Row key={u.id} active={isActive} icon={<Eye className="size-4" />} label={u.username} action={action} />
                );
            })}

            {isImpersonating ? (
                <p className="text-muted-foreground text-xs">
                    Tu consultes actuellement un autre compte — pense à revenir au tien.
                </p>
            ) : null}

            <Dialog open={toDelete != null} onOpenChange={(o) => (o ? null : setToDelete(null))}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Supprimer ce compte ?</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground text-sm">
                        Le compte <strong>{toDelete?.username}</strong> et toutes ses données (poids,
                        séances, nutrition, mensurations, photos) seront effacés définitivement.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="h-11 flex-1"
                            onClick={() => setToDelete(null)}
                            disabled={deleting}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            className="h-11 flex-1"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="size-4 animate-spin" /> : "Supprimer"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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
            {action ??
                (active ? (
                    <span className="text-primary flex items-center gap-1 text-xs font-medium">
                        <Check className="size-3.5" /> actif
                    </span>
                ) : null)}
        </div>
    );
}
