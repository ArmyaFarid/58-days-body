export const POSES: { key: string; label: string }[] = [
    { key: "face-relache", label: "Face relâché" },
    { key: "face-contracte", label: "Face contracté" },
    { key: "dos", label: "Dos" },
    { key: "profil", label: "Profil" },
];

export function poseLabel(key: string): string {
    return POSES.find((p) => p.key === key)?.label ?? key;
}
