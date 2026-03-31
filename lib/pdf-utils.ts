'use client'

/**
 * Client-side PDF text extraction using pdf.js (lazy-loaded to avoid SSR crashes).
 * Falls back to Tesseract.js OCR if no selectable text is found.
 */

export async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  // Use specific build path for legacy/stable browser support
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  
  // Use locally hosted worker in /public
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  console.log('[PDF] Fetching document from:', pdfUrl)

  let pdf: any
  try {
    const loadingTask = pdfjs.getDocument(pdfUrl)
    pdf = await loadingTask.promise
  } catch (e: any) {
    console.error('[PDF] Failed to load pdf:', e.message)
    throw new Error(`Failed to load PDF: ${e.message}`)
  }

  console.log(`[PDF] Loaded. Pages: ${pdf.numPages}`)

  let fullText = ''
  let foundSelectableText = false

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()

    if (pageText.length > 5) {
      foundSelectableText = true
      fullText += pageText + '\n\n'
    } else {
      // OCR fallback for this page
      console.log(`[PDF] Page ${i} has no selectable text. Attempting OCR...`)
      try {
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = document.createElement('canvas')
        canvas.height = viewport.height
        canvas.width = viewport.width
        const context = canvas.getContext('2d')
        
        if (context) {
          await page.render({ canvasContext: context, viewport }).promise
          
          const Tesseract = (await import('tesseract.js')).default
          const result = await Tesseract.recognize(canvas, 'eng')
          const ocrText = result.data.text.trim()
          
          if (ocrText.length > 5) {
            console.log(`[OCR] Page ${i}: extracted ${ocrText.length} chars`)
            fullText += ocrText + '\n\n'
          }
        }
      } catch (ocrErr: any) {
        console.warn(`[OCR] Page ${i} OCR failed:`, ocrErr.message)
      }
    }
  }

  console.log(`[PDF] Total extracted: ${fullText.length} chars. Selectable text: ${foundSelectableText}`)
  return fullText.trim()
}
