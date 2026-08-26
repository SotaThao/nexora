import React from 'react'
import { Rocket, CheckCircle2, Archive, Globe, Save, Eye } from 'lucide-react'
import { MerchantSiteStatus } from '../../../../constants/merchantSiteStatus'

interface SitePublishBarProps {
  status: MerchantSiteStatus
  isSaving: boolean
  isDirty?: boolean
  onSave: () => void
  onPreview: () => void
  onPublish: () => void
  onArchive: () => void
}

export const SitePublishBar: React.FC<SitePublishBarProps> = ({
  status,
  isSaving,
  isDirty,
  onSave,
  onPreview,
  onPublish,
  onArchive
}) => {
  const isPublished = status === MerchantSiteStatus.Published

  return (
    <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl gap-4">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {isPublished ? 'Website Đang Trực Tuyến' : 'Bản Nháp (Draft)'}
        </span>
        {isDirty && (
          <span className="text-[11px] text-amber-600 font-semibold hidden md:inline">
            ● Có thay đổi chưa lưu
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isDirty
              ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300 hover:bg-indigo-100'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
        </button>

        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md active:scale-95"
        >
          <Eye className="w-4 h-4 text-amber-400" />
          <span>Xem Trước Website</span>
        </button>

        {isPublished ? (
          <button
            type="button"
            onClick={onArchive}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            <Archive className="w-4 h-4" />
            <span>Tạm Ẩn Website</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPublish}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-transform active:scale-95"
          >
            <Rocket className="w-4 h-4" />
            <span>Xuất Bản Website Ngay</span>
          </button>
        )}
      </div>
    </div>
  )
}
