import { useState } from 'react'
import api from '../utils/api'

async function extractTextFromPDF(file) {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = resolve; script.onerror = reject
      document.head.appendChild(script)
    })
  }
  const pdfjsLib = window.pdfjsLib
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items.map(item => item.str).join(' ') + '\n'
  }
  return fullText.trim()
}

async function exportAnswersToPDF(topic, type, questions) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = resolve; script.onerror = reject
      document.head.appendChild(script)
    })
  }
  const { jsPDF } = window.jspdf
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 18
  const maxWidth = pageWidth - margin * 2
  let y = 20
  const colors = { '2marks': [83,74,183], '5marks': [133,79,11], '10marks': [15,110,86] }
  const hc = colors[type] || [83,74,183]
  const typeLabel = { '2marks':'2 Mark','5marks':'5 Mark','10marks':'10 Mark' }[type]

  const write = (text, size, bold, color) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...(color || [30,30,30]))
    const lines = doc.splitTextToSize(String(text), maxWidth)
    lines.forEach(line => { if (y > 275) { doc.addPage(); y = 20 } doc.text(line, margin, y); y += size * 0.45 })
    y += 2
  }

  doc.setFillColor(...hc); doc.rect(0, 0, pageWidth, 42, 'F')
  doc.setFontSize(17); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255)
  doc.text(`${topic}`, margin, 20)
  doc.setFontSize(11); doc.setFont('helvetica','normal')
  doc.text(`${typeLabel} Answers · ${questions.length} Questions · Study Buddy`, margin, 33)
  y = 54

  let lastUnit = ''
  questions.forEach((q, i) => {
    if (q.unit && q.unit !== lastUnit) {
      if (y > 260) { doc.addPage(); y = 20 }
      lastUnit = q.unit
      doc.setFillColor(240,240,250); doc.rect(margin-2, y-5, maxWidth+4, 10, 'F')
      write(q.unit.toUpperCase(), 10, true, hc)
    }
    if (y > 255) { doc.addPage(); y = 20 }
    write(`Q${i+1}. ${q.question}`, 11, true, [30,30,30])
    if (typeof q.answer === 'string') {
      write(q.answer, 10, false, [60,60,60])
    } else {
      if (q.answer?.introduction) write(q.answer.introduction, 10, false, [60,60,60])
      q.answer?.points?.forEach(p => { write(p.heading, 10, true, hc); write(p.explanation, 10, false, [60,60,60]) })
      if (q.answer?.conclusion) { write('Conclusion:', 10, true, [80,80,80]); write(q.answer.conclusion, 10, false, [60,60,60]) }
    }
    y += 3; doc.setDrawColor(220,220,220)
    if (y < 275) { doc.line(margin, y, pageWidth-margin, y); y += 5 }
  })

  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160,160,160)
    doc.text(`Study Buddy · ${topic} · ${typeLabel} Answers · Page ${i}/${total}`, margin, 291)
  }
  doc.save(`${topic.replace(/\s+/g,'-')}-${type}-answers.pdf`)
}

const TABS = [
  { key: '2marks',  label: '2 Mark',  color: 'primary', desc: 'Short precise answers' },
  { key: '5marks',  label: '5 Mark',  color: 'amber',   desc: 'Structured answers' },
  { key: '10marks', label: '10 Mark', color: 'emerald', desc: 'Detailed essay answers' },
]
const tabStyles = {
  primary: { active: 'bg-primary-600 text-white', badge: 'bg-primary-50 text-primary-800', border: 'border-primary-400', btn: 'bg-primary-600 hover:bg-primary-800' },
  amber:   { active: 'bg-amber-500 text-white',   badge: 'bg-amber-50 text-amber-800',     border: 'border-amber-400',   btn: 'bg-amber-500 hover:bg-amber-700' },
  emerald: { active: 'bg-emerald-600 text-white', badge: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-800' },
}

export default function ExamPrep() {
  const [activeTab, setActiveTab]     = useState('2marks')
  const [text, setText]               = useState('')
  const [inputText, setInputText]     = useState('') // draft — not sent to API until confirmed
  const [pdfFile, setPdfFile]         = useState(null)
  const [extracting, setExtracting]   = useState(false)
  const [extractError, setExtractError] = useState('')
  const [dragOver, setDragOver]       = useState(false)
  const [ready, setReady]             = useState(false) // true only after user clicks Confirm
  const [results, setResults]         = useState({})
  const [loading, setLoading]         = useState({})
  const [exporting, setExporting]     = useState({})
  const [expanded, setExpanded]       = useState({})

  const tab   = TABS.find(t => t.key === activeTab)
  const style = tabStyles[tab.color]
  const result    = results[activeTab]
  const isLoading = loading[activeTab]

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') { alert('Please upload a PDF file.'); return }
    setPdfFile(file); setInputText(''); setText(''); setExtractError('')
    setReady(false); setResults({}); setExtracting(true)
    try {
      const extracted = await extractTextFromPDF(file)
      if (!extracted || extracted.length < 50) {
        setExtractError('Could not extract text from this PDF — it may be a scanned image. Please paste the questions below manually.')
        setPdfFile(null)
      } else {
        setInputText(extracted) // put in draft, not confirmed yet
      }
    } catch {
      setExtractError('PDF reading failed. Please paste your questions as text below.')
      setPdfFile(null)
    } finally { setExtracting(false) }
  }

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }

  // Only called when user explicitly clicks Confirm
  const confirmText = () => {
    if (!inputText.trim()) return
    setText(inputText)
    setReady(true)
    setResults({})
  }

  const reset = () => {
    setPdfFile(null); setInputText(''); setText('')
    setReady(false); setResults({}); setExtractError('')
  }

  const generate = async (type) => {
    if (!text.trim()) return
    setLoading(prev => ({ ...prev, [type]: true }))
    try {
      const { data } = await api.post('/qna/answers', { text, type })
      setResults(prev => ({ ...prev, [type]: data }))
      setExpanded(prev => ({ ...prev, [type]: new Set() }))
    } catch (err) {
      alert(err.response?.data?.message || 'Generation failed. Try again.')
    } finally { setLoading(prev => ({ ...prev, [type]: false })) }
  }

  const toggleExpand = (type, i) => {
    setExpanded(prev => {
      const cur = new Set(prev[type] || [])
      cur.has(i) ? cur.delete(i) : cur.add(i)
      return { ...prev, [type]: cur }
    })
  }

  const handleExport = async (type) => {
    const r = results[type]; if (!r) return
    setExporting(prev => ({ ...prev, [type]: true }))
    try { await exportAnswersToPDF(r.topic, type, r.questions) }
    catch { alert('Export failed.') }
    finally { setExporting(prev => ({ ...prev, [type]: false })) }
  }

  const expandedSet = expanded[activeTab] || new Set()

  // ── STEP 1: Upload / Paste ─────────────────────────────────────────────
  if (!ready) return (
    <div className="p-6 max-w-3xl page-enter">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Exam Prep</h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload your college question bank PDF — AI generates answers sorted by marks (2M, 5M, 10M).
        </p>
      </div>

      {/* Drop zone */}
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 text-center mb-5 cursor-pointer transition-colors
          ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
        <input type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {extracting
            ? <span className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            : <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <path d="M12 15V3M8 7l4-4 4 4" stroke="#534AB7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="#534AB7" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
          }
        </div>
        <p className="text-base font-medium text-gray-700">
          {extracting ? 'Reading PDF…'
            : pdfFile ? <>✓ <span className="text-primary-600">{pdfFile.name}</span> loaded</>
            : <>Drop your question bank PDF or <span className="text-primary-600">browse</span></>}
        </p>
        <p className="text-xs text-gray-400 mt-2">Text-based PDFs only · up to 20MB</p>
      </label>

      {extractError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-600 font-medium mb-1">⚠️ PDF extraction failed</p>
          <p className="text-xs text-red-500">{extractError}</p>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
        <div className="flex-1 h-px bg-gray-100" />
        or paste questions manually
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Textarea — draft only, nothing sent until Confirm */}
      <textarea
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        placeholder={`Paste your question bank text here…\n\nExample:\n1. Define Computer Networks? 2M\n2. Explain OSI Model in detail. 10M\n3. What is packet switching? 5M`}
        className="w-full min-h-[160px] px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-white resize-none"
      />
      <p className="text-xs text-gray-400 mt-1.5">
        {inputText.length > 0 ? `${inputText.length} characters typed — click Confirm when done` : 'Type or paste, then click Confirm to proceed'}
      </p>

      {/* Confirm button */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={confirmText}
          disabled={!inputText.trim() || extracting}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 flex items-center gap-2">
          Confirm & Continue →
        </button>
        {inputText && (
          <button onClick={() => { setInputText(''); setPdfFile(null); setExtractError('') }}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Clear
          </button>
        )}
      </div>
    </div>
  )

  // ── STEP 2: Generate answers ────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl page-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-xl font-semibold">Exam Prep</h1>
          <p className="text-sm text-gray-400 mt-0.5">{text.length} characters loaded · select mark type below</p>
        </div>
        <button onClick={reset}
          className="text-xs px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          ← Upload new file
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => {
          const s = tabStyles[t.color]
          const isActive = activeTab === t.key
          const hasResult = !!results[t.key]
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border
                ${isActive ? `${s.active} border-transparent shadow-sm` : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.label} Answers
              {hasResult && <span className="w-2 h-2 rounded-full bg-current opacity-70" />}
              {loading[t.key] && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            </button>
          )
        })}
      </div>

      {/* Generate prompt */}
      {!result && !isLoading && (
        <div className={`border-2 border-dashed ${style.border} rounded-2xl p-10 text-center mb-4`}>
          <p className="text-2xl mb-3">{tab.key === '2marks' ? '📝' : tab.key === '5marks' ? '📋' : '📄'}</p>
          <p className="text-base font-medium text-gray-700 mb-1">{tab.label} Answers</p>
          <p className="text-sm text-gray-400 mb-5">{tab.desc} — AI will extract all {tab.label} questions and write answers</p>
          <button onClick={() => generate(activeTab)}
            className={`px-6 py-2.5 ${style.btn} text-white text-sm font-medium rounded-lg transition-colors`}>
            ⚡ Generate {tab.label} Answers
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-6 mb-4">
          <span className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">Generating {tab.label} answers…</p>
            <p className="text-xs text-gray-400 mt-0.5">AI is reading all questions and writing answers</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="page-enter">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold">{result.topic}</h2>
              <p className="text-sm text-gray-400">{result.questions?.length} {tab.label} questions answered</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setExpanded(prev => ({ ...prev, [activeTab]: new Set(result.questions.map((_, i) => i)) }))}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Expand all</button>
              <button onClick={() => setExpanded(prev => ({ ...prev, [activeTab]: new Set() }))}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Collapse all</button>
              <button onClick={() => handleExport(activeTab)} disabled={exporting[activeTab]}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50">
                {exporting[activeTab]
                  ? <><span className="w-3 h-3 border border-gray-400 border-t-gray-700 rounded-full animate-spin" />Exporting…</>
                  : <><svg viewBox="0 0 15 15" fill="none" className="w-3 h-3"><path d="M7.5 10V2M4 7l3.5 3.5L11 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>Export PDF</>
                }
              </button>
              <button onClick={() => generate(activeTab)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Regenerate</button>
            </div>
          </div>

          <div className="space-y-2">
            {result.questions?.map((q, i) => {
              const isOpen = expandedSet.has(i)
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <button onClick={() => toggleExpand(activeTab, i)}
                    className="w-full flex items-start justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors gap-3">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${style.badge}`}>
                        {q.marks || tab.label.replace(' Mark','M')}
                      </span>
                      {q.unit && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">{q.unit}</span>
                      )}
                      <p className="text-sm font-medium text-gray-800 leading-snug">{q.question}</p>
                    </div>
                    <svg viewBox="0 0 15 15" fill="none"
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-0.5 ${isOpen ? 'rotate-180' : ''}`}>
                      <path d="M3 5l4.5 4.5L12 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-50">
                      {typeof q.answer === 'string' ? (
                        <p className="text-sm text-gray-600 leading-relaxed">{q.answer}</p>
                      ) : (
                        <div className="space-y-3">
                          {q.answer?.introduction && <p className="text-sm text-gray-600 leading-relaxed">{q.answer.introduction}</p>}
                          {q.answer?.points?.map((p, j) => (
                            <div key={j} className={`border-l-2 pl-3 ${tab.color === 'primary' ? 'border-primary-400' : tab.color === 'amber' ? 'border-amber-400' : 'border-emerald-400'}`}>
                              <p className={`text-xs font-bold mb-1 uppercase tracking-wide ${tab.color === 'primary' ? 'text-primary-700' : tab.color === 'amber' ? 'text-amber-700' : 'text-emerald-700'}`}>{p.heading}</p>
                              <p className="text-sm text-gray-600 leading-relaxed">{p.explanation}</p>
                            </div>
                          ))}
                          {q.answer?.conclusion && (
                            <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Conclusion</p>
                              <p className="text-sm text-gray-600 leading-relaxed">{q.answer.conclusion}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Suggest other mark types */}
          <div className="mt-5 flex gap-2 flex-wrap">
            {TABS.filter(t => t.key !== activeTab && !results[t.key]).map(t => (
              <button key={t.key} onClick={() => { setActiveTab(t.key); generate(t.key) }}
                className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${tabStyles[t.color].badge}`}>
                Also generate {t.label} answers →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
