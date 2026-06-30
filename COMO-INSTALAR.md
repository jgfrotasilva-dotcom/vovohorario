# 📦 Como Instalar e Rodar o Sistema

## Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- [Git](https://git-scm.com/) instalado

---

## Passo 1: Instalar Dependências

Abra o terminal na pasta do projeto e digite:

```bash
npm install
```

Aguarde instalar tudo (pode levar 1-2 minutos).

---

## Passo 2: Configurar o Banco de Dados

### Opção A: Supabase (Recomendado - Gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **Settings → Database**
4. Copie a **URI** (Connection string)
5. Abra o arquivo `.env` e cole:

```
DATABASE_URL=sua_url_do_supabase_aqui
JWT_SECRET=minha-chave-secreta-forte
```

### Opção B: Banco Local

Se tiver PostgreSQL instalado localmente, o `.env` já está configurado.

---

## Passo 3: Aplicar Schema ao Banco

```bash
npx drizzle-kit push
```

Isso cria todas as tabelas no banco de dados.

---

## Passo 4: Criar Usuário Administrador

```bash
npx tsx src/db/seed-admin.ts
```

Isso cria o usuário admin com:
- **Email:** admin@sistema.com
- **Senha:** admin123

---

## Passo 5: Iniciar o Sistema

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 🚀 Resumo Rápido

```bash
npm install
npx drizzle-kit push
npx tsx src/db/seed-admin.ts
npm run dev
```

---

## ⚠️ Erros Comuns

### "Cannot find module 'drizzle-orm'"
Execute: `npm install`

### "Cannot find module 'dotenv/config'"
Execute: `npm install`

### "DATABASE_URL is required"
Configure o arquivo `.env` com a URL do banco

### "relation already exists"
O schema já foi aplicado. Pode pular o `drizzle-kit push`

---

## 📱 Deploy no Vercel

Veja o arquivo `DEPLOY-VERCEL.md` para instruções de publicação.
