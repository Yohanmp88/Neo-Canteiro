# ⚡ Quick Start - 5 Minutos

## Passo 1: Setup Supabase (2 min)

```bash
# Acesse https://supabase.com
# 1. Clique "New Project"
# 2. Preencha: name=neocanteiro, password=algo_forte
# 3. Copie as 3 chaves (URL, Anon Key, Service Role Key)
```

## Passo 2: Variáveis de Ambiente (1 min)

Crie `c:\Users\yohan\neocanteiro\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Passo 3: Criar Schema (1 min)

```bash
# No Supabase Dashboard:
# 1. SQL Editor → New Query
# 2. Copie conteúdo de: DATABASE_SCHEMA.sql
# 3. Execute (Run button)
# 4. Storage → Create bucket "diarios" (public)
# 5. Storage → Create bucket "avatares" (public)
```

## Passo 4: Rodar Localmente (1 min)

```bash
cd c:\Users\yohan\neocanteiro

# Instalar dependência
npm install @supabase/supabase-js

# Rodar servidor
npm run dev
```

## Passo 5: Testar (Bônus!)

```
Abra http://localhost:3000
→ Clique "Criar conta"
→ Preencha dados
→ Clique "Criar Conta"
→ Boom! ✨
```

---

## 🎯 Pronto!

Agora você tem:
- ✅ Backend real com Supabase
- ✅ Autenticação funcionando
- ✅ Banco de dados criado
- ✅ Sistema de segurança (RLS)
- ✅ Upload de imagens

---

## 📖 Leia Depois

1. `IMPLEMENTACAO_COMPLETA.md` - Guia detalhado
2. `RESUMO_IMPLEMENTACAO.md` - Resumo técnico
3. `SUPABASE_SETUP.md` - Setup completo

---

**Tempo total**: ~10 minutos (incluindo espera do Supabase)  
**Dificuldade**: 🟢 Fácil
