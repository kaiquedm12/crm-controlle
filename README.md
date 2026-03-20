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
