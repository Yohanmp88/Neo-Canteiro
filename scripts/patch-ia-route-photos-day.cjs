const fs = require('fs')

const path = 'src/app/ia/page.js'
let source = fs.readFileSync(path, 'utf8')

function replaceOnce(search, replacement, label) {
  if (source.includes(replacement)) return
  if (!source.includes(search)) throw new Error(`Trecho não encontrado: ${label}`)
  source = source.replace(search, replacement)
}

replaceOnce(
  "import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'",
  "import { useWorkspaceRecords } from '@/hooks/useWorkspaceRecords'\nimport { useObraPhotos } from '@/hooks/useObraPhotos'",
  'importação do hook de fotos',
)

replaceOnce(
  "const PERGUNTAS_CHAVE = [\n  'Diário de hoje: o que foi feito?',",
  "const PERGUNTAS_CHAVE = [\n  'Fotos do dia',\n  'Diário de hoje: o que foi feito?',",
  'pergunta sugerida Fotos do dia',
)

replaceOnce(
  "  const {\n    records: materiaisWorkspaceRaw = [],\n    loading: materiaisWorkspaceLoading,\n    error: materiaisWorkspaceError,\n  } = useWorkspaceRecords('materiais', obraAtual?.id, user)",
  "  const {\n    records: materiaisWorkspaceRaw = [],\n    loading: materiaisWorkspaceLoading,\n    error: materiaisWorkspaceError,\n  } = useWorkspaceRecords('materiais', obraAtual?.id, user)\n  const {\n    photos: fotosObra = [],\n    loading: fotosLoading,\n    reload: recarregarFotos,\n  } = useObraPhotos(obraAtual?.id)",
  'carregamento das fotos da obra',
)

replaceOnce(
  '  const carregando = authLoading || obrasLoading || tarefasLoading || comprasLoading || diariosLoading || workspaceLoading || materiaisWorkspaceLoading',
  '  const carregando = authLoading || obrasLoading || tarefasLoading || comprasLoading || diariosLoading || workspaceLoading || materiaisWorkspaceLoading || fotosLoading',
  'estado de carregamento das fotos',
)

const questionStart = source.indexOf('  function perguntar(textoPergunta) {')
const questionEnd = source.indexOf('  function enviar(event) {', questionStart)
if (questionStart === -1 || questionEnd === -1) throw new Error('Função perguntar não encontrada.')

const newQuestionFunction = `  async function perguntar(textoPergunta) {
    const texto = String(textoPergunta || '').trim()
    if (!texto || respondendo) return

    setMensagens((atuais) => [...atuais, { tipo: 'usuario', texto }])
    setPergunta('')
    setRespondendo(true)

    try {
      const fotosAtualizadas = await recarregarFotos()
      const fotosDisponiveis = Array.isArray(fotosAtualizadas) && fotosAtualizadas.length ? fotosAtualizadas : fotosObra
      const textoNormalizado = normalizarTexto(texto)
      const perguntaFotos = contemAlgum(textoNormalizado, ['foto', 'fotos', 'registro fotografico', 'registros fotograficos'])
      const perguntaDiario = contemAlgum(textoNormalizado, [
        'diario', 'o que foi feito', 'feito hoje', 'servicos executados hoje',
        'trabalhos de hoje', 'atividades de hoje', 'relatorio do dia', 'resumo do dia',
      ])
      const dataAlvo = dataPedidaNoTexto(texto) || dataISO(new Date())
      const fotosDoDia = fotosDisponiveis.filter((foto) => String(foto.date || '').slice(0, 10) === dataAlvo)

      const resposta = perguntaFotos
        ? (fotosDoDia.length
          ? \`Encontrei \${fotosDoDia.length} foto\${fotosDoDia.length === 1 ? '' : 's'} registrada\${fotosDoDia.length === 1 ? '' : 's'} em \${formatarData(dataAlvo)}.\`
          : \`Não encontrei fotos registradas em \${formatarData(dataAlvo)} para a obra “\${obraAtual.nome}”.\`)
        : gerarResposta(texto, {
          obra: obraAtual,
          tarefas,
          pedidos,
          diarios,
          servicosAtrasados,
          materiaisNaoEntregues,
          materiaisAtrasados,
          tarefasBloqueadas,
          comprasError,
          diarioError,
        })

      setMensagens((atuais) => [...atuais, {
        tipo: 'assistente',
        texto: resposta,
        fotos: perguntaFotos || perguntaDiario ? fotosDoDia : [],
      }])
    } catch {
      setMensagens((atuais) => [...atuais, {
        tipo: 'assistente',
        texto: 'Não consegui consultar as fotos da obra neste momento.',
      }])
    } finally {
      setRespondendo(false)
    }
  }

`

source = source.slice(0, questionStart) + newQuestionFunction + source.slice(questionEnd)

replaceOnce(
  "                <div className={\`max-w-[92%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 \${mensagem.tipo === 'usuario' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'}\`}>\n                  {mensagem.texto}\n                </div>",
  "                <div className={\`max-w-[92%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 \${mensagem.tipo === 'usuario' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'}\`}>\n                  <div>{mensagem.texto}</div>\n                  {mensagem.tipo === 'assistente' && mensagem.fotos?.length > 0 && (\n                    <div className=\"mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2\">\n                      {mensagem.fotos.map((foto, fotoIndice) => (\n                        <a\n                          key={foto.id || foto.url || fotoIndice}\n                          href={foto.url}\n                          target=\"_blank\"\n                          rel=\"noreferrer\"\n                          className=\"overflow-hidden rounded-xl border border-slate-200 bg-slate-100\"\n                        >\n                          <img\n                            src={foto.url}\n                            alt={foto.title || `Foto da obra \${fotoIndice + 1}`}\n                            className=\"h-44 w-full object-cover\"\n                          />\n                        </a>\n                      ))}\n                    </div>\n                  )}\n                </div>",
  'galeria de fotos nas mensagens',
)

fs.writeFileSync(path, source)
