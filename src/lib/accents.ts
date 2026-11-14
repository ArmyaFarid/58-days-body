export type Accent = "citron" | "rose" | "bleu" | "orange";

export const ACCENTS: { key: Accent; label: string; color: string; ground: string }[] = [
    { key: "citron", label: "Citron", color: "#c6f432", ground: "#0e0f12" },
    { key: "rose", label: "Rose", color: "#ff6fb5", ground: "#110d10" },
    { key: "bleu", label: "Bleu", color: "#5ec8ff", ground: "#0b0e13" },
    { key: "orange", label: "Orange", color: "#ff8a3d", ground: "#110e0c" },
];

export const ACCENT_STORAGE_KEY = "ui-accent";

/** Applique la couleur sur <html> (sans l'enregistrer). */
export function applyAccent(accent: Accent) {
    if (accent === "citron") document.documentElement.removeAttribute("data-accent");
    else document.documentElement.setAttribute("data-accent", accent);
    window.dispatchEvent(new Event("ui-accent-change"));
}

/** Applique et retient la couleur sur cet appareil. */
export function saveAccent(accent: Accent) {
    try {
        localStorage.setItem(ACCENT_STORAGE_KEY, accent);
    } catch {
        // localStorage indisponible : la couleur reste appliquée pour la session.
    }
    // Après l'enregistrement : l'événement prévient aussi ceux qui lisent le stockage.
    applyAccent(accent);
}
