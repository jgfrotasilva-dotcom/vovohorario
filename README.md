# 🕐 Sistema de Ponto Eletrônico

Sistema completo de gerenciamento de registro de ponto para servidores públicos.

## 🚀 Funcionalidades

- ✅ Dashboard com estatísticas
- ✅ Cadastro de servidores com jornada flexível
- ✅ Registro de ponto com horário do sistema
- ✅ Ausências e licenças
- ✅ Banco de horas
- ✅ Folha de ponto para impressão
- ✅ Relatórios completos
- ✅ Controle de usuários com perfis
- ✅ Design responsivo (Desktop, Tablet, Celular)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL (Supabase, Neon, ou Vercel Postgres)

## 🛠️ Tecnologias

- Next.js 16
- TypeScript
- Tailwind CSS
- Drizzle ORM
- PostgreSQL

## 🚀 Deploy no Vercel

### 1. Criar banco PostgreSQL (Supabase)

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Vá em **Settings → Database**
5. Copie a **Connection string** (URI)
6. Formato: `postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres`

### 2. Preparar o código

1. Faça upload do projeto para o GitHub
2. Certifique-se que o `.env.example` está no repositório

### 3. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Crie uma conta gratuita
3. Clique em **"Add New Project"**
4. Importe o repositório do GitHub
5. Configure as **Environment Variables**:

```
DATABASE_URL=sua_url_do_supabase
JWT_SECRET=uma_chave_secreta_forte_aqui
```

6. Clique em **"Deploy"**

### 4. Aplicar schema do banco

Após o deploy, acesse o terminal do Vercel ou rode localmente:

```bash
# Conecte-se ao banco do Supabase
npx drizzle-kit push
```

Ou execute o seed para criar o usuário admin:

```bash
npx tsx src/db/seed-admin.ts
```

### 5. Acessar o sistema

- **URL:** `https://seu-app.vercel.app`
- **Login:** admin@sistema.com
- **Senha:** admin123

## 👤 Usuários

### Administrador
- **Email:** admin@sistema.com
- **Senha:** admin123
- Acesso total ao sistema

### Servidores
- **Email:** e-mail cadastrado no servidor
- **Senha:** CPF do servidor
- Acesso: Meu Ponto + Minha Senha

## 📱 Acesso pelo Celular

1. Abra o navegador do celular
2. Acesse o endereço do sistema
3. Faça login
4. Para adicionar à tela inicial:
   - **Chrome:** Menu → "Adicionar à tela inicial"
   - **Safari:** Compartilhar → "Adicionar à Tela de Início"

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar banco local
npx drizzle-kit push

# Criar admin
npx tsx src/db/seed-admin.ts

# Rodar em desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/           # APIs do backend
│   ├── dashboard/     # Páginas do painel
│   └── login/         # Página de login
├── components/        # Componentes React
├── db/                # Banco de dados
└── lib/               # Utilitários
```

## 🔐 Segurança

- Senhas criptografadas com bcrypt
- Autenticação via JWT
- Controle de acesso por perfil
- Auditoria de todas as ações

## 📞 Suporte

Em caso de dúvidas, consulte a documentação do Next.js e Vercel.
