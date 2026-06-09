export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-5 w-10 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 h-4 w-32 rounded bg-muted" />
          <div className="h-48 w-full rounded bg-muted" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 h-4 w-28 rounded bg-muted" />
          <div className="h-48 w-full rounded-full bg-muted" />
        </div>
      </div>
      {/* Table row */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 h-4 w-40 rounded bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-t border-border">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-40 rounded bg-muted" />
              <div className="h-2.5 w-24 rounded bg-muted" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
