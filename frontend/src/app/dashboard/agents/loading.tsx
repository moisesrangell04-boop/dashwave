export default function AgentsLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-9 w-56 rounded-lg bg-muted" />
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="h-5 w-14 rounded-full bg-muted" />
            </div>
            <div className="h-12 w-full rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-lg bg-muted" />
              <div className="h-8 flex-1 rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
