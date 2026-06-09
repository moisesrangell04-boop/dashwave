export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      {/* Date filters */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-36 rounded-lg bg-muted" />
        <div className="h-9 w-36 rounded-lg bg-muted" />
        <div className="h-9 w-28 rounded-lg bg-muted" />
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-7 w-16 rounded bg-muted" />
            <div className="h-2.5 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 h-4 w-40 rounded bg-muted" />
            <div className="h-52 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 h-4 w-32 rounded bg-muted" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-border py-3">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 h-3 w-32 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
