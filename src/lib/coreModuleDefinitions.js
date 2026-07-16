import { MODULE_DEFINITIONS } from '@/lib/moduleDefinitions'

export const CORE_MODULE_DEFINITIONS = {
  equipe: {
    title: 'Equipe da Obra',
    singular: 'membro da equipe',
    description: 'Cadastro de funcionários, terceirizados, funções, custos, presença e produtividade.',
    statusField: 'status',
    valueField: 'valor_diaria',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'funcao', label: 'Função', type: 'text', required: true },
      { key: 'empresa', label: 'Empresa / equipe', type: 'text' },
      { key: 'tipo_contrato', label: 'Tipo de contratação', type: 'select', options: ['Diária', 'Mensalista', 'Empreitada', 'Terceirizado'] },
      { key: 'valor_diaria', label: 'Valor da diária', type: 'currency' },
      { key: 'dias_trabalhados', label: 'Dias trabalhados', type: 'number', min: 0, step: 0.5 },
      { key: 'telefone', label: 'Telefone', type: 'tel' },
      { key: 'documento', label: 'CPF / CNPJ', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Ativo', 'Afastado', 'Desligado', 'Documentação pendente'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'eq-1', nome: 'Adelino Romão', funcao: 'Mestre de Obras', empresa: 'Equipe própria', tipo_contrato: 'Diária', valor_diaria: 350, dias_trabalhados: 21, telefone: '(47) 99999-0001', documento: '', status: 'Ativo', observacoes: 'Responsável pela organização diária do canteiro.' },
      { id: 'eq-2', nome: 'Adilio Costa', funcao: 'Pedreiro', empresa: 'Equipe própria', tipo_contrato: 'Diária', valor_diaria: 300, dias_trabalhados: 24.5, telefone: '(47) 99999-0002', documento: '', status: 'Ativo', observacoes: '' },
      { id: 'eq-3', nome: 'Ataíde Costa', funcao: 'Servente', empresa: 'Equipe própria', tipo_contrato: 'Diária', valor_diaria: 200, dias_trabalhados: 20, telefone: '(47) 99999-0003', documento: '', status: 'Ativo', observacoes: '' },
    ],
  },
  diario: {
    title: 'Diário de Obra',
    singular: 'diário',
    description: 'Registro diário de clima, equipe, serviços executados, visitas, ocorrências e decisões.',
    statusField: 'status',
    fields: [
      { key: 'data', label: 'Data', type: 'date', required: true },
      { key: 'clima', label: 'Clima', type: 'select', options: ['Ensolarado', 'Nublado', 'Chuva leve', 'Chuva forte', 'Instável'] },
      { key: 'equipe_total', label: 'Total de trabalhadores', type: 'number', min: 0 },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'servicos_executados', label: 'Serviços executados', type: 'textarea', required: true, full: true },
      { key: 'ocorrencias', label: 'Ocorrências e interferências', type: 'textarea', full: true },
      { key: 'visitas', label: 'Visitas e fiscalizações', type: 'textarea', full: true },
      { key: 'proximas_atividades', label: 'Próximas atividades', type: 'textarea', full: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Rascunho', 'Finalizado', 'Aprovado', 'Revisar'] },
    ],
    seed: [
      { id: 'dia-1', data: '2026-07-16', clima: 'Ensolarado', equipe_total: 18, responsavel: 'Yohan', servicos_executados: 'Montagem de formas das vigas e continuidade das instalações hidráulicas.', ocorrencias: 'Aguardando confirmação da entrega do cimento.', visitas: 'Visita do cliente às 14h.', proximas_atividades: 'Concluir armação e liberar inspeção.', status: 'Finalizado' },
    ],
  },
  fotos: {
    title: 'Fotos da Obra',
    singular: 'registro fotográfico',
    description: 'Organização das imagens por etapa, data, localização e responsável.',
    statusField: 'status',
    fields: [
      { key: 'descricao', label: 'Descrição', type: 'text', required: true },
      { key: 'etapa', label: 'Etapa da obra', type: 'text' },
      { key: 'local', label: 'Local / ambiente', type: 'text' },
      { key: 'data', label: 'Data', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'url', label: 'Link da foto', type: 'url' },
      { key: 'status', label: 'Status', type: 'select', options: ['Publicado', 'Em revisão', 'Privado', 'Arquivado'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', full: true },
    ],
    seed: [
      { id: 'foto-1', descricao: 'Formas das vigas do pavimento', etapa: 'Execução da estrutura', local: 'Pavimento superior', data: '2026-07-16', responsavel: 'Yohan', url: '', status: 'Publicado', observacoes: 'Registro demonstrativo. Adicione o link ou faça o upload no ambiente com Supabase Storage.' },
    ],
  },
}

Object.assign(MODULE_DEFINITIONS, CORE_MODULE_DEFINITIONS)

export const CORE_MODULE_KEYS = Object.keys(CORE_MODULE_DEFINITIONS)
