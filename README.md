# 🚀 CRM Sales Platform

Sistema de **CRM (Customer Relationship Management)** focado em gestão de vendas, com suporte a estratégias de **Inbound e Outbound (Sales Engagement)**.

O objetivo da plataforma é fornecer uma solução simples, escalável e eficiente para equipes comerciais organizarem seus leads, automatizarem cadências e acompanharem métricas de desempenho.

---

## 📌 Visão Geral

Este projeto foi idealizado com base em uma necessidade real do mercado:

A maioria dos CRMs tradicionais é focada em **Inbound**, enquanto equipes comerciais que trabalham com **Outbound** (prospecção ativa) precisam de ferramentas mais dinâmicas e automatizadas.

A proposta é criar uma solução que atenda ambos os cenários:

- 📥 **Inbound Sales** → Gestão de leads que chegam até a empresa  
- 📤 **Outbound Sales** → Prospecção ativa com cadência e automação  

---

## 🎯 Objetivos

- Centralizar a gestão de leads e oportunidades
- Implementar pipeline de vendas visual (Kanban)
- Automatizar cadências de contato (Outbound)
- Integrar comunicação via WhatsApp
- Gerar relatórios de performance em funil
- Criar uma base sólida para escalabilidade futura

---

## 🧱 Stack Tecnológica

### 🔹 Backend
- Node.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Arquitetura REST

### 🔹 Frontend
- React
- Next.js
- TypeScript
- TailwindCSS (opcional)
- Zustand ou Context API

---

## 📁 Estrutura do Projeto

```bash
crm-sales-platform/
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── leads/
│   │   │   ├── pipeline/
│   │   │   ├── cadences/
│   │   │   ├── messages/
│   │   │   └── reports/
│   │   │
│   │   ├── infra/
│   │   │   ├── database/
│   │   │   ├── http/
│   │   │   └── integrations/
│   │   │
│   │   ├── shared/
│   │   │   ├── utils/
│   │   │   ├── errors/
│   │   │   └── types/
│   │   │
│   │   └── app.ts
│   │
│   ├── prisma/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── contexts/
│   │   └── styles/
│   │
│   └── package.json
│
└── README.md
```

## ⚙️ Funcionalidades

### 📊 Pipeline de Vendas (Kanban)
- Visualização em colunas (ex: Lead → Contato → Proposta → Fechado)
- Drag and drop entre etapas
- Personalização de pipeline

---

### 🔁 Cadência de Contato (Outbound)
- Criação de fluxos de contato automatizados

**Exemplo:**
- Dia 1 → Mensagem WhatsApp
- Dia 3 → Follow-up
- Dia 5 → Última tentativa

- Agendamento automático
- Histórico de interações

---

### 📱 Integração com WhatsApp
- Envio de mensagens diretamente pelo CRM
- Templates reutilizáveis
- Registro automático de interações

> Nota: integração via WhatsApp Business API (planejado)

---

### 📈 Relatórios e Funil
- Taxa de conversão por etapa
- Tempo médio por estágio
- Performance por vendedor
- Dashboard com métricas

---

### 👤 Gestão de Leads
- Cadastro manual ou importação
- Histórico completo de interações
- Tags e segmentação

---

### 🔐 Autenticação e Permissões
- Autenticação com JWT

**Controle de acesso:**
- Admin
- Vendedor
- Gestor

---

## 🗄️ Modelagem Inicial

### Entidades principais:
- Users
- Leads
- Pipelines
- Stages
- Deals
- Cadences
- Messages
- Activities

---

## 🔄 Fluxo do Sistema

1. Usuário cria/importa um lead  
2. Lead entra no pipeline (Kanban)  
3. É atribuída uma cadência de contato  
4. Interações são executadas (manual ou automatizada)  
5. Lead avança nas etapas  
6. Conversão é registrada  
7. Dados alimentam relatórios  

---

## 🔌 Integrações Futuras
- WhatsApp Business API
- Email (SMTP / SendGrid)
- Webhooks
- APIs de geração de leads

---

## 🧪 Testes

### Backend
- Jest
- Supertest

### Frontend
- Jest
- React Testing Library

---
