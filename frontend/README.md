# Frontend CRM Controlle

Aplicacao web em Next.js para operacao comercial multi-tenant: pipeline Kanban, mensagens, equipe, financeiro e administracao.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- TailwindCSS
- dnd-kit (drag and drop do Kanban)

## Estrutura

```text
frontend/
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ KanbanBoard.tsx
│  │  ├─ LoginPanel.tsx
│  │  ├─ pages/
│  │  │  └─ hooks/
│  │  └─ ui/
│  ├─ services/
│  │  └─ api.ts
│  ├─ lib/
│  └─ types/
├─ package.json
└─ tsconfig.json
```

## Variaveis de Ambiente

Crie `frontend/.env.local`:

```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3331
NEXT_PUBLIC_CRM_API_URL=http://localhost:3332
```

## Execucao Local

```bash
cd frontend
npm install
npm run dev
```

Aplicacao disponivel em `http://localhost:3000`.

## Scripts

- `npm run dev`: ambiente de desenvolvimento
- `npm run build`: build de producao
- `npm run start`: sobe build de producao
- `npm run lint`: analise ESLint

## Integracao com Backend

O frontend consome dois servicos:

- Auth API (`NEXT_PUBLIC_AUTH_API_URL`)
- CRM API (`NEXT_PUBLIC_CRM_API_URL`)

O token JWT e enviado no header `Authorization: Bearer <token>`.

Para cenarios de super administracao, o tenant selecionado e persistido no browser e enviado no header `x-tenant-id`.

## Fluxo Funcional

1. Login por email/senha.
2. Bootstrap de sessao e carregamento de pipeline/leads.
3. Operacao do board com drag-and-drop.
4. Acoes por contexto (ex.: botao de WhatsApp na etapa Contato).
5. Navegacao por secoes: home, mensagens, equipe, financeiro e admin.

## Qualidade e Build

```bash
cd frontend
npm run lint
npm run build
```

## Observacoes de UX Implementadas

- Onboarding de tenant sem pipeline com provisionamento automatico.
- Estado vazio sem banner de erro quando nao ha leads.
- Acao rapida de WhatsApp no card da etapa Contato com mensagem pre-preenchida.
