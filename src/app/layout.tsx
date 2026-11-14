import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/register-sw";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeColorSync } from "@/components/theme-color-sync";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Programme 58 jours",
    description: "Assistant d'entraînement — programme de 58 jours",
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/icon.svg", type: "image/svg+xml" },
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        ],
        apple: "/apple-touch-icon.png",
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "58 jours",
    },
};

export const viewport: Viewport = {
    themeColor: "#ffffff",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    // Contenu sous la barre d'accueil de l'iPhone : les marges `safe-area` la contournent.
    viewportFit: "cover",
};

// Applique la taille d'affichage et la couleur du thème avant le premier paint (évite le flash).
const sizeScript = `(function(){try{var d=document.documentElement;var s=localStorage.getItem('ui-size');if(s&&s!=='normal')d.setAttribute('data-size',s);var a=localStorage.getItem('ui-accent');if(a&&a!=='citron')d.setAttribute('data-accent',a);}catch(e){}})();`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
            <body className="bg-background text-foreground flex min-h-full flex-col">
                <script dangerouslySetInnerHTML={{ __html: sizeScript }} />
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    <ThemeColorSync />
                    {children}
                    <Toaster position="top-center" />
                </ThemeProvider>
                <RegisterSW />
            </body>
        </html>
    );
}
