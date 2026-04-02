'use client'

interface PaginationProps {
  totalItems: number
  currentPage: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
}

export default function Pagination({
  totalItems,
  currentPage,
  itemsPerPage = 10,
  onPageChange,
  isLoading
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // 0-based start index
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)

  function handlePageUpdate(newPage: number) {
    if (isLoading) return
    onPageChange?.(newPage)
  }

  return (
    <div className="flex items-center justify-end py-4 select-none">
      <div className="flex items-center gap-6 transition-all">
        <span className="text-[14px] font-bold text-slate-400 tracking-tight">
          <span className="text-slate-600">{totalItems === 0 ? 0 : currentPage}–{totalItems === 0 ? 0 : totalPages}</span>
          <span className="mx-1.5 text-slate-300 font-medium">of</span>
          <span className="text-slate-600">{totalItems === 0 ? 0 : totalPages}</span>
        </span>

        <div className="flex items-center gap-2 pl-4">
          <button
            onClick={() => handlePageUpdate(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-[#1a1f2e] disabled:opacity-20 disabled:hover:bg-transparent transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px] !font-black">chevron_left</span>
          </button>

          <button
            onClick={() => handlePageUpdate(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-[#1a1f2e] disabled:opacity-20 disabled:hover:bg-transparent transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px] !font-black">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  )
}