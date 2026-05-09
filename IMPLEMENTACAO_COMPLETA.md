# 🚀 Guia Completo de Implementação - NeoCanteiro com Supabase

## 📋 Resumo do Projeto

NeoCanteiro é um SaaS profissional de gestão de construção com backend real usando Supabase. O projeto foi completamente refatorado com:

- ✅ Estrutura profissional (components/, services/, hooks/, lib/, utils/)
- ✅ Autenticação com Supabase (engenheiro, estagiário, cliente)
- ✅ Banco de dados relacional com RLS (segurança por linha)
- ✅ CRUD completo para obras, tarefas, diários, materiais
- ✅ Upload de imagens com Supabase Storage
- ✅ Proteção de rotas e controle de acesso
- ✅ Design premium (preto, cinza, amarelo)

---

## 🔧 Passo 1: Configurar Supabase

### 1.1 Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha:
   - **Name**: `neocanteiro`
   - **Database Password**: Use uma senha forte
   - **Region**: Escolha a região mais próxima
4. Clique "Create new project"

### 1.2 Obter Credenciais
1. Settings → API
2. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Anon Key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `Service Role Key` → `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Arquivo `.env.local`
Na raiz do projeto (`c:\Users\yohan\neocanteiro`), crie `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu_projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...copie_aqui
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...copie_aqui
```

---

## 📊 Passo 2: Criar Schema do Banco

### 2.1 No Supabase Dashboard
1. Clique em **SQL Editor**
2. Clique em **New Query**
3. Abra `DATABASE_SCHEMA.sql` (na raiz do projeto)
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique **Run**

### 2.2 Criar Storage Buckets
1. Storage → Create a new bucket
2. Nome: `diarios` → Mark as Public → Create
3. Repita para `avatares`

---

## 💾 Passo 3: Instalar Dependências

```bash
cd c:\Users\yohan\neocanteiro
npm install @supabase/supabase-js
npm run dev
```

O servidor iniciará em `http://localhost:3000`

---

## 📱 Passo 4: Usar o Sistema

### 4.1 Primeiro Acesso
1. Acesse `http://localhost:3000`
2. Será redirecionado para `/login`
3. Clique em "Criar conta"
4. Preencha os dados:
   - **Nome**: Seu nome
   - **Email**: seu@email.com
   - **Tipo**: Escolha entre Engenheiro, Estagiário, Cliente
   - **Senha**: Mínimo 6 caracteres

### 4.2 Após Fazer Login
Você verá:
- Dashboard com cards de estatísticas
- Sidebar para navegação entre seções
- Opção de criar, editar, deletar obras
- Funcionalidades completas de cronograma, diário, materiais

---

## 🏗️ Estrutura de Pastas

```
src/
├── app/                          # Páginas Next.js
│   ├── page.js                  # Dashboard principal
│   ├── layout.js                # Layout global
│   ├── globals.css              # Estilos globais
│   ├── login/page.js            # Página de login
│   ├── signup/page.js           # Página de registro
│   └── dashboard/page.js        # Dashboard (protetor)
│
├── components/                   # Componentes reutilizáveis
│   ├── Header.js                # Cabeçalho com usuário
│   ├── Sidebar.js               # Navegação lateral
│   ├── AuthProtector.js         # Proteção de rotas
│   └── (futuros componentes)
│
├── services/                     # Serviços (lógica de negócio)
│   ├── authService.js           # Autenticação
│   ├── obraService.js           # CRUD de obras
│   ├── tarefaService.js         # CRUD de tarefas
│   ├── diarioService.js         # CRUD de diários + upload
│   └── materialService.js       # CRUD de materiais
│
├── hooks/                        # Custom hooks React
│   ├── useAuth.js               # Hook de autenticação
│   ├── useObras.js              # Hook de obras
│   ├── useTarefas.js            # Hook de tarefas
│   └── useDiarios.js            # Hook de diários
│
├── lib/                          # Utilitários e configuração
│   └── supabase.ts              # Cliente Supabase
│
└── utils/                        # Funções auxiliares
    └── helpers.js               # Funções de formatação, etc
```

---

## 🔐 Segurança e Controle de Acesso

### Tipos de Usuários

| Tipo | Acesso |
|------|--------|
| **Engenheiro** | Todas as obras, criar/editar/deletar tudo |
| **Estagiário** | Todas as obras, pode criar/editar/deletar |
| **Cliente** | Apenas suas próprias obras, apenas leitura |

### Row Level Security (RLS)
Todas as tabelas têm RLS ativada. O banco de dados automaticamente:
- Engenheiros veem todas as obras
- Estagiários veem todas as obras e podem modificar
- Clientes veem apenas suas obras

---

## 📡 API/Serviços Disponíveis

### authService
```javascript
await authService.login(email, password)
await authService.signup(email, password, userData)
await authService.logout()
await authService.getCurrentUser()
await authService.getUserProfile(userId)
```

### obraService
```javascript
await obraService.listar(userId, tipoUsuario)
await obraService.obter(id)
await obraService.criar(obraData)
await obraService.atualizar(id, updates)
await obraService.deletar(id)
await obraService.atualizarProgresso(id, progresso)
```

### tarefaService
```javascript
await tarefaService.listar(obraId)
await tarefaService.criar(tarefaData)
await tarefaService.atualizar(id, updates)
await tarefaService.deletar(id)
await tarefaService.obterEstatisticas(obraId)
```

### diarioService
```javascript
await diarioService.listar(obraId)
await diarioService.criar(diarioData)
await diarioService.atualizar(id, updates)
await diarioService.deletar(id)
await diarioService.uploadFoto(obraId, diarioId, arquivo)
```

### materialService
```javascript
await materialService.listarPorDiario(diarioId)
await materialService.listarPorObra(obraId)
await materialService.criar(materialData)
await materialService.atualizar(id, updates)
await materialService.deletar(id)
```

---

## 🎯 Próximos Passos

### A fazer (prioritário):
1. [ ] Refatorar `page.js` para usar hooks e serviços
2. [ ] Criar página `/dashboard` completa
3. [ ] Implementar componentes para cada seção
4. [ ] Adicionar notificações (toast messages)
5. [ ] Implementar real-time updates com subscriptions

### Melhorias futuras:
- [ ] Relatórios em PDF
- [ ] Exportação de dados (Excel)
- [ ] Notificações por email
- [ ] Integração com Google Maps
- [ ] App mobile com React Native
- [ ] Backup automático

---

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não carregam"
```bash
# Restart do servidor
Ctrl+C
npm run dev
```

### Erro: "CORS error"
→ Settings → API → CORS → Adicione `http://localhost:3000`

### Erro: "RLS policy blocking"
→ Verifique as credenciais no `.env.local`
→ Confirme que o usuário está autenticado

### Erro ao fazer login
→ Verifique se a tabela `usuarios` foi criada
→ Verifique se o email/senha estão corretos

---

## 📚 Documentação Adicional

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Guia detalhado de setup
- [DATABASE_SCHEMA.sql](./DATABASE_SCHEMA.sql) - Schema SQL completo
- [CRIAR_SCHEMA.md](./CRIAR_SCHEMA.md) - Instruções de criar schema
- [.env.example](./.env.example) - Exemplo de variáveis

---

## ✅ Checklist de Implementação

- [x] Estrutura profissional de pastas
- [x] Cliente Supabase configurado
- [x] Serviços CRUD para todas as entidades
- [x] Hooks customizados para dados
- [x] Autenticação com Supabase Auth
- [x] Pages de login e signup
- [x] Proteção de rotas
- [x] Header e Sidebar componentes
- [x] Segurança com RLS
- [x] Upload de imagens (diarioService)
- [ ] **Dashboard integrado (próximo passo)**
- [ ] Notificações e feedback
- [ ] Real-time updates
- [ ] Testes automatizados

---

## 📞 Suporte

Para mais informações:
1. Consulte a documentação oficial do [Supabase](https://supabase.com/docs)
2. Verifique os comentários no código
3. Revise os arquivos de configuração (lib/supabase.ts, services/*)

---

**Versão**: 1.0.0  
**Data**: Maio 2026  
**Status**: Em Desenvolvimento
