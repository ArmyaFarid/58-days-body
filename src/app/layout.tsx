import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/register-sw";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
    variable: "--font-geist-sans",
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
};

// Applique la taille d'affichage avant le premier paint (évite le flash).
const sizeScript = `(function(){try{var s=localStorage.getItem('ui-size');if(s&&s!=='normal')document.documentElement.setAttribute('data-size',s);}catch(e){}})();`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning className={`${geistSans.variable} h-full antialiased`}>
            <body className="bg-background text-foreground flex min-h-full flex-col">
                <script dangerouslySetInnerHTML={{ __html: sizeScript }} />
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster position="top-center" />
                </ThemeProvider>
                <RegisterSW />
            </body>
        </html>
    );
}
