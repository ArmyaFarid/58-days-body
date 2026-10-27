// Remonté à chaque navigation : fondu court à l'arrivée de la nouvelle page.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
    return <div className="animate-in fade-in duration-200">{children}</div>;
}
