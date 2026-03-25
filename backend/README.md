# Backend CRM Controlle

Servicos REST em Node.js/TypeScript para autenticacao e dominio CRM, com persistencia em PostgreSQL via Prisma ORM.

## Componentes

- Auth Service: login, refresh token, registro e contexto de identidade.
- CRM Service: modulos de negocio (leads, pipeline, deals, relatorios, usuarios, admin, mensagens e cadencias).

## Stack

- Runtime: Node.js 22+
- Linguagem: TypeScript
- Web: Express
- Validacao: Zod
- Persistencia: Prisma + PostgreSQL
- Seguranca: JWT, bcryptjs, rate limit
- Testes: Vitest + Supertest

## Arquitetura de Pastas

```text
backend/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ src/
│  ├─ infra/
│  │  ├─ database/prisma/client.ts
│  │  ├─ integrations/
│  │  └─ queue/
│  ├─ main/
│  │  ├─ auth-app.ts
│  │  ├─ auth-server.ts
│  │  ├─ crm-app.ts
│  │  └─ crm-server.ts
│  ├─ modules/
│  └─ shared/
└─ tests/
```

## Variaveis de Ambiente

Crie um arquivo `.env` em `backend/` com, no minimo:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AUTH_SERVICE_PORT=3331
CRM_SERVICE_PORT=3332
WHATSAPP_PROVIDER=stub
```

Observacao: ha fallback de portas no codigo para 3331/3332 quando nao informado.

## Execucao Local

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

Inicie os servicos em terminais separados:

```bash
npm run dev:auth
npm run dev:crm
```

## Execucao com Docker

```bash
cd backend
docker compose up -d
```

## Scripts Disponiveis

- `npm run dev`: servidor legado unico (`src/main/server.ts`)
- `npm run dev:auth`: Auth Service em modo watch
- `npm run dev:crm`: CRM Service em modo watch
- `npm run build`: compilacao TypeScript
- `npm run start:auth`: inicia Auth compilado
- `npm run start:crm`: inicia CRM compilado
- `npm run test`: executa testes (vitest run)
- `npm run test:watch`: executa testes em watch
- `npm run prisma:generate`: gera Prisma Client
- `npm run prisma:migrate -- --name <nome>`: cria/aplica migration local
- `npm run prisma:deploy`: aplica migrations pendentes
- `npm run prisma:seed`: carrega dados de seed

## Endpoints de Referencia

Base Auth: `http://localhost:3331`

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

Base CRM: `http://localhost:3332`

- `GET /health`
- `GET /pipeline`
- `POST /pipeline`
- `POST /pipeline/:pipelineId/stages`
- `POST /pipeline/move-lead/:leadId`
- `GET /leads`
- `POST /leads`
- `PATCH /leads/:id`
- `GET /users`
- `POST /users`
- `GET /reports/funnel`
- `GET /reports/deals`
- `GET /reports/performance/users`

## Multi-Tenancy e RBAC

- Perfis: `SUPER_ADMIN`, `TENANT_ADMIN`, `USER`.
- Escopo tenant derivado de token (`tenantId`) e, para `SUPER_ADMIN`, pode ser sobrescrito por header `x-tenant-id`.
- Middlewares de auth/role aplicados por modulo de rota.

## Seed e Onboarding

O seed cria usuarios iniciais e tenant de referencia.

No fluxo atual, tenants novos recebem provisionamento de pipeline inicial para evitar ambiente vazio no primeiro acesso.

## Testes

```bash
cd backend
npm run test
```

Arquivos de referencia:

- `tests/integration/app.test.ts`
- `tests/mocks/prisma-mock.ts`
