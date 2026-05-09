-- ============================================
-- NEOCANTEIRO - Database Schema
-- ============================================

-- 1. TABELA: usuarios
-- Armazena dados dos usuários (engenheiros, estagiários, clientes)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('engenheiro', 'estagiario', 'cliente')),
  empresa TEXT,
  telefone TEXT,
  avatar_url TEXT,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE
);

-- 2. TABELA: obras
-- Armazena informações das construções
CREATE TABLE obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT NOT NULL,
  cliente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  endereco TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  prazo_final DATE NOT NULL,
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  status TEXT DEFAULT 'No prazo' CHECK (status IN ('No prazo', 'Atenção', 'Atrasada', 'Finalizada')),
  observacoes TEXT,
  engenheiro_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW()
);

-- 3. TABELA: tarefas
-- Armazena as tarefas/atividades de cada obra
CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_termino DATE NOT NULL,
  duracao INTEGER NOT NULL,
  predecessoras TEXT,
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW()
);

-- 4. TABELA: diario_obra
-- Registro diário das atividades da obra
CREATE TABLE diario_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  clima TEXT,
  equipe TEXT,
  servicos_executados TEXT,
  ocorrencias TEXT,
  responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW()
);

-- 5. TABELA: materiais_recebidos
-- Registro de materiais recebidos na obra
CREATE TABLE materiais_recebidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diario_id UUID NOT NULL REFERENCES diario_obra(id) ON DELETE CASCADE,
  material TEXT NOT NULL,
  quantidade DECIMAL(10, 2) NOT NULL,
  unidade TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  horario_entrega TIME,
  observacoes TEXT,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW()
);

-- 6. TABELA: fotos_diario
-- Armazena referências de fotos do diário
CREATE TABLE fotos_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diario_id UUID NOT NULL REFERENCES diario_obra(id) ON DELETE CASCADE,
  url_foto TEXT NOT NULL,
  descricao TEXT,
  data_criacao TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Segurança
-- ============================================

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE diario_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais_recebidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_diario ENABLE ROW LEVEL SECURITY;

-- Políticas para USUARIOS
-- Usuários só veem seus próprios dados
CREATE POLICY "usuarios_read_own" ON usuarios
  FOR SELECT USING (auth.uid() = id OR (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) = 'engenheiro');

CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para OBRAS
-- Engenheiro vê todas as obras
-- Cliente vê apenas suas obras
CREATE POLICY "obras_read" ON obras
  FOR SELECT USING (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) = 'engenheiro' OR
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) = 'estagiario' OR
    cliente_id = auth.uid()
  );

CREATE POLICY "obras_insert" ON obras
  FOR INSERT WITH CHECK (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

CREATE POLICY "obras_update" ON obras
  FOR UPDATE USING (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

CREATE POLICY "obras_delete" ON obras
  FOR DELETE USING (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) = 'engenheiro'
  );

-- Políticas para TAREFAS
CREATE POLICY "tarefas_read" ON tarefas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM obras
      WHERE obras.id = tarefas.obra_id AND
      (
        (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario') OR
        obras.cliente_id = auth.uid()
      )
    )
  );

CREATE POLICY "tarefas_write" ON tarefas
  FOR INSERT WITH CHECK (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

CREATE POLICY "tarefas_update" ON tarefas
  FOR UPDATE USING (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

CREATE POLICY "tarefas_delete" ON tarefas
  FOR DELETE USING (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

-- Políticas para DIARIO_OBRA
CREATE POLICY "diario_read" ON diario_obra
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM obras
      WHERE obras.id = diario_obra.obra_id AND
      (
        (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario') OR
        obras.cliente_id = auth.uid()
      )
    )
  );

CREATE POLICY "diario_write" ON diario_obra
  FOR INSERT WITH CHECK (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

CREATE POLICY "diario_update" ON diario_obra
  FOR UPDATE USING (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

CREATE POLICY "diario_delete" ON diario_obra
  FOR DELETE USING (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

-- Políticas para MATERIAIS_RECEBIDOS
CREATE POLICY "materiais_read" ON materiais_recebidos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diario_obra
      JOIN obras ON obras.id = diario_obra.obra_id
      WHERE diario_obra.id = materiais_recebidos.diario_id AND
      (
        (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario') OR
        obras.cliente_id = auth.uid()
      )
    )
  );

CREATE POLICY "materiais_write" ON materiais_recebidos
  FOR INSERT WITH CHECK (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

CREATE POLICY "materiais_update" ON materiais_recebidos
  FOR UPDATE USING (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

CREATE POLICY "materiais_delete" ON materiais_recebidos
  FOR DELETE USING (
    (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario')
  );

-- Políticas para FOTOS_DIARIO
CREATE POLICY "fotos_read" ON fotos_diario
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diario_obra
      JOIN obras ON obras.id = diario_obra.obra_id
      WHERE diario_obra.id = fotos_diario.diario_id AND
      (
        (SELECT tipo_usuario FROM usuarios WHERE id = auth.uid()) IN ('engenheiro', 'estagiario') OR
        obras.cliente_id = auth.uid()
      )
    )
  );

-- ============================================
-- Índices para Performance
-- ============================================

CREATE INDEX idx_obras_cliente_id ON obras(cliente_id);
CREATE INDEX idx_obras_engenheiro_id ON obras(engenheiro_id);
CREATE INDEX idx_tarefas_obra_id ON tarefas(obra_id);
CREATE INDEX idx_diario_obra_id ON diario_obra(obra_id);
CREATE INDEX idx_materiais_diario_id ON materiais_recebidos(diario_id);
CREATE INDEX idx_fotos_diario_id ON fotos_diario(diario_id);

-- ============================================
-- STORAGE - Para armazenar fotos
-- ============================================

-- Execute isso no Supabase Dashboard → Storage:
-- 1. Criar novo bucket chamado "diarios" (Public)
-- 2. Criar novo bucket chamado "avatares" (Public)
-- Isso permite fazer upload de fotos e avatares
