-- NeoCanteiro - estrutura de pedidos de compra para a IA Operacional
-- Execute este arquivo no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS pedidos_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  fornecedor TEXT,
  quantidade DECIMAL(12, 2),
  unidade TEXT,
  data_solicitacao DATE DEFAULT CURRENT_DATE,
  data_prevista DATE,
  data_entrega DATE,
  status TEXT NOT NULL DEFAULT 'Pendente'
    CHECK (status IN ('Solicitado', 'Cotação', 'Comprado', 'Pendente', 'Atrasado', 'Recebido', 'Cancelado')),
  tarefa_relacionada TEXT,
  impacto TEXT,
  observacoes TEXT,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_compra_obra_id ON pedidos_compra(obra_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_data_prevista ON pedidos_compra(data_prevista);
CREATE INDEX IF NOT EXISTS idx_pedidos_compra_status ON pedidos_compra(status);

ALTER TABLE pedidos_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_compra_read" ON pedidos_compra;
CREATE POLICY "pedidos_compra_read" ON pedidos_compra
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM obras
      WHERE obras.id = pedidos_compra.obra_id
    )
  );

DROP POLICY IF EXISTS "pedidos_compra_write" ON pedidos_compra;
CREATE POLICY "pedidos_compra_write" ON pedidos_compra
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Exemplo de pedido crítico. Troque o UUID pela obra real antes de executar.
-- INSERT INTO pedidos_compra (
--   obra_id, item, fornecedor, quantidade, unidade, data_prevista,
--   status, tarefa_relacionada, impacto
-- ) VALUES (
--   'UUID_DA_OBRA',
--   'Cimento CP-II',
--   'Votorantim',
--   100,
--   'sacos',
--   CURRENT_DATE - INTERVAL '2 days',
--   'Atrasado',
--   'Concretagem das vigas 101 a 108',
--   'Pode interromper ou adiar a concretagem das vigas 101 a 108.'
-- );
