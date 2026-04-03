import { useState, useEffect } from 'react'
import { Sun, Moon, Languages, Sliders, Copy, Check } from 'lucide-react'

const translations = {
  en: {
    title: 'QoS Policy Designer',
    subtitle: 'DSCP reference, queue types, shaping vs policing calculator and MQC config generator for Cisco.',
    dscpRef: 'DSCP Reference',
    queues: 'Queue Types',
    calculator: 'Shaping / Policing Calculator',
    mqcGen: 'MQC Config Generator',
    dscp: 'DSCP',
    decimal: 'Decimal',
    hex: 'Hex',
    binary: 'Binary',
    description: 'Description',
    useCase: 'Use Case',
    cir: 'CIR (Committed Information Rate) bps',
    bc: 'Bc (Committed Burst) bits',
    be: 'Be (Excess Burst) bits',
    tc: 'Tc = Bc / CIR',
    tcValue: 'Token bucket interval',
    shapingResult: 'Shaping: smooth, buffers excess',
    policingResult: 'Policing: drops (or marks down) excess',
    interface: 'Interface Name',
    generateMqc: 'Generate MQC',
    copy: 'Copy',
    copied: 'Copied!',
    noConfig: 'Click "Generate MQC" to see output.',
    references: 'References',
    refList: ['RFC 2474 - Definition of the DS Field in IPv4 and IPv6 Headers', 'RFC 2475 - An Architecture for Differentiated Services'],
    builtBy: 'Built by',
    queueTypes: [
      { name: 'LLQ (Low Latency Queuing)', desc: 'Strict priority queue for delay-sensitive traffic (VoIP, video). Guarantees absolute priority — packets in this queue are always served first before CBWFQ queues.', pros: ['Guaranteed low latency', 'Suitable for real-time traffic'], cons: ['Can starve other queues if misconfigured', 'Requires careful bandwidth allocation'] },
      { name: 'CBWFQ (Class-Based WFQ)', desc: 'Assigns minimum guaranteed bandwidth to each class. Non-priority queue; bandwidth is shared proportionally. Unused bandwidth from other classes is given to classes that need it.', pros: ['Guaranteed minimum bandwidth per class', 'Fair sharing of unused bandwidth'], cons: ['Does not guarantee latency (only bandwidth)', 'More complex than simple FIFO'] },
      { name: 'WFQ (Weighted Fair Queuing)', desc: 'Automatic bandwidth sharing based on flow weights (usually derived from IP Precedence). Legacy mechanism; largely replaced by CBWFQ in modern designs.', pros: ['Automatic fairness across flows', 'Simple configuration'], cons: ['Cannot define explicit class bandwidth guarantees', 'Deprecated in favor of CBWFQ'] },
    ],
  },
  pt: {
    title: 'Designer de Politica QoS',
    subtitle: 'Referencia DSCP, tipos de fila, calculadora shaping vs policing e gerador de config MQC para Cisco.',
    dscpRef: 'Referencia DSCP',
    queues: 'Tipos de Fila',
    calculator: 'Calculadora Shaping / Policing',
    mqcGen: 'Gerador de Config MQC',
    dscp: 'DSCP',
    decimal: 'Decimal',
    hex: 'Hex',
    binary: 'Binario',
    description: 'Descricao',
    useCase: 'Caso de Uso',
    cir: 'CIR (Taxa de Informacao Comprometida) bps',
    bc: 'Bc (Burst Comprometido) bits',
    be: 'Be (Burst em Excesso) bits',
    tc: 'Tc = Bc / CIR',
    tcValue: 'Intervalo do bucket de tokens',
    shapingResult: 'Shaping: suaviza, bufferiza o excesso',
    policingResult: 'Policing: descarta (ou remarca) o excesso',
    interface: 'Nome da Interface',
    generateMqc: 'Gerar MQC',
    copy: 'Copiar',
    copied: 'Copiado!',
    noConfig: 'Clique em "Gerar MQC" para ver o resultado.',
    references: 'Referencias',
    refList: ['RFC 2474 - Definicao do Campo DS nos Cabecalhos IPv4 e IPv6', 'RFC 2475 - Arquitetura para Servicos Diferenciados'],
    builtBy: 'Criado por',
    queueTypes: [
      { name: 'LLQ (Low Latency Queuing)', desc: 'Fila de prioridade estrita para trafego sensivel a atraso (VoIP, video). Garante prioridade absoluta — pacotes nesta fila sao sempre atendidos primeiro.', pros: ['Baixa latencia garantida', 'Adequado para trafego em tempo real'], cons: ['Pode privar outras filas se mal configurado', 'Requer alocacao cuidadosa de banda'] },
      { name: 'CBWFQ (Class-Based WFQ)', desc: 'Atribui banda garantida minima a cada classe. Fila nao-prioritaria; banda e compartilhada proporcionalmente. Banda nao utilizada e distribuida as classes que precisam.', pros: ['Banda minima garantida por classe', 'Compartilhamento justo de banda ociosa'], cons: ['Nao garante latencia (apenas banda)', 'Mais complexo que FIFO simples'] },
      { name: 'WFQ (Weighted Fair Queuing)', desc: 'Compartilhamento automatico de banda baseado em pesos de fluxo (geralmente derivados do IP Precedence). Mecanismo legado; amplamente substituido por CBWFQ.', pros: ['Justica automatica entre fluxos', 'Configuracao simples'], cons: ['Nao permite garantias explicitas de banda por classe', 'Deprecado em favor do CBWFQ'] },
    ],
  },
} as const

type Lang = keyof typeof translations
type Tab = 'dscp' | 'queues' | 'calc' | 'mqc'

const DSCP_TABLE = [
  { name: 'EF', dscp: 46, dec: 46, desc: 'Expedited Forwarding', use: 'VoIP media (G.711, G.729), interactive video' },
  { name: 'CS7', dscp: 56, dec: 56, desc: 'Class Selector 7', use: 'Network control (routing protocols)' },
  { name: 'CS6', dscp: 48, dec: 48, desc: 'Class Selector 6', use: 'Network control (OSPF, BGP)' },
  { name: 'AF41', dscp: 34, dec: 34, desc: 'Assured Forwarding 4-1', use: 'Interactive video (low drop)' },
  { name: 'AF42', dscp: 36, dec: 36, desc: 'Assured Forwarding 4-2', use: 'Interactive video (med drop)' },
  { name: 'AF43', dscp: 38, dec: 38, desc: 'Assured Forwarding 4-3', use: 'Interactive video (high drop)' },
  { name: 'AF31', dscp: 26, dec: 26, desc: 'Assured Forwarding 3-1', use: 'Call signaling, streaming' },
  { name: 'AF32', dscp: 28, dec: 28, desc: 'Assured Forwarding 3-2', use: 'Call signaling (med drop)' },
  { name: 'AF33', dscp: 30, dec: 30, desc: 'Assured Forwarding 3-3', use: 'Call signaling (high drop)' },
  { name: 'AF21', dscp: 18, dec: 18, desc: 'Assured Forwarding 2-1', use: 'Transactional data (low drop)' },
  { name: 'AF22', dscp: 20, dec: 20, desc: 'Assured Forwarding 2-2', use: 'Transactional data (med drop)' },
  { name: 'AF23', dscp: 22, dec: 22, desc: 'Assured Forwarding 2-3', use: 'Transactional data (high drop)' },
  { name: 'AF11', dscp: 10, dec: 10, desc: 'Assured Forwarding 1-1', use: 'Bulk data (low drop)' },
  { name: 'AF12', dscp: 12, dec: 12, desc: 'Assured Forwarding 1-2', use: 'Bulk data (med drop)' },
  { name: 'AF13', dscp: 14, dec: 14, desc: 'Assured Forwarding 1-3', use: 'Bulk data (high drop)' },
  { name: 'CS1', dscp: 8, dec: 8, desc: 'Class Selector 1', use: 'Scavenger/low-priority traffic' },
  { name: 'BE', dscp: 0, dec: 0, desc: 'Best Effort / Default', use: 'Default unmarked traffic' },
]

function toBin(n: number): string {
  return n.toString(2).padStart(6, '0')
}
function toHex(n: number): string {
  return '0x' + (n << 2).toString(16).toUpperCase().padStart(2, '0')
}

export default function QosDesigner() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [tab, setTab] = useState<Tab>('dscp')
  const [cir, setCir] = useState(1000000)
  const [bc, setBc] = useState(125000)
  const [be, setBe] = useState(250000)
  const [ifName, setIfName] = useState('GigabitEthernet0/0')
  const [config, setConfig] = useState('')
  const [copied, setCopied] = useState(false)

  const t = translations[lang]
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const tc = cir > 0 ? (bc / cir * 1000).toFixed(2) : '0'

  const generateMqc = () => {
    const lines = [
      `! QoS MQC Configuration - ${ifName}`,
      `!`,
      `class-map match-any VOICE`,
      ` match dscp ef`,
      `class-map match-any VIDEO`,
      ` match dscp af41 af42 af43`,
      `class-map match-any CALL-SIGNAL`,
      ` match dscp af31 af32 af33`,
      `class-map match-any DATA`,
      ` match dscp af21 af22 af23`,
      `class-map match-any BULK`,
      ` match dscp af11 af12 af13`,
      `class-map match-any SCAVENGER`,
      ` match dscp cs1`,
      `!`,
      `policy-map EGRESS-QOS`,
      ` class VOICE`,
      `  priority percent 20`,
      ` class VIDEO`,
      `  bandwidth percent 20`,
      `  random-detect dscp-based`,
      ` class CALL-SIGNAL`,
      `  bandwidth percent 5`,
      ` class DATA`,
      `  bandwidth percent 25`,
      `  random-detect dscp-based`,
      ` class BULK`,
      `  bandwidth percent 10`,
      ` class SCAVENGER`,
      `  bandwidth percent 1`,
      ` class class-default`,
      `  fair-queue`,
      `  bandwidth percent 19`,
      `!`,
      `! Shaping policy (outer)`,
      `policy-map WAN-SHAPING`,
      ` class class-default`,
      `  shape average ${cir}`,
      `   service-policy EGRESS-QOS`,
      `!`,
      `interface ${ifName}`,
      ` service-policy output WAN-SHAPING`,
      `!`,
    ]
    setConfig(lines.join('\n'))
  }

  const handleCopy = () => {
    if (!config) return
    navigator.clipboard.writeText(config).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dscp', label: t.dscpRef },
    { key: 'queues', label: t.queues },
    { key: 'calc', label: t.calculator },
    { key: 'mqc', label: t.mqcGen },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Sliders size={18} className="text-white" />
            </div>
            <span className="font-semibold">QoS Designer</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/qos-designer" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(tb => (
              <button key={tb.key} onClick={() => setTab(tb.key)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === tb.key ? 'bg-orange-500 text-white border-orange-500' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                {tb.label}
              </button>
            ))}
          </div>

          {/* DSCP Table */}
          {tab === 'dscp' && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 overflow-x-auto">
              <h2 className="font-semibold mb-4">{t.dscpRef}</h2>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    {[t.dscp, t.decimal, t.hex, t.binary, t.description, t.useCase].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-xs uppercase tracking-wide text-zinc-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DSCP_TABLE.map(row => (
                    <tr key={row.name} className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2 pr-4 font-bold text-orange-500 font-mono">{row.name}</td>
                      <td className="py-2 pr-4 font-mono text-sm">{row.dec}</td>
                      <td className="py-2 pr-4 font-mono text-sm text-zinc-500">{toHex(row.dscp)}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-zinc-500">{toBin(row.dscp)}</td>
                      <td className="py-2 pr-4 text-sm">{row.desc}</td>
                      <td className="py-2 text-xs text-zinc-500 dark:text-zinc-400">{row.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Queues */}
          {tab === 'queues' && (
            <div className="space-y-4">
              {t.queueTypes.map(qt => (
                <div key={qt.name} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                  <h2 className="font-bold text-orange-500 mb-2">{qt.name}</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{qt.desc}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-green-500 font-medium mb-1">Pros</div>
                      <ul className="space-y-1">{qt.pros.map((p, i) => <li key={i} className="text-xs text-zinc-500 flex gap-1"><span className="text-green-500">+</span>{p}</li>)}</ul>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-red-500 font-medium mb-1">Cons</div>
                      <ul className="space-y-1">{qt.cons.map((c, i) => <li key={i} className="text-xs text-zinc-500 flex gap-1"><span className="text-red-500">-</span>{c}</li>)}</ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Calculator */}
          {tab === 'calc' && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5">
              <h2 className="font-semibold">{t.calculator}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t.cir}</label><input type="number" className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" value={cir} onChange={e => setCir(Number(e.target.value))} /></div>
                <div><label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t.bc}</label><input type="number" className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" value={bc} onChange={e => setBc(Number(e.target.value))} /></div>
                <div><label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t.be}</label><input type="number" className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" value={be} onChange={e => setBe(Number(e.target.value))} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: t.tc, value: `${tc} ms`, sub: t.tcValue },
                  { label: t.shapingResult, value: `Bc=${(bc/1000).toFixed(0)}kbits`, sub: 'Buffers bursts up to Bc' },
                  { label: t.policingResult, value: `Bc+Be=${((bc+be)/1000).toFixed(0)}kbits`, sub: 'Drops above Bc+Be' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{item.label}</div>
                    <div className="text-lg font-bold text-orange-500 font-mono">{item.value}</div>
                    <div className="text-[10px] text-zinc-400">{item.sub}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-zinc-950 text-zinc-100 p-4 font-mono text-xs">
                {`! Shaping (smooth)\nshape average ${cir} ${bc} ${be}\n\n! Policing (drop/remark)\npolice rate ${cir} bps burst ${bc} bits\n  conform-action transmit\n  exceed-action drop\n  violate-action drop`}
              </div>
            </div>
          )}

          {/* MQC Generator */}
          {tab === 'mqc' && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <h2 className="font-semibold">{t.mqcGen}</h2>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]"><label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t.interface}</label><input className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" value={ifName} onChange={e => setIfName(e.target.value)} /></div>
                <div className="flex-1 min-w-[200px]"><label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t.cir}</label><input type="number" className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" value={cir} onChange={e => setCir(Number(e.target.value))} /></div>
              </div>
              <button onClick={generateMqc} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
                <Sliders size={15} />{t.generateMqc}
              </button>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.mqcGen}</span>
                {config && (
                  <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    {copied ? t.copied : t.copy}
                  </button>
                )}
              </div>
              {config ? (
                <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-4 text-xs font-mono whitespace-pre overflow-x-auto leading-relaxed">{config}</pre>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-8 text-center text-sm text-zinc-400">{t.noConfig}</div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="font-semibold mb-3">{t.references}</h2>
            <ul className="space-y-1">
              {t.refList.map(ref => (
                <li key={ref} className="text-sm text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>{ref}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-orange-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
