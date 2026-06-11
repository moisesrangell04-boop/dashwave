'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function PipelinesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PipelinesError]', error.name, error.message, error.stack);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Erro ao carregar pipelines</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || 'Ocorreu um erro inesperado.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </button>
    </div>
  );
}
