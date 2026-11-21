import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface RejectReasonModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  submitLabel?: string;
  tone?: 'danger' | 'warning';
  onConfirm: (reason: string) => void;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  open,
  onClose,
  title,
  description,
  submitLabel = 'Konfirmasi Penolakan',
  tone = 'danger',
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 8) {
      setError('Mohon cantumkan alasan yang jelas (minimal 8 karakter).');
      return;
    }
    onConfirm(reason.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle
              className={`w-5 h-5 ${tone === 'danger' ? 'text-red-600' : 'text-amber-600'}`}
            />
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {description && <p className="text-xs text-slate-600 leading-relaxed">{description}</p>}
          <div>
            <label htmlFor="reject-reason-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alasan / Catatan Perbaikan Wajib
            </label>
            <textarea
              id="reject-reason-input"
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Tuliskan alasan spesifik atau poin berkas yang belum sesuai ketentuan..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none resize-none"
            />
            {error && <p className="text-xs text-red-700 mt-1.5">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                tone === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
