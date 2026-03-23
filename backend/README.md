# Backend CRM Sales Platform

Backend REST em Node.js + TypeScript com arquitetura modular, Prisma ORM e PostgreSQL no Supabase.

## Stack

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL (Supabase)
- JWT (access + refresh)
- Zod (validacao)
- node-cron (scheduler de cadencias)

## Arquitetura

- Modular Monolith por dominio (`auth`, `users`, `leads`, etc.)
- Separacao por camada HTTP e aplicacao:
	- `routes.ts`: definicao de rotas e middlewares
	- `controllers/`: validacao de entrada e orquestracao HTTP
	- `application/*-service.ts`: regras de negocio e casos de uso
- Persistencia com Prisma usada diretamente pelos services
- Sem camada de repositorio dedicada neste momento

## Estrutura

```bash
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── infra/
│   │   ├── database/prisma/client.ts
│   │   ├── integrations/whatsapp/whatsapp-client.ts
│   │   └── queue/cadence-scheduler.ts
│   ├── main/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── application/auth-service.ts
│   │   │   ├── controllers/auth-controller.ts
│   │   │   └── routes.ts
│   │   ├── users/
│   │   │   ├── application/users-service.ts
│   │   │   ├── controllers/users-controller.ts
│   │   │   └── routes.ts
│   │   ├── leads/
│   │   │   ├── application/leads-service.ts
│   │   │   ├── controllers/leads-controller.ts
│   │   │   └── routes.ts
│   │   ├── pipeline/
│   │   ├── deals/
│   │   ├── cadences/
│   │   ├── messages/
│   │   ├── reports/
│   │   ├── activities/
│   │   └── integrations/
│   └── shared/
│       ├── errors/AppError.ts
│       ├── middlewares/
│       └── utils/
├── .env.example
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## Como rodar

1. Criar arquivo `.env` com base em `.env.example` e configurar `DATABASE_URL` do Supabase.

```bash
docker compose up -d
```

2. Instalar dependencias (se for rodar local sem Docker):

```bash
npm install
```

3. Gerar Prisma Client e aplicar migrations:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4. Popular dados iniciais:

```bash
npm run prisma:seed
```

5. Rodar API em desenvolvimento (local):

```bash
npm run dev
```

Ou subir a API com Docker Compose:

```bash
docker compose up -d
```

## Scripts

- `npm run dev`: sobe a API com watch
- `npm run build`: compila TypeScript para `dist`
- `npm run start`: executa build compilada
- `npm run test`: executa testes automatizados (Vitest)
- `npm run test:watch`: executa testes em modo watch
- `npm run prisma:generate`: gera Prisma Client
- `npm run prisma:migrate -- --name init`: cria/aplica migration local
- `npm run prisma:deploy`: aplica migrations em ambiente de deploy
- `npm run prisma:seed`: popula dados iniciais

## Testes

- Framework: `Vitest`
- Testes HTTP: `Supertest`
- Os testes atuais usam mock do Prisma (nao dependem de banco ativo)
- Arquivos principais:
	- `tests/integration/app.test.ts`
	- `tests/mocks/prisma-mock.ts`

API: `http://localhost:3333`
Healthcheck: `GET /health`

## Usuario inicial (seed)

- Email: `admin@crm.local`
- Senha: `admin123`
- Role: `ADMIN`

## Endpoints principais

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

### Users
- `GET /users` (ADMIN, MANAGER)
- `POST /users` (ADMIN)
- `PATCH /users/:id` (ADMIN)
- `DELETE /users/:id` (ADMIN)

### Leads
- `GET /leads`
- `POST /leads`
- `PATCH /leads/:id`
- `DELETE /leads/:id`

### Pipeline
- `GET /pipeline`
- `POST /pipeline` (ADMIN, MANAGER)
- `POST /pipeline/:pipelineId/stages` (ADMIN, MANAGER)
- `POST /pipeline/move-lead/:leadId`

### Deals
- `GET /deals`
- `POST /deals`
- `PATCH /deals/:id`

### Cadences
- `GET /cadences`
- `POST /cadences` (ADMIN, MANAGER)
- `POST /cadences/:cadenceId/steps` (ADMIN, MANAGER)
- `POST /cadences/assign`

### Messages
- `GET /messages`
- `POST /messages/send`

### Integrations
- `POST /integrations/whatsapp/webhook`

### Activities
- `GET /activities`
- `GET /activities/lead/:leadId`

### Reports
- `GET /reports/funnel`
- `GET /reports/deals`
- `GET /reports/performance/users`

## Scheduler

O scheduler executa automaticamente no bootstrap do servidor e processa cadencias ativas a cada minuto.

## Seguranca

- Senhas com `bcryptjs`
- JWT access + refresh
- Middleware de autenticacao
- Middleware de autorizacao por role
- Validacao de payload com Zod
- CORS ativo
