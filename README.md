# CRM Controlle

Plataforma CRM multi-tenant para operação comercial com foco em pipeline, produtividade de equipe e governança de acesso por perfil.

## Visão Executiva

O projeto está organizado como monorepo com duas aplicações principais:

- Backend TypeScript com serviços separados para autenticação e domínio CRM.
- Frontend Next.js para operação diária de funil, equipe, mensagens, finanças e administração.

O sistema suporta:

- Multi-tenant com isolamento por tenant.
- RBAC com perfis SUPER_ADMIN, TENANT_ADMIN e USER.
- Pipeline Kanban com movimentação de leads.
- Relatórios operacionais (funil, performance de usuários e deals).
- Fluxo inicial de onboarding com provisionamento automático de pipeline padrão.

## Arquitetura

```text
frontend (Next.js 16)
	|
	| HTTP (JWT)
	v
auth-service (3331)      crm-service (3332)
		 \                    /
		  \                  /
			 PostgreSQL + Prisma
```

## Estrutura do Repositório

```text
.
├─ backend/
│  ├─ prisma/
│  ├─ src/
│  │  ├─ infra/
│  │  ├─ main/
│  │  ├─ modules/
│  │  └─ shared/
│  └─ README.md
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ services/
│  │  └─ types/
│  └─ README.md
└─ README.md
```

## Stack Tecnológico

- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, JWT, Vitest.
- Frontend: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, dnd-kit.
- Infra local: Docker Compose para execução de serviços backend.

## Início Rápido

Pré-requisitos:

- Node.js 22+
- npm 10+
- Banco PostgreSQL disponível (local ou cloud)

### 1) Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev:auth
# em outro terminal
npm run dev:crm
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

## Portas Padrão

- Frontend: 3000
- Auth Service: 3331
- CRM Service: 3332

## Documentação por Módulo

- Backend técnico: ver `backend/README.md`
- Frontend técnico: ver `frontend/README.md`

## Segurança e Acesso

- Tokens JWT (access + refresh).
- Escopo tenant por token e por header `x-tenant-id` para operações de SUPER_ADMIN.
- Middlewares de autenticação, autorização por perfil e tratamento de erro centralizado.

## Estado Atual do Produto

Implementado:

- Login e sessão multi-tenant.
- Painel Kanban com drag-and-drop.
- Gestão de usuários por tenant e camada global de administração.
- Integrações e relatórios básicos de operação.

Em evolução:

- Integrações externas avançadas.
- Observabilidade e hardening de produção.
