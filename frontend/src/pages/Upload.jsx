import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const subjects = ['Biology', 'Physics', 'Chemistry', 'Maths', 'Computer Science', 'History', 'English']

async function extractTextFromPDF(file) {
  // Use pdf.js from CDN directly — avoids version mismatch issues
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = resolve
      script.onerror = reject
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
    const pageText = content.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }

  return fullText.trim()
}

export default function Upload() {
  const [notes, setNotes] = useState('')
  const [subject, setSubject] = useState('Computer Science')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const navigate = useNavigate()

  const msgs = ['Analysing your notes…', 'Generating summary…', 'Creating quiz…', 'Building flashcards…']

  const startMsgs = () => {
    let i = 0
    setLoadingMsg(msgs[0])
    return setInterval(() => { if (++i < msgs.length) setLoadingMsg(msgs[i]) }, 2500)
  }

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file.')
      return
    }
    setPdfFile(file)
    setNotes('')
    setExtracting(true)
    try {
      const text = await extractTextFromPDF(file)
      if (!text || text.length < 30) {
        alert('Could not extract text from this PDF — it may be a scanned image. Please paste your notes as text instead.')
        setPdfFile(null)
      } else {
        setNotes(text)
      }
    } catch (err) {
      console.error('PDF error:', err)
      alert('PDF reading failed. Please paste your notes as text instead.')
      setPdfFile(null)
    } finally {
      setExtracting(false)
    }
  }

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }
  const onFileInput = (e) => handleFile(e.target.files[0])
  const removePdf = () => { setPdfFile(null); setNotes('') }

  const generate = async () => {
    if (!notes.trim()) return
    setLoading(true)
    const t = startMsgs()
    try {
      const { data } = await api.post('/notes/generate', { text: notes, subject })
      clearInterval(t)
      navigate(`/summary/${data._id}`)
    } catch (err) {
      clearInterval(t)
      alert(err.response?.data?.message || 'Generation failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-2xl page-enter">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Upload notes</h1>
        <p className="text-sm text-gray-400 mt-1">Upload a PDF or paste your notes — AI will generate a summary, quiz, and flashcards.</p>
      </div>

      {/* Drop zone */}
      {!pdfFile ? (
        <label
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center mb-4 cursor-pointer transition-colors
            ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
        >
          <input type="file" accept=".pdf" className="hidden" onChange={onFileInput} />
          <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            {extracting
              ? <span className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              : <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5">
                  <path d="M11 14V4M7 8l4-4 4 4" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 16v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            }
          </div>
          <p className="text-sm font-medium text-gray-700">
            {extracting ? 'Reading PDF…' : <>Drop your PDF here or <span className="text-primary-600">browse</span></>}
          </p>
          <p className="text-xs text-gray-400 mt-1">Text-based PDFs · up to 20MB</p>
        </label>
      ) : (
        <div className="flex items-center gap-3 border border-primary-200 bg-primary-50 rounded-2xl p-4 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <rect x="3" y="1" width="14" height="18" rx="2" stroke="#534AB7" strokeWidth="1.4"/>
              <path d="M7 6h6M7 10h4" stroke="#534AB7" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary-800 truncate">{pdfFile.name}</p>
            <p className="text-xs text-primary-500">
              {extracting ? 'Extracting text…' : `${notes.length} characters extracted ✓`}
            </p>
          </div>
          <button onClick={removePdf} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg viewBox="0 0 15 15" fill="none" className="w-4 h-4">
              <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
        <div className="flex-1 h-px bg-gray-100" />
        {pdfFile ? 'extracted text (editable)' : 'or paste notes directly'}
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Textarea */}
      <textarea
        value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Paste your study notes here… or upload a PDF above and text will appear here automatically."
        className="w-full min-h-[140px] px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-white resize-none"
      />

      {/* Subject tags */}
      <div className="mt-3">
        <p className="text-xs text-gray-400 mb-2">Subject</p>
        <div className="flex flex-wrap gap-2">
          {subjects.map(s => (
            <button key={s} onClick={() => setSubject(s)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors
                ${subject === s
                  ? 'bg-primary-50 border-primary-200 text-primary-800 font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-5">
        <button onClick={generate} disabled={loading || !notes.trim()}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading
            ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{loadingMsg}</>
            : '⚡ Generate with AI'}
        </button>
        {pdfFile && (
          <button onClick={removePdf} className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Clear PDF
          </button>
        )}
        <p className="text-xs text-gray-400 ml-auto">Generates summary, quiz & flashcards</p>
      </div>
    </div>
  )
}
