"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

// Couleur réelle du fond, convertie en hex : les couleurs du thème sont en
// oklch, que la balise theme-color ne comprend pas partout.
function backgroundHex(): string | null {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Barre système (Android, onglets) de la couleur du thème choisi dans l'app. */
export function ThemeColorSync() {
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        const hex = backgroundHex();
        if (!hex) return;
        let metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
        if (metas.length === 0) {
            const meta = document.createElement("meta");
            meta.name = "theme-color";
            document.head.appendChild(meta);
            metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
        }
        metas.forEach((m) => m.setAttribute("content", hex));
    }, [resolvedTheme]);

    return null;
}
