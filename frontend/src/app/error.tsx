'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground">Algo deu errado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Ref: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}
