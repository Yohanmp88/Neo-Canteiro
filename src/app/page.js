'use client'

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { DashboardView } from '@/components/dashboard/views/DashboardView'
import { GraficoCronograma, CronogramaVisual } from '@/components/dashboard/Schedule'
import { PanelClean } from '@/components/ui/Cards'

import { useAuth } from '@/hooks/useAuth'
import { useObras } from '@/hooks/useObras'
import { useTarefas } from '@/hooks/useTarefas'
import { useDiarios } from '@/hooks/useDiarios'
import { useMateriais } from '@/hooks/useMateriais'
import { useEquipe } from '@/hooks/useEquipe'

// --- ESTILOS PREMIUM ---
const inputClass = 'w-full rounded-xl border border-slate-200/60 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-premium placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 shadow-sm'
const buttonPrimaryClass = 'rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-premium hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'
const buttonGreenClass = 'rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-premium hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'
const eyebrowClass = 'text-[10px] font-black uppercase tracking-widest text-slate-400'

const FOTO_BUCKET = 'fotos-obras'

// --- DADOS DE BACKUP (DEMO FALLBACK) ---
const OBRAS_DEMO = [
  { id: 'demo-1', nome: 'Residencial Aurora', cliente: 'Aurora Empreendimentos', status: 'Em andamento', progresso: 65, data_inicio: '2026-01-10', prazo_final: '2026-12-15', etapa: 'Acabamentos', responsavel: 'Eng. Yohan', previsaoEntrega: '2026-12-15' },
  { id: 'demo-2', nome: 'Loja Concept', cliente: 'Concept Store', status: 'Finalização', progresso: 92, data_inicio: '2026-03-05', prazo_final: '2026-06-30', etapa: 'Entrega', responsavel: 'Eng. Pedro', previsaoEntrega: '2026-06-30' },
  { id: 'demo-3', nome: 'Harmonia', cliente: 'Condomínio Harmonia', status: 'Planejamento', progresso: 15, data_inicio: '2026-06-01', prazo_final: '2027-05-20', etapa: 'Fundação', responsavel: 'Eng. Raquel', previsaoEntrega: '2027-05-20' },
]

const EQUIPE_DEMO = [
  { id: 1, obraId: 'demo-1', nome: 'Adelino Romão', funcao: 'Mestre de Obras', diaria: true, diasTrabalhados: 21, semanas: [0, 5, 5, 5, 4, 2], salario_unitario: 150, vale: 400 },
  { id: 2, obraId: 'demo-1', nome: 'Adilio Costa', funcao: 'Pedreiro', diaria: true, diasTrabalhados: 24.5, semanas: [1, 5, 6, 4.5, 6, 2], salario_unitario: 300, vale: 200 },
  { id: 3, obraId: 'demo-1', nome: 'Ataíde Costa', funcao: 'Servente', diaria: false, diasTrabalhados: 20, semanas: [0, 5, 5, 4, 4, 2], salario_unitario: 200, vale: 200 },
]

const COMPRAS_DEMO = [
  { id: 1, item: 'Cimento CP-II', fornecedor: 'Votorantim', data: '2026-05-10', qtd: '100 un', status: 'Pendente' },
  { id: 2, item: 'Aço CA-50 10mm', fornecedor: 'Gerdau', data: '2026-05-20', qtd: '500kg', status: 'Recebido' },
  { id: 3, item: 'Marcenaria Sob Medida', fornecedor: 'Marcenaria Silva', data: '2026-05-01', qtd: '1 conj', status: 'Pendente' },
]

// --- HELPERS ---
const normalizarObra = (o) => ({ ...o, nome: o.nome || 'Sem nome', status: o.status || 'No prazo', progresso: Number(o.progresso || 0), data_inicio: o.data_inicio || '', prazo_final: o.prazo_final || o.previsaoEntrega || '' })
const normalizarTarefa = (t) => ({ ...t, nome: t.nome || 'Sem nome', inicio: t.data_inicio || t.inicio || '', termino: t.data_termino || t.termino || '', duracao: Number(t.duracao || 0), progresso: Number(t.progresso || 0) })
const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Home() {
  const { user, userProfile, login: authLogin, logout: authLogout, loading: authLoading } = useAuth()
  const { obras: obrasRaw = [], loading: obrasLoading, criar: criarObraHook } = useObras()

  // --- ESTADOS DE CONTROLE E NAVEGAÇÃO ---
  const [perfilAtivo, setPerfilAtivo] = useState(null)
  const [inicializandoPerfil, setInicializandoPerfil] = useState(true)
  const [tela, setTela] = useState('dashboard')
  const [obraId, setObraId] = useState(null)

  // --- ESTADOS DE DADOS (LOCAIS/DEMO) ---
  const [semanasDiarias, setSemanasDiarias] = useState(['03/04 a 05/04', '06/04 a 12/04', '13/04 a 19/04', '20/04 a 26/04', '27/04 a 03/05', '04/05 a 05/05'])
  const [novaTarefa, setNovaTarefa] = useState({ nome: '', inicio: '', termino: '', duracao: 1 })
  const [novoMembro, setNovoMembro] = useState({ nome: '', funcao: '' })
  const [novaObra, setNovaObra] = useState({ nome: '', cliente: '', endereco: '', responsavel: '', etapa: '', data_inicio: '', prazo_final: '' })
  const [diarioLocal, setDiarioLocal] = useState({ data: new Date().toISOString().slice(0, 10), clima: '', atividades: '', observacoes: '' })

  const [saveStatus, setSaveStatus] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const feedbackTimerRef = useRef(null)

  // --- LÓGICA DE OBRAS (REAL + DEMO) ---
  const obrasVisiveis = useMemo(() => {
    const reais = (obrasRaw || []).map(normalizarObra)
    return reais.length > 0 ? reais : OBRAS_DEMO.map(normalizarObra)
  }, [obrasRaw])

  const obraAtual = useMemo(() => {
    if (!obraId && obrasVisiveis.length > 0) return obrasVisiveis[0]
    return obrasVisiveis.find((o) => String(o.id) === String(obraId)) || obrasVisiveis[0] || null
  }, [obrasVisiveis, obraId])

  const obraAtualSegura = useMemo(() => obraAtual || OBRAS_DEMO[0], [obraAtual])
  const obraAtualId = obraAtualSegura?.id

  // --- HOOKS DE DADOS (SUPABASE) ---
  const { tarefas: tarefasRaw = [], criar: adicionarTarefaHook, atualizar: atualizarTarefaHook } = useTarefas(obraAtualId)
  const { materiais: materiaisRaw = [] } = useMateriais(obraAtualId)
  const { diarios = [], criar: criarDiarioHook, atualizar: atualizarDiarioHook } = useDiarios(obraAtualId)
  const { equipe: equipeRaw = [], criar: adicionarMembroHook, atualizar: atualizarMembroHook } = useEquipe(obraAtualId)

  const tarefas = useMemo(() => (tarefasRaw || []).map(normalizarTarefa), [tarefasRaw])
  const materiais = useMemo(() => materiaisRaw || [], [materiaisRaw])

  const equipeVisivel = useMemo(() => {
    if (String(obraAtualId).startsWith('demo')) return EQUIPE_DEMO.filter(m => m.obraId === obraAtualId)
    return equipeRaw.length > 0 ? equipeRaw : (obrasRaw.length === 0 ? EQUIPE_DEMO.filter(m => m.obraId === 'demo-1') : [])
  }, [equipeRaw, obraAtualId, obrasRaw.length])

  const permissaoEditar = ['engenheiro', 'estagiario'].includes(perfilAtivo)
  const permissaoAdmin = perfilAtivo === 'engenheiro'
  const ehCliente = perfilAtivo === 'cliente'

  // --- EFEITOS DE INICIALIZAÇÃO ---
  useEffect(() => {
    const init = async () => {
      try {
        if (!user) { setPerfilAtivo(null); return }
        // Para investidor/demo, forçar sempre a escolha do perfil ao iniciar
        // Não carregamos automaticamente do localStorage para garantir a tela de escolha
        setPerfilAtivo(null)
      } catch (e) { console.error(e) } finally { setInicializandoPerfil(false) }
    }
    if (!authLoading) init()
  }, [user, authLoading])

  // Sincronizar Diário
  useEffect(() => {
    if (diarios?.[0]) {
      const d = diarios[0]
      setDiarioLocal({ id: d.id, data: d.data, clima: d.clima || '', atividades: d.servicos_executados || '', observacoes: d.ocorrencias || '' })
    }
  }, [diarios])

  // --- HANDLERS INTERATIVOS ---
  const triggerFeedback = useCallback((status, msg = '') => {
    setSaveStatus(status); setErrorMsg(msg)
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
    if (status === 'saved') feedbackTimerRef.current = window.setTimeout(() => setSaveStatus(null), 2500)
  }, [])

  const trocarPerfil = () => {
    setPerfilAtivo(null)
  }

  // Obras
  async function criarNovaObra() {
    if (!permissaoAdmin || !novaObra.nome.trim()) return
    try {
      triggerFeedback('saving')
      const criada = await criarObraHook({
        nome: novaObra.nome,
        cliente: novaObra.cliente,
        endereco: novaObra.endereco,
        responsavel: novaObra.responsavel,
        etapa: novaObra.etapa || 'Planejamento',
        progresso: 0,
        usuario_id: user.id
      })
      setObraId(criada.id)
      setNovaObra({ nome: '', cliente: '', endereco: '', responsavel: '', etapa: '', data_inicio: '', prazo_final: '' })
      setTela('dashboard')
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  // Cronograma
  async function adicionarTarefa() {
    if (!permissaoEditar || !novaTarefa.nome.trim() || !obraAtualId) return
    try {
      triggerFeedback('saving')
      await adicionarTarefaHook({ obra_id: obraAtualId, nome: novaTarefa.nome, data_inicio: novaTarefa.inicio, data_termino: novaTarefa.termino, progresso: 0 })
      setNovaTarefa({ nome: '', inicio: '', termino: '', duracao: 1 })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function atualizarTarefa(id, campo, valor) {
    if (!permissaoEditar) return
    const dbField = campo === 'inicio' ? 'data_inicio' : campo === 'termino' ? 'data_termino' : campo
    try {
      triggerFeedback('saving')
      await atualizarTarefaHook(id, { [dbField]: valor })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  // Equipe
  async function adicionarMembro() {
    if (!permissaoEditar || !novoMembro.nome.trim() || !obraAtualId || String(obraAtualId).startsWith('demo')) return
    try {
      triggerFeedback('saving')
      await adicionarMembroHook({ nome: novoMembro.nome, funcao: novoMembro.funcao, diaria: true, semanas: [0, 0, 0, 0, 0, 0], salario_unitario: 0, vale: 0 })
      setNovoMembro({ nome: '', funcao: '' })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function atualizarEquipe(id, campo, valor) {
    if (!permissaoEditar || String(obraAtualId).startsWith('demo')) return
    try {
      triggerFeedback('saving')
      await atualizarMembroHook(id, { [campo]: valor })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  async function atualizarSemanaEquipe(id, i, valor) {
    if (!permissaoEditar || String(obraAtualId).startsWith('demo')) return
    try {
      const membro = equipeRaw.find(m => m.id === id)
      if (!membro) return
      const s = [...(membro.semanas || [0, 0, 0, 0, 0, 0])]
      s[i] = Number(valor)
      triggerFeedback('saving')
      await atualizarMembroHook(id, { semanas: s })
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  // Diário
  async function salvarDiario(updates) {
    if (!obraAtualId || String(obraAtualId).startsWith('demo')) return
    const next = { ...diarioLocal, ...updates }
    setDiarioLocal(next)
    try {
      triggerFeedback('saving')
      const payload = { obra_id: obraAtualId, data: next.data, clima: next.clima, servicos_executados: next.atividades, ocorrencias: next.observacoes, responsavel_id: user.id }
      if (next.id) await atualizarDiarioHook(next.id, payload)
      else await criarDiarioHook(payload)
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', e.message) }
  }

  // Fotos
  async function adicionarFotos(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length || !obraAtualId || String(obraAtualId).startsWith('demo')) return
    try {
      triggerFeedback('saving')
      let diarioId = diarioLocal?.id
      if (!diarioId) {
        const novo = await criarDiarioHook({ obra_id: obraAtualId, data: new Date().toISOString().slice(0, 10), responsavel_id: user.id })
        diarioId = novo.id
      }
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${obraAtualId}/${diarioId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from(FOTO_BUCKET).upload(fileName, file)
        if (uploadError) throw uploadError
        const { data: publicUrlData } = supabase.storage.from(FOTO_BUCKET).getPublicUrl(fileName)
        await supabase.from('fotos_diario').insert({ diario_id: diarioId, url_foto: publicUrlData.publicUrl, descricao: file.name })
      }
      triggerFeedback('saved')
    } catch (e) { triggerFeedback('error', 'Falha no upload') }
  }

  // --- RENDERIZAÇÃO ---
  if (authLoading || (user && inicializandoPerfil)) return <Loading text="Processando acesso..." />
  if (!user) return <LoginScreen login={authLogin} />
  if (!perfilAtivo) return <PerfilChoiceScreen onSelect={t => setPerfilAtivo(t)} logout={authLogout} />

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 lg:pb-0">
      {saveStatus && <Toast status={saveStatus} msg={errorMsg} />}
      <div className="flex min-h-screen w-full">
        <Sidebar activeTab={tela} onTabChange={setTela} userProfile={userProfile} logout={authLogout} />

        <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
          <Header userProfile={{ ...userProfile, nome: userProfile?.nome || user.email?.split('@')[0], tipo: perfilAtivo }} obras={obrasVisiveis} obraSelecionadaId={obraAtualSegura.id} onObraChange={setObraId} />

          <section className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 custom-scrollbar">
            <div className="mb-4 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div />
                {permissaoAdmin && <button onClick={() => setTela('usuarios')} className={buttonPrimaryClass}>Nova Obra</button>}
              </div>
            </div>

            <div className="animate-fade-in">
              {tela === 'dashboard' && <DashboardView obraAtual={obraAtualSegura} tarefas={tarefas} materiais={materiais} diarios={diarios} isClient={ehCliente} onNavigate={setTela} />}
              {tela === 'cronograma' && <TelaCronograma permissaoEditar={permissaoEditar} novaTarefa={novaTarefa} setNovaTarefa={setNovaTarefa} adicionarTarefa={adicionarTarefa} tarefas={tarefas} atualizarTarefa={atualizarTarefa} obraAtual={obraAtualSegura} />}
              {tela === 'equipe' && !ehCliente && <TelaEquipe obraAtual={obraAtualSegura} equipe={equipeVisivel} semanas={semanasDiarias} novoMembro={novoMembro} setNovoMembro={setNovoMembro} adicionarMembro={adicionarMembro} atualizarEquipe={atualizarEquipe} atualizarSemanaEquipe={atualizarSemanaEquipe} />}
              {tela === 'diario' && !ehCliente && <TelaDiario obraAtual={obraAtualSegura} diario={diarioLocal} setDiario={salvarDiario} />}
              {tela === 'fotos' && <TelaFotos permissaoEditar={permissaoEditar} adicionarFotos={adicionarFotos} fotosDaObra={[]} />}
              {tela === 'usuarios' && <TelaUsuarios permissaoAdmin={permissaoAdmin} novaObra={novaObra} setNovaObra={setNovaObra} criarNovaObra={criarNovaObra} />}
              {tela === 'compras' && <TelaCompras compras={COMPRAS_DEMO} materiais={materiais} />}
              {['materiais', 'financeiro', 'orcamento', 'ia'].includes(tela) && <ModulePlaceholder tela={tela} setTela={setTela} />}
            </div>
          </section>
        </div>
      </div>
      <BottomNav activeTab={tela} onTabChange={setTela} />
    </main>
  )
}

// --- SUB-COMPONENTES ---

function PerfilChoiceScreen({ onSelect, logout }) {
  const perfis = [{ tipo: 'engenheiro', titulo: 'Engenheiro' }, { tipo: 'estagiario', titulo: 'Estagiário' }, { tipo: 'cliente', titulo: 'Cliente' }]
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-black text-slate-900 mb-10 tracking-tight">Como deseja visualizar o sistema?</h1>
        <div className="grid gap-6 md:grid-cols-3">
          {perfis.map(p => (
            <button key={p.tipo} onClick={() => onSelect(p.tipo)} className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm transition-premium hover:-translate-y-2 hover:border-blue-400 hover:shadow-2xl">
              <h2 className="text-2xl font-black text-slate-900">{p.titulo}</h2>
            </button>
          ))}
        </div>
        <button onClick={logout} className="mt-12 text-xs font-black uppercase text-slate-400 hover:text-red-600">Sair da Plataforma</button>
      </div>
    </main>
  )
}

function LoginScreen({ login }) {
  const [e, setE] = useState(''); const [s, setS] = useState(''); const [l, setL] = useState(false)
  const h = async (x) => { x.preventDefault(); setL(true); try { await login(e, s) } catch { alert('Acesso Negado') } finally { setL(false) } }
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div className="w-full max-w-[400px]">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-8 animate-bounce-slow"><span className="text-white font-black text-2xl">NC</span></div>
        <form onSubmit={h} className="space-y-5">
          <input type="email" placeholder="E-mail" className={inputClass} value={e} onChange={i => setE(i.target.value)} required />
          <input type="password" placeholder="Senha" className={inputClass} value={s} onChange={i => setS(i.target.value)} required />
          <button type="submit" disabled={l} className={buttonPrimaryClass + ' w-full py-4 shadow-xl'}>{l ? 'Entrando...' : 'Acessar Sistema'}</button>
        </form>
      </div>
    </main>
  )
}

function TelaCronograma({ permissaoEditar, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarTarefa, obraAtual }) {
  const total = tarefas.length || 0
  const concluidas = tarefas.filter(t => Number(t.progresso) === 100).length
  const atrasadas = tarefas.filter(t => (t.progresso < 100 && (t.termino || t.data_termino) && new Date(t.termino || t.data_termino) < new Date())).length
  const progressoGlobal = total > 0 ? Math.round(tarefas.reduce((a, t) => a + Number(t.progresso), 0) / total) : 0

  return (
    <div className="space-y-6">
      {/* Indicadores do Cronograma */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className={eyebrowClass + " mb-1"}>Status de Execução</p>
          <h4 className="text-2xl font-black text-slate-900">{concluidas}/{total}</h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Tarefas Finalizadas</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className={eyebrowClass + " mb-1"}>Prazo Final</p>
          <h4 className="text-2xl font-black text-slate-900">
            {obraAtual.prazo_final ? new Date(obraAtual.prazo_final).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
          </h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{obraAtual.prazo || 'Data Estimada'}</p>
        </div>
        <div className={`p-6 rounded-3xl border shadow-sm ${atrasadas > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200/60'}`}>
          <p className={atrasadas > 0 ? "text-[10px] font-black uppercase tracking-widest text-red-400 mb-1" : eyebrowClass + " mb-1"}>Pontos Críticos</p>
          <h4 className={`text-2xl font-black ${atrasadas > 0 ? 'text-red-600' : 'text-slate-900'}`}>{atrasadas}</h4>
          <p className={`text-[10px] font-bold uppercase mt-1 ${atrasadas > 0 ? 'text-red-500' : 'text-slate-500'}`}>Serviços Atrasados</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className={eyebrowClass + " mb-1"}>Progresso Físico</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-black text-blue-600">{progressoGlobal}%</h4>
            <span className="text-[10px] font-bold text-slate-400">Total</span>
          </div>
          <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${progressoGlobal}%` }} />
          </div>
        </div>
      </div>

      {permissaoEditar && (
        <PanelClean>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <span className="text-xs font-bold">+</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Nova Atividade no Cronograma</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input className={inputClass + ' md:col-span-2'} placeholder="Descrição da Atividade" value={novaTarefa.nome} onChange={e => setNovaTarefa({ ...novaTarefa, nome: e.target.value })} />
            <div className="relative">
              <p className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">Início</p>
              <input type="date" className={inputClass} value={novaTarefa.inicio} onChange={e => setNovaTarefa({ ...novaTarefa, inicio: e.target.value })} />
            </div>
            <div className="relative">
              <p className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">Término</p>
              <input type="date" className={inputClass} value={novaTarefa.termino} onChange={e => setNovaTarefa({ ...novaTarefa, termino: e.target.value })} />
            </div>
            <button onClick={adicionarTarefa} className={buttonPrimaryClass}>Lançar</button>
          </div>
        </PanelClean>
      )}

      <PanelClean>
        <div className="mb-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cronograma Físico (Previsto vs Realizado)</h3>
        </div>
        <GraficoCronograma tarefas={tarefas} />
      </PanelClean>

      <PanelClean>
        <div className="mb-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Detalhamento de Atividades</h3>
        </div>
        <CronogramaVisual tarefas={tarefas} atualizarTarefa={atualizarTarefa} podeEditar={permissaoEditar} />
      </PanelClean>
    </div>
  )
}

function TelaEquipe({ obraAtual, equipe, semanas, novoMembro, setNovoMembro, adicionarMembro, atualizarEquipe, atualizarSemanaEquipe }) {
  return (
    <div className="space-y-6">
      <PanelClean>
        <h2 className="text-2xl font-black mb-6">Equipe de Campo: {obraAtual.nome}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input className={inputClass} placeholder="Nome do Profissional" value={novoMembro.nome} onChange={e => setNovoMembro({ ...novoMembro, nome: e.target.value })} />
          <input className={inputClass} placeholder="Função" value={novoMembro.funcao} onChange={e => setNovoMembro({ ...novoMembro, funcao: e.target.value })} />
          <button onClick={adicionarMembro} className={buttonGreenClass}>Adicionar</button>
        </div>
      </PanelClean>
      <PanelClean>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr className="bg-slate-50 text-slate-500 font-bold"><th className="p-4 text-left border border-slate-100">Profissional</th><th className="p-4 text-left border border-slate-100">Cargo</th>{semanas.map((s, i) => <th key={i} className="p-4 border border-slate-100 text-center">{s}</th>)}<th className="p-4 border border-slate-100 text-center">Total</th></tr></thead>
            <tbody>
              {equipe.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-premium">
                  <td className="p-4 border border-slate-100 font-bold">{m.nome}</td>
                  <td className="p-4 border border-slate-100">{m.funcao}</td>
                  {(m.semanas || [0, 0, 0, 0, 0, 0]).map((d, i) => (
                    <td key={i} className="p-4 border border-slate-100 text-center">
                      <input type="number" step="0.5" className="w-16 border rounded p-1 text-center" value={d} onChange={e => atualizarSemanaEquipe(m.id, i, e.target.value)} />
                    </td>
                  ))}
                  <td className="p-4 border border-slate-100 text-center font-black">{(m.semanas || [0, 0, 0, 0, 0, 0]).reduce((a, b) => a + b, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelClean>
    </div>
  )
}

function TelaDiario({ obraAtual, diario, setDiario }) {
  const [local, setLocal] = useState(diario); useEffect(() => { setLocal(diario) }, [diario])
  return (
    <PanelClean>
      <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black tracking-tight">Diário de Obra: {obraAtual.nome}</h2><button onClick={() => setDiario(local)} className={buttonPrimaryClass}>Sincronizar</button></div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6"><input type="date" className={inputClass} value={local?.data || ''} onChange={e => setLocal({ ...local, data: e.target.value })} /><input placeholder="Condições Climáticas" className={inputClass} value={local?.clima || ''} onChange={e => setLocal({ ...local, clima: e.target.value })} /></div>
        <textarea placeholder="Atividades Realizadas" className={inputClass + ' min-h-[250px]'} value={local?.atividades || ''} onChange={e => setLocal({ ...local, atividades: e.target.value })} />
        <textarea placeholder="Observações e Ocorrências" className={inputClass + ' min-h-[120px]'} value={local?.observacoes || ''} onChange={e => setLocal({ ...local, observacoes: e.target.value })} />
      </div>
    </PanelClean>
  )
}

function TelaFotos({ permissaoEditar, adicionarFotos, fotosDaObra }) {
  return (
    <PanelClean>
      <div className="mb-8 flex justify-between items-center"><h2 className="text-3xl font-black">Registros Fotográficos</h2>{permissaoEditar && <label className={buttonPrimaryClass + ' cursor-pointer'}>Fazer Upload<input type="file" multiple onChange={adicionarFotos} className="hidden" /></label>}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{fotosDaObra.map(f => (<div key={f.id} className="rounded-3xl overflow-hidden shadow-xl border border-slate-100 group"><img src={f.url} className="h-48 w-full object-cover group-hover:scale-110 transition-premium" /><div className="p-4 bg-white"><p className="text-[10px] font-black text-slate-400 uppercase">{f.data}</p></div></div>))}</div>
    </PanelClean>
  )
}

function TelaUsuarios({ permissaoAdmin, novaObra, setNovaObra, criarNovaObra }) {
  return (
    <div className="space-y-6">
      {permissaoAdmin && (
        <PanelClean>
          <h2 className="text-2xl font-black mb-6">Cadastro de Nova Obra</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input className={inputClass} placeholder="Nome da Obra" value={novaObra.nome} onChange={e => setNovaObra({ ...novaObra, nome: e.target.value })} />
            <input className={inputClass} placeholder="Cliente" value={novaObra.cliente} onChange={e => setNovaObra({ ...novaObra, cliente: e.target.value })} />
            <input className={inputClass} placeholder="Responsável Técnico" value={novaObra.responsavel} onChange={e => setNovaObra({ ...novaObra, responsavel: e.target.value })} />
            <button onClick={criarNovaObra} className={buttonGreenClass}>Salvar Registro</button>
          </div>
        </PanelClean>
      )}
    </div>
  )
}

function TelaCompras({ compras = [], materiais = [] }) {
  const hoje = new Date()

  // Unificando dados para análise
  const itensAtrasados = compras.filter(c => c.status !== 'Recebido' && new Date(c.data) < hoje).length
  const itensPendentes = compras.filter(c => c.status !== 'Recebido').length
  const itensRecebidos = compras.filter(c => c.status === 'Recebido').length

  return (
    <div className="space-y-6">
      {/* Indicadores de Suprimentos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-6 rounded-3xl border shadow-sm ${itensAtrasados > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200/60'}`}>
          <p className={itensAtrasados > 0 ? "text-[10px] font-black uppercase tracking-widest text-red-400 mb-1" : eyebrowClass + " mb-1"}>Atenção</p>
          <h4 className={`text-2xl font-black ${itensAtrasados > 0 ? 'text-red-600' : 'text-slate-900'}`}>{itensAtrasados}</h4>
          <p className={`text-[10px] font-bold uppercase mt-1 ${itensAtrasados > 0 ? 'text-red-500' : 'text-slate-500'}`}>Materiais em Atraso</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className={eyebrowClass + " mb-1"}>Logística</p>
          <h4 className="text-2xl font-black text-slate-900">{itensPendentes}</h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Pedidos Pendentes</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <p className={eyebrowClass + " mb-1"}>Concluído</p>
          <h4 className="text-2xl font-black text-emerald-600">{itensRecebidos}</h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Entregas Realizadas</p>
        </div>
      </div>

      <PanelClean>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Gestão de Compras e Suprimentos</h3>
            <p className="text-xs text-slate-500 mt-1">Acompanhamento de pedidos e entregas de materiais</p>
          </div>
          <button className={buttonPrimaryClass}>Novo Pedido</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-2">Item / Material</th>
                <th className="px-4 py-2">Fornecedor</th>
                <th className="px-4 py-2 text-center">Data Prevista</th>
                <th className="px-4 py-2 text-center">Qtd</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => {
                const isAtrasado = c.status !== 'Recebido' && new Date(c.data) < hoje
                return (
                  <tr key={c.id} className="group">
                    <td className="bg-white border-y border-l border-slate-100 rounded-l-2xl p-4 shadow-sm group-hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isAtrasado ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                        <span className="font-black text-slate-900">{c.item}</span>
                      </div>
                    </td>
                    <td className="bg-white border-y border-slate-100 p-4 shadow-sm text-sm text-slate-600 group-hover:bg-slate-50 transition-colors">
                      {c.fornecedor}
                    </td>
                    <td className="bg-white border-y border-slate-100 p-4 shadow-sm text-center group-hover:bg-slate-50 transition-colors">
                      <span className={`text-xs font-bold ${isAtrasado ? 'text-red-500' : 'text-slate-500'}`}>
                        {new Date(c.data).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="bg-white border-y border-slate-100 p-4 shadow-sm text-center font-black text-slate-900 group-hover:bg-slate-50 transition-colors">
                      {c.qtd}
                    </td>
                    <td className="bg-white border-y border-r border-slate-100 rounded-r-2xl p-4 shadow-sm text-right group-hover:bg-slate-50 transition-colors">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${c.status === 'Recebido' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' :
                          isAtrasado ? 'bg-red-50 text-red-600 ring-1 ring-red-100' :
                            'bg-blue-50 text-blue-600 ring-1 ring-blue-100'
                        }`}>
                        {isAtrasado ? 'Atrasado' : c.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </PanelClean>
    </div>
  )
}

function Loading({ text }) { return <div className="min-h-screen bg-white flex items-center justify-center font-black text-blue-600 animate-pulse text-lg">{text}</div> }
function Toast({ status, msg }) { return <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl bg-white border border-blue-100 text-blue-600 font-black text-xs uppercase">{status === 'saved' ? 'Dados Sincronizados' : status === 'saving' ? 'Sincronizando...' : msg || 'Erro de Comunicação'}</div> }
function ModulePlaceholder({ tela, setTela }) { return <div className="p-32 text-center border-2 border-dashed border-slate-200 bg-white rounded-[3rem] shadow-sm"><p className="text-slate-400 font-black uppercase text-xs mb-6">Módulo em desenvolvimento</p><button onClick={() => setTela('dashboard')} className="text-blue-600 font-black text-sm uppercase">Retornar ao Painel</button></div> }