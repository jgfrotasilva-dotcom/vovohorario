# 🚀 Guia de Deploy no Vercel

## Passo 1: Preparar o Código

1. Crie uma pasta no seu computador
2. Copie todos os arquivos do projeto
3. Crie um repositório no GitHub

## Passo 2: Configurar o Supabase

1. Acesse https://supabase.com
2. Selecione seu projeto
3. Vá em **Settings → Database**
4. Copie a **URI** (Connection string)
5. Formato: `postgresql://postgres.SENHA@db.PROJETO.supabase.co:5432/postgres`

## Passo 3: Deploy no Vercel

1. Acesse https://vercel.com
2. Clique em **"Add New Project"**
3. Selecione **"Import Git Repository"**
4. Escolha seu repositório do GitHub
5. Clique em **"Import"**

## Passo 4: Configurar Environment Variables

Na tela de deploy, adicione:

```
DATABASE_URL=postgresql://postgres.SUA_SENHA@db.bueynmtetdriftuyivqr.supabase.co:5432/postgres
JWT_SECRET=ponto-eletronico-chave-secreta-forte-2026
```

⚠️ **IMPORTANTE:** Substitua SUA_SENHA pela senha real do Supabase

## Passo 5: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Pronto! O sistema estará online

## Passo 6: Configurar o Banco de Dados

Após o deploy, acesse o terminal do Vercel:

1. Vá em **Settings → General → Build & Development Settings**
2. Ative **"Terminal"**
3. Rode os comandos:

```bash
npx drizzle-kit push
npx tsx src/db/seed-admin.ts
```

## Passo 7: Acessar o Sistema

- **URL:** https://seu-app.vercel.app
- **Login:** admin@sistema.com
- **Senha:** admin123

## 📱 Para os Servidores

Eles acessam pelo navegador do celular:
1. Digitem o endereço do sistema
2. Façam login com e-mail e CPF
3. Adicionem à tela inicial para acesso rápido

## 🔧 Solução de Problemas

### Erro de conexão com banco
- Verifique se a DATABASE_URL está correta
- Verifique se a senha está correta
- Teste a conexão no Supabase Dashboard

### Erro de build
- Verifique se todos os arquivos estão no GitHub
- Verifique os logs do Vercel

### Erro de autenticação
- Verifique se o JWT_SECRET está definido
- Verifique se o seed foi executado
