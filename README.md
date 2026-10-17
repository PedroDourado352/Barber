# Barberly

Sistema de gestão para barbearias — agenda, clientes, serviços e caixa — construído com React + Vite.

## Rodar localmente

```bash
npm install
npm run dev
```

A aplicação fica disponível em `http://127.0.0.1:5173/`.

Para gerar a versão de produção:

```bash
npm run build      # gera a pasta dist/
npm run preview    # serve o build localmente
```

## O que já está funcional

- **Autenticação** — criar conta, login e logout com validação real (sessão guardada no navegador).
- **Agenda** — criar, editar, confirmar, concluir e cancelar agendamentos; navegação por dia.
- **Serviços e equipe** — cadastro de serviços (nome, duração, preço) e de barbeiros (com % de comissão).
- **Clientes** — cadastro, busca, ficha com histórico de atendimentos e total gasto.
- **Caixa / financeiro** — cada atendimento concluído vira uma entrada automática; lançamentos manuais (entradas/saídas), resumo por período (hoje / 7 dias / mês).
- **Relatórios** — comissão por barbeiro e serviços mais populares.
- **Dashboard** — faturamento do dia, agendamentos, novos clientes, ocupação e gráfico dos últimos 7 dias, tudo calculado a partir dos dados reais.

## Onde os dados ficam

Hoje os dados são salvos no **navegador** (localStorage). Toda a aplicação conversa apenas com a camada em `src/lib/` (nunca com o localStorage diretamente), então a migração para um backend é isolada.

> **Próximo passo (multi-dispositivo + app mobile):** trocar a implementação de `src/lib/db.js` e dos métodos de `src/lib/store.jsx` por **Firebase (Firestore + Auth)**. As telas não mudam. Com o Firestore, o mesmo backend passa a servir este painel web e um futuro app em Flutter.

## Estrutura

```text
src/
├── app/                 # App + roteamento entre páginas
├── components/
│   ├── layout/          # Sidebar / topbar
│   └── ui/              # Modal, ConfirmDialog, EmptyState
├── features/
│   ├── auth/            # tela de login/cadastro
│   ├── dashboard/       # visão geral e métricas
│   ├── appointments/    # agenda e agendamentos
│   ├── clients/         # clientes e histórico
│   ├── services/        # serviços e equipe
│   └── finance/         # caixa, pagamentos e relatórios
├── lib/                 # camada de dados (db, store, selectors, utils)
└── styles/              # global.css + components.css
```
