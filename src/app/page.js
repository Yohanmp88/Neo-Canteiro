'use client'

import { useMemo, useState } from 'react'

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

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
const buttonPrimaryClass = 'rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800'
const buttonGreenClass = 'rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-600'

export default function Home() {
  const [usuario, setUsuario] = useState(null)
  const [tela, setTela] = useState('dashboard')
  const [obras, setObras] = useState(obrasIniciais)
  const [obraId, setObraId] = useState(1)
  const [cronogramas, setCronogramas] = useState({ 1: tarefasIniciais, 2: tarefasIniciais.slice(0, 5), 3: tarefasIniciais.slice(0, 6) })
  const [fotos, setFotos] = useState([])
  const [novaTarefa, setNovaTarefa] = useState({ nome: '', inicio: '', termino: '', duracao: 1 })
  const [novaObra, setNovaObra] = useState({ nome: '', cliente: '', endereco: '', responsavel: '', etapa: '' })
  const [cardDetalhe, setCardDetalhe] = useState(null)
  const [equipe, setEquipe] = useState(equipeInicial)
  const [novoMembro, setNovoMembro] = useState({ nome: '', funcao: '' })
  const [diario, setDiario] = useState(diarioInicial)
  const [materiais, setMateriais] = useState(materiaisIniciais)
  const [novoMaterial, setNovoMaterial] = useState({ material: '', quantidade: '' })
  const [compras, setCompras] = useState(comprasIniciais)
  const [financeiro, setFinanceiro] = useState(financeiroInicial)
  const [novaTransacao, setNovaTransacao] = useState({ tipo: 'Despesa', descricao: '', valor: '', data: '' })
  const [orcamento, setOrcamento] = useState(orcamentoInicial)
  const [novoOrcamento, setNovoOrcamento] = useState({ etapa: '', item: '', unidade: '', quantidade: '', unitario: '', categoria: 'Serviços' })
  const [composicoes, setComposicoes] = useState(composicoesInicial)
  const [semanasDiarias, setSemanasDiarias] = useState(['03/04 a 05/04', '06/04 a 12/04', '13/04 a 19/04', '20/04 a 26/04', '27/04 a 03/05', '04/05 a 05/05'])

  const obrasVisiveis = useMemo(() => {
    if (!usuario) return []
    if (usuario.obrasPermitidas === 'todas') return obras
    return obras.filter((obra) => usuario.obrasPermitidas.includes(obra.id))
  }, [usuario, obras])

  const obraAtual = obrasVisiveis.find((obra) => obra.id === Number(obraId)) || obrasVisiveis[0] || obras[0]
  const tarefas = cronogramas[obraAtual.id] || []
  const permissaoEditar = usuario?.tipo === 'Engenheiro' || usuario?.tipo === 'Estagiário'
  const permissaoAdmin = usuario?.tipo === 'Engenheiro'
  const ehCliente = usuario?.tipo === 'Cliente'
  const fotosDaObra = fotos.filter((foto) => foto.obraId === obraAtual.id)
  const equipeDaObra = equipe.filter((membro) => membro.obraId === obraAtual.id)
  const materiaisDaObra = materiais.filter((m) => m.obraId === obraAtual.id)
  const materiaisRecebidosHoje = materiaisDaObra.filter((m) => m.recebido && m.data === diario.data).length
  const financeiroDaObra = financeiro.filter((f) => f.obraId === obraAtual.id)

  const resumo = useMemo(() => {
    const total = tarefas.length || 1
    const media = Math.round(tarefas.reduce((acc, tarefa) => acc + Number(tarefa.progresso), 0) / total)
    const concluidas = tarefas.filter((tarefa) => Number(tarefa.progresso) === 100).length
    const pendentes = tarefas.filter((tarefa) => Number(tarefa.progresso) === 0).length
    return { media, concluidas, pendentes }
  }, [tarefas])

  const alertas = gerarAlertas(tarefas, materiaisDaObra, diario)
  const atrasosReais = alertas.filter((a) => a.tipo === 'critico')
  const possiveisAtrasos = alertas.filter((a) => a.tipo === 'atencao')

  function selecionarUsuario(user) { setUsuario(user); setTela('dashboard'); setCardDetalhe(null); setObraId(user.obrasPermitidas === 'todas' ? 1 : user.obrasPermitidas[0]) }
  function trocarTela(novaTela) { setTela(novaTela); setCardDetalhe(null) }

  function adicionarTarefa() {
    if (!permissaoEditar) return alert('Cliente não pode alterar o cronograma.')
    if (!novaTarefa.nome.trim()) return alert('Digite o nome da tarefa.')
    const novoId = tarefas.length ? Math.max(...tarefas.map((t) => t.id)) + 1 : 1
    const nova = { id: novoId, nome: novaTarefa.nome.trim(), inicio: novaTarefa.inicio || '2026-07-01', termino: novaTarefa.termino || '2026-07-05', inicioReal: '', terminoReal: '', duracao: Number(novaTarefa.duracao) || 1, progresso: 0, inicioGrafico: Math.min(75, tarefas.length * 8), orcado: 0, medido: 0 }
    setCronogramas({ ...cronogramas, [obraAtual.id]: [...tarefas, nova] })
    setNovaTarefa({ nome: '', inicio: '', termino: '', duracao: 1 })
  }

  function atualizarTarefa(id, campo, valor) {
    if (!permissaoEditar && !['medido'].includes(campo)) return
    const numericos = ['progresso', 'duracao', 'inicioGrafico', 'orcado', 'medido']
    const valorFinal = numericos.includes(campo) ? Math.max(0, campo === 'progresso' ? Math.min(100, Number(valor)) : Number(valor)) : valor
    setCronogramas({ ...cronogramas, [obraAtual.id]: tarefas.map((tarefa) => (tarefa.id === id ? { ...tarefa, [campo]: valorFinal } : tarefa)) })
  }

  function atualizarProgresso(id, progresso) { atualizarTarefa(id, 'progresso', progresso) }
  function criarNovoCronograma() { if (!permissaoAdmin) return alert('Somente engenheiro pode criar novo cronograma.'); if (confirm('Criar um novo cronograma zerado para esta obra?')) setCronogramas({ ...cronogramas, [obraAtual.id]: [] }) }

  function criarNovaObra() {
    if (!permissaoAdmin) return alert('Somente engenheiro pode criar uma nova obra.')
    if (!novaObra.nome.trim()) return alert('Digite o nome da obra.')
    const novoId = obras.length ? Math.max(...obras.map((obra) => obra.id)) + 1 : 1
    const obra = { id: novoId, nome: novaObra.nome.trim(), cliente: novaObra.cliente.trim() || 'Cliente não informado', endereco: novaObra.endereco.trim() || 'Endereço não informado', status: 'Nova obra', prazo: 'Prazo a definir', etapa: novaObra.etapa || 'Planejamento inicial', responsavel: novaObra.responsavel || 'Responsável a definir', previsaoEntrega: '', materiaisHoje: 0 }
    setObras([...obras, obra]); setCronogramas({ ...cronogramas, [novoId]: [] }); setObraId(novoId); setNovaObra({ nome: '', cliente: '', endereco: '', responsavel: '', etapa: '' }); setTela('cronograma')
  }

  function atualizarObra(id, campo, valor) { setObras(obras.map((obra) => obra.id === id ? { ...obra, [campo]: valor } : obra)) }
  function adicionarFotos(event) { const arquivos = Array.from(event.target.files || []); const novasFotos = arquivos.map((arquivo) => ({ id: crypto.randomUUID(), nome: arquivo.name, url: URL.createObjectURL(arquivo), obraId: obraAtual.id, data: new Date().toLocaleDateString('pt-BR') })); setFotos([...novasFotos, ...fotos]); event.target.value = '' }
  function adicionarMembro() { if (!novoMembro.nome.trim()) return alert('Digite o nome do membro da equipe.'); setEquipe([...equipe, { id: crypto.randomUUID(), obraId: obraAtual.id, nome: novoMembro.nome.trim(), funcao: novoMembro.funcao.trim() || 'Função não informada', diaria: true, diasTrabalhados: 0, semanas: [0,0,0,0,0,0], salarioUnitario: 0, vale: 0 }]); setNovoMembro({ nome: '', funcao: '' }) }
  function atualizarEquipe(id, campo, valor) { setEquipe(equipe.map((m) => (m.id === id ? { ...m, [campo]: ['diasTrabalhados', 'salarioUnitario', 'vale'].includes(campo) ? Number(valor) : valor } : m))) }
  function atualizarSemanaEquipe(id, i, valor) { setEquipe(equipe.map((m) => { if (m.id !== id) return m; const semanas = [...(m.semanas || [0,0,0,0,0,0])]; semanas[i] = Number(valor); return { ...m, semanas, diasTrabalhados: semanas.reduce((a, d) => a + Number(d || 0), 0) } })) }
  function atualizarMaterial(id, campo, valor) { setMateriais(materiais.map((item) => (item.id === id ? { ...item, [campo]: campo === 'custo' ? Number(valor) : valor } : item))) }
  function adicionarMaterial() { if (!novoMaterial.material.trim()) return alert('Digite o nome do material.'); setMateriais([...materiais, { id: crypto.randomUUID(), obraId: obraAtual.id, material: novoMaterial.material.trim(), quantidade: novoMaterial.quantidade || 'Qtd. a definir', recebido: false, data: '', necessidade: '', custo: 0 }]); setNovoMaterial({ material: '', quantidade: '' }) }
  function atualizarCompra(id, campo, valor) { setCompras(compras.map((item) => (item.id === id ? { ...item, [campo]: campo === 'qtd' || campo === 'valorUnitario' ? Number(valor) : valor } : item))) }
  function adicionarTransacao() { if (!novaTransacao.descricao.trim()) return alert('Descreva a transação.'); setFinanceiro([...financeiro, { id: crypto.randomUUID(), obraId: obraAtual.id, tipo: novaTransacao.tipo, descricao: novaTransacao.descricao, valor: Number(novaTransacao.valor || 0), data: novaTransacao.data || new Date().toISOString().slice(0,10), status: novaTransacao.tipo === 'Receita' ? 'A receber' : 'A pagar' }]); setNovaTransacao({ tipo: 'Despesa', descricao: '', valor: '', data: '' }) }
  function adicionarItemOrcamento() { if (!novoOrcamento.item.trim()) return alert('Digite o item do orçamento.'); setOrcamento([...orcamento, { id: crypto.randomUUID(), etapa: novoOrcamento.etapa || 'Sem etapa', item: novoOrcamento.item, unidade: novoOrcamento.unidade || 'un', quantidade: Number(novoOrcamento.quantidade || 0), unitario: Number(novoOrcamento.unitario || 0), categoria: novoOrcamento.categoria }]); setNovoOrcamento({ etapa: '', item: '', unidade: '', quantidade: '', unitario: '', categoria: 'Serviços' }) }

  if (!usuario) return <LoginScreen selecionarUsuario={selecionarUsuario} />

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-28 flex-col items-center justify-between border-r border-slate-200 bg-white p-5 lg:flex">
          <div className="flex flex-col items-center gap-8"><LogoIcon /><nav className="space-y-3">
            <MenuItem label="📊" active={tela === 'dashboard'} onClick={() => trocarTela('dashboard')} />
            <MenuItem label="📅" active={tela === 'cronograma'} onClick={() => trocarTela('cronograma')} />
            <MenuItem label="📷" active={tela === 'fotos'} onClick={() => trocarTela('fotos')} />
            {!ehCliente && <MenuItem label="👷" active={tela === 'equipe'} onClick={() => trocarTela('equipe')} />}
            {!ehCliente && <MenuItem label="📝" active={tela === 'diario'} onClick={() => trocarTela('diario')} />}
            {!ehCliente && <MenuItem label="📦" active={tela === 'materiais'} onClick={() => trocarTela('materiais')} />}
            {!ehCliente && <MenuItem label="💰" active={tela === 'financeiro'} onClick={() => trocarTela('financeiro')} />}
            {!ehCliente && <MenuItem label="🛒" active={tela === 'compras'} onClick={() => trocarTela('compras')} />}
            {!ehCliente && <MenuItem label="📋" active={tela === 'orcamento'} onClick={() => trocarTela('orcamento')} />}
            {!ehCliente && <MenuItem label="🧩" active={tela === 'composicoes'} onClick={() => trocarTela('composicoes')} />}
            {!ehCliente && <MenuItem label="🔠" active={tela === 'abc'} onClick={() => trocarTela('abc')} />}
            <MenuItem label="📏" active={tela === 'medicoes'} onClick={() => trocarTela('medicoes')} />
            <MenuItem label="📄" active={tela === 'templates'} onClick={() => trocarTela('templates')} />
            {!ehCliente && <MenuItem label="⚙️" active={tela === 'usuarios'} onClick={() => trocarTela('usuarios')} />}
          </nav></div>
          <button onClick={() => setUsuario(null)} className="grid h-12 w-12 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">{usuario.iniciais}</button>
        </aside>

        <section className="flex-1 overflow-hidden px-4 py-5 lg:px-8">
          <header className="mb-6 flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between"><LogoNeoCanteiro /><div className="flex flex-wrap items-center gap-3">{obrasVisiveis.length > 1 && <select value={obraId} onChange={(e) => setObraId(Number(e.target.value))} className={`${inputClass} min-w-60`}>{obrasVisiveis.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}</select>}{permissaoAdmin && <button onClick={() => trocarTela('usuarios')} className={buttonPrimaryClass}>Nova obra</button>}</div></header>

          {tela === 'dashboard' && !cardDetalhe && <Dashboard ehCliente={ehCliente} obraAtual={obraAtual} usuario={usuario} resumo={resumo} alertas={alertas} atrasosReais={atrasosReais} possiveisAtrasos={possiveisAtrasos} fotosDaObra={fotosDaObra} materiaisRecebidosHoje={materiaisRecebidosHoje} tarefas={tarefas} obrasVisiveis={obrasVisiveis} cronogramas={cronogramas} setObraId={setObraId} setCardDetalhe={setCardDetalhe} financeiro={financeiroDaObra} compras={compras} atualizarObra={atualizarObra} />}
          {tela === 'dashboard' && cardDetalhe && <DetalheCard tipo={cardDetalhe} voltar={() => setCardDetalhe(null)} resumo={resumo} fotosDaObra={fotosDaObra} materiais={materiaisDaObra} tarefas={tarefas} />}
          {tela === 'cronograma' && <TelaCronograma permissaoEditar={permissaoEditar} permissaoAdmin={permissaoAdmin} criarNovoCronograma={criarNovoCronograma} novaTarefa={novaTarefa} setNovaTarefa={setNovaTarefa} adicionarTarefa={adicionarTarefa} tarefas={tarefas} atualizarProgresso={atualizarProgresso} atualizarTarefa={atualizarTarefa} />}
          {tela === 'fotos' && <TelaFotos permissaoEditar={permissaoEditar} adicionarFotos={adicionarFotos} fotosDaObra={fotosDaObra} />}
          {tela === 'equipe' && !ehCliente && <TelaEquipe obraAtual={obraAtual} equipe={equipeDaObra} semanas={semanasDiarias} setSemanas={setSemanasDiarias} novoMembro={novoMembro} setNovoMembro={setNovoMembro} adicionarMembro={adicionarMembro} atualizarEquipe={atualizarEquipe} atualizarSemanaEquipe={atualizarSemanaEquipe} />}
          {tela === 'diario' && !ehCliente && <TelaDiario obraAtual={obraAtual} diario={diario} setDiario={setDiario} equipe={equipeDaObra} materiais={materiaisDaObra} />}
          {tela === 'materiais' && !ehCliente && <TelaMateriais materiais={materiaisDaObra} atualizarMaterial={atualizarMaterial} novoMaterial={novoMaterial} setNovoMaterial={setNovoMaterial} adicionarMaterial={adicionarMaterial} />}
          {tela === 'financeiro' && !ehCliente && <TelaFinanceiro financeiro={financeiroDaObra} novaTransacao={novaTransacao} setNovaTransacao={setNovaTransacao} adicionarTransacao={adicionarTransacao} />}
          {tela === 'compras' && !ehCliente && <TelaCompras compras={compras} atualizarCompra={atualizarCompra} />}
          {tela === 'orcamento' && !ehCliente && <TelaOrcamento orcamento={orcamento} novo={novoOrcamento} setNovo={setNovoOrcamento} adicionar={adicionarItemOrcamento} />}
          {tela === 'composicoes' && !ehCliente && <TelaComposicoes composicoes={composicoes} />}
          {tela === 'abc' && !ehCliente && <TelaCurvaABC orcamento={orcamento} />}
          {tela === 'medicoes' && <TelaMedicoes tarefas={tarefas} atualizarTarefa={atualizarTarefa} podeEditar={permissaoEditar} />}
          {tela === 'templates' && <TelaTemplates />}
          {tela === 'usuarios' && !ehCliente && <TelaUsuarios permissaoAdmin={permissaoAdmin} novaObra={novaObra} setNovaObra={setNovaObra} criarNovaObra={criarNovaObra} />}
        </section>
      </div>
    </main>
  )
}

function Dashboard({ ehCliente, obraAtual, usuario, resumo, alertas, atrasosReais, possiveisAtrasos, fotosDaObra, materiaisRecebidosHoje, tarefas, obrasVisiveis, cronogramas, setObraId, setCardDetalhe, financeiro, compras, atualizarObra }) {
  const receitas = financeiro.filter((f) => f.tipo === 'Receita').reduce((a, f) => a + f.valor, 0)
  const despesas = financeiro.filter((f) => f.tipo === 'Despesa').reduce((a, f) => a + f.valor, 0)
  const aReceber = financeiro.filter((f) => f.tipo === 'Receita' && f.status === 'A receber').reduce((a, f) => a + f.valor, 0)
  return <div className="space-y-6">{ehCliente && <ClienteBanner obraAtual={obraAtual} />}<CentralAlertas alertas={alertas} atrasosReais={atrasosReais} possiveisAtrasos={possiveisAtrasos} setCardDetalhe={setCardDetalhe} />
    <section className="grid grid-cols-1 gap-5 md:grid-cols-3"><MetricCard title="Avanço médio da obra" value={`${resumo.media}%`} detail="progresso físico geral" icon="📈" onClick={() => setCardDetalhe('avanco')} /><MetricCard title="Fotos do dia" value={fotosDaObra.length} detail="registros liberados" icon="📷" onClick={() => setCardDetalhe('fotos')} /><MetricCard title="Materiais recebidos" value={materiaisRecebidosHoje} detail="entregas lançadas hoje" icon="📦" onClick={() => setCardDetalhe('materiais')} /></section>
    {!ehCliente && <section className="grid grid-cols-1 gap-5 md:grid-cols-4"><MetricCard title="Resultado financeiro" value={formatarMoeda(receitas - despesas)} detail="entradas - saídas" icon="💰" /><MetricCard title="A receber" value={formatarMoeda(aReceber)} detail="pagamentos futuros" icon="🧾" /><MetricCard title="Cotações abertas" value={compras.filter(c => c.status !== 'Aprovado').length} detail="aguardando decisão" icon="🛒" /><MetricCard title="Possíveis atrasos" value={possiveisAtrasos.length} detail="pontos de atenção" icon="🟡" /></section>}
    <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><PanelClean><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wide text-blue-600">{ehCliente ? 'Painel do cliente' : 'Visão geral da obra'}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 lg:text-5xl">{obraAtual.nome}</h1><p className="mt-2 text-sm text-slate-500">{obraAtual.cliente} · {obraAtual.endereco}</p><p className="mt-2 text-xs text-slate-400">Logado como {usuario.nome} — {usuario.tipo}</p></div><StatusBadge status={obraAtual.status} /></div><div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr]"><div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5"><ProgressRing value={resumo.media} /></div><div className="grid gap-3"><InfoCard titulo="Etapa atual" valor={obraAtual.etapa} detalhe={`Responsável: ${obraAtual.responsavel}`} /><InfoCard titulo="Prazo" valor={obraAtual.prazo} detalhe={`Previsão: ${formatarData(obraAtual.previsaoEntrega)}`} /><MiniTimeline tarefas={tarefas} /></div></div></PanelClean><PanelClean><div className="mb-4"><p className="text-sm text-slate-500">Quadro de obras</p><h2 className="text-xl font-black text-slate-950">Etapas, prazos e responsáveis</h2></div><div className="space-y-3">{obrasVisiveis.map((obra) => { const tarefasObra = cronogramas[obra.id] || []; const p = tarefasObra.length ? Math.round(tarefasObra.reduce((a, t) => a + Number(t.progresso), 0) / tarefasObra.length) : 0; return <button key={obra.id} onClick={() => setObraId(obra.id)} className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left transition hover:scale-[1.01] hover:bg-blue-50"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-slate-950">{obra.nome}</p><p className="text-xs text-slate-500">{obra.etapa} · {obra.prazo}</p><p className="text-xs text-blue-700 font-bold">Responsável: {obra.responsavel}</p></div><p className="text-sm font-black text-blue-700">{p}%</p></div></button> })}</div></PanelClean></section>
    {!ehCliente && <PanelClean><h2 className="mb-4 text-2xl font-black">Editar etapa, prazo e responsável da obra selecionada</h2><div className="grid gap-3 md:grid-cols-4"><input className={inputClass} value={obraAtual.etapa} onChange={(e) => atualizarObra(obraAtual.id, 'etapa', e.target.value)} /><input className={inputClass} value={obraAtual.prazo} onChange={(e) => atualizarObra(obraAtual.id, 'prazo', e.target.value)} /><input className={inputClass} value={obraAtual.responsavel} onChange={(e) => atualizarObra(obraAtual.id, 'responsavel', e.target.value)} /><input type="date" className={inputClass} value={obraAtual.previsaoEntrega || ''} onChange={(e) => atualizarObra(obraAtual.id, 'previsaoEntrega', e.target.value)} /></div></PanelClean>}
  </div>
}

function CentralAlertas({ alertas, atrasosReais, possiveisAtrasos, setCardDetalhe }) { return <PanelClean><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Central de alertas</p><h2 className="text-3xl font-black text-slate-950">Atrasos e pontos de atenção</h2></div><div className="flex gap-2 text-sm font-black"><button onClick={() => setCardDetalhe('atrasos')} className="rounded-full bg-red-50 px-3 py-2 text-red-700 ring-1 ring-red-100">🔴 {atrasosReais.length} atrasados</button><button onClick={() => setCardDetalhe('possiveis')} className="rounded-full bg-amber-50 px-3 py-2 text-amber-700 ring-1 ring-amber-100">🟡 {possiveisAtrasos.length} possíveis atrasos</button></div></div>{alertas.length === 0 ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 font-bold text-emerald-700">🟢 Nenhum alerta no momento.</div> : <div className="grid gap-3 md:grid-cols-2">{alertas.slice(0, 6).map((a) => <button key={a.id} onClick={() => a.id === 'materiais-pendentes' ? setCardDetalhe('materiaisPendentes') : a.tipo === 'critico' ? setCardDetalhe('atrasos') : setCardDetalhe('possiveis')} className={`rounded-2xl border p-4 text-left ${a.tipo === 'critico' ? 'border-red-100 bg-red-50' : 'border-amber-100 bg-amber-50'}`}><div className="flex items-start gap-3"><span className="text-2xl">{a.icone}</span><div><p className="font-black text-slate-950">{a.titulo}</p><p className="mt-1 text-sm text-slate-600">{a.descricao}</p></div></div></button>)}</div>}</PanelClean> }
function DetalheCard({ tipo, voltar, resumo, fotosDaObra, materiais, tarefas }) { const titulo = tipo === 'avanco' ? 'Detalhes do avanço da obra' : tipo === 'fotos' ? 'Fotos do dia' : tipo === 'materiais' ? 'Materiais recebidos' : tipo === 'materiaisPendentes' ? 'Materiais pendentes' : tipo === 'atrasos' ? 'Atividades realmente atrasadas' : 'Possíveis atrasos'; const listaMateriais = tipo === 'materiaisPendentes' ? materiais.filter((m) => !m.recebido) : materiais.filter((m) => m.recebido); const listaTarefas = tipo === 'atrasos' ? tarefas.filter(estaAtrasada) : tarefas.filter((t) => !estaAtrasada(t) && Number(t.progresso) < 100); return <div className="space-y-5"><button onClick={voltar} className="font-black text-blue-700">← Voltar ao dashboard</button><PanelClean><h1 className="text-4xl font-black text-slate-950">{titulo}</h1>{tipo === 'avanco' && <div className="mt-6 grid gap-4 md:grid-cols-2"><ProgressRing value={resumo.media} /><MiniTimeline tarefas={tarefas} /></div>}{tipo === 'fotos' && (fotosDaObra.length ? <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">{fotosDaObra.map((foto) => <img key={foto.id} src={foto.url} alt={foto.nome} className="h-40 w-full rounded-3xl object-cover" />)}</div> : <Empty text="Nenhuma foto cadastrada hoje." />)}{['materiais', 'materiaisPendentes'].includes(tipo) && <div className="mt-6 space-y-3">{listaMateriais.map((m) => <div key={m.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">{m.material}</p><p className="text-sm text-slate-500">{m.quantidade} · necessidade: {formatarData(m.necessidade)} · {m.recebido ? `recebido em ${formatarData(m.data)}` : 'não recebido'}</p></div>)}</div>}{['atrasos', 'possiveis'].includes(tipo) && <div className="mt-6 space-y-3">{listaTarefas.map((t) => <div key={t.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">{t.nome}</p><p className="text-sm text-slate-500">Previsto: {formatarData(t.inicio)} até {formatarData(t.termino)} · avanço: {t.progresso}%</p></div>)}</div>}</PanelClean></div> }

function TelaCronograma({ permissaoEditar, permissaoAdmin, criarNovoCronograma, novaTarefa, setNovaTarefa, adicionarTarefa, tarefas, atualizarProgresso, atualizarTarefa }) { return <div className="space-y-5"><PanelClean><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm text-slate-500">Planejamento da obra</p><h2 className="text-3xl font-black text-slate-950">Planejamento 10x mais preciso</h2><p className="mt-1 text-sm text-slate-500">Previna atrasos, compare previsto x realizado e monitore o andamento da obra.</p></div>{permissaoAdmin && <button onClick={criarNovoCronograma} className={buttonPrimaryClass}>Novo cronograma zerado</button>}</div></PanelClean>{permissaoEditar && <PanelClean><h3 className="mb-4 text-xl font-black text-slate-950">Adicionar tarefa</h3><div className="grid grid-cols-1 gap-3 md:grid-cols-5"><input value={novaTarefa.nome} onChange={(e) => setNovaTarefa({ ...novaTarefa, nome: e.target.value })} placeholder="Nome da tarefa" className={`${inputClass} md:col-span-2`} /><input type="date" value={novaTarefa.inicio} onChange={(e) => setNovaTarefa({ ...novaTarefa, inicio: e.target.value })} className={inputClass} /><input type="date" value={novaTarefa.termino} onChange={(e) => setNovaTarefa({ ...novaTarefa, termino: e.target.value })} className={inputClass} /><button onClick={adicionarTarefa} className={buttonGreenClass}>Adicionar</button></div></PanelClean>}<PanelClean><h3 className="mb-5 text-2xl font-black">Gráfico do cronograma</h3><GraficoCronograma tarefas={tarefas} /></PanelClean><PanelClean><CronogramaVisual tarefas={tarefas} atualizarProgresso={atualizarProgresso} atualizarTarefa={atualizarTarefa} podeEditar={permissaoEditar} /></PanelClean></div> }
function GraficoCronograma({ tarefas }) { if (!tarefas.length) return <Empty text="Nenhuma tarefa criada." />; return <div className="overflow-x-auto pb-3"><div className="min-w-[900px] space-y-4"><div className="grid grid-cols-[180px_1fr_80px] gap-4 text-sm font-bold text-slate-500"><span>Atividade</span><div className="grid grid-cols-3 gap-2 text-center"><span className="rounded-xl bg-slate-100 py-2">Maio</span><span className="rounded-xl bg-slate-100 py-2">Junho</span><span className="rounded-xl bg-slate-100 py-2">Julho</span></div><span className="text-right">% real</span></div>{tarefas.map((t) => { const plannedLeft = Math.max(0, Number(t.inicioGrafico || 0)); const plannedWidth = Math.max(Number(t.duracao || 1) * 3.5, 7); const realLeft = t.inicioReal ? plannedLeft + diferencaDias(t.inicio, t.inicioReal) * 1.4 : plannedLeft; const realWidth = t.inicioReal ? Math.max((t.terminoReal ? diferencaDias(t.inicioReal, t.terminoReal) + 1 : Number(t.duracao || 1)) * 3.5, 7) : 0; return <div key={t.id} className="grid grid-cols-[180px_1fr_80px] gap-4 items-center"><div><p className="truncate font-black">{t.nome}</p><p className={`text-xs font-bold ${estaAtrasada(t) ? 'text-red-600' : 'text-slate-400'}`}>{estaAtrasada(t) ? 'Atrasada' : 'Em controle'}</p></div><div className="relative h-12 rounded-2xl bg-slate-100 overflow-hidden"><div className="absolute top-2 h-3 rounded-full bg-blue-300" style={{ left: `${plannedLeft}%`, width: `${plannedWidth}%` }} />{t.inicioReal && <div className="absolute bottom-2 h-3 rounded-full bg-emerald-400" style={{ left: `${Math.max(0, realLeft)}%`, width: `${realWidth}%` }}><div className="h-full rounded-full bg-emerald-600" style={{ width: `${t.progresso}%` }} /></div>}</div><span className="text-right font-black">{t.progresso}%</span></div>})}<div className="flex flex-wrap gap-3 pt-2 text-sm font-bold"><span className="rounded-full bg-blue-50 px-3 py-2 text-blue-700 ring-1 ring-blue-100">Azul: previsto</span><span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-100">Verde: realizado</span></div></div></div> }
function CronogramaVisual({ tarefas, atualizarProgresso, atualizarTarefa, podeEditar }) { if (!tarefas.length) return <Empty text="Nenhuma tarefa criada neste cronograma." />; return <div className="overflow-x-auto pb-3"><div className="min-w-[1180px]"><div className="mb-4 grid grid-cols-[210px_145px_145px_145px_145px_90px_1fr] gap-3 text-sm font-bold text-slate-500"><div>Tarefa</div><div>Início previsto</div><div>Término previsto</div><div>Início real</div><div>Término real</div><div>%</div><div>Comparativo visual</div></div><div className="space-y-4">{tarefas.map((t) => <div key={t.id} className={`grid grid-cols-[210px_145px_145px_145px_145px_90px_1fr] items-center gap-3 rounded-[1.5rem] border p-3 ${estaAtrasada(t) ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}><div>{podeEditar ? <input className="w-full bg-transparent font-black outline-none" value={t.nome} onChange={(e) => atualizarTarefa(t.id, 'nome', e.target.value)} /> : <p className="truncate font-black">{t.nome}</p>}<p className={`mt-1 text-xs font-bold ${estaAtrasada(t) ? 'text-red-700' : 'text-slate-400'}`}>{estaAtrasada(t) ? 'Atrasada' : 'Em controle'}</p></div><CampoData valor={t.inicio} podeEditar={podeEditar} onChange={(v) => atualizarTarefa(t.id, 'inicio', v)} /><CampoData valor={t.termino} podeEditar={podeEditar} onChange={(v) => atualizarTarefa(t.id, 'termino', v)} /><CampoData valor={t.inicioReal} podeEditar={podeEditar} onChange={(v) => atualizarTarefa(t.id, 'inicioReal', v)} /><CampoData valor={t.terminoReal} podeEditar={podeEditar} onChange={(v) => atualizarTarefa(t.id, 'terminoReal', v)} />{podeEditar ? <input type="number" min="0" max="100" value={t.progresso} onChange={(e) => atualizarProgresso(t.id, e.target.value)} className={inputClass} /> : <span className="font-black">{t.progresso}%</span>}<ComparativoPlanejadoReal tarefa={t} /></div>)}</div></div></div> }
function CampoData({ valor, podeEditar, onChange }) { return podeEditar ? <input type="date" className={inputClass} value={valor || ''} onChange={(e) => onChange(e.target.value)} /> : <span className="text-sm font-bold">{formatarData(valor)}</span> }
function ComparativoPlanejadoReal({ tarefa }) { const l = Number(tarefa.inicioGrafico || 0); const w = Math.max(Number(tarefa.duracao || 1) * 3.5, 7); const rl = tarefa.inicioReal ? l + diferencaDias(tarefa.inicio, tarefa.inicioReal) * 1.4 : l; const rw = tarefa.inicioReal ? Math.max((tarefa.terminoReal ? diferencaDias(tarefa.inicioReal, tarefa.terminoReal) + 1 : Number(tarefa.duracao || 1)) * 3.5, 7) : 0; return <div className="space-y-2"><div className="relative h-5 overflow-hidden rounded-full bg-slate-100"><div className="absolute h-full rounded-full bg-blue-300" style={{ left: `${l}%`, width: `${w}%` }} /></div><div className="relative h-5 overflow-hidden rounded-full bg-slate-100">{tarefa.inicioReal ? <div className="absolute h-full rounded-full bg-emerald-400" style={{ left: `${Math.max(0, rl)}%`, width: `${rw}%` }}><div className="h-full rounded-full bg-emerald-600" style={{ width: `${tarefa.progresso}%` }} /></div> : <span className="absolute left-3 top-0.5 text-xs font-bold text-slate-400">sem início real</span>}</div></div> }

function TelaOrcamento({ orcamento, novo, setNovo, adicionar }) { const total = orcamento.reduce((a, i) => a + i.quantidade * i.unitario, 0); return <div className="space-y-5"><PanelClean><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Orçamento de Obra</p><h2 className="text-3xl font-black">Adicione itens, simule versões e gere base para relatórios</h2><p className="mt-2 text-slate-500">Total do orçamento: <strong>{formatarMoeda(total)}</strong></p></PanelClean><PanelClean><div className="grid gap-3 md:grid-cols-6"><input className={inputClass} placeholder="Etapa" value={novo.etapa} onChange={(e)=>setNovo({...novo, etapa:e.target.value})}/><input className={`${inputClass} md:col-span-2`} placeholder="Item" value={novo.item} onChange={(e)=>setNovo({...novo, item:e.target.value})}/><input className={inputClass} placeholder="Un." value={novo.unidade} onChange={(e)=>setNovo({...novo, unidade:e.target.value})}/><input type="number" className={inputClass} placeholder="Qtd." value={novo.quantidade} onChange={(e)=>setNovo({...novo, quantidade:e.target.value})}/><button className={buttonGreenClass} onClick={adicionar}>Adicionar</button></div></PanelClean><PanelClean><TabelaSimples linhas={orcamento.map(i => [i.etapa, i.item, i.unidade, i.quantidade, formatarMoeda(i.unitario), formatarMoeda(i.quantidade*i.unitario)])} colunas={['Etapa','Item','Un.','Qtd.','Unitário','Total']} /></PanelClean></div> }
function TelaComposicoes({ composicoes }) { return <PanelClean><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Composição de Custos</p><h2 className="mb-5 text-3xl font-black">Crie composições e simule custos unitários</h2><TabelaSimples colunas={['Código','Composição','Insumos','Mão de obra','Material','Total']} linhas={composicoes.map(c => [c.codigo, c.nome, c.insumos, formatarMoeda(c.maoObra), formatarMoeda(c.material), formatarMoeda(c.total)])} /></PanelClean> }
function TelaCurvaABC({ orcamento }) { const total = orcamento.reduce((a, i) => a + i.quantidade * i.unitario, 0); const ordenado = [...orcamento].sort((a,b)=>(b.quantidade*b.unitario)-(a.quantidade*a.unitario)); return <PanelClean><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Curva ABC</p><h2 className="mb-5 text-3xl font-black">Itens mais relevantes do orçamento</h2><TabelaSimples colunas={['Classe','Item','Categoria','Valor','Participação']} linhas={ordenado.map((i, idx) => [idx < 1 ? 'A' : idx < 3 ? 'B' : 'C', i.item, i.categoria, formatarMoeda(i.quantidade*i.unitario), `${Math.round(((i.quantidade*i.unitario)/total)*100)}%`])} /></PanelClean> }
function TelaFinanceiro({ financeiro, novaTransacao, setNovaTransacao, adicionarTransacao }) { const receitas = financeiro.filter(f => f.tipo === 'Receita').reduce((a, f) => a + f.valor, 0); const despesas = financeiro.filter(f => f.tipo === 'Despesa').reduce((a, f) => a + f.valor, 0); const aReceber = financeiro.filter(f => f.tipo === 'Receita' && f.status === 'A receber').reduce((a, f) => a + f.valor, 0); return <div className="space-y-5"><section className="grid gap-5 md:grid-cols-3"><MetricCard title="Receitas" value={formatarMoeda(receitas)} detail="entradas" icon="🟢" /><MetricCard title="Despesas" value={formatarMoeda(despesas)} detail="saídas" icon="🔴" /><MetricCard title="Pagamentos a receber" value={formatarMoeda(aReceber)} detail="resumo de recebíveis" icon="🧾" /></section><PanelClean><h2 className="mb-4 text-3xl font-black">Fluxo de entradas e saídas por obra</h2><div className="grid gap-3 md:grid-cols-5"><select className={inputClass} value={novaTransacao.tipo} onChange={(e) => setNovaTransacao({ ...novaTransacao, tipo: e.target.value })}><option>Receita</option><option>Despesa</option></select><input className={`${inputClass} md:col-span-2`} placeholder="Descrição" value={novaTransacao.descricao} onChange={(e) => setNovaTransacao({ ...novaTransacao, descricao: e.target.value })} /><input type="number" className={inputClass} placeholder="Valor" value={novaTransacao.valor} onChange={(e) => setNovaTransacao({ ...novaTransacao, valor: e.target.value })} /><button className={buttonGreenClass} onClick={adicionarTransacao}>Adicionar</button></div></PanelClean><PanelClean><TabelaSimples colunas={['Descrição','Tipo','Valor','Data','Status']} linhas={financeiro.map(t => [t.descricao, t.tipo, formatarMoeda(t.valor), formatarData(t.data), t.status])} /></PanelClean></div> }
function TelaCompras({ compras, atualizarCompra }) { return <PanelClean><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Gestão de Compras</p><h2 className="text-3xl font-black">Evite prejuízos com compras online</h2><p className="mt-1 text-slate-500">Centralize fornecedores, prazos e status de aquisição.</p></div><button className={buttonPrimaryClass}>+ Nova cotação</button></div><TabelaSimples colunas={['Código','Cotação','Fornecedor','Data','Status','Prioridade','Total']} linhas={compras.map(c => [c.codigo, c.item, c.fornecedor, formatarData(c.data), c.status, c.prioridade, formatarMoeda(c.qtd*c.valorUnitario)])} /></PanelClean> }
function TelaMedicoes({ tarefas, atualizarTarefa, podeEditar }) { const totalOrcado = tarefas.reduce((a, t) => a + Number(t.orcado || 0), 0); const totalMedido = tarefas.reduce((a, t) => a + Number(t.medido || 0), 0); return <div className="space-y-5"><section className="grid gap-5 md:grid-cols-3"><MetricCard title="Orçado" value={formatarMoeda(totalOrcado)} detail="total previsto" icon="📐" /><MetricCard title="Medido acumulado" value={formatarMoeda(totalMedido)} detail="executado" icon="📏" /><MetricCard title="Restante" value={formatarMoeda(totalOrcado - totalMedido)} detail="saldo" icon="📊" /></section><PanelClean><h2 className="mb-5 text-3xl font-black">Medição de obra</h2><div className="overflow-x-auto"><table className="min-w-[850px] w-full text-sm"><thead><tr className="bg-slate-100"><th className="p-3 text-left">Item</th><th className="p-3">Orçado</th><th className="p-3">Medição atual</th><th className="p-3">Acumulado</th><th className="p-3">Restante</th><th className="p-3">%</th></tr></thead><tbody>{tarefas.map(t => <tr key={t.id} className="border-b"><td className="p-3 font-black">{t.nome}</td><td className="p-3"><input type="number" disabled={!podeEditar} className={inputClass} value={t.orcado || 0} onChange={(e) => atualizarTarefa(t.id, 'orcado', e.target.value)} /></td><td className="p-3"><input type="number" disabled={!podeEditar} className={inputClass} value={t.medido || 0} onChange={(e) => atualizarTarefa(t.id, 'medido', e.target.value)} /></td><td className="p-3 font-bold">{formatarMoeda(t.medido || 0)}</td><td className="p-3 font-bold">{formatarMoeda((t.orcado || 0) - (t.medido || 0))}</td><td className="p-3 font-black text-blue-700">{t.orcado ? Math.round((t.medido / t.orcado) * 100) : 0}%</td></tr>)}</tbody></table></div></PanelClean></div> }
function TelaTemplates() { return <PanelClean><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Templates para Obra</p><h2 className="mb-5 text-3xl font-black">Modelos rápidos para relatórios e controles</h2><div className="grid gap-4 md:grid-cols-3">{templates.map((t, i) => <div key={t} className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black text-blue-700">{i === 3 || i === 4 ? 'POPULAR' : 'TEMPLATE'}</p><h3 className="mt-2 text-xl font-black">{t}</h3><button className="mt-5 rounded-2xl bg-white px-4 py-2 font-bold ring-1 ring-slate-200">Usar modelo</button></div>)}</div></PanelClean> }

function TelaFotos({ permissaoEditar, adicionarFotos, fotosDaObra }) { return <PanelClean><div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm text-slate-500">Fotos da obra</p><h2 className="text-3xl font-black">Registro em campo</h2></div>{permissaoEditar && <label className={`${buttonPrimaryClass} cursor-pointer`}>Adicionar fotos<input type="file" multiple accept="image/*" onChange={adicionarFotos} className="hidden" /></label>}</div>{fotosDaObra.length === 0 ? <Empty text="Nenhuma foto cadastrada nesta obra." /> : <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{fotosDaObra.map((foto) => <div key={foto.id} className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm"><img src={foto.url} alt={foto.nome} className="h-40 w-full object-cover" /><div className="p-3"><p className="truncate font-bold">{foto.nome}</p><p className="text-sm text-slate-400">{foto.data}</p></div></div>)}</div>}</PanelClean> }
function TelaEquipe({ obraAtual, equipe, semanas, setSemanas, novoMembro, setNovoMembro, adicionarMembro, atualizarEquipe, atualizarSemanaEquipe }) { const totalDiarias = equipe.reduce((a, m) => a + Number(m.diasTrabalhados || 0), 0); const totalVales = equipe.reduce((a, m) => a + Number(m.vale || 0), 0); const totalSalarios = equipe.reduce((a, m) => a + ((Number(m.diasTrabalhados || 0) * Number(m.salarioUnitario || 0)) - Number(m.vale || 0)), 0); return <div className="space-y-5"><section className="grid grid-cols-1 gap-5 md:grid-cols-4"><MetricCard title="Membros" value={equipe.length} detail="vinculados" icon="👷" /><MetricCard title="Presentes hoje" value={equipe.filter((m) => m.diaria).length} detail="diária marcada" icon="✅" /><MetricCard title="Dias trabalhados" value={totalDiarias.toLocaleString('pt-BR')} detail="total" icon="📅" /><MetricCard title="Total a pagar" value={formatarMoeda(totalSalarios)} detail="salário - vales" icon="💰" /></section><PanelClean><p className="mb-1 text-sm font-bold uppercase tracking-wide text-blue-600">{obraAtual.nome}</p><h2 className="mb-4 text-3xl font-black">Equipe, diárias e pagamento</h2><div className="grid gap-3 md:grid-cols-3"><input className={inputClass} placeholder="Nome" value={novoMembro.nome} onChange={(e) => setNovoMembro({ ...novoMembro, nome: e.target.value })} /><input className={inputClass} placeholder="Função" value={novoMembro.funcao} onChange={(e) => setNovoMembro({ ...novoMembro, funcao: e.target.value })} /><button className={buttonGreenClass} onClick={adicionarMembro}>Adicionar membro</button></div></PanelClean><PanelClean><h3 className="mb-4 text-2xl font-black">Resumo mensal por trabalhador</h3><div className="mb-5 grid gap-3 md:grid-cols-3">{semanas.map((s, i) => <label key={i}><span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Semana {i+1}</span><input className={inputClass} value={s} onChange={(e) => setSemanas(semanas.map((x, idx) => idx === i ? e.target.value : x))} /></label>)}</div><div className="overflow-x-auto"><table className="min-w-[1150px] w-full border-collapse text-sm"><thead><tr className="bg-slate-900 text-white"><th className="border p-3 text-left">Trabalhador</th><th className="border p-3 text-left">Função</th>{semanas.map((s) => <th key={s} className="border p-3 text-center">{s}</th>)}<th className="border p-3">Total dias</th><th className="border p-3">Salário Unit.</th><th className="border p-3">Vale</th><th className="border p-3">Salário Mês</th><th className="border p-3">Hoje</th></tr></thead><tbody>{equipe.map((m) => { const salario = (Number(m.diasTrabalhados || 0) * Number(m.salarioUnitario || 0)) - Number(m.vale || 0); return <tr key={m.id} className="odd:bg-slate-50 even:bg-white"><td className="border p-2"><input className="w-full bg-transparent font-bold outline-none" value={m.nome} onChange={(e) => atualizarEquipe(m.id, 'nome', e.target.value)} /></td><td className="border p-2"><input className="w-full bg-transparent outline-none" value={m.funcao} onChange={(e) => atualizarEquipe(m.id, 'funcao', e.target.value)} /></td>{semanas.map((s, i) => <td key={s} className="border p-2 text-center"><input type="number" step="0.5" min="0" className="w-20 rounded-xl border px-2 py-1 text-right" value={(m.semanas || [0,0,0,0,0,0])[i] || 0} onChange={(e) => atualizarSemanaEquipe(m.id, i, e.target.value)} /></td>)}<td className="border p-2 text-center font-black">{Number(m.diasTrabalhados || 0).toLocaleString('pt-BR')}</td><td className="border p-2"><input type="number" className="w-24 rounded-xl border px-2 py-1 text-right" value={m.salarioUnitario || 0} onChange={(e) => atualizarEquipe(m.id, 'salarioUnitario', e.target.value)} /></td><td className="border p-2"><input type="number" className="w-24 rounded-xl border px-2 py-1 text-right" value={m.vale || 0} onChange={(e) => atualizarEquipe(m.id, 'vale', e.target.value)} /></td><td className="border p-2 text-right font-black">{formatarMoeda(salario)}</td><td className="border p-2 text-center"><input type="checkbox" checked={m.diaria} onChange={(e) => atualizarEquipe(m.id, 'diaria', e.target.checked)} /></td></tr> })}</tbody><tfoot><tr className="bg-slate-900 text-white font-black"><td className="border p-3" colSpan={8}>TOTAL</td><td className="border p-3 text-center">{totalDiarias.toLocaleString('pt-BR')}</td><td className="border p-3" /><td className="border p-3 text-right">{formatarMoeda(totalVales)}</td><td className="border p-3 text-right">{formatarMoeda(totalSalarios)}</td><td className="border p-3" /></tr></tfoot></table></div></PanelClean></div> }
function TelaDiario({ obraAtual, diario, setDiario, equipe, materiais }) { return <PanelClean><p className="text-sm font-bold uppercase tracking-wide text-blue-600">Diário de obra online</p><h2 className="mb-6 text-3xl font-black">Registre e centralize todas as informações da obra</h2><div className="overflow-auto"><div className="min-w-[850px] border-2 border-slate-950 bg-white text-slate-950"><div className="border-b-2 border-slate-950 p-3 text-center font-black"><input className="w-full text-center font-black outline-none" value={obraAtual.nome} readOnly /></div><div className="grid grid-cols-[160px_1fr] border-b border-slate-950"><div className="border-r border-slate-950 p-2 font-bold">Data</div><input type="date" className="p-2 outline-none" value={diario.data} onChange={(e) => setDiario({ ...diario, data: e.target.value })} /></div><div className="border-b border-slate-950 p-2"><p className="font-bold">Condições de trabalho do dia:</p><textarea className="mt-2 min-h-20 w-full outline-none" value={diario.clima} onChange={(e) => setDiario({ ...diario, clima: e.target.value })} /></div><div className="border-b border-slate-950 p-2 font-black">Funcionários presentes</div><div className="grid grid-cols-2 border-b border-slate-950">{equipe.filter((m) => m.diaria).map((m) => <div key={m.id} className="grid grid-cols-2 border-r border-slate-950"><div className="border-b border-slate-950 p-2">{m.nome}</div><div className="border-b border-slate-950 p-2">{m.funcao}</div></div>)}</div><div className="border-b border-slate-950 p-2"><p className="font-black">Atividades Desenvolvidas:</p><textarea className="mt-2 min-h-40 w-full outline-none" value={diario.atividades} onChange={(e) => setDiario({ ...diario, atividades: e.target.value })} /></div><div className="border-b border-slate-950 p-2"><p className="font-black">Materiais Recebidos:</p><textarea className="mt-2 min-h-24 w-full outline-none" value={materiais.filter((m) => m.recebido).map((m) => `${m.material} - ${m.quantidade} - ${formatarData(m.data)}`).join('\n')} readOnly /></div><div className="p-2"><p className="font-black">Observações:</p><textarea className="mt-2 min-h-24 w-full outline-none" value={diario.observacoes} onChange={(e) => setDiario({ ...diario, observacoes: e.target.value })} /></div></div></div></PanelClean> }
function TelaMateriais({ materiais, atualizarMaterial, novoMaterial, setNovoMaterial, adicionarMaterial }) { return <div className="space-y-5"><PanelClean><h2 className="mb-4 text-3xl font-black">Materiais</h2><div className="grid gap-3 md:grid-cols-3"><input className={inputClass} placeholder="Material" value={novoMaterial.material} onChange={(e) => setNovoMaterial({ ...novoMaterial, material: e.target.value })} /><input className={inputClass} placeholder="Quantidade" value={novoMaterial.quantidade} onChange={(e) => setNovoMaterial({ ...novoMaterial, quantidade: e.target.value })} /><button className={buttonGreenClass} onClick={adicionarMaterial}>Adicionar material</button></div></PanelClean><PanelClean><TabelaSimples colunas={['Material','Quantidade','Recebido','Necessidade','Recebimento','Custo']} linhas={materiais.map((item) => [item.material, item.quantidade, item.recebido ? 'Sim' : 'Não', formatarData(item.necessidade), formatarData(item.data), formatarMoeda(item.custo)])} /></PanelClean></div> }
function TelaUsuarios({ permissaoAdmin, novaObra, setNovaObra, criarNovaObra }) { return <div className="space-y-5">{permissaoAdmin && <PanelClean><h2 className="mb-4 text-3xl font-black">Criar nova obra</h2><div className="grid grid-cols-1 gap-3 md:grid-cols-5"><input value={novaObra.nome} onChange={(e) => setNovaObra({ ...novaObra, nome: e.target.value })} placeholder="Nome da obra" className={inputClass} /><input value={novaObra.cliente} onChange={(e) => setNovaObra({ ...novaObra, cliente: e.target.value })} placeholder="Cliente" className={inputClass} /><input value={novaObra.endereco} onChange={(e) => setNovaObra({ ...novaObra, endereco: e.target.value })} placeholder="Endereço" className={inputClass} /><input value={novaObra.responsavel} onChange={(e) => setNovaObra({ ...novaObra, responsavel: e.target.value })} placeholder="Responsável" className={inputClass} /><button onClick={criarNovaObra} className={buttonGreenClass}>Criar obra</button></div></PanelClean>}<PanelClean><h2 className="mb-5 text-3xl font-black">Tipos de usuários</h2><div className="grid grid-cols-1 gap-5 md:grid-cols-3"><UserCard tipo="Engenheiro" texto="Acesso completo." /><UserCard tipo="Estagiário" texto="Atualiza diário, fotos, progresso, equipe e materiais." /><UserCard tipo="Cliente" texto="Visualiza somente a obra vinculada." /></div></PanelClean></div> }
function TabelaSimples({ colunas, linhas }) { return <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-sm"><thead><tr className="bg-slate-100">{colunas.map(c => <th key={c} className="p-3 text-left font-black text-slate-600">{c}</th>)}</tr></thead><tbody>{linhas.map((linha, i) => <tr key={i} className="border-b border-slate-100">{linha.map((cel, j) => <td key={j} className="p-3">{cel}</td>)}</tr>)}</tbody></table></div> }
function LoginScreen({ selecionarUsuario }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [autenticado, setAutenticado] = useState(false)

  function entrarDemo(e) {
    e.preventDefault()

    const emailCorreto = 'investidor@neocanteiro.com.br'
    const senhaCorreta = 'Demo@2026'

    if (email.trim().toLowerCase() === emailCorreto && senha === senhaCorreta) {
      setErro('')
      setAutenticado(true)
      return
    }

    setErro('E-mail ou senha incorretos. Confira os dados de acesso demo.')
  }

  if (autenticado) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 text-slate-950">
        <div className="relative mx-auto grid min-h-screen max-w-5xl place-items-center">
          <div className="w-full rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
            <LogoNeoCanteiro />
            <p className="mt-8 text-sm font-bold uppercase tracking-wide text-blue-600">Acesso demo liberado</p>
            <h1 className="mt-2 text-5xl font-black tracking-tight">Escolha a visão do sistema</h1>
            <p className="mt-3 text-slate-500">O investidor pode navegar pelas permissões de Engenheiro, Estagiário e Cliente.</p>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              {usuarios.map((user) => (
                <button key={user.id} onClick={() => selecionarUsuario(user)} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-left transition hover:scale-[1.02] hover:border-blue-200 hover:bg-blue-50">
                  <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">{user.iniciais}</div>
                  <h2 className="text-2xl font-black">{user.nome}</h2>
                  <p className="mt-1 text-slate-500">{user.tipo}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-950">
      <div className="relative mx-auto grid min-h-screen max-w-5xl place-items-center">
        <div className="grid w-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.05fr_.95fr]">
          <section className="bg-slate-950 p-8 text-white lg:p-12">
            <LogoNeoCanteiro />
            <div className="mt-16">
              <p className="mb-3 inline-flex rounded-full bg-blue-500/15 px-4 py-2 text-sm font-bold text-blue-200 ring-1 ring-blue-400/20">Acesso demo para investidores</p>
              <h1 className="text-5xl font-black tracking-tight lg:text-6xl">Neo<span className="text-blue-400">Canteiro</span></h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-300">Plataforma de gestão de obras com cronograma, diário, financeiro, compras, medições e alertas inteligentes.</p>
            </div>
            <div className="mt-12 grid gap-3 text-sm text-slate-300">
              <p>✅ Planejamento de obra</p>
              <p>✅ Alertas de atraso</p>
              <p>✅ Diário de obra online</p>
              <p>✅ Financeiro, compras e medições</p>
            </div>
          </section>

          <section className="p-8 lg:p-12">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">Entrar na plataforma</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Login</h2>
            <p className="mt-3 text-slate-500">Use o acesso demo enviado para visualizar o sistema.</p>

            <form onSubmit={entrarDemo} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">E-mail</span>
                <input className={inputClass} type="email" placeholder="investidor@neocanteiro.com.br" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Senha</span>
                <input className={inputClass} type="password" placeholder="Digite a senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
              </label>
              {erro && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{erro}</div>}
              <button type="submit" className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800">Acessar demo</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}

function LogoNeoCanteiro() { return <div className="flex items-center gap-4"><img src="/logo-neocanteiro.png" alt="NeoCanteiro" className="h-14 w-auto object-contain" /><div><h1 className="text-2xl font-black tracking-tight text-slate-950">Neo<span className="text-blue-600">Canteiro</span></h1><p className="text-[10px] uppercase tracking-[0.34em] text-slate-400">Sistema de Gestão de Obras</p></div></div> }
function LogoIcon() { return <img src="/logo-neocanteiro.png" alt="NeoCanteiro" className="h-14 w-14 rounded-2xl object-cover" /> }
function PanelClean({ children }) { return <section className="rounded-[2.25rem] border border-slate-200 bg-white p-5 shadow-sm">{children}</section> }
function MenuItem({ label, active, onClick }) { return <button onClick={onClick} className={`grid h-12 w-12 place-items-center rounded-2xl text-xl transition ${active ? 'bg-slate-950 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200'}`}>{label}</button> }
function StatusBadge({ status }) { const color = status === 'Atenção' ? 'bg-orange-50 text-orange-700 ring-orange-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'; return <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${color}`}>{status}</span> }
function ClienteBanner({ obraAtual }) { return <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5"><p className="font-black text-blue-800">Painel do cliente</p><p className="mt-1 text-sm text-blue-700">Você está visualizando somente a obra vinculada ao seu acesso: <strong>{obraAtual.nome}</strong>.</p></div> }
function InfoCard({ titulo, valor, detalhe }) { return <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{titulo}</p><p className="mt-2 text-xl font-black">{valor}</p><p className="mt-1 text-sm text-slate-500">{detalhe}</p></div> }
function MiniTimeline({ tarefas }) { return <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Cronograma</p><p className="text-xs font-bold text-emerald-600">Atualizado hoje</p></div>{tarefas.length === 0 ? <p className="text-sm text-slate-500">Nenhum cronograma criado ainda.</p> : tarefas.slice(0, 5).map((item) => <div key={item.id} className="mb-3 last:mb-0"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{item.nome}</span><span>{item.progresso}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${item.progresso}%` }} /></div></div>)}</div> }
function MetricCard({ title, value, detail, icon, onClick }) { return <button onClick={onClick} className="rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-3 text-sm text-slate-400">{detail}</p></div><div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">{icon}</div></div></button> }
function ProgressRing({ value }) { const radius = 38; const circumference = 2 * Math.PI * radius; const offset = circumference - (value / 100) * circumference; return <div className="relative grid h-28 w-28 place-items-center"><svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r={radius} stroke="#e2e8f0" strokeWidth="10" fill="none" /><circle cx="50" cy="50" r={radius} stroke="url(#neoGradient)" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} /><defs><linearGradient id="neoGradient" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#22c55e" /><stop offset="55%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#0ea5e9" /></linearGradient></defs></svg><div className="absolute text-center"><p className="text-3xl font-black">{value}%</p><p className="text-[10px] uppercase tracking-widest text-slate-400">progresso</p></div></div> }
function UserCard({ tipo, texto }) { return <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6"><h3 className="text-2xl font-black">{tipo}</h3><p className="mt-3 leading-relaxed text-slate-500">{texto}</p></div> }
function Empty({ text }) { return <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">{text}</div> }
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
