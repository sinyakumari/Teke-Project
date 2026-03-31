'use client'

import React, { useState, useEffect, useRef } from 'react'

interface PDFViewerProps {
  fileId: string
  className?: string
}

/**
 * Robust PDF Viewer that handles Google Drive Proxy with Blob URL caching.
 * Prevents redundant API calls and potential Google Drive quota issues.
 */
export default function PDFViewer({ fileId, className = "w-full h-full rounded-xl border border-slate-100 shadow-sm" }: PDFViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track current file ID to avoid race conditions during fast switching
  const currentFileId = useRef<string>(fileId)
  const blobUrlCache = useRef<string | null>(null)

  useEffect(() => {
    currentFileId.current = fileId
    
    async function loadPdf() {
      setLoading(true)
      setError(null)

      // 1. Revoke old blob URL if it exists
      if (blobUrlCache.current) {
        URL.revokeObjectURL(blobUrlCache.current)
        blobUrlCache.current = null
        setBlobUrl(null)
      }

      try {
        const response = await fetch(`/api/proxy/google-drive/${fileId}`)
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || `Failed to fetch PDF (Status: ${response.status})`)
        }

        const blob = await response.blob()
        
        // Ensure we're still on the same file after the fetch
        if (currentFileId.current === fileId) {
          const url = URL.createObjectURL(blob)
          blobUrlCache.current = url
          setBlobUrl(url)
        }
      } catch (err: any) {
        if (currentFileId.current === fileId) {
          console.error('[PDFViewer] Error:', err.message)
          setError(err.message)
        }
      } finally {
        if (currentFileId.current === fileId) {
          setLoading(false)
        }
      }
    }

    loadPdf()

    // Cleanup on unmount or fileId change
    return () => {
      if (blobUrlCache.current) {
        URL.revokeObjectURL(blobUrlCache.current)
        blobUrlCache.current = null
      }
    }
  }, [fileId])

  if (loading) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-slate-50 animate-pulse gap-3`}>
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Document...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-red-50 p-6 gap-3 text-center`}>
        <span className="material-symbols-outlined text-red-300 text-3xl">error_outline</span>
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Failed to Load PDF</p>
          <p className="text-[11px] text-red-400 font-medium leading-relaxed max-w-[200px] mx-auto">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-1.5 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <iframe
      src={`${blobUrl}#toolbar=0&navpanes=0`}
      className={className}
      title="PDF Document"
    />
  )
}
