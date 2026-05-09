# 📊 Como Criar o Schema do Banco de Dados

## Passo 1: Executar o SQL Script

### 1.1 Abrir SQL Editor
1. No dashboard do Supabase, clique em **SQL Editor** (no menu esquerdo)
2. Clique em **New Query**

### 1.2 Copiar e Colar o Script
1. Abra o arquivo `DATABASE_SCHEMA.sql` (na raiz do projeto)
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (botão verde)

### 1.3 Verificar Criação
Após executar, você verá mensagens de sucesso. As tabelas serão criadas automaticamente.

## Passo 2: Criar Storage Buckets

### 2.1 Criar Bucket "diarios"
1. No Supabase Dashboard, clique em **Storage** (menu esquerdo)
2. Clique em **Create a new bucket**
3. Nome: `diarios`
4. Marque **Public bucket** (para permitir acesso público às fotos)
5. Clique **Create bucket**

### 2.2 Criar Bucket "avatares"
1. Repita o processo anterior
2. Nome: `avatares`
3. Marque **Public bucket**
4. Clique **Create bucket**

## Passo 3: Configurar CORS (Se necessário)

Se receber erro de CORS ao fazer upload:

1. Vá para **Settings** → **API**
2. Procure por **CORS** (ou **CORS Configuration**)
3. Adicione `http://localhost:3000` em "Allowed Origin"

## Passo 4: Verificar Dados de Exemplo (Opcional)

Para adicionar dados de teste:

1. Abra **SQL Editor**
2. Clique em **New Query**
3. Execute este script:

```sql
-- Inserir usuário de teste (engenheiro)
INSERT INTO usuarios (id, nome, email, tipo_usuario, empresa)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'João Engenheiro',
  'joao@neocanteiro.com',
  'engenheiro',
  'NeoCanteiro'
);

-- Nota: Use os UUIDs do banco de dados, não IDs arbitrários
-- Para dados reais, use a aplicação web para cadastrar usuários
```

## Próximo Passo

Após criar o schema e os buckets, execute na terminal:

```bash
npm install @supabase/supabase-js
```

Depois configure o `.env.local` com suas credenciais do Supabase.

## Troubleshooting

### Erro: "relation already exists"
- Significa que as tabelas já foram criadas
- Você pode deletar e criar de novo, ou ignorar o erro

### Erro: "permission denied"
- Verifique se você tem permissão de admin no projeto
- RLS pode estar bloqueando (isto é normal)

### Erro ao fazer upload de fotos
- Confirme que os buckets foram criados como "Public"
- Verifique CORS em Settings → API

---

Para mais informações sobre o schema, abra este arquivo na raiz do projeto: `DATABASE_SCHEMA.sql`
