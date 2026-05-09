# 📋 Guia Completo de Setup do Supabase para NeoCanteiro

## Passo 1: Criar Projeto no Supabase

### 1.1 Criar Conta
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Sign In" → "Continue with GitHub" (ou crie conta com email)
3. Autorize o acesso do Supabase no seu GitHub

### 1.2 Criar Novo Projeto
1. No dashboard, clique em "New Project"
2. Preencha os dados:
   - **Name**: `neocanteiro` ou similar
   - **Database Password**: Crie uma senha forte (salve em local seguro!)
   - **Region**: Escolha a região mais próxima (ex: São Paulo/US East)
3. Clique em "Create new project"
4. Aguarde 2-3 minutos enquanto o projeto é criado

### 1.3 Obter Credenciais
Após criar o projeto:

1. Clique em **Settings** (engrenagem no canto inferior esquerdo)
2. Clique em **API** (no menu esquerdo)
3. Você verá 3 informações essenciais:

```
Project URL: https://xxxxxxxxxxxx.supabase.co
Anon Key: eyJhbGc... (copie todo o conteúdo)
Service Role Key: eyJhbGc... (salve em local seguro, apenas backend)
```

**⚠️ NÃO COMPARTILHE a Service Role Key!** Somente use no backend.

## Passo 2: Configurar Variáveis de Ambiente

### 2.1 Criar arquivo `.env.local`
Na raiz do projeto (`c:\Users\yohan\neocanteiro\.env.local`):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...seu_key_aqui...

# Supabase Service Role (apenas backend, NUNCA exponha ao cliente)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...seu_key_aqui...
```

**Importante:**
- `NEXT_PUBLIC_*` → Visível ao cliente (use apenas Anon Key com RLS)
- Variáveis sem prefixo → Apenas no servidor (nunca exponha ao cliente)
- **NUNCA committe `.env.local` ao Git!** Está no `.gitignore`

### 2.2 Verificar `.gitignore`
Abra `c:\Users\yohan\neocanteiro\.gitignore` e confirme que contém:
```
.env
.env.local
.env.*.local
```

## Passo 3: Instalar Supabase Client

Execute no terminal:

```bash
cd c:\Users\yohan\neocanteiro
npm install @supabase/supabase-js
```

Aguarde a instalação completar (pode levar alguns minutos).

## Passo 4: Executar Localmente

### 4.1 Reiniciar o servidor Next.js
```bash
npm run dev
```

Se o servidor já está rodando, pressione `Ctrl+C` para parar e execute novamente.

### 4.2 Verificar Variáveis Carregadas
O Next.js automaticamente carrega `.env.local`. Para confirmar:
- No console do navegador (F12), não deve aparecer as variáveis
- As variáveis `NEXT_PUBLIC_*` aparecerão

## Passo 5: Testar Conexão

Depois de implementar, acesse a aplicação em `http://localhost:3000` e:
1. Tente fazer login
2. Observe se há erros no console (F12)
3. Verifique se os dados aparecem no dashboard

## Troubleshooting

### Erro: "Variáveis não carregam"
- Restart do servidor: `Ctrl+C` → `npm run dev`

### Erro: "CORS"
- Vá para Settings → API → CORS
- Adicione `http://localhost:3000` em "Allowed Origin"

### Erro: "Key inválida"
- Copie a key novamente do dashboard
- Certifique-se de não ter espaços extras

### Erro: "Projeto não encontrado"
- Confirme que o URL está correto em `.env.local`
- Verifique a região selecionada

---

## Próximos Passos Automáticos

Após completar esse setup, o sistema irá:
1. ✅ Conectar automaticamente ao Supabase
2. ✅ Criar as tabelas do banco de dados
3. ✅ Implementar autenticação
4. ✅ Sincronizar dados com o backend
