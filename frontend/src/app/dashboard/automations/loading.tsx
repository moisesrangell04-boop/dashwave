export default function AutomationsLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-9 w-48 rounded-lg bg-muted" />
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-3 w-72 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-6 w-10 rounded-full bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
