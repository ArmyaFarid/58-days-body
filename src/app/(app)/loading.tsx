// Squelette affiché dès le tap : la page dynamique arrive ensuite en streaming.
export default function AppLoading() {
    return (
        <div className="flex animate-pulse flex-col gap-4 p-4" aria-busy="true" aria-label="Chargement">
            <div className="bg-muted h-7 w-1/2 rounded-md" />
            <div className="bg-muted h-4 w-3/4 rounded-md" />
            <div className="bg-muted h-36 rounded-xl" />
            <div className="bg-muted h-24 rounded-xl" />
            <div className="bg-muted h-24 rounded-xl" />
        </div>
    );
}
