import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, KeyRound, FileSignature } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DigitalSignModalProps {
  open: boolean;
  onClose: () => void;
  signerName: string;
  signerJabatan: string;
  documentTitle: string;
  documentNumber: string;
  onConfirmSign: (payload: { hash: string; catatan: string }) => void;
}

function generateBsreHash(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  return `DS-BSN-${hex}`;
}

export const DigitalSignModal: React.FC<DigitalSignModalProps> = ({
  open,
  onClose,
  signerName,
  signerJabatan,
  documentTitle,
  documentNumber,
  onConfirmSign,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [catatan, setCatatan] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPassphrase('');
      setCatatan('');
      setAgreed(false);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Anda harus menyetujui pernyataan pertanggungjawaban penandatanganan elektronik.');
      return;
    }
    if (passphrase.trim().length < 4) {
      setError('Masukkan passphrase sertifikat elektronik minimal 4 karakter.');
      return;
    }
    const hash = generateBsreHash();
    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.65 },
      });
    } catch {
      // ignore in headless contexts
    }
    onConfirmSign({ hash, catatan: catatan.trim() });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Penandatanganan Elektronik BSrE"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="h-1 w-full bg-[#C8102E]" />
        <div className="bg-white flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#C8102E]" />
            <h3 className="text-base font-extrabold text-slate-900">
              Tanda Tangan Elektronik (BSrE — BSSN)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 text-slate-500 hover:text-[#C8102E] hover:bg-[#FDF2F4] rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Dokumen</span>
              <span className="font-semibold text-slate-900 text-right">{documentTitle}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Nomor SK</span>
              <span className="font-mono text-slate-900">{documentNumber}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Pejabat Penandatangan</span>
              <span className="font-semibold text-slate-900 text-right">{signerName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Jabatan</span>
              <span className="text-slate-700 text-right">{signerJabatan}</span>
            </div>
          </div>

          <div>
            <label htmlFor="bsre-passphrase" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Passphrase Sertifikat Elektronik (Simulasi BSrE)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="bsre-passphrase"
                type="password"
                autoComplete="off"
                value={passphrase}
                onChange={(e) => {
                  setPassphrase(e.target.value);
                  setError('');
                }}
                placeholder="Masukkan passphrase BSrE Anda (contoh: bsre2026)"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bsre-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Penandatanganan (Opsional)
            </label>
            <textarea
              id="bsre-notes"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Disetujui sesuai ketentuan Perka Basarnas No. 10/2024."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none resize-none"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                setError('');
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              Saya menyatakan telah memeriksa kelengkapan draft SK Tugas Belajar ini dan membubuhkan tanda tangan elektronik secara sah menggunakan kode hash sertifikat elektronik BSrE.
            </span>
          </label>

          {error && <p className="text-xs font-medium text-red-700">{error}</p>}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FileSignature className="w-4 h-4" />
              Tandatangani Digital
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
