'use client'

import { useState, useRef, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'

// Removed top-level pdfjs import to prevent Server-Side Rendering crashes during build.
// Local dynamic import is used inside the component instead.

interface ExtractedTask {
  id: string
  text: string
  page: number
}

function ExtractorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlTrainingId = searchParams.get('training_id')
  
  const trainings = useAppStore(state => state.trainings)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [pdfjsLib, setPdfjsLib] = useState<any>(null)

  useEffect(() => {
    // Dynamically load pdfjs only on the client
    const loadPdfjs = async () => {
      try {
        const mod = await import('pdfjs-dist')
        // @ts-ignore
        mod.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.version}/build/pdf.worker.min.mjs`
        setPdfjsLib(mod)
      } catch (err) {
        console.error('Failed to load pdfjs-dist:', err)
      }
    }
    loadPdfjs()
  }, [])

  const [selectedTrainingId, setSelectedTrainingId] = useState(urlTrainingId || '')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [tasks, setTasks] = useState<ExtractedTask[]>([])
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a valid PDF file.')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError('')
      setTasks([])
    }
  }

  const extractTasks = async () => {
    if (!file) return

    setLoading(true)
    setError('')
    setTasks([])
    setProgress(0)

    try {
      if (!pdfjsLib) throw new Error('PDF library not yet loaded')
      
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      
      const foundTasks: ExtractedTask[] = []
      const numPages = pdf.numPages

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        // Extract lines
        const lines: string[] = []
        let currentLine = ''
        let lastY = -1

        for (const item of textContent.items as any[]) {
          if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
            lines.push(currentLine.trim())
            currentLine = ''
          }
          currentLine += item.str + ' '
          lastY = item.transform[5]
        }
        lines.push(currentLine.trim())

        // Detection logic: Only look for lines strictly starting with "TASK" or "Task"
        lines.forEach((line) => {
          const trimmed = line.trim();
          
          // First, strip leading numbers or bullets to see the raw sentence start
          const noBulletText = trimmed.replace(/^(\(\d+\)|\d+[\.)]|\d+\s+|[-•*])\s*/, '').trim();
          
          // Strictly check if the line STARTS with "Task" or "TASK"
          if (/^task\b/i.test(noBulletText)) {
            
            // Strip the "TASK :" or "Task - " prefix from the actual text using regex
            let finalText = noBulletText.replace(/^task\s*[:-]?\s*/i, '').trim();
            
            // Strip anything inside parentheses () or square brackets []
            finalText = finalText.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
            
            // Cleanup double spaces from stripped content
            finalText = finalText.replace(/\s{2,}/g, ' ').trim();
            
            if (finalText) {
              foundTasks.push({
                id: Math.random().toString(36).substr(2, 9),
                text: finalText,
                page: i
              })
            }
          }
        })

        setProgress(Math.round((i / numPages) * 100))
      }

      setTasks(foundTasks)
      if (foundTasks.length === 0) {
        setError('No lines containing "TASK" were found in this PDF.')
      }
    } catch (err) {
      console.error('Extraction error:', err)
      setError('Failed to extract text from PDF. Ensure it is a text-based PDF.')
    } finally {
      setLoading(false)
    }
  }

  const confirmExtractedTasks = async () => {
    if (tasks.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const tasksToCreate = tasks.map(t => {
        const payload: any = {
          name: t.text,
          status: 'pending'
        }
        // Only attach training_id if it exists and is a valid string, preventing empty string UUID errors
        if (selectedTrainingId && selectedTrainingId.trim() !== '') {
          payload.training_id = selectedTrainingId
        }
        return payload
      });

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasksToCreate)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save tasks');
      }

      // If urlTrainingId exists, they came directly from a training context
      // Navigate them back to the main trainings page. Otherwise, back to tasks.
      router.push(urlTrainingId ? '/trainings' : '/tasks');
      router.refresh();
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err?.message || 'Failed to save extracted tasks to the database.');
    } finally {
      setLoading(false);
    }
  }

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-1 pb-32 lg:px-6 lg:pt-3">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#1a1f2e] tracking-tight">Task Extractor</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">
              {urlTrainingId ? 'Extracting tasks for current training' : 'Upload PDF to auto-detect tasks'}
            </p>
          </div>
        </div>

        {/* Training Selection (If coming from main tasks page) */}
        {!urlTrainingId && (
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Training Course *</label>
            <select
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold text-[#1a1f2e] focus:border-[#1a1f2e] focus:ring-0 transition-all outline-none"
            >
              <option value="" disabled>Select a training to attach tasks to...</option>
              {trainings.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
              file ? 'border-green-400 bg-green-50/20' : 'border-slate-200 hover:border-[#1a1f2e] hover:bg-slate-50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf"
            />
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 transition-all ${
              file ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'
            }`}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <p className="text-[#1a1f2e] font-bold text-lg mb-1">
              {file ? file.name : 'Choose Syllabus PDF'}
            </p>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Only standard text-based PDFs supported'}
            </p>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-500 text-sm font-bold">{error}</p>
            </div>
          )}

          <button
            onClick={extractTasks}
            disabled={!file || !selectedTrainingId || loading}
            className={`w-full mt-6 py-4 rounded-2xl font-semibold text-sm uppercase tracking-widest transition-all ${
              !file || !selectedTrainingId || loading 
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                : 'bg-[#1a1f2e] text-white shadow-xl shadow-slate-200 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing {progress}%
              </div>
            ) : 'Start Extraction'}
          </button>
        </div>

        {/* Results Area */}
        {tasks.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a1f2e]">Detected Tasks</h2>
              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setTasks([])}
                   className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors"
                 >
                   Clear
                 </button>
                 <span className="bg-[#1a1f2e] text-white px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest">
                  {tasks.length} FOUND
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className="bg-white rounded-3xl border border-slate-50 shadow-sm p-6 hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#1a1f2e] group-hover:w-2 transition-all" />
                  <div className="flex items-start gap-4 pr-12">
                    <div className="bg-slate-50 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-400">
                      P{task.page}
                    </div>
                    <p className="text-[#1a1f2e] text-sm font-bold leading-relaxed">{task.text}</p>
                  </div>
                  
                  <button 
                    onClick={() => removeTask(task.id)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 p-2 bg-slate-50 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center">
              <button 
                onClick={confirmExtractedTasks}
                disabled={loading}
                className="bg-green-500 text-white px-12 py-4 rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] shadow-lg shadow-green-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>CONFIRM EXTRACTED TASKS ✓</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PdfTaskExtractorPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7]">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1a1f2e] border-t-transparent rounded-full animate-spin" /></div>}>
        <ExtractorContent />
      </Suspense>
    </div>
  )
}
