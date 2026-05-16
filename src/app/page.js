'use client'

import { useMemo, useState, useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { DashboardView } from '@/components/dashboard/views/DashboardView'
import { GraficoCronograma, CronogramaVisual } from '@/components/dashboard/Schedule'
import { PanelClean, MetricCard, StatusBadge, InfoCard, MiniTimeline, ProgressRing } from '@/components/ui/Cards'

// Hooks Supabase
import { useAuth } from '@/hooks/useAuth'
import { useObras } from '@/hooks/useObras'
import { useTarefas } from '@/hooks/useTarefas'
import { useDiarios } from '@/hooks/useDiarios'
import { useMateriais } from '@/hooks/useMateriais'

const usuarios = [
  { id: 1, nome: 'Yohan', tipo: 'Engenheiro', iniciais: 'YP', obrasPermitidas: 'todas' },
  { id: 2, nome: 'Pedro', tipo: 'Estagiário', iniciais: 'PD', obrasPermitidas: 'todas' },
  { id: 3, nome: 'Raquel', tipo: 'Cliente', iniciais: 'RM', obrasPermitidas: [1] },
]

const obrasIniciais = [
  { id: 1, nome: 'Residencial Aurora', cliente: 'Dra. Raquel', endereco: 'Joinville, SC', status: 'Em andamento', etapa: 'Instalações e acabamentos', prazo: '18 dias restantes', responsavel: 'Yohan', previsaoEntrega: '2026-07-06', materiaisHoje: 5 },
  { id: 2, nome: 'Clínica Harmonia', cliente: 'César Almeida', endereco: 'São Francisco do Sul, SC', status: 'Atenção', etapa: 'Infraestrutura', prazo: '34 dias restantes', responsavel: 'Pedro', previsaoEntrega: '2026-08-15', materiaisHoje: 3 },
  { id: 3, nome: 'Loja Concept', cliente: 'Grupo Norte', endereco: 'Joinville, SC', status: 'Avançada', etapa: 'Vistoria final', prazo: '7 dias restantes', responsavel: 'Yohan', previsaoEntrega: '2026-06-20', materiaisHoje: 2 },
]

const tarefasIniciais = [
  { id: 1, nome: 'Demolição', inicio: '2026-05-05', termino: '2026-05-12', inicioReal: '2026-05-05', terminoReal: '2026-05-12', duracao: 6, progresso: 100, inicioGrafico: 0, orcado: 1430, medido: 1430 },
  { id: 2, nome: 'Alvenaria', inicio: '2026-05-13', termino: '2026-05-22', inicioReal: '', terminoReal: '', duracao: 8, progresso: 0, inicioGrafico: 8, orcado: 5800, medido: 0 },
  { id: 3, nome: 'Infra elétrica', inicio: '2026-05-25', termino: '2026-05-27', inicioReal: '', terminoReal: '', duracao: 3, progresso: 0, inicioGrafico: 18, orcado: 3500, medido: 0 },
  { id: 4, nome: 'Infra hidráulica', inicio: '2026-05-25', termino: '2026-05-27', inicioReal: '', terminoReal: '', duracao: 3, progresso: 0, inicioGrafico: 25, orcado: 4200, medido: 0 },
  { id: 5, nome: 'Contrapiso', inicio: '2026-05-28', termino: '2026-06-01', inicioReal: '', terminoReal: '', duracao: 3, progresso: 0, inicioGrafico: 32, orcado: 2800, medido: 0 },
  { id: 6, nome: 'Reboco', inicio: '2026-06-03', termino: '2026-06-09', inicioReal: '', terminoReal: '', duracao: 5, progresso: 0, inicioGrafico: 39, orcado: 5000, medido: 0 },
  { id: 7, nome: 'Forro', inicio: '2026-06-04', termino: '2026-06-12', inicioReal: '', terminoReal: '', duracao: 7, progresso: 0, inicioGrafico: 45, orcado: 7600, medido: 0 },
  { id: 8, nome: 'Pintura', inicio: '2026-07-02', termino: '2026-07-06', inicioReal: '', terminoReal: '', duracao: 3, progresso: 0, inicioGrafico: 58, orcado: 3900, medido: 0 },
]

const equipeInicial = [
  { id: 1, obraId: 1, nome: 'Adelino Romão', funcao: 'Mestre de Obras', diaria: true, diasTrabalhados: 21, semanas: [0, 5, 5, 5, 4, 2], salarioUnitario: 150, vale: 400 },
  { id: 2, obraId: 1, nome: 'Adilio Costa', funcao: 'Pedreiro', diaria: true, diasTrabalhados: 24.5, semanas: [1, 5, 6, 4.5, 6, 2], salarioUnitario: 300, vale: 200 },
  { id: 3, obraId: 1, nome: 'Ataíde Costa', funcao: 'Servente', diaria: false, diasTrabalhados: 20, semanas: [0, 5, 5, 4, 4, 2], salarioUnitario: 200, vale: 200 },
  { id: 4, obraId: 2, nome: 'Pedro Santos', funcao: 'Estagiário', diaria: true, diasTrabalhados: 15, semanas: [1, 4, 4, 3, 2, 1], salarioUnitario: 120, vale: 100 },
]

const materiaisIniciais = [
  { id: 1, obraId: 1, material: 'Porcelanato', quantidade: '85 m²', recebido: true, data: '2026-05-09', necessidade: '2026-05-08', custo: 8500 },
  { id: 2, obraId: 1, material: 'Argamassa ACIII', quantidade: '32 sacos', recebido: true, data: '2026-05-09', necessidade: '2026-05-08', custo: 1536 },
  { id: 3, obraId: 1, material: 'Rejunte cinza', quantidade: '12 kg', recebido: false, data: '', necessidade: '2026-05-20', custo: 380 },
  { id: 4, obraId: 1, material: 'Eletroduto corrugado', quantidade: '200 m', recebido: true, data: '2026-05-08', necessidade: '2026-05-05', custo: 900 },
  { id: 5, obraId: 2, material: 'Tubos PVC', quantidade: '70 m', recebido: false, data: '', necessidade: '2026-05-18', custo: 1100 },
]

const comprasIniciais = [
  { id: 1, codigo: 'C0001', item: 'Marcenaria', fornecedor: 'Madeireira Norte', data: '2026-06-20', status: 'Aprovado', prioridade: 'Alta', qtd: 1, valorUnitario: 18100 },
  { id: 2, codigo: 'C0002', item: 'Pisos e Revestimentos', fornecedor: 'Revest Mais', data: '2026-06-12', status: 'Respondido', prioridade: 'Média', qtd: 200, valorUnitario: 190 },
  { id: 3, codigo: 'C0003', item: 'Louças e metais', fornecedor: 'Casa Hidro', data: '2026-06-28', status: 'Alerta', prioridade: 'Alta', qtd: 12, valorUnitario: 520 },
]

const financeiroInicial = [
  { id: 1, obraId: 1, tipo: 'Receita', descricao: 'Medição 1 - Cliente', valor: 24500, data: '2026-06-10', status: 'Recebido' },
  { id: 2, obraId: 1, tipo: 'Despesa', descricao: 'Uber deslocamento 1/3', valor: 185, data: '2026-06-16', status: 'Pago' },
  { id: 3, obraId: 1, tipo: 'Despesa', descricao: 'Reembolso de material 1/1', valor: 500, data: '2026-06-17', status: 'Pago' },
  { id: 4, obraId: 1, tipo: 'Despesa', descricao: 'Equipe semanal', valor: 2500, data: '2026-06-20', status: 'Pago' },
  { id: 5, obraId: 1, tipo: 'Receita', descricao: 'Medição 2 a receber', valor: 18000, data: '2026-07-10', status: 'A receber' },
]

const orcamentoInicial = [
  { id: 1, etapa: 'Demolições e Retiradas', item: 'Demolição de alvenaria', unidade: 'm²', quantidade: 45, unitario: 31.8, categoria: 'Serviços' },
  { id: 2, etapa: 'Construções', item: 'Alvenaria em bloco cerâmico', unidade: 'm²', quantidade: 120, unitario: 48.3, categoria: 'Mão de obra' },
  { id: 3, etapa: 'Instalações', item: 'Infra elétrica', unidade: 'ponto', quantidade: 70, unitario: 50, categoria: 'Instalações' },
  { id: 4, etapa: 'Revestimentos', item: 'Porcelanato', unidade: 'm²', quantidade: 85, unitario: 100, categoria: 'Materiais' },
]

const composicoesInicial = [
  { id: 1, codigo: 'COMP-001', nome: 'Assentamento de porcelanato', insumos: 4, maoObra: 38, material: 72, total: 110 },
  { id: 2, codigo: 'COMP-002', nome: 'Alvenaria de vedação', insumos: 5, maoObra: 30, material: 55, total: 85 },
  { id: 3, codigo: 'COMP-003', nome: 'Pintura acrílica', insumos: 3, maoObra: 18, material: 22, total: 40 },
]

const diarioInicial = { data: '2026-05-09', clima: 'Dia com tempo bom, serviços operantes.', atividades: 'Execução de infraestrutura elétrica, conferência de pontos hidráulicos e preparação para fechamento de forro.', observacoes: 'Sem ocorrências relevantes. Equipe orientada sobre limpeza e organização do canteiro.' }
const templates = ['Diário de Obra Padrão', 'Relatório Semanal da Obra', 'Relatório Fotográfico', 'Medição Mensal', 'Solicitação de Compra']

const inputClass = 'w-full rounded-xl border border-slate-200/60 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-premium placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 shadow-sm'
const buttonPrimaryClass = 'rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-premium hover:bg-slate-800 active:scale-95'
const buttonGreenClass = 'rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-premium hover:bg-blue-700 active:scale-95'
const surfaceClass = 'rounded-2xl border border-slate-200/60 bg-white shadow-sm shadow-slate-200/50'
const eyebrowClass = 'text-[10px] font-black uppercase tracking-widest text-slate-400'
const professionalIconClass = 'grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/50'
export default function Home() {
  const { user, userProfile, login: authLogin, logout: authLogout, loading: authLoading, isClient, isEngineer } = useAuth()
  const { obras, loading: obrasLoading, criar: criarObraHook, atualizar: atualizarObraHook } = useObras()

  const [tela, setTela] = useState('dashboard')
  const [obraId, setObraId] = useState(null)

  const { tarefas, loading: tarefasLoading, criar: adicionarTarefaHook, atualizar: atualizarTarefaHook } = useTarefas(obraId)
  const { materiais, loading: materiaisLoading, criar: adicionarMaterialHook, atualizar: atualizarMaterialHook } = useMateriais(obraId)
  const { diarios, loading: diariosLoading, criar: criarDiarioHook, atualizar: atualizarDiarioHook } = useDiarios(obraId)

  // Sincronizar obraId inicial quando as obras carregarem
  useEffect(() => {
    if (obras.length > 0 && !obraId) {
      setObraId(obras[0].id)
    }
  }, [obras, obraId])

  const [usuario, setUsuario] = useState(null) // Mantido para compatibilidade temporária
  const [fotos, setFotos] = useState([])
  const [novaTarefa, setNovaTarefa] = useState({ nome: '', inicio: '', termino: '', duracao: 1 })
  const [novaObra, setNovaObra] = useState({ nome: '', cliente: '', endereco: '', responsavel: '', etapa: '' })
  const [cardDetalhe, setCardDetalhe] = useState(null)
  const [equipe, setEquipe] = useState(equipeInicial)
  const [novoMembro, setNovoMembro] = useState({ nome: '', funcao: '' })
  const [diario, setDiario] = useState(diarioInicial)
  const [novoMaterial, setNovoMaterial] = useState({ material: '', quantidade: '' })
  const [compras, setCompras] = useState(comprasIniciais)
  const [financeiro, setFinanceiro] = useState(financeiroInicial)
  const [novaTransacao, setNovaTransacao] = useState({ tipo: 'Despesa', descricao: '', valor: '', data: '' })
  const [orcamento, setOrcamento] = useState(orcamentoInicial)
  const [novoOrcamento, setNovoOrcamento] = useState({ etapa: '', item: '', unidade: '', quantidade: '', unitario: '', categoria: 'Serviços' })
  const [composicoes, setComposicoes] = useState(composicoesInicial)
  const [semanasDiarias, setSemanasDiarias] = useState(['03/04 a 05/04', '06/04 a 12/04', '13/04 a 19/04', '20/04 a 26/04', '27/04 a 03/05', '04/05 a 05/05'])

  // Atualizar o "usuario" legado para bater com o userProfile do Supabase
  useEffect(() => {
    if (userProfile) {
      setUsuario({
        id: userProfile.id,
        nome: userProfile.nome,
        tipo: userProfile.tipo_usuario.charAt(0).toUpperCase() + userProfile.tipo_usuario.slice(1),
        iniciais: userProfile.nome.split(' ').map(n => n[0]).join('').toUpperCase()
      })
    } else {
      setUsuario(null)
    }
  }, [userProfile])

  const [saveStatus, setSaveStatus] = useState(null) // 'saving', 'saved', 'error'
  const [errorMsg, setErrorMsg] = useState('')

  const triggerFeedback = (status, msg = '') => {
    setSaveStatus(status)
    setErrorMsg(msg)
    if (status === 'saved') {
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }
  const obrasVisiveis = obras || []
  const obraAtual = obrasVisiveis.find((obra) => obra.id === obraId) || obrasVisiveis[0] || { nome: 'Carregando...', status: '...', cliente: '...', endereco: '...', etapa: '...' }

  const permissaoEditar = userProfile?.tipo_usuario === 'engenheiro' || userProfile?.tipo_usuario === 'estagiario'
  const permissaoAdmin = userProfile?.tipo_usuario === 'engenheiro'
  const ehCliente = userProfile?.tipo_usuario === 'cliente'

  const fotosDaObra = fotos.filter((foto) => foto.obraId === obraAtual.id)
  const equipeDaObra = equipe.filter((membro) => membro.obraId === obraAtual.id)
  const materiaisDaObra = materiais

  const diarioAtual = diarios[0] || { data: new Date().toISOString().split('T')[0], clima: '', atividades: '', observacoes: '' }

  const materiaisRecebidosHoje = materiaisDaObra.filter((m) => m.recebido && m.data === diarioAtual.data).length
  const financeiroDaObra = financeiro.filter((f) => f.obraId === obraAtual.id)

  const resumo = useMemo(() => {
    const total = tarefas.length || 1
    const media = Math.round(tarefas.reduce((acc, tarefa) => acc + Number(tarefa.progresso || 0), 0) / total)
    const concluidas = tarefas.filter((tarefa) => Number(tarefa.progresso) === 100).length
    const pendentes = tarefas.filter((tarefa) => Number(tarefa.progresso) === 0).length
    return { media, concluidas, pendentes }
  }, [tarefas])

  const alertas = gerarAlertas(tarefas, materiaisDaObra, diarioAtual)
  const atrasosReais = alertas.filter((a) => a.tipo === 'critico')
  const possiveisAtrasos = alertas.filter((a) => a.tipo === 'atencao')

  function selecionarUsuario(user) { /* Legado, será removido após login real */ }
  function trocarTela(novaTela) { setTela(novaTela); setCardDetalhe(null) }

  async function adicionarTarefa() {
    if (!permissaoEditar) return alert('Sem permissão para alterar o cronograma.')
    if (!novaTarefa.nome.trim()) return alert('Digite o nome da tarefa.')

    try {
      triggerFeedback('saving')
      const nova = {
        obra_id: obraAtual.id,
        nome: novaTarefa.nome.trim(),
        data_inicio: novaTarefa.inicio || new Date().toISOString().split('T')[0],
        data_termino: novaTarefa.termino || new Date().toISOString().split('T')[0],
        duracao: Number(novaTarefa.duracao) || 1,
        progresso: 0
      }
      await adicionarTarefaHook(nova)
      setNovaTarefa({ nome: '', inicio: '', termino: '', duracao: 1 })
      triggerFeedback('saved')
    } catch (err) {
      triggerFeedback('error', err.message)
    }
  }

  async function atualizarTarefa(id, campo, valor) {
    if (!permissaoEditar && !['medido'].includes(campo)) return

    const campoMapeado = {
      inicio: 'data_inicio',
      termino: 'data_termino',
      progresso: 'progresso',
      nome: 'nome',
      duracao: 'duracao'
    }[campo] || campo

    const valorFinal = ['progresso', 'duracao', 'orcado', 'medido'].includes(campo)
      ? Math.max(0, campo === 'progresso' ? Math.min(100, Number(valor)) : Number(valor))
      : valor

    try {
      triggerFeedback('saving')
      await atualizarTarefaHook(id, { [campoMapeado]: valorFinal })
      triggerFeedback('saved')
    } catch (err) {
      triggerFeedback('error', err.message)
    }
  }

  function atualizarProgresso(id, progresso) { atualizarTarefa(id, 'progresso', progresso) }
  function criarNovoCronograma() { if (!permissaoAdmin) return alert('Somente engenheiro pode criar novo cronograma.'); if (confirm('Criar um novo cronograma zerado para esta obra?')) setCronogramas({ ...cronogramas, [obraAtual.id]: [] }) }

  async function criarNovaObra() {
    if (!permissaoAdmin) return alert('Somente engenheiro pode criar uma nova obra.')
    if (!novaObra.nome.trim()) return alert('Digite o nome da obra.')

    try {
      triggerFeedback('saving')
      const obra = {
        nome: novaObra.nome.trim(),
        cliente: novaObra.cliente.trim() || 'Cliente não informado',
        endereco: novaObra.endereco.trim() || 'Endereço não informado',
        status: 'No prazo',
        etapa: novaObra.etapa || 'Planejamento inicial'
      }
      const criada = await criarObraHook(obra)
      setObraId(criada.id)
      setNovaObra({ nome: '', cliente: '', endereco: '', responsavel: '', etapa: '' })
      setTela('cronograma')
      triggerFeedback('saved')
    } catch (err) {
      triggerFeedback('error', err.message)
    }
  }

  async function atualizarObra(id, campo, valor) {
    try {
      triggerFeedback('saving')
      await atualizarObraHook(id, { [campo]: valor })
      triggerFeedback('saved')
    } catch (err) {
      triggerFeedback('error', err.message)
    }
  }

  function adicionarFotos(event) { const arquivos = Array.from(event.target.files || []); const novasFotos = arquivos.map((arquivo) => ({ id: crypto.randomUUID(), nome: arquivo.name, url: URL.createObjectURL(arquivo), obraId: obraAtual.id, data: new Date().toLocaleDateString('pt-BR') })); setFotos([...novasFotos, ...fotos]); event.target.value = '' }
  function adicionarMembro() { if (!novoMembro.nome.trim()) return alert('Digite o nome do membro da equipe.'); setEquipe([...equipe, { id: crypto.randomUUID(), obraId: obraAtual.id, nome: novoMembro.nome.trim(), funcao: novoMembro.funcao.trim() || 'Função não informada', diaria: true, diasTrabalhados: 0, semanas: [0, 0, 0, 0, 0, 0], salarioUnitario: 0, vale: 0 }]); setNovoMembro({ nome: '', funcao: '' }) }
  function atualizarEquipe(id, campo, valor) { setEquipe(equipe.map((m) => (m.id === id ? { ...m, [campo]: ['diasTrabalhados', 'salarioUnitario', 'vale'].includes(campo) ? Number(valor) : valor } : m))) }
  function atualizarSemanaEquipe(id, i, valor) { setEquipe(equipe.map((m) => { if (m.id !== id) return m; const semanas = [...(m.semanas || [0, 0, 0, 0, 0, 0])]; semanas[i] = Number(valor); return { ...m, semanas, diasTrabalhados: semanas.reduce((a, d) => a + Number(d || 0), 0) } })) }

  async function atualizarMaterial(id, campo, valor) {
    try {
      triggerFeedback('saving')
      await atualizarMaterialHook(id, { [campo]: campo === 'custo' ? Number(valor) : valor })
      triggerFeedback('saved')
    } catch (err) {
      triggerFeedback('error', err.message)
    }
  }

  async function adicionarMaterial() {
    if (!novoMaterial.material.trim()) return alert('Digite o nome do material.')
    try {
      triggerFeedback('saving')
      await adicionarMaterialHook({
        material: novoMaterial.material.trim(),
        quantidade: novoMaterial.quantidade || 'Qtd. a definir',
        recebido: false,
        custo: 0
      })
      setNovoMaterial({ material: '', quantidade: '' })
      triggerFeedback('saved')
    } catch (err) {
      triggerFeedback('error', err.message)
    }
  }

  function atualizarCompra(id, campo, valor) { setCompras(compras.map((item) => (item.id === id ? { ...item, [campo]: campo === 'qtd' || campo === 'valorUnitario' ? Number(valor) : valor } : item))) }
  function adicionarTransacao() { if (!novaTransacao.descricao.trim()) return alert('Descreva a transação.'); setFinanceiro([...financeiro, { id: crypto.randomUUID(), obraId: obraAtual.id, tipo: novaTransacao.tipo, descricao: novaTransacao.descricao, valor: Number(novaTransacao.valor || 0), data: novaTransacao.data || new Date().toISOString().slice(0, 10), status: novaTransacao.tipo === 'Receita' ? 'A receber' : 'A pagar' }]); setNovaTransacao({ tipo: 'Despesa', descricao: '', valor: '', data: '' }) }
  function adicionarItemOrcamento() { if (!novoOrcamento.item.trim()) return alert('Digite o item do orçamento.'); setOrcamento([...orcamento, { id: crypto.randomUUID(), etapa: novoOrcamento.etapa || 'Sem etapa', item: novoOrcamento.item, unidade: novoOrcamento.unidade || 'un', quantidade: Number(novoOrcamento.quantidade || 0), unitario: Number(novoOrcamento.unitario || 0), categoria: novoOrcamento.categoria }]); setNovoOrcamento({ etapa: '', item: '', unidade: '', quantidade: '', unitario: '', categoria: 'Serviços' }) }

  async function salvarDiario(updates) {
    try {
      triggerFeedback('saving')
      if (diarios[0]) {
        await atualizarDiarioHook(diarios[0].id, updates)
      } else {
        await criarDiarioHook({ ...updates, obra_id: obraId, data: new Date().toISOString().split('T')[0] })
      }
      triggerFeedback('saved')
    } catch (err) {
      triggerFeedback('error', err.message)
    }
  }

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-blue-600">Carregando NeoCanteiro...</div>
  if (!user) return <LoginScreen login={authLogin} />

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 lg:pb-0">
      {/* Toast Feedback */}
      {saveStatus && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl border px-6 py-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${saveStatus === 'saving' ? 'bg-white border-blue-100 text-blue-600' :
          saveStatus === 'saved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
            'bg-red-50 border-red-100 text-red-700'
          }`}>
          <div className="flex h-2 w-2 rounded-full bg-current animate-pulse"></div>
          <p className="text-xs font-black uppercase tracking-widest">
            {saveStatus === 'saving' ? 'Salvando alterações...' :
              saveStatus === 'saved' ? 'Alterações salvas!' :
                `Erro: ${errorMsg}`}
          </p>
        </div>
      )}
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={tela}
          onTabChange={trocarTela}
          userProfile={usuario}
          logout={authLogout}
        />

        <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
          {/* Global Header */}
          <Header
            userProfile={usuario}
            obras={obrasVisiveis}
            obraSelecionadaId={obraId}
            onObraChange={setObraId}
          />

          <section className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 custom-scrollbar">
            {/* Context Breadcrumb / Action Bar (Optional extra polish) */}
            <div className="mb-8 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></span>
                    <p className={eyebrowClass}>NeoCanteiro / {tela}</p>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 capitalize">
                    {tela === 'dashboard' ? 'Visão Geral' : tela}
                  </h1>
                </div>

                {permissaoAdmin && (
                  <button
                    onClick={() => trocarTela('usuarios')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-premium hover:bg-blue-700 hover:scale-105 active:scale-95"
                  >
                    <span>Nova Obra</span>
                  </button>
                )}
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {tela === 'dashboard' && !cardDetalhe && (
                <DashboardView
                  obraAtual={obraAtual}
                  tarefas={tarefas}
                  materiais={materiaisDaObra}
                  diarios={[]} // Adapt as needed or pass real diarios
                  isClient={ehCliente}
                  resumo={resumo}
                  alertas={alertas}
                  atrasosReais={atrasosReais}
                  possiveisAtrasos={possiveisAtrasos}
                  fotosDaObra={fotosDaObra}
                  materiaisRecebidosHoje={materiaisRecebidosHoje}
                  obrasVisiveis={obrasVisiveis}
                  setObraId={setObraId}
                  setCardDetalhe={setCardDetalhe}
                  financeiro={financeiroDaObra}
                  compras={compras}
                  atualizarObra={atualizarObra}
                />
              )}
              {tela === 'dashboard' && cardDetalhe && <DetalheCard tipo={cardDetalhe} voltar={() => setCardDetalhe(null)} resumo={resumo} fotosDaObra={fotosDaObra} materiais={materiaisDaObra} tarefas={tarefas} />}
              {tela === 'cronograma' && <TelaCronograma permissaoEditar={permissaoEditar} permissaoAdmin={permissaoAdmin} criarNovoCronograma={criarNovoCronograma} novaTarefa={novaTarefa} setNovaTarefa={setNovaTarefa} adicionarTarefa={adicionarTarefa} tarefas={tarefas} atualizarProgresso={atualizarProgresso} atualizarTarefa={atualizarTarefa} />}
              {tela === 'fotos' && <TelaFotos permissaoEditar={permissaoEditar} adicionarFotos={adicionarFotos} fotosDaObra={fotosDaObra} />}
              {tela === 'equipe' && !ehCliente && <TelaEquipe obraAtual={obraAtual} equipe={equipeDaObra} semanas={semanasDiarias} setSemanas={setSemanasDiarias} novoMembro={novoMembro} setNovoMembro={setNovoMembro} adicionarMembro={adicionarMembro} atualizarEquipe={atualizarEquipe} atualizarSemanaEquipe={atualizarSemanaEquipe} />}
              {tela === 'diario' && !ehCliente && <TelaDiario obraAtual={obraAtual} diario={diarioAtual} setDiario={salvarDiario} equipe={equipeDaObra} materiais={materiaisDaObra} />}
              {tela === 'materiais' && !ehCliente && <TelaMateriais materiais={materiaisDaObra} atualizarMaterial={atualizarMaterial} novoMaterial={novoMaterial} setNovoMaterial={setNovoMaterial} adicionarMaterial={adicionarMaterial} />}
              {tela === 'financeiro' && !ehCliente && <TelaFinanceiro financeiro={financeiroDaObra} novaTransacao={novaTransacao} setNovaTransacao={setNovaTransacao} adicionarTransacao={adicionarTransacao} />}
              {tela === 'compras' && !ehCliente && <TelaCompras compras={compras} atualizarCompra={atualizarCompra} />}
              {tela === 'orcamento' && !ehCliente && <TelaOrcamento orcamento={orcamento} novo={novoOrcamento} setNovo={setNovoOrcamento} adicionar={adicionarItemOrcamento} />}
              {tela === 'composicoes' && !ehCliente && <TelaComposicoes composicoes={composicoes} />}
              {tela === 'abc' && !ehCliente && <TelaCurvaABC orcamento={orcamento} />}
              {tela === 'medicoes' && <TelaMedicoes tarefas={tarefas} atualizarTarefa={atualizarTarefa} podeEditar={permissaoEditar} />}
              {tela === 'templates' && <TelaTemplates />}
              {tela === 'ia' && !ehCliente && <TelaIA obraAtual={obraAtual} tarefas={tarefas} alertas={alertas} compras={compras} financeiro={financeiroDaObra} materiais={materiaisDaObra} />}
              {tela === 'usuarios' && !ehCliente && <TelaUsuarios permissaoAdmin={permissaoAdmin} novaObra={novaObra} setNovaObra={setNovaObra} criarNovaObra={criarNovaObra} />}
            </div>
          </section>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={tela}
        onTabChange={trocarTela}
        userProfile={usuario}
      />
    </main>
  )
}

function Dashboard({ ehCliente, obraAtual, usuario, resumo, alertas, atrasosReais, possiveisAtrasos, fotosDaObra, materiaisRecebidosHoje, tarefas, obrasVisiveis, cronogramas, setObraId, setCardDetalhe, financeiro, compras, atualizarObra }) {
  const receitas = financeiro.filter((f) => f.tipo === 'Receita').reduce((a, f) => a + f.valor, 0)
  const despesas = financeiro.filter((f) => f.tipo === 'Despesa').reduce((a, f) => a + f.valor, 0)
  const aReceber = financeiro.filter((f) => f.tipo === 'Receita' && f.status === 'A receber').reduce((a, f) => a + f.valor, 0)
  const resultado = receitas - despesas
  const tarefasAtrasadas = tarefas.filter((t) => estaAtrasada(t)).length
  const comprasAbertas = compras.filter(c => c.status !== 'Aprovado').length

  return <div className="space-y-6">
    {ehCliente && <ClienteBanner obraAtual={obraAtual} />}

    <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm shadow-slate-200/50">
      <div className="grid gap-10 xl:grid-cols-[1.2fr_.8fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 ring-1 ring-slate-200">Visão Geral da Obra</span>
            <StatusBadge status={obraAtual.status} />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900">{obraAtual.nome}</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium text-slate-500 leading-relaxed">{obraAtual.cliente} · {obraAtual.endereco}. Etapa: <span className="text-slate-900 font-bold">{obraAtual.etapa}</span>.</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <ExecutiveStat label="Avanço Físico" value={`${resumo.media}%`} detail="progresso real" />
            <ExecutiveStat label="Entrega Prevista" value={formatarData(obraAtual.previsaoEntrega)} detail={obraAtual.prazo} />
            <ExecutiveStat label="Resp. Técnico" value={obraAtual.responsavel} detail={`Nível: ${usuario.tipo}`} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 text-center">Saúde do Empreendimento</p>
          <div className="flex items-center justify-center mb-8"><ProgressRing value={resumo.media} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Atrasos</p><p className="mt-1 text-xl font-black text-red-600">{tarefasAtrasadas}</p></div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Suprimentos</p><p className="mt-1 text-xl font-black text-amber-600">{comprasAbertas}</p></div>
          </div>
        </div>
      </div>
    </section>


    {!ehCliente && <CentralAlertas alertas={alertas} atrasosReais={atrasosReais} possiveisAtrasos={possiveisAtrasos} setCardDetalhe={setCardDetalhe} />}

    {!ehCliente && <PanelClean><div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><p className={eyebrowClass}>Planejamento</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Cronograma executivo</h2></div><p className="text-sm text-slate-500">Previsto x realizado, atualizado automaticamente</p></div><GraficoCronograma tarefas={tarefas} /></PanelClean>}

    {ehCliente && <PanelClean>
      <div className="mb-4 flex items-center justify-between"><div><p className={eyebrowClass}>Fase atual</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Etapa e cronograma simplificado</h2></div><StatusBadge status={obraAtual.status} /></div>
      <div className="grid gap-4 md:grid-cols-3"><InfoCard titulo="Etapa atual" valor={obraAtual.etapa} detalhe={`Responsável: ${obraAtual.responsavel}`} /><InfoCard titulo="Prazo" valor={obraAtual.prazo} detalhe={`Previsão: ${formatarData(obraAtual.previsaoEntrega)}`} /><InfoCard titulo="Status da obra" valor={obraAtual.status} detalhe="acompanhamento executivo" /></div>
      <div className="mt-4"><MiniTimeline tarefas={tarefas} /></div>
    </PanelClean>}

    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {ehCliente ? <>
        <MetricCard title="Fotos da obra" value={fotosDaObra.length} detail="registros liberados" icon="01" onClick={() => setCardDetalhe('fotos')} />
        <MetricCard title="Materiais recebidos" value={materiaisRecebidosHoje} detail="entregas lançadas hoje" icon="02" onClick={() => setCardDetalhe('materiais')} />
        <MetricCard title="Panorama geral" value={`${resumo.media}%`} detail="progresso físico geral" icon="03" onClick={() => setCardDetalhe('avanco')} />
      </> : <>
        <MetricCard title="Avanço médio da obra" value={`${resumo.media}%`} detail="progresso físico geral" icon="01" onClick={() => setCardDetalhe('avanco')} />
        <MetricCard title="Fotos do dia" value={fotosDaObra.length} detail="registros liberados" icon="02" onClick={() => setCardDetalhe('fotos')} />
        <MetricCard title="Materiais recebidos" value={materiaisRecebidosHoje} detail="entregas lançadas hoje" icon="03" onClick={() => setCardDetalhe('materiais')} />
      </>}
    </section>

    {!ehCliente && <section className="grid gap-5 xl:grid-cols-[1fr_.72fr]">
      <PanelClean>
        <div className="mb-4 flex items-center justify-between"><div><p className={eyebrowClass}>Operação</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Etapa, prazo e responsável</h2></div><StatusBadge status={obraAtual.status} /></div>
        <div className="grid gap-3 md:grid-cols-3"><InfoCard titulo="Etapa atual" valor={obraAtual.etapa} detalhe={`Responsável: ${obraAtual.responsavel}`} /><InfoCard titulo="Prazo" valor={obraAtual.prazo} detalhe={`Previsão: ${formatarData(obraAtual.previsaoEntrega)}`} /><InfoCard titulo="Pontos críticos" valor={tarefasAtrasadas} detalhe="atividades realmente atrasadas" /></div>
        <div className="mt-4"><MiniTimeline tarefas={tarefas} /></div>
      </PanelClean>

      <PanelClean>
        <div className="mb-3"><p className={eyebrowClass}>Portfólio</p><h2 className="mt-1 text-xl font-bold text-slate-950">Obras em acompanhamento</h2></div>
        <div className="space-y-3">{obrasVisiveis.map((obra) => { const tarefasObra = cronogramas?.[obra.id] || []; const p = tarefasObra.length ? Math.round(tarefasObra.reduce((a, t) => a + Number(t.progresso), 0) / tarefasObra.length) : 0; return <button key={obra.id} onClick={() => setObraId(obra.id)} className="w-full rounded-[1.15rem] border border-slate-200/70 bg-white/80 p-3 text-left transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-slate-950">{obra.nome}</p><p className="mt-1 text-xs text-slate-500">{obra.etapa} · {obra.prazo}</p><p className="mt-1 text-xs font-bold text-blue-700">Responsável: {obra.responsavel}</p></div><div className="text-right"><p className="text-xl font-bold text-blue-700">{p}%</p><p className="text-[10px] uppercase tracking-widest text-slate-400">avanço</p></div></div></button> })}</div>
      </PanelClean>
    </section>}

    {ehCliente && <CentralAlertas alertas={alertas} atrasosReais={atrasosReais} possiveisAtrasos={possiveisAtrasos} setCardDetalhe={setCardDetalhe} />}

    {!ehCliente && <PanelClean><h2 className="mb-4 text-xl font-bold">Editar etapa, prazo e responsável da obra selecionada</h2><div className="grid gap-3 md:grid-cols-4"><input className={inputClass} value={obraAtual.etapa} onChange={(e) => atualizarObra(obraAtual.id, 'etapa', e.target.value)} /><input className={inputClass} value={obraAtual.prazo} onChange={(e) => atualizarObra(obraAtual.id, 'prazo', e.target.value)} /><input className={inputClass} value={obraAtual.responsavel} onChange={(e) => atualizarObra(obraAtual.id, 'responsavel', e.target.value)} /><input type="date" className={inputClass} value={obraAtual.previsaoEntrega || ''} onChange={(e) => atualizarObra(obraAtual.id, 'previsaoEntrega', e.target.value)} /></div></PanelClean>}

    {!ehCliente && <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
      <MetricCard title="Resultado financeiro" value={formatarMoeda(resultado)} detail="entradas - saídas" icon="04" />
      <MetricCard title="A receber" value={formatarMoeda(aReceber)} detail="pagamentos futuros" icon="05" />
      <MetricCard title="Cotações abertas" value={comprasAbertas} detail="aguardando decisão" icon="06" />
      <MetricCard title="Possíveis atrasos" value={possiveisAtrasos.length} detail="pontos de atenção" icon="07" />
    </section>}
  </div>
}

function CentralAlertas({ alertas, atrasosReais, possiveisAtrasos, setCardDetalhe }) { return <PanelClean><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Central de alertas</p><h2 className="text-3xl font-bold text-slate-950">Atrasos e pontos de atenção</h2></div><div className="flex gap-2 text-sm font-black"><button onClick={() => setCardDetalhe('atrasos')} className="rounded-full bg-red-50 px-3 py-2 text-red-700 ring-1 ring-red-100">🔴 {atrasosReais.length} atrasados</button><button onClick={() => setCardDetalhe('possiveis')} className="rounded-full bg-amber-50 px-3 py-2 text-amber-700 ring-1 ring-amber-100">🟡 {possiveisAtrasos.length} possíveis atrasos</button></div></div>{alertas.length === 0 ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 font-bold text-emerald-700">🟢 Nenhum alerta no momento.</div> : <div className="grid gap-3 md:grid-cols-2">{alertas.slice(0, 6).map((a) => <button key={a.id} onClick={() => a.id === 'materiais-pendentes' ? setCardDetalhe('materiaisPendentes') : a.tipo === 'critico' ? setCardDetalhe('atrasos') : setCardDetalhe('possiveis')} className={`rounded-2xl border p-4 text-left ${a.tipo === 'critico' ? 'border-red-100 bg-red-50' : 'border-amber-100 bg-amber-50'}`}><div className="flex items-start gap-3"><span className="text-2xl">{a.icone}</span><div><p className="font-bold text-slate-950">{a.titulo}</p><p className="mt-1 text-sm text-slate-600">{a.descricao}</p></div></div></button>)}</div>}</PanelClean> }
function DetalheCard({ tipo, voltar, resumo, fotosDaObra, materiais, tarefas }) { const titulo = tipo === 'avanco' ? 'Detalhes do avanço da obra' : tipo === 'fotos' ? 'Fotos do dia' : tipo === 'materiais' ? 'Materiais recebidos' : tipo === 'materiaisPendentes' ? 'Materiais pendentes' : tipo === 'atrasos' ? 'Atividades realmente atrasadas' : 'Possíveis atrasos'; const listaMateriais = tipo === 'materiaisPendentes' ? materiais.filter((m) => !m.recebido) : materiais.filter((m) => m.recebido); const listaTarefas = tipo === 'atrasos' ? tarefas.filter(estaAtrasada) : tarefas.filter((t) => !estaAtrasada(t) && Number(t.progresso) < 100); return <div className="space-y-5"><button onClick={voltar} className="font-black text-blue-700">← Voltar ao dashboard</button><PanelClean><h1 className="text-4xl font-bold text-slate-950">{titulo}</h1>{tipo === 'avanco' && <div className="mt-6 grid gap-4 md:grid-cols-2"><ProgressRing value={resumo.media} /><MiniTimeline tarefas={tarefas} /></div>}{tipo === 'fotos' && (fotosDaObra.length ? <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{fotosDaObra.map((foto) => <img key={foto.id} src={foto.url} alt={foto.nome} className="h-40 w-full rounded-3xl object-cover" />)}</div> : <Empty text="Nenhuma foto cadastrada hoje." />)}{['materiais', 'materiaisPendentes'].includes(tipo) && <div className="mt-6 space-y-3">{listaMateriais.map((m) => <div key={m.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">{m.material}</p><p className="text-sm text-slate-500">{m.quantidade} · necessidade: {formatarData(m.necessidade)} · {m.recebido ? `recebido em ${formatarData(m.data)}` : 'não recebido'}</p></div>)}</div>}{['atrasos', 'possiveis'].includes(tipo) && <div className="mt-6 space-y-3">{listaTarefas.map((t) => <div key={t.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">{t.nome}</p><p className="text-sm text-slate-500">Previsto: {formatarData(t.inicio)} até {formatarData(t.termino)} · avanço: {t.progresso}%</p></div>)}</div>}</PanelClean></div> }

function TelaCronograma({ permissaoEditar, permissaoAdmin, criarNovoCronograma, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarProgresso, atualizarTarefa }) {
  return (
    <div className="space-y-6">
      <PanelClean>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Cronograma de Obra</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Planejamento e controle de prazos</p>
          </div>
          <div className="flex gap-3">
            {permissaoAdmin && (
              <button
                onClick={criarNovoCronograma}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-500 hover:bg-slate-50 hover:text-red-600 transition-all active:scale-95 shadow-sm"
              >
                Resetar Cronograma
              </button>
            )}
          </div>
        </div>
      </PanelClean>

      {permissaoEditar && (
        <PanelClean>
          <h3 className="mb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Adicionar Nova Atividade</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <input
              value={novaTarefa.nome}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, nome: e.target.value })}
              placeholder="Ex: Alvenaria de vedação"
              className={`${inputClass} md:col-span-2`}
            />
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <input
                type="date"
                value={novaTarefa.inicio}
                onChange={(e) => setNovaTarefa({ ...novaTarefa, inicio: e.target.value })}
                className={inputClass}
              />
              <input
                type="date"
                value={novaTarefa.termino}
                onChange={(e) => setNovaTarefa({ ...novaTarefa, termino: e.target.value })}
                className={inputClass}
              />
            </div>
            <button
              onClick={adicionarTarefa}
              className="rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-premium hover:bg-blue-700 active:scale-95"
            >
              Adicionar
            </button>
          </div>
        </PanelClean>
      )}

      <PanelClean>
        <h3 className="mb-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Gráfico de Gantt Executivo</h3>
        <GraficoCronograma tarefas={tarefas} />
      </PanelClean>

      <PanelClean>
        <h3 className="mb-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Gestão de Atividades</h3>
        <CronogramaVisual
          tarefas={tarefas}
          atualizarProgresso={atualizarProgresso}
          atualizarTarefa={atualizarTarefa}
          podeEditar={permissaoEditar}
        />
      </PanelClean>
    </div>
  )
}
function CampoData({ valor, podeEditar, onChange }) { return podeEditar ? <input type="date" className={inputClass} value={valor || ''} onChange={(e) => onChange(e.target.value)} /> : <span className="text-sm font-bold">{formatarData(valor)}</span> }

function TelaOrcamento({ orcamento, novo, setNovo, adicionar }) { const total = orcamento.reduce((a, i) => a + i.quantidade * i.unitario, 0); return <div className="space-y-5"><PanelClean><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Orçamento de Obra</p><h2 className="text-3xl font-black">Adicione itens, simule versões e gere base para relatórios</h2><p className="mt-2 text-slate-500">Total do orçamento: <strong>{formatarMoeda(total)}</strong></p></PanelClean><PanelClean><div className="grid gap-3 md:grid-cols-6"><input className={inputClass} placeholder="Etapa" value={novo.etapa} onChange={(e) => setNovo({ ...novo, etapa: e.target.value })} /><input className={`${inputClass} md:col-span-2`} placeholder="Item" value={novo.item} onChange={(e) => setNovo({ ...novo, item: e.target.value })} /><input className={inputClass} placeholder="Un." value={novo.unidade} onChange={(e) => setNovo({ ...novo, unidade: e.target.value })} /><input type="number" className={inputClass} placeholder="Qtd." value={novo.quantidade} onChange={(e) => setNovo({ ...novo, quantidade: e.target.value })} /><button className={buttonGreenClass} onClick={adicionar}>Adicionar</button></div></PanelClean><PanelClean><TabelaSimples linhas={orcamento.map(i => [i.etapa, i.item, i.unidade, i.quantidade, formatarMoeda(i.unitario), formatarMoeda(i.quantidade * i.unitario)])} colunas={['Etapa', 'Item', 'Un.', 'Qtd.', 'Unitário', 'Total']} /></PanelClean></div> }
function TelaComposicoes({ composicoes }) { return <PanelClean><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Composição de Custos</p><h2 className="mb-5 text-3xl font-black">Crie composições e simule custos unitários</h2><TabelaSimples colunas={['Código', 'Composição', 'Insumos', 'Mão de obra', 'Material', 'Total']} linhas={composicoes.map(c => [c.codigo, c.nome, c.insumos, formatarMoeda(c.maoObra), formatarMoeda(c.material), formatarMoeda(c.total)])} /></PanelClean> }
function TelaCurvaABC({ orcamento }) { const total = orcamento.reduce((a, i) => a + i.quantidade * i.unitario, 0); const ordenado = [...orcamento].sort((a, b) => (b.quantidade * b.unitario) - (a.quantidade * a.unitario)); return <PanelClean><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Curva ABC</p><h2 className="mb-5 text-3xl font-black">Itens mais relevantes do orçamento</h2><TabelaSimples colunas={['Classe', 'Item', 'Categoria', 'Valor', 'Participação']} linhas={ordenado.map((i, idx) => [idx < 1 ? 'A' : idx < 3 ? 'B' : 'C', i.item, i.categoria, formatarMoeda(i.quantidade * i.unitario), `${Math.round(((i.quantidade * i.unitario) / total) * 100)}%`])} /></PanelClean> }
function TelaFinanceiro({ financeiro, novaTransacao, setNovaTransacao, adicionarTransacao }) { const receitas = financeiro.filter(f => f.tipo === 'Receita').reduce((a, f) => a + f.valor, 0); const despesas = financeiro.filter(f => f.tipo === 'Despesa').reduce((a, f) => a + f.valor, 0); const aReceber = financeiro.filter(f => f.tipo === 'Receita' && f.status === 'A receber').reduce((a, f) => a + f.valor, 0); return <div className="space-y-5"><section className="grid gap-5 md:grid-cols-3"><MetricCard title="Receitas" value={formatarMoeda(receitas)} detail="entradas" icon="🟢" /><MetricCard title="Despesas" value={formatarMoeda(despesas)} detail="saídas" icon="🔴" /><MetricCard title="Pagamentos a receber" value={formatarMoeda(aReceber)} detail="resumo de recebíveis" icon="🧾" /></section><PanelClean><h2 className="mb-4 text-3xl font-black">Fluxo de entradas e saídas por obra</h2><div className="grid gap-3 md:grid-cols-5"><select className={inputClass} value={novaTransacao.tipo} onChange={(e) => setNovaTransacao({ ...novaTransacao, tipo: e.target.value })}><option>Receita</option><option>Despesa</option></select><input className={`${inputClass} md:col-span-2`} placeholder="Descrição" value={novaTransacao.descricao} onChange={(e) => setNovaTransacao({ ...novaTransacao, descricao: e.target.value })} /><input type="number" className={inputClass} placeholder="Valor" value={novaTransacao.valor} onChange={(e) => setNovaTransacao({ ...novaTransacao, valor: e.target.value })} /><button className={buttonGreenClass} onClick={adicionarTransacao}>Adicionar</button></div></PanelClean><PanelClean><TabelaSimples colunas={['Descrição', 'Tipo', 'Valor', 'Data', 'Status']} linhas={financeiro.map(t => [t.descricao, t.tipo, formatarMoeda(t.valor), formatarData(t.data), t.status])} /></PanelClean></div> }
function TelaCompras({ compras, atualizarCompra }) { return <PanelClean><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Gestão de Compras</p><h2 className="text-3xl font-black">Evite prejuízos com compras online</h2><p className="mt-1 text-slate-500">Centralize fornecedores, prazos e status de aquisição.</p></div><button className={buttonPrimaryClass}>+ Nova cotação</button></div><TabelaSimples colunas={['Código', 'Cotação', 'Fornecedor', 'Data', 'Status', 'Prioridade', 'Total']} linhas={compras.map(c => [c.codigo, c.item, c.fornecedor, formatarData(c.data), c.status, c.prioridade, formatarMoeda(c.qtd * c.valorUnitario)])} /></PanelClean> }
function TelaMedicoes({ tarefas, atualizarTarefa, podeEditar }) { const totalOrcado = tarefas.reduce((a, t) => a + Number(t.orcado || 0), 0); const totalMedido = tarefas.reduce((a, t) => a + Number(t.medido || 0), 0); return <div className="space-y-5"><section className="grid gap-5 md:grid-cols-3"><MetricCard title="Orçado" value={formatarMoeda(totalOrcado)} detail="total previsto" icon="📐" /><MetricCard title="Medido acumulado" value={formatarMoeda(totalMedido)} detail="executado" icon="📏" /><MetricCard title="Restante" value={formatarMoeda(totalOrcado - totalMedido)} detail="saldo" icon="📊" /></section><PanelClean><h2 className="mb-5 text-3xl font-black">Medição de obra</h2><div className="overflow-x-auto"><table className="min-w-[850px] w-full text-sm"><thead><tr className="bg-slate-100"><th className="p-3 text-left">Item</th><th className="p-3">Orçado</th><th className="p-3">Medição atual</th><th className="p-3">Acumulado</th><th className="p-3">Restante</th><th className="p-3">%</th></tr></thead><tbody>{tarefas.map(t => <tr key={t.id} className="border-b"><td className="p-3 font-black">{t.nome}</td><td className="p-3"><input type="number" disabled={!podeEditar} className={inputClass} value={t.orcado || 0} onChange={(e) => atualizarTarefa(t.id, 'orcado', e.target.value)} /></td><td className="p-3"><input type="number" disabled={!podeEditar} className={inputClass} value={t.medido || 0} onChange={(e) => atualizarTarefa(t.id, 'medido', e.target.value)} /></td><td className="p-3 font-bold">{formatarMoeda(t.medido || 0)}</td><td className="p-3 font-bold">{formatarMoeda((t.orcado || 0) - (t.medido || 0))}</td><td className="p-3 font-black text-blue-700">{t.orcado ? Math.round((t.medido / t.orcado) * 100) : 0}%</td></tr>)}</tbody></table></div></PanelClean></div> }
function TelaTemplates() { return <div className="space-y-6"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Biblioteca profissional</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">Templates para obra</h1><p className="mt-3 max-w-2xl text-sm text-slate-600">Modelos prontos para padronizar relatórios, medições, diários e solicitações dentro do NeoCanteiro.</p></section><div className="grid gap-5 md:grid-cols-3">{templates.map((t, i) => <div key={t} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{i === 3 || i === 4 ? 'Popular' : 'Template'}</p><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">0{i + 1}</span></div><h3 className="mt-6 text-xl font-bold text-slate-800">{t}</h3><p className="mt-3 text-sm text-slate-600">Modelo padronizado para agilizar rotinas de campo, controle técnico e comunicação com cliente.</p><button className="mt-6 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Usar modelo</button></div>)}</div></div> }

function TelaFotos({ permissaoEditar, adicionarFotos, fotosDaObra }) { return <PanelClean><div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm text-slate-500">Fotos da obra</p><h2 className="text-3xl font-black">Registro em campo</h2></div>{permissaoEditar && <label className={`${buttonPrimaryClass} cursor-pointer`}>Adicionar fotos<input type="file" multiple accept="image/*" onChange={adicionarFotos} className="hidden" /></label>}</div>{fotosDaObra.length === 0 ? <Empty text="Nenhuma foto cadastrada nesta obra." /> : <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{fotosDaObra.map((foto) => <div key={foto.id} className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm"><img src={foto.url} alt={foto.nome} className="h-40 w-full object-cover" /><div className="p-3"><p className="truncate font-bold">{foto.nome}</p><p className="text-sm text-slate-400">{foto.data}</p></div></div>)}</div>}</PanelClean> }
function TelaEquipe({ obraAtual, equipe, semanas, setSemanas, novoMembro, setNovoMembro, adicionarMembro, atualizarEquipe, atualizarSemanaEquipe }) { const totalDiarias = equipe.reduce((a, m) => a + Number(m.diasTrabalhados || 0), 0); const totalVales = equipe.reduce((a, m) => a + Number(m.vale || 0), 0); const totalSalarios = equipe.reduce((a, m) => a + ((Number(m.diasTrabalhados || 0) * Number(m.salarioUnitario || 0)) - Number(m.vale || 0)), 0); return <div className="space-y-5"><section className="grid grid-cols-1 gap-5 md:grid-cols-4"><MetricCard title="Membros" value={equipe.length} detail="vinculados" icon="👷" /><MetricCard title="Presentes hoje" value={equipe.filter((m) => m.diaria).length} detail="diária marcada" icon="✅" /><MetricCard title="Dias trabalhados" value={totalDiarias.toLocaleString('pt-BR')} detail="total" icon="📅" /><MetricCard title="Total a pagar" value={formatarMoeda(totalSalarios)} detail="salário - vales" icon="💰" /></section><PanelClean><p className="mb-1 text-sm font-bold uppercase tracking-wide text-blue-600">{obraAtual.nome}</p><h2 className="mb-4 text-3xl font-black text-slate-800">Equipe, diárias e pagamento</h2><div className="grid gap-3 md:grid-cols-3"><input className={inputClass} placeholder="Nome" value={novoMembro.nome} onChange={(e) => setNovoMembro({ ...novoMembro, nome: e.target.value })} /><input className={inputClass} placeholder="Função" value={novoMembro.funcao} onChange={(e) => setNovoMembro({ ...novoMembro, funcao: e.target.value })} /><button className={buttonGreenClass} onClick={adicionarMembro}>Adicionar membro</button></div></PanelClean><PanelClean><h3 className="mb-4 text-2xl font-black text-slate-800">Resumo mensal por trabalhador</h3><div className="mb-5 grid gap-3 md:grid-cols-3">{semanas.map((s, i) => <label key={i}><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Semana {i + 1}</span><input className={inputClass} value={s} onChange={(e) => setSemanas(semanas.map((x, idx) => idx === i ? e.target.value : x))} /></label>)}</div><div className="overflow-x-auto"><table className="min-w-[1150px] w-full border-collapse text-sm"><thead><tr className="bg-slate-100 text-slate-600 font-semibold"><th className="border border-slate-200 p-3 text-left">Trabalhador</th><th className="border border-slate-200 p-3 text-left">Função</th>{semanas.map((s) => <th key={s} className="border border-slate-200 p-3 text-center">{s}</th>)}<th className="border border-slate-200 p-3">Total dias</th><th className="border border-slate-200 p-3">Salário Unit.</th><th className="border border-slate-200 p-3">Vale</th><th className="border border-slate-200 p-3">Salário Mês</th><th className="border border-slate-200 p-3">Hoje</th></tr></thead><tbody>{equipe.map((m) => { const salario = (Number(m.diasTrabalhados || 0) * Number(m.salarioUnitario || 0)) - Number(m.vale || 0); return <tr key={m.id} className="odd:bg-slate-50 even:bg-white"><td className="border border-slate-200 p-2"><input className="w-full bg-transparent font-bold outline-none" value={m.nome} onChange={(e) => atualizarEquipe(m.id, 'nome', e.target.value)} /></td><td className="border border-slate-200 p-2"><input className="w-full bg-transparent outline-none" value={m.funcao} onChange={(e) => atualizarEquipe(m.id, 'funcao', e.target.value)} /></td>{semanas.map((s, i) => <td key={s} className="border border-slate-200 p-2 text-center"><input type="number" step="0.5" min="0" className="w-20 rounded-xl border border-slate-200 px-2 py-1 text-right" value={(m.semanas || [0, 0, 0, 0, 0, 0])[i] || 0} onChange={(e) => atualizarSemanaEquipe(m.id, i, e.target.value)} /></td>)}<td className="border border-slate-200 p-2 text-center font-black">{Number(m.diasTrabalhados || 0).toLocaleString('pt-BR')}</td><td className="border border-slate-200 p-2"><input type="number" className="w-24 rounded-xl border border-slate-200 px-2 py-1 text-right" value={m.salarioUnitario || 0} onChange={(e) => atualizarEquipe(m.id, 'salarioUnitario', e.target.value)} /></td><td className="border border-slate-200 p-2"><input type="number" className="w-24 rounded-xl border border-slate-200 px-2 py-1 text-right" value={m.vale || 0} onChange={(e) => atualizarEquipe(m.id, 'vale', e.target.value)} /></td><td className="border border-slate-200 p-2 text-right font-black">{formatarMoeda(salario)}</td><td className="border border-slate-200 p-2 text-center"><input type="checkbox" checked={m.diaria} onChange={(e) => atualizarEquipe(m.id, 'diaria', e.target.checked)} /></td></tr> })}</tbody><tfoot><tr className="bg-slate-100 text-slate-800 font-black"><td className="border border-slate-200 p-3" colSpan={8}>TOTAL</td><td className="border border-slate-200 p-3 text-center">{totalDiarias.toLocaleString('pt-BR')}</td><td className="border border-slate-200 p-3" /><td className="border border-slate-200 p-3 text-right">{formatarMoeda(totalVales)}</td><td className="border border-slate-200 p-3 text-right">{formatarMoeda(totalSalarios)}</td><td className="border border-slate-200 p-3" /></tr></tfoot></table></div></PanelClean></div> }
function TelaDiario({ obraAtual, diario, setDiario, equipe, materiais }) {
  return <PanelClean>
    <p className="text-sm font-bold uppercase tracking-wide text-blue-600">Diário de obra online</p>
    <h2 className="mb-6 text-3xl font-black text-slate-800">Registre e centralize todas as informações da obra</h2>
    <div className="overflow-auto">
      <div className="min-w-[850px] border border-slate-200 bg-white text-slate-700 shadow-sm rounded-xl">
        <div className="border-b border-slate-200 bg-slate-50 p-3 text-center font-black">
          <input className="w-full text-center bg-transparent font-black outline-none" value={obraAtual.nome} readOnly />
        </div>
        <div className="grid grid-cols-[160px_1fr] border-b border-slate-200">
          <div className="border-r border-slate-200 p-2 font-bold bg-slate-50">Data</div>
          <input type="date" className="p-2 outline-none" value={diario.data || ''} onChange={(e) => setDiario({ data: e.target.value })} />
        </div>
        <div className="border-b border-slate-200 p-2">
          <p className="font-bold bg-slate-50 p-1 -m-2 mb-2 border-b border-slate-200">Condições de trabalho do dia:</p>
          <textarea className="mt-2 min-h-20 w-full outline-none" value={diario.clima || ''} onChange={(e) => setDiario({ clima: e.target.value })} />
        </div>
        <div className="border-b border-slate-200 p-2 font-black bg-slate-50">Funcionários presentes</div>
        <div className="grid grid-cols-2 border-b border-slate-200">
          {equipe.filter((m) => m.diaria).map((m) => (
            <div key={m.id} className="grid grid-cols-2 border-r border-slate-200 last:border-r-0">
              <div className="border-b border-slate-200 p-2">{m.nome}</div>
              <div className="border-b border-slate-200 p-2">{m.funcao}</div>
            </div>
          ))}
        </div>
        <div className="border-b border-slate-200 p-2">
          <p className="font-black bg-slate-50 p-1 -m-2 mb-2 border-b border-slate-200">Atividades Desenvolvidas:</p>
          <textarea className="mt-2 min-h-40 w-full outline-none" value={diario.atividades || ''} onChange={(e) => setDiario({ atividades: e.target.value })} />
        </div>
        <div className="border-b border-slate-200 p-2">
          <p className="font-black bg-slate-50 p-1 -m-2 mb-2 border-b border-slate-200">Materiais Recebidos:</p>
          <textarea className="mt-2 min-h-24 w-full outline-none" value={materiais.filter((m) => m.recebido).map((m) => `${m.material} - ${m.quantidade} - ${formatarData(m.data)}`).join('\n')} readOnly />
        </div>
        <div className="p-2">
          <p className="font-black bg-slate-50 p-1 -m-2 mb-2 border-b border-slate-200">Observações:</p>
          <textarea className="mt-2 min-h-24 w-full outline-none" value={diario.observacoes || ''} onChange={(e) => setDiario({ observacoes: e.target.value })} />
        </div>
      </div>
    </div>
  </PanelClean>
}
function TelaMateriais({ materiais, atualizarMaterial, novoMaterial, setNovoMaterial, adicionarMaterial }) {
  return <div className="space-y-5">
    <PanelClean>
      <h2 className="mb-4 text-3xl font-black">Materiais</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <input className={inputClass} placeholder="Material" value={novoMaterial.material} onChange={(e) => setNovoMaterial({ ...novoMaterial, material: e.target.value })} />
        <input className={inputClass} placeholder="Quantidade" value={novoMaterial.quantidade} onChange={(e) => setNovoMaterial({ ...novoMaterial, quantidade: e.target.value })} />
        <button className={buttonGreenClass} onClick={adicionarMaterial}>Adicionar material</button>
      </div>
    </PanelClean>
    <PanelClean>
      <TabelaSimples
        colunas={['Material', 'Quantidade', 'Recebido', 'Necessidade', 'Recebimento', 'Custo']}
        linhas={materiais.map((item) => [
          item.material,
          item.quantidade,
          <input key={item.id} type="checkbox" checked={item.recebido} onChange={(e) => atualizarMaterial(item.id, 'recebido', e.target.checked)} />,
          <input key={`nec-${item.id}`} type="date" className="bg-transparent text-xs" value={item.necessidade || ''} onChange={(e) => atualizarMaterial(item.id, 'necessidade', e.target.value)} />,
          <input key={`dat-${item.id}`} type="date" className="bg-transparent text-xs" value={item.data || ''} onChange={(e) => atualizarMaterial(item.id, 'data', e.target.value)} />,
          formatarMoeda(item.custo)
        ])}
      />
    </PanelClean>
  </div>
}
function TelaIA({ obraAtual, tarefas, alertas, compras, financeiro, materiais }) {
  const [mensagem, setMensagem] = useState('')
  const [chat, setChat] = useState([
    {
      tipo: 'ia',
      texto: `Olá! Sou a IA do NeoCanteiro. Estou analisando a obra ${obraAtual.nome}. Posso ajudar com atrasos, materiais, financeiro, compras e resumo da obra.`,
    },
  ])

  function enviarMensagem(perguntaManual) {
    const pergunta = perguntaManual || mensagem
    if (!pergunta.trim()) return

    const historico = [...chat, { tipo: 'user', texto: pergunta }]
    const perguntaLower = pergunta.toLowerCase()
    let resposta = 'Ainda não consegui interpretar essa pergunta. Tente perguntar sobre atrasos, materiais, financeiro, compras ou resumo da obra.'

    if (perguntaLower.includes('atras') || perguntaLower.includes('cronograma')) {
      const atrasadas = tarefas.filter((t) => estaAtrasada(t))
      resposta = atrasadas.length
        ? `Existem ${atrasadas.length} atividades atrasadas: ${atrasadas.map((t) => `${t.nome} (${t.progresso}% executado, término previsto ${formatarData(t.termino)})`).join('; ')}.`
        : 'Nenhuma atividade atrasada encontrada no cronograma atual.'
    } else if (perguntaLower.includes('finance') || perguntaLower.includes('dinheiro') || perguntaLower.includes('receber') || perguntaLower.includes('despesa')) {
      const receitas = financeiro.filter((f) => f.tipo === 'Receita').reduce((a, f) => a + f.valor, 0)
      const despesas = financeiro.filter((f) => f.tipo === 'Despesa').reduce((a, f) => a + f.valor, 0)
      const aReceber = financeiro.filter((f) => f.tipo === 'Receita' && f.status === 'A receber').reduce((a, f) => a + f.valor, 0)
      resposta = `Resumo financeiro da obra: receitas de ${formatarMoeda(receitas)}, despesas de ${formatarMoeda(despesas)}, resultado de ${formatarMoeda(receitas - despesas)} e ${formatarMoeda(aReceber)} a receber.`
    } else if (perguntaLower.includes('material') || perguntaLower.includes('compra') || perguntaLower.includes('pendente')) {
      const pendentes = materiais.filter((m) => !m.recebido)
      resposta = pendentes.length
        ? `Existem ${pendentes.length} materiais pendentes: ${pendentes.map((m) => `${m.material} - ${m.quantidade} - necessidade ${formatarData(m.necessidade)}`).join('; ')}.`
        : 'Todos os materiais cadastrados para esta obra foram recebidos.'
    } else if (perguntaLower.includes('cotação') || perguntaLower.includes('cotacao') || perguntaLower.includes('fornecedor')) {
      const abertas = compras.filter((c) => c.status !== 'Aprovado')
      resposta = abertas.length
        ? `Existem ${abertas.length} cotações/compras em aberto: ${abertas.map((c) => `${c.item} com ${c.fornecedor}, status ${c.status}`).join('; ')}.`
        : 'Todas as compras e cotações estão aprovadas no momento.'
    } else if (perguntaLower.includes('resumo') || perguntaLower.includes('obra')) {
      const atrasadas = tarefas.filter((t) => estaAtrasada(t)).length
      const pendentes = materiais.filter((m) => !m.recebido).length
      resposta = `Resumo da obra ${obraAtual.nome}: etapa atual ${obraAtual.etapa}, status ${obraAtual.status}, prazo ${obraAtual.prazo}, responsável ${obraAtual.responsavel}, ${atrasadas} atividade(s) atrasada(s) e ${pendentes} material(is) pendente(s).`
    }

    setChat([...historico, { tipo: 'ia', texto: resposta }])
    setMensagem('')
  }

  return (
    <div className="space-y-5">
      <PanelClean>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Inteligência Artificial</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">IA da Obra</h1>
            <p className="mt-2 text-slate-600">Assistente inteligente conectado aos dados da obra selecionada.</p>
          </div>
          <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">Demo IA NeoCanteiro</div>
        </div>
      </PanelClean>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <PanelClean>
          <h2 className="text-2xl font-black">Perguntas rápidas</h2>
          <div className="mt-5 grid gap-3">
            <button onClick={() => enviarMensagem('Existem atividades atrasadas no cronograma?')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left font-bold transition hover:bg-blue-50">⚠️ Ver atrasos do cronograma</button>
            <button onClick={() => enviarMensagem('Quais materiais estão pendentes?')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left font-bold transition hover:bg-blue-50">📦 Ver materiais pendentes</button>
            <button onClick={() => enviarMensagem('Mostrar resumo financeiro')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left font-bold transition hover:bg-blue-50">💰 Resumo financeiro</button>
            <button onClick={() => enviarMensagem('Quais compras estão em aberto?')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left font-bold transition hover:bg-blue-50">🛒 Compras em aberto</button>
            <button onClick={() => enviarMensagem('Gerar resumo da obra')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left font-bold transition hover:bg-blue-50">📋 Resumo geral da obra</button>
          </div>
        </PanelClean>

        <PanelClean>
          <div className="min-h-[360px] space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-6">
            {chat.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-xl p-4 text-sm ${m.tipo === 'ia' ? 'bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm' : 'ml-auto bg-blue-600 text-white shadow-sm'}`}>
                {m.texto}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input value={mensagem} onChange={(e) => setMensagem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()} placeholder="Pergunte algo sobre a obra..." className={inputClass} />
            <button onClick={() => enviarMensagem()} className={buttonPrimaryClass}>Enviar</button>
          </div>
        </PanelClean>
      </div>
    </div>
  )
}
function UserCard({ tipo, texto }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-widest text-blue-600">
        {tipo}
      </p>

      <p className="mt-2 text-sm font-medium text-slate-500">
        {texto}
      </p>
    </div>
  )
}

function TelaUsuarios({ permissaoAdmin, novaObra, setNovaObra, criarNovaObra }) { return <div className="space-y-5">{permissaoAdmin && <PanelClean><h2 className="mb-4 text-3xl font-black">Criar nova obra</h2><div className="grid grid-cols-1 gap-3 md:grid-cols-5"><input value={novaObra.nome} onChange={(e) => setNovaObra({ ...novaObra, nome: e.target.value })} placeholder="Nome da obra" className={inputClass} /><input value={novaObra.cliente} onChange={(e) => setNovaObra({ ...novaObra, cliente: e.target.value })} placeholder="Cliente" className={inputClass} /><input value={novaObra.endereco} onChange={(e) => setNovaObra({ ...novaObra, endereco: e.target.value })} placeholder="Endereço" className={inputClass} /><input value={novaObra.responsavel} onChange={(e) => setNovaObra({ ...novaObra, responsavel: e.target.value })} placeholder="Responsável" className={inputClass} /><button onClick={criarNovaObra} className={buttonGreenClass}>Criar obra</button></div></PanelClean>}<PanelClean><h2 className="mb-5 text-3xl font-black">Tipos de usuários</h2><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><UserCard tipo="Engenheiro" texto="Acesso completo." /><UserCard tipo="Estagiário" texto="Atualiza diário, fotos, progresso, equipe e materiais." /><UserCard tipo="Cliente" texto="Visualiza somente a obra vinculada." /></div></PanelClean></div> }
function TabelaSimples({ colunas, linhas }) { return <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-sm"><thead><tr className="bg-slate-100">{colunas.map(c => <th key={c} className="p-3 text-left font-black text-slate-600">{c}</th>)}</tr></thead><tbody>{linhas.map((linha, i) => <tr key={i} className="border-b border-slate-100">{linha.map((cel, j) => <td key={j} className="p-3">{cel}</td>)}</tr>)}</tbody></table></div> }
function LogoDark() {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/30 ring-4 ring-blue-600/10">
        <span className="text-white font-black text-base">NC</span>
      </div>
      <div className="text-center">
        <p className="text-xl font-black tracking-tight text-slate-900">NeoCanteiro</p>
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Gestão inteligente de obras com IA</p>
      </div>
    </div>
  )
}

function LoginScreen({ login }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !senha) return setErro('Preencha todos os campos.')

    setCarregando(true)
    setErro('')

    try {
      await login(email, senha)
    } catch (err) {
      setErro('Falha no login: ' + (err.message === 'Invalid login credentials' ? 'Credenciais inválidas' : err.message))
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-white font-black text-sm">NC</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">NeoCanteiro</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Gestão inteligente de obras com IA</p>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-2xl p-8 shadow-xl shadow-slate-200/40">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">Acesse sua Conta</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">Digite suas credenciais do Supabase.</p>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-xs font-bold text-center">{erro}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-mail</label>
              <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Senha</label>
              <input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className={inputClass} required />
            </div>
            <button type="submit" disabled={carregando} className={buttonPrimaryClass + ' w-full py-3 shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2'}>
              {carregando ? 'Autenticando...' : 'Acessar Plataforma'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">Ainda não tem conta? <a href="/signup" className="text-blue-600 font-bold hover:underline">Cadastre-se</a></p>
          </div>
        </div>
      </div>
    </main>
  )
}

function Empty({ text }) { return <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center flex flex-col items-center gap-3"><span className="text-2xl opacity-20">📂</span><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text}</p></div> }
function gerarAlertas(tarefas, materiais, diario) {
  const hoje = new Date()
  const alertas = []

  tarefas.forEach((t) => {
    const termino = new Date(`${t.termino}T23:59:59`)
    const inicio = new Date(`${t.inicio}T00:00:00`)
    const diasParaInicio = Math.ceil((inicio - hoje) / (1000 * 60 * 60 * 24))

    if (termino < hoje && Number(t.progresso) < 100) {
      const diasAtraso = Math.max(1, Math.ceil((hoje - termino) / (1000 * 60 * 60 * 24)))
      alertas.push({
        id: `atraso-${t.id}`,
        tipo: 'critico',
        icone: '🔴',
        titulo: `${t.nome} atrasada`,
        descricao: `Serviço previsto para terminar em ${formatarData(t.termino)}, com ${t.progresso}% executado e ${diasAtraso} dia(s) de atraso.`,
      })
    } else if (diasParaInicio >= 0 && diasParaInicio <= 7 && Number(t.progresso) === 0 && !t.inicioReal) {
      alertas.push({
        id: `inicio-${t.id}`,
        tipo: 'atencao',
        icone: '🟡',
        titulo: `${t.nome} pode atrasar`,
        descricao: `Prevista para iniciar em ${diasParaInicio} dia(s), ainda sem início real registrado.`,
      })
    }
  })

  const pendentes = materiais.filter((m) => !m.recebido)
  if (pendentes.length) alertas.push({ id: 'materiais-pendentes', tipo: 'atencao', icone: '📦', titulo: 'Materiais pendentes', descricao: `${pendentes.length} material(is) ainda não foram recebidos.` })
  if (!diario.atividades?.trim()) alertas.push({ id: 'diario-pendente', tipo: 'atencao', icone: '📝', titulo: 'Diário incompleto', descricao: 'Preencha as atividades desenvolvidas.' })

  return alertas
}
function formatarData(data) { if (!data) return '--/--/----'; const [ano, mes, dia] = data.split('-'); return `${dia}/${mes}/${ano}` }
function diferencaDias(dataInicio, dataFim) { if (!dataInicio || !dataFim) return 0; const inicio = new Date(`${dataInicio}T00:00:00`); const fim = new Date(`${dataFim}T00:00:00`); return Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) }
function estaAtrasada(tarefa) { const hoje = new Date(); const terminoPrevisto = new Date(`${tarefa.termino}T23:59:59`); return terminoPrevisto < hoje && Number(tarefa.progresso) < 100 }
function formatarMoeda(valor) { return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }


