# Wave CRM — Progresso da Sessão

## Resumo
Após corrigir 8 bugs críticos nas configurações e o React error #310, implementamos os itens pendentes:

## Implementado
- **CSV Export**: Utilitário reutilizável `frontend/src/lib/csv.ts` + botões em leads e contatos
- **Kanban visual feedback**: `dragOverStageId` state, highlight da coluna alvo (borda/background/scale), `opacity-50` no card arrastado, `handleDragLeave` para limpeza
- **Test Webhook**: Botão por webhook na settings, mutation `POST /webhooks/test/:id`
- **CI/CD**: `.github/workflows/ci.yml` — lint, typecheck, test, build (frontend + backend)
- **Onboarding**: Modal de 4 passos que aparece no primeiro login, salva em localStorage
- **Botão "Exportar CSV"** nas páginas de contatos e leads

## Verificado
- Frontend: build limpo (21 páginas, sem erros)
- Backend: `nest build` sem erros

## Estrutura de Arquivos Criados/Modificados
- `frontend/src/lib/csv.ts` — NOVO (exportToCSV)
- `frontend/src/components/features/onboarding-modal.tsx` — NOVO
- `.github/workflows/ci.yml` — NOVO
- `frontend/src/app/dashboard/leads/page.tsx` — modificado (CSV + kanban drag)
- `frontend/src/app/dashboard/contacts/page.tsx` — modificado (CSV)
- `frontend/src/app/dashboard/settings/page.tsx` — modificado (test webhook)
- `frontend/src/app/dashboard/layout.tsx` — modificado (onboarding)
