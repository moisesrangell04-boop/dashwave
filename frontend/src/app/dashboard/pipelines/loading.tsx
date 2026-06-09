export default function PipelinesLoading() {
  return (
    <div className="flex flex-col gap-4 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-9 w-44 rounded-lg bg-muted" />
        <div className="h-9 w-32 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border px-4 py-3 bg-muted/30">
          {[160, 80, 80, 80, 80].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted" style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted ml-2" />
            <div className="h-3 w-16 rounded bg-muted ml-2" />
            <div className="ml-auto flex gap-2">
              <div className="h-7 w-7 rounded bg-muted" />
              <div className="h-7 w-7 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
