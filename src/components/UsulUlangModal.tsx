import React, { useState } from 'react';
import { X, RotateCcw, Upload } from 'lucide-react';
import { prepareDocumentUpload } from '../lib/fileUtils';
import { getUsulUlangQuota, type RejectionInfo } from '../lib/statusUtils';
import type { DokumenItem, User } from '../types';

interface UsulUlangModalProps {
  open: boolean;
  onClose: () => void;
  noRegistrasi: string;
  jenisLabel: string;
  usedCount: number;
  maxAllowed: number;
  rejectionInfo: RejectionInfo | null;
  currentUser: User;
  onSubmitResubmission: (payload: { catatanPerbaikan: string; newDoc?: DokumenItem }) => void;
}

export const UsulUlangModal: React.FC<UsulUlangModalProps> = ({
  open,
  onClose,
  noRegistrasi,
  jenisLabel,
  usedCount,
  maxAllowed,
  rejectionInfo,
  currentUser,
  onSubmitResubmission,
}) => {
  const [catatan, setCatatan] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const quota = getUsulUlangQuota(usedCount, maxAllowed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quota.canResubmit) {
      setError('Kuota usul ulang telah habis.');
      return;
    }
    if (catatan.trim().length < 10) {
      setError('Jelaskan poin perbaikan yang telah dilakukan minimal 10 karakter.');
      return;
    }
    setSubmitting(true);
    try {
      let newDoc: DokumenItem | undefined;
      if (file) {
        const uploaded = await prepareDocumentUpload(file, {
          jenis: jenisLabel,
          nip: currentUser.nip,
          nama: currentUser.nama_lengkap,
          noReg: noRegistrasi,
        });
        newDoc = {
          id: `doc-rev-${Date.now()}`,
          kode_dokumen: 'BERKAS_PERBAIKAN',
          nama_dokumen: `Berkas Perbaikan Usul Ulang ke-${usedCount + 1}`,
          nama_file: uploaded.nama_file,
          file_url: uploaded.file_url,
          google_drive_file_id: uploaded.google_drive_file_id,
          google_drive_path: uploaded.google_drive_path,
          ukuran_mb: uploaded.ukuran_mb,
          uploaded_at: new Date().toISOString(),
          status_verifikasi: 'pending',
        };
      }
      onSubmitResubmission({ catatanPerbaikan: catatan.trim(), newDoc });
      setCatatan('');
      setFile(null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Usul Ulang Pengajuan"
      className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Ajukan Usul Ulang</h3>
              <p className="text-xs font-mono text-slate-500">
                {noRegistrasi} · Sisa kuota {quota.remaining} dari {quota.max}
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {rejectionInfo && (
            <div className="rounded-lg border border-red-200 bg-red-50/70 p-3.5 text-xs space-y-1">
              <p className="font-semibold text-red-900">
                Catatan Penolakan Sebelumnya ({rejectionInfo.roleLabel} — {rejectionInfo.rejectedBy})
              </p>
              <p className="text-red-800 leading-relaxed">{rejectionInfo.reason}</p>
            </div>
          )}

          <div>
            <label htmlFor="usul-ulang-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Perbaikan Pegawai
            </label>
            <textarea
              id="usul-ulang-notes"
              rows={3}
              value={catatan}
              onChange={(e) => {
                setCatatan(e.target.value);
                setError('');
              }}
              placeholder="Uraikan dokumen atau data yang telah diperbaiki sesuai catatan verifikator..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Unggah Berkas Perbaikan (PDF/JPG/DOCX — Opsional)
            </label>
            <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 transition-colors">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{file ? file.name : 'Pilih berkas perbaikan yang telah diperbarui'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {error && <p className="text-xs font-medium text-red-700">{error}</p>}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || !quota.canResubmit}
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {submitting ? 'Memproses...' : 'Kirim Usul Ulang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
