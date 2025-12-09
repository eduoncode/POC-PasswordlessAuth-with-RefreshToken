# POC - Passwordless Auth with Refresh Token

Projeto de prova de conceito (POC) para autenticação sem senha (passwordless) com suporte a refresh tokens.

## Visão geral

- Backend: API construída com NestJS (pasta `backend/`).
- Objetivo: demonstrar fluxo de login por token (ex.: link por e-mail), emissão de access token JWT e refresh token.

## Estrutura do repositório

- `backend/` - aplicação NestJS (código fonte, testes, scripts).
  - `src/` - código fonte da aplicação.
  - `test/` - testes E2E.

## Pré-requisitos

- Node.js 18+ (recomenda-se v18 ou v20)
- npm (ou yarn/pnpm se preferir)

## Como rodar (desenvolvimento)

No root do repositório:

```bash
cd backend
npm install
npm run start:dev
```

Scripts úteis (local `backend/package.json`):

- `npm run start:dev` - inicia NestJS em modo watch (desenvolvimento)
- `npm run start` - inicia a aplicação (modo padrão)
- `npm run start:prod` - inicia a build já criada em `dist/`
- `npm run build` - compila o projeto NestJS
- `npm test` - executa os testes (Jest)
- `npm run test:e2e` - executa testes E2E

## Variáveis de ambiente (exemplo)

Crie um arquivo `.env` dentro de `backend/` com as variáveis necessárias para o seu ambiente. Exemplo (ajuste conforme seu código):

```
SMTP_HOST=smtp.example.email
SMTP_PORT=587
SMTP_USER=example@user.email
SMTP_PASS=examplepassword
JWT_ACCESS_SECRET=<example_access_secret> should be replaced with a strong secret key
JWT_REFRESH_SECRET=<example_refresh_secret> should be replaced with a strong secret key
```

Verifique o código em `backend/src` para confirmar todas as chaves usadas.

## Banco de dados

Este projeto usa `sqlite3` nas dependências — por padrão a configuração pode usar um arquivo local. Ajuste `DATABASE_URL` conforme necessário para usar outro SGBD.

## Testes

Para rodar testes unitários e E2E:

```bash
cd backend
npm test
npm run test:e2e
```

## Desenvolvimento e contribuições

- Recomendado: usar `npm run format` e `npm run lint` antes de abrir PRs.
- Se quiser adicionar um README mais detalhado dentro do `backend/`, posso criar também.

---
