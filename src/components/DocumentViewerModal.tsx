import React, { useEffect } from 'react';
import { X, Download, FileText, ShieldCheck } from 'lucide-react';
import { downloadDocumentAsPdf, type OfficialPdfPayload } from '../lib/pdfDownloader';

interface DocumentViewerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fileName: string;
  fileUrl?: string;
  pdfPayload?: OfficialPdfPayload;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  open,
  onClose,
  title,
  fileName,
  fileUrl,
  pdfPayload,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isImage =
    fileUrl?.startsWith('data:image/') ||
    /\.(png|jpe?g|webp|gif)$/i.test(fileName);
  const isPdfUrl =
    fileUrl &&
    (fileUrl.startsWith('data:application/pdf') || fileUrl.startsWith('blob:'));

  const handleDownload = () => {
    if (pdfPayload) {
      downloadDocumentAsPdf({ ...pdfPayload, existingUrl: fileUrl });
      return;
    }
    downloadDocumentAsPdf({
      fileName,
      judulDokumen: title,
      namaPegawai: 'Pegawai BASARNAS',
      nipPegawai: '—',
      unitKerja: 'Badan Nasional Pencarian dan Pertolongan',
      existingUrl: fileUrl,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${title}`}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="h-1 w-full bg-[#C8102E] shrink-0" />
        <div className="bg-white flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 truncate">{title}</h3>
            <p className="text-xs font-mono text-slate-600 truncate mt-0.5">{fileName}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pratinjau"
              className="p-2 text-slate-500 hover:text-[#C8102E] hover:bg-[#FDF2F4] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-6 overscroll-contain">
          {isImage && fileUrl ? (
            <div className="flex justify-center">
              <img
                src={fileUrl}
                alt={title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] rounded-lg border border-slate-200 shadow-sm object-contain bg-white"
              />
            </div>
          ) : isPdfUrl ? (
            <iframe
              src={fileUrl}
              title={title}
              className="w-full h-[68vh] rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-slate-800">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <p className="text-xs font-bold tracking-wider text-slate-900">
                  BADAN NASIONAL PENCARIAN DAN PERTOLONGAN
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  BIRO KEPEGAWAIAN DAN ORGANISASI
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Jl. Angkasa Blok B.15 Kav. 2-3, Kemayoran, Jakarta Pusat 10720
                </p>
              </div>

              <div className="mt-6 text-center">
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  {pdfPayload?.judulDokumen || title}
                </h4>
                {pdfPayload?.nomorSurat && (
                  <p className="text-xs font-mono text-slate-600 mt-1">
                    Nomor: {pdfPayload.nomorSurat}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-2.5 text-sm">
                {pdfPayload ? (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500">Nama Pegawai</span>
                      <span className="col-span-2 font-medium text-slate-900">
                        : {pdfPayload.namaPegawai}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500">NIP</span>
                      <span className="col-span-2 font-mono text-slate-900 tabular-nums">
                        : {pdfPayload.nipPegawai}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500">Unit Kerja</span>
                      <span className="col-span-2 text-slate-900">: {pdfPayload.unitKerja}</span>
                    </div>
                    {pdfPayload.universitas && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500">Perguruan Tinggi</span>
                        <span className="col-span-2 text-slate-900">
                          : {pdfPayload.universitas}
                        </span>
                      </div>
                    )}
                    {pdfPayload.programStudi && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500">Program Studi</span>
                        <span className="col-span-2 text-slate-900">
                          : {pdfPayload.jenjang ? `${pdfPayload.jenjang} — ` : ''}
                          {pdfPayload.programStudi}
                        </span>
                      </div>
                    )}
                    {pdfPayload.digitalHash && (
                      <div className="mt-6 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/70 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                        <div className="text-xs">
                          <p className="font-semibold text-emerald-900">
                            Terverifikasi Tanda Tangan Elektronik BSrE — BSSN
                          </p>
                          <p className="font-mono text-emerald-800 mt-0.5">
                            Hash: {pdfPayload.digitalHash}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-6 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-800">{fileName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Klik tombol “Unduh PDF” di kanan atas untuk menghasilkan salinan berkas resmi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
