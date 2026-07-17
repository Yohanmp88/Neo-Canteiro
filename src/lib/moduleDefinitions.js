export const MODULE_DEFINITIONS = {
  crm: {
    title: 'CRM Comercial',
    singular: 'oportunidade',
    description: 'Controle leads, propostas, próximos contatos e oportunidades de novas obras.',
    statusField: 'etapa',
    valueField: 'valor_estimado',
    fields: [
      { key: 'cliente', label: 'Cliente / empresa', type: 'text', required: true },
      { key: 'contato', label: 'Contato principal', type: 'text' },
      { key: 'telefone', label: 'Telefone', type: 'tel' },
      { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'origem', label: 'Origem', type: 'select', options: ['Indicação', 'Site', 'Instagram', 'Parceiro', 'Prospecção', 'Outro'] },
      { key: 'etapa', label: 'Etapa', type: 'select', required: true, options: ['Novo lead', 'Contato realizado', 'Visita técnica', 'Proposta enviada', 'Negociação', 'Fechado', 'Perdido'] },
      { key: 'valor_estimado', label: 'Valor estimado', type: 'currency' },
      { key: 'probabilidade', label: 'Probabilidade (%)', type: 'number', min: 0, max: 100 },
      { key: 'proxima_acao', label: 'Próxima ação', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'crm-1', cliente: 'Clínica Horizonte', contato: 'Dra. Marina', telefone: '(47) 99999-1122', email: 'marina@horizonte.com.br', origem: 'Indicação', etapa: 'Proposta enviada', valor_estimado: 850000, probabilidade: 70, proxima_acao: '2026-07-18', responsavel: 'Yohan', observacoes: 'Aguardando retorno sobre prazo e escopo.' },
      { id: 'crm-2', cliente: 'Residencial Bela Vista', contato: 'Carlos Menezes', telefone: '(47) 98888-3344', email: 'carlos@belavista.com.br', origem: 'Parceiro', etapa: 'Visita técnica', valor_estimado: 1200000, probabilidade: 45, proxima_acao: '2026-07-21', responsavel: 'Yohan', observacoes: 'Levantamento inicial realizado.' },
    ],
  },
  clientes: {
    title: 'Clientes',
    singular: 'cliente',
    description: 'Cadastro central de clientes, contatos, documentos e responsáveis.',
    statusField: 'status',
    fields: [
      { key: 'nome', label: 'Nome / razão social', type: 'text', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['Pessoa física', 'Pessoa jurídica', 'Condomínio', 'Incorporadora'] },
      { key: 'documento', label: 'CPF / CNPJ', type: 'text' },
      { key: 'telefone', label: 'Telefone', type: 'tel' },
      { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'cidade', label: 'Cidade', type: 'text' },
      { key: 'responsavel', label: 'Responsável interno', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Prospecto', 'Inativo'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'cli-1', nome: 'Aurora Empreendimentos', tipo: 'Pessoa jurídica', documento: '12.345.678/0001-90', telefone: '(47) 3333-1000', email: 'contato@aurora.com.br', cidade: 'Joinville', responsavel: 'Yohan', status: 'Ativo', observacoes: 'Cliente da obra Residencial Aurora.' },
    ],
  },
  fornecedores: {
    title: 'Fornecedores',
    singular: 'fornecedor',
    description: 'Base de fornecedores, categorias, prazos e avaliação de desempenho.',
    statusField: 'status',
    valueField: 'avaliacao',
    fields: [
      { key: 'razao_social', label: 'Razão social', type: 'text', required: true },
      { key: 'categoria', label: 'Categoria', type: 'select', options: ['Materiais', 'Estrutura', 'Instalações', 'Acabamentos', 'Equipamentos', 'Serviços', 'Outros'] },
      { key: 'contato', label: 'Contato', type: 'text' },
      { key: 'telefone', label: 'Telefone', type: 'tel' },
      { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'prazo_medio', label: 'Prazo médio (dias)', type: 'number', min: 0 },
      { key: 'avaliacao', label: 'Avaliação (0 a 5)', type: 'number', min: 0, max: 5, step: 0.1 },
      { key: 'status', label: 'Status', type: 'select', options: ['Homologado', 'Em avaliação', 'Bloqueado', 'Inativo'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'for-1', razao_social: 'Concreforte Joinville', categoria: 'Estrutura', contato: 'Rafael', telefone: '(47) 3222-7788', email: 'vendas@concreforte.com.br', prazo_medio: 3, avaliacao: 4.6, status: 'Homologado', observacoes: 'Bom histórico de pontualidade.' },
    ],
  },
  materiais: {
    title: 'Materiais e Estoque',
    singular: 'material',
    description: 'Controle de estoque, consumo, custos e níveis mínimos por obra.',
    statusField: 'status',
    valueField: 'custo_unitario',
    fields: [
      { key: 'item', label: 'Material', type: 'text', required: true },
      { key: 'categoria', label: 'Categoria', type: 'text' },
      { key: 'unidade', label: 'Unidade', type: 'select', options: ['un', 'kg', 'm', 'm²', 'm³', 'saco', 'l', 'conjunto'] },
      { key: 'quantidade', label: 'Quantidade atual', type: 'number', min: 0, step: 0.01 },
      { key: 'estoque_minimo', label: 'Estoque mínimo', type: 'number', min: 0, step: 0.01 },
      { key: 'custo_unitario', label: 'Custo unitário', type: 'currency' },
      { key: 'fornecedor', label: 'Fornecedor principal', type: 'text' },
      { key: 'localizacao', label: 'Localização no canteiro', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Disponível', 'Estoque baixo', 'Solicitar compra', 'Esgotado'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'mat-1', item: 'Cimento CP-II F-32', categoria: 'Estrutura', unidade: 'saco', quantidade: 38, estoque_minimo: 60, custo_unitario: 39.9, fornecedor: 'Casa do Construtor', localizacao: 'Depósito 01', status: 'Estoque baixo', observacoes: 'Reposição vinculada à estrutura.' },
      { id: 'mat-2', item: 'Aço CA-50 10 mm', categoria: 'Estrutura', unidade: 'kg', quantidade: 740, estoque_minimo: 300, custo_unitario: 7.8, fornecedor: 'Gerdau', localizacao: 'Baia externa', status: 'Disponível', observacoes: '' },
    ],
  },
  compras: {
    title: 'Gestão de Compras',
    singular: 'pedido',
    description: 'Solicitações, cotações, aprovações, entregas e impactos no cronograma.',
    statusField: 'status',
    valueField: 'valor_total',
    fields: [
      { key: 'item', label: 'Item / serviço', type: 'text', required: true },
      { key: 'fornecedor', label: 'Fornecedor', type: 'text' },
      { key: 'quantidade', label: 'Quantidade', type: 'number', min: 0, step: 0.01 },
      { key: 'unidade', label: 'Unidade', type: 'text' },
      { key: 'valor_total', label: 'Valor total', type: 'currency' },
      { key: 'solicitante', label: 'Solicitante', type: 'text' },
      { key: 'necessario_em', label: 'Necessário em', type: 'date' },
      { key: 'entrega_prevista', label: 'Entrega prevista', type: 'date' },
      { key: 'tarefa_relacionada', label: 'Serviço relacionado', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Solicitado', 'Em cotação', 'Aguardando aprovação', 'Pedido emitido', 'Entrega parcial', 'Recebido', 'Cancelado', 'Atrasado'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'com-1', item: 'Cimento CP-II F-32', fornecedor: 'Votorantim', quantidade: 150, unidade: 'saco', valor_total: 5985, solicitante: 'Yohan', necessario_em: '2026-07-27', entrega_prevista: '2026-07-29', tarefa_relacionada: 'Execução da estrutura', status: 'Atrasado', observacoes: 'Entrega revisada com impacto estimado de 2 dias.' },
    ],
  },
  financeiro: {
    title: 'Financeiro',
    singular: 'lançamento',
    description: 'Receitas, despesas, vencimentos, pagamentos e fluxo de caixa da obra.',
    statusField: 'status',
    valueField: 'valor',
    fields: [
      { key: 'descricao', label: 'Descrição', type: 'text', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['Receita', 'Despesa'] },
      { key: 'categoria', label: 'Categoria', type: 'text' },
      { key: 'fornecedor_cliente', label: 'Fornecedor / cliente', type: 'text' },
      { key: 'valor', label: 'Valor', type: 'currency', required: true },
      { key: 'vencimento', label: 'Vencimento', type: 'date' },
      { key: 'pagamento', label: 'Data de pagamento', type: 'date' },
      { key: 'centro_custo', label: 'Centro de custo', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Previsto', 'A vencer', 'Pago', 'Recebido', 'Vencido', 'Cancelado'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'fin-1', descricao: 'Concretagem de vigas', tipo: 'Despesa', categoria: 'Estrutura', fornecedor_cliente: 'Concreforte Joinville', valor: 28400, vencimento: '2026-07-25', pagamento: '', centro_custo: 'Estrutura', status: 'A vencer', observacoes: 'Pagamento após conferência do volume.' },
      { id: 'fin-2', descricao: 'Medição contratual 05', tipo: 'Receita', categoria: 'Medição', fornecedor_cliente: 'Aurora Empreendimentos', valor: 126000, vencimento: '2026-07-20', pagamento: '', centro_custo: 'Contrato principal', status: 'Previsto', observacoes: '' },
    ],
  },
  orcamento: {
    title: 'Orçamento',
    singular: 'item orçamentário',
    description: 'Planilha orçamentária, quantidades, valores unitários e custo total previsto.',
    statusField: 'status',
    valueField: 'total',
    fields: [
      { key: 'codigo', label: 'Código', type: 'text' },
      { key: 'servico', label: 'Serviço', type: 'text', required: true },
      { key: 'categoria', label: 'Categoria', type: 'text' },
      { key: 'unidade', label: 'Unidade', type: 'text' },
      { key: 'quantidade', label: 'Quantidade', type: 'number', min: 0, step: 0.01 },
      { key: 'valor_unitario', label: 'Valor unitário', type: 'currency' },
      { key: 'total', label: 'Total', type: 'currency' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Previsto', 'Contratado', 'Executando', 'Concluído', 'Revisar'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'orc-1', codigo: '03.01', servico: 'Estrutura de concreto armado', categoria: 'Estrutura', unidade: 'm³', quantidade: 185, valor_unitario: 1850, total: 342250, responsavel: 'Yohan', status: 'Executando', observacoes: 'Inclui formas, armação e concretagem.' },
    ],
  },
  composicoes: {
    title: 'Composições de Custos',
    singular: 'composição',
    description: 'Custos unitários de materiais, mão de obra, equipamentos e BDI.',
    statusField: 'status',
    valueField: 'preco_venda',
    fields: [
      { key: 'codigo', label: 'Código', type: 'text' },
      { key: 'servico', label: 'Serviço', type: 'text', required: true },
      { key: 'unidade', label: 'Unidade', type: 'text' },
      { key: 'custo_material', label: 'Materiais', type: 'currency' },
      { key: 'custo_mao_obra', label: 'Mão de obra', type: 'currency' },
      { key: 'custo_equipamento', label: 'Equipamentos', type: 'currency' },
      { key: 'bdi', label: 'BDI (%)', type: 'number', min: 0, step: 0.01 },
      { key: 'preco_venda', label: 'Preço de venda', type: 'currency' },
      { key: 'status', label: 'Status', type: 'select', options: ['Atualizada', 'Revisar', 'Aprovada'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'cmp-1', codigo: 'CPU-001', servico: 'Alvenaria de vedação 14 cm', unidade: 'm²', custo_material: 48.2, custo_mao_obra: 39.5, custo_equipamento: 2.1, bdi: 25, preco_venda: 112.25, status: 'Atualizada', observacoes: '' },
    ],
  },
  abc: {
    title: 'Curva ABC',
    singular: 'item da curva',
    description: 'Classificação dos itens que mais impactam o custo total da obra.',
    statusField: 'classe',
    valueField: 'valor',
    fields: [
      { key: 'item', label: 'Item', type: 'text', required: true },
      { key: 'categoria', label: 'Categoria', type: 'text' },
      { key: 'valor', label: 'Valor acumulado', type: 'currency' },
      { key: 'percentual', label: 'Participação (%)', type: 'number', min: 0, max: 100, step: 0.01 },
      { key: 'percentual_acumulado', label: 'Acumulado (%)', type: 'number', min: 0, max: 100, step: 0.01 },
      { key: 'classe', label: 'Classe', type: 'select', options: ['A', 'B', 'C'] },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'abc-1', item: 'Estrutura de concreto armado', categoria: 'Estrutura', valor: 342250, percentual: 21.4, percentual_acumulado: 21.4, classe: 'A', responsavel: 'Yohan', observacoes: 'Item prioritário para controle.' },
    ],
  },
  medicoes: {
    title: 'Medições',
    singular: 'medição',
    description: 'Medições contratuais, aprovação, retenções e acompanhamento de pagamento.',
    statusField: 'status',
    valueField: 'valor_bruto',
    fields: [
      { key: 'numero', label: 'Número', type: 'text', required: true },
      { key: 'periodo', label: 'Período', type: 'text' },
      { key: 'contratada', label: 'Contratada / cliente', type: 'text' },
      { key: 'valor_bruto', label: 'Valor bruto', type: 'currency' },
      { key: 'retencoes', label: 'Retenções', type: 'currency' },
      { key: 'valor_liquido', label: 'Valor líquido', type: 'currency' },
      { key: 'data_envio', label: 'Data de envio', type: 'date' },
      { key: 'data_aprovacao', label: 'Data de aprovação', type: 'date' },
      { key: 'aprovado_por', label: 'Aprovado por', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Rascunho', 'Em conferência', 'Enviada', 'Aprovada', 'Rejeitada', 'Paga'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'med-1', numero: 'MED-005', periodo: '01/07/2026 a 15/07/2026', contratada: 'Aurora Empreendimentos', valor_bruto: 126000, retencoes: 6300, valor_liquido: 119700, data_envio: '2026-07-16', data_aprovacao: '', aprovado_por: '', status: 'Em conferência', observacoes: 'Medição física vinculada ao cronograma.' },
    ],
  },
  planilhas: {
    title: 'Planilhas Excel',
    singular: 'planilha',
    description: 'Importação, visualização, atualização e histórico de planilhas Excel por obra.',
    statusField: 'status',
    fields: [
      { key: 'nome', label: 'Nome da planilha', type: 'text', required: true },
      { key: 'descricao', label: 'Descrição', type: 'textarea', full: true },
      { key: 'versao', label: 'Versão', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Publicada', 'Em revisão', 'Arquivada'] },
    ],
    seed: [],
  },
  documentos: {
    title: 'Documentos',
    singular: 'documento',
    description: 'Contratos, projetos, licenças, notas, relatórios e controle de versões.',
    statusField: 'status',
    fields: [
      { key: 'nome', label: 'Nome do documento', type: 'text', required: true },
      { key: 'categoria', label: 'Categoria', type: 'select', options: ['Contrato', 'Projeto', 'Licença', 'Nota fiscal', 'Relatório', 'ART/RRT', 'Manual', 'Outro'] },
      { key: 'versao', label: 'Versão', type: 'text' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'data_emissao', label: 'Data de emissão', type: 'date' },
      { key: 'validade', label: 'Validade', type: 'date' },
      { key: 'url', label: 'Link do arquivo', type: 'url' },
      { key: 'status', label: 'Status', type: 'select', options: ['Vigente', 'Em revisão', 'Aguardando assinatura', 'Vencido', 'Arquivado'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'doc-1', nome: 'Projeto estrutural executivo', categoria: 'Projeto', versao: 'R03', responsavel: 'Equipe de Projetos', data_emissao: '2026-06-28', validade: '', url: '', status: 'Vigente', observacoes: 'Revisão liberada para execução.' },
    ],
  },
  templates: {
    title: 'Templates e Processos',
    singular: 'template',
    description: 'Modelos reutilizáveis de cronograma, diário, checklist e relatórios.',
    statusField: 'status',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'categoria', label: 'Categoria', type: 'select', options: ['Cronograma', 'Diário de obra', 'Checklist', 'Relatório', 'Orçamento', 'Compras'] },
      { key: 'descricao', label: 'Descrição', type: 'textarea', full: true },
      { key: 'versao', label: 'Versão', type: 'text' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Rascunho', 'Arquivado'] },
    ],
    seed: [
      { id: 'tpl-1', nome: 'Cronograma residencial completo', categoria: 'Cronograma', descricao: 'Modelo com 20 etapas da fundação à entrega.', versao: '1.0', responsavel: 'Yohan', status: 'Ativo' },
    ],
  },
  usuarios: {
    title: 'Usuários e Permissões',
    singular: 'usuário',
    description: 'Perfis de acesso, obras autorizadas e permissões por função.',
    statusField: 'status',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'email', label: 'E-mail', type: 'email', required: true },
      { key: 'perfil', label: 'Perfil', type: 'select', options: ['Administrador', 'Engenheiro', 'Estagiário', 'Compras', 'Financeiro', 'Cliente', 'Investidor'] },
      { key: 'obra', label: 'Obra autorizada', type: 'text' },
      { key: 'permissao', label: 'Nível de acesso', type: 'select', options: ['Controle total', 'Editar', 'Aprovar', 'Somente leitura'] },
      { key: 'ultimo_acesso', label: 'Último acesso', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Convite enviado', 'Bloqueado', 'Inativo'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'usr-1', nome: 'Yohan Pinterich', email: 'investidor@nc.com', perfil: 'Administrador', obra: 'Todas', permissao: 'Controle total', ultimo_acesso: '2026-07-16', status: 'Ativo', observacoes: 'Responsável pelo sistema.' },
      { id: 'usr-2', nome: 'Lucas — Acesso Demo', email: 'lucas.demo@nc.com', perfil: 'Investidor', obra: 'Residencial Aurora', permissao: 'Somente leitura', ultimo_acesso: '', status: 'Ativo', observacoes: 'Acesso demonstrativo revogável.' },
    ],
  },
}

export const EDITABLE_MODULE_KEYS = Object.keys(MODULE_DEFINITIONS)

export function getModuleDefinition(moduleKey) {
  return MODULE_DEFINITIONS[moduleKey] || null
}

export function normalizeModuleRecord(moduleKey, record) {
  const next = { ...record }

  if (moduleKey === 'orcamento') {
    const quantidade = Number(next.quantidade || 0)
    const valorUnitario = Number(next.valor_unitario || 0)
    if (!next.total || Number(next.total) === 0) next.total = quantidade * valorUnitario
  }

  if (moduleKey === 'composicoes') {
    const custo = Number(next.custo_material || 0) + Number(next.custo_mao_obra || 0) + Number(next.custo_equipamento || 0)
    const bdi = Number(next.bdi || 0)
    if (!next.preco_venda || Number(next.preco_venda) === 0) next.preco_venda = custo * (1 + bdi / 100)
  }

  if (moduleKey === 'medicoes') {
    const bruto = Number(next.valor_bruto || 0)
    const retencoes = Number(next.retencoes || 0)
    if (!next.valor_liquido || Number(next.valor_liquido) === 0) next.valor_liquido = bruto - retencoes
  }

  return next
}
