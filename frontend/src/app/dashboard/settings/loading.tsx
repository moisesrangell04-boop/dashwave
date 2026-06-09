export default function SettingsLoading() {
  return (
    <div className="flex h-full animate-pulse">
      {/* Sidebar tabs */}
      <div className="w-56 shrink-0 border-r border-border bg-card p-4 space-y-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-9 w-full rounded-lg bg-muted" />
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="h-4 w-36 rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-9 w-full rounded-lg bg-muted" />
              </div>
            ))}
          </div>
          <div className="h-9 w-28 rounded-lg bg-muted" />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="h-4 w-40 rounded bg-muted" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 rounded bg-muted" />
                <div className="h-3 w-52 rounded bg-muted" />
              </div>
              <div className="h-6 w-10 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
