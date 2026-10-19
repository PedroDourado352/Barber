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

## Autenticação com Supabase

O login usa **Supabase Auth**. Enquanto as chaves não forem configuradas, o app
cai automaticamente em um login local (localStorage) — nada quebra.

### Como ativar (grátis)

1. Crie uma conta em https://supabase.com e um novo projeto (plano **Free**).
2. No projeto, vá em **Project Settings → API** e copie:
   - **Project URL**
   - **Project API keys → `anon` `public`** (essa chave é pública; pode ir no front-end)
3. Abra o arquivo `.env` na raiz de `Barber/` e preencha:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. (Opcional, para testar rápido) Em **Authentication → Sign In / Providers → Email**,
   desligue "Confirm email" para entrar sem confirmar por e-mail. Para produção,
   deixe ligado e configure o **Site URL** em **Authentication → URL Configuration**.
5. Reinicie o `npm run dev`. Pronto — cadastro e login passam a usar o Supabase.

> Os dados do negócio (agenda, clientes, serviços, caixa) ainda ficam no navegador.
> O próximo passo é mover essas tabelas para o Postgres do Supabase (com RLS),
> reaproveitando o mesmo login — aí o sistema funciona em vários dispositivos e
> habilita um app mobile.

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
