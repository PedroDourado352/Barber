# Barberly

Base de um SaaS de agendamento para barbearias, construída com React e Vite.

## Rodar localmente

```bash
npm install
npm run dev
```

A aplicação fica disponível em `http://127.0.0.1:5173/`.

## Estrutura

```text
src/
├── app/                 # composição da aplicação e navegação global
├── components/layout/   # layout compartilhado entre as páginas
├── features/
│   ├── appointments/    # agenda, agendamentos e regras do domínio
│   └── dashboard/       # visão geral e métricas da operação
├── lib/                 # clientes de API, storage e utilitários futuros
├── pages/               # entradas de rota quando o produto crescer
└── styles/              # tokens e estilos globais
```

Novos módulos devem ficar dentro de `features/` quando tiverem regras próprias. Componentes visuais genéricos podem evoluir para `components/ui/` sem misturar regras de negócio com o layout.

## Scripts

- `npm run dev`: servidor de desenvolvimento
- `npm run build`: build de produção
- `npm run preview`: serve o build localmente