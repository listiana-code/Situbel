import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Upload, Download, CalendarClock } from 'lucide-react';
import { formatDateIndo, formatTimeIndo } from '../lib/dateUtils';
import { prepareDocumentUpload } from '../lib/fileUtils';
import { downloadDocumentAsPdf } from '../lib/pdfDownloader';
import { getRoleDisplayLabel, getStatusLabel, getStatusTextClass } from '../lib/statusUtils';
import { generateId, Storage } from '../lib/storage';
import { Stepper } from './Stepper';
import { useToast } from './Toast';
import { RejectReasonModal } from './RejectReasonModal';
import type { PengajuanPerpanjangan, User } from '../types';

interface PerpanjanganDetailModalProps {
  item: PengajuanPerpanjangan | null;
  currentUser: User;
  onClose: () => void;
  onUpdated: () => void;
}

export const PerpanjanganDetailModal: React.FC<PerpanjanganDetailModalProps> = ({
  item,
  currentUser,
  onClose,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [nomorSk, setNomorSk] = useState('SK.PPJ/012/KP.03.02/XI/BSN-2026');
  const [tanggalSk, setTanggalSk] = useState(new Date().toISOString().slice(0, 10));
  const [tmtDisetujui, setTmtDisetujui] = useState(item?.tmt_selesai_usulan ?? '');
  const [skFile, setSkFile] = useState<File | null>(null);

  if (!item) return null;

  const isPimpinanAction =
    currentUser.role === 'pimpinan_unit' && item.status === 'menunggu_acc_pimpinan';
  const isAdminAction =
    (currentUser.role === 'admin_kepegawaian' || currentUser.role === 'super_admin') &&
    item.status === 'menunggu_acc_admin_pusat';
  const isKaBiroAction =
    currentUser.role === 'kepala_biro_kepegawaian' && item.status === 'menunggu_acc_kabiro';
  const isAdminUploadSk =
    (currentUser.role === 'admin_kepegawaian' || currentUser.role === 'super_admin') &&
    item.status === 'menunggu_upload_sk_perpanjangan';

  const handleApprove = () => {
    const now = new Date().toISOString();
    let nextStatus = item.status;
    let tahap = '';
    let notifRole: User['role'] | undefined;

    if (isPimpinanAction) {
      nextStatus = 'menunggu_acc_admin_pusat';
      tahap = 'Persetujuan Pimpinan Unit';
      notifRole = 'admin_kepegawaian';
    } else if (isAdminAction) {
      nextStatus = 'menunggu_acc_kabiro';
      tahap = 'Verifikasi Admin Kepegawaian Pusat';
      notifRole = 'kepala_biro_kepegawaian';
    } else if (isKaBiroAction) {
      nextStatus = 'menunggu_upload_sk_perpanjangan';
      tahap = 'Persetujuan Kepala Biro Kepegawaian';
      notifRole = 'admin_kepegawaian';
    }

    const updated: PengajuanPerpanjangan = {
      ...item,
      status: nextStatus,
      updated_at: now,
      riwayat_alur: [
        ...item.riwayat_alur,
        {
          id: generateId('r-ppj'),
          tahap,
          role: currentUser.role,
          actor_nama: currentUser.nama_lengkap,
          status: 'disetujui',
          catatan: 'Disetujui dan diteruskan ke tahap berikutnya.',
          timestamp: now,
        },
      ],
    };
    Storage.updatePerpanjangan(updated);
    Storage.addAuditLog({
      user: currentUser,
      aksi: `ACC Perpanjangan (${tahap})`,
      entitas: item.no_registrasi,
      detail: `Status berubah ke ${getStatusLabel(nextStatus)}.`,
    });
    if (notifRole) {
      Storage.addNotification({
        target_role: notifRole,
        judul: 'Usulan Perpanjangan Masa Belajar',
        pesan: `${item.no_registrasi} (${item.user_nama}) membutuhkan tindak lanjut.`,
        ref_type: 'perpanjangan',
        ref_id: item.id,
      });
    }
    showToast('success', 'Usulan perpanjangan disetujui', `Berlanjut ke tahap ${getStatusLabel(nextStatus)}.`);
    onUpdated();
    onClose();
  };

  const handleReject = (reason: string) => {
    const now = new Date().toISOString();
    const nextStatus = isPimpinanAction
      ? 'ditolak_pimpinan'
      : isAdminAction
      ? 'ditolak_admin'
      : 'ditolak_kabiro';
    const updated: PengajuanPerpanjangan = {
      ...item,
      status: nextStatus,
      updated_at: now,
      riwayat_alur: [
        ...item.riwayat_alur,
        {
          id: generateId('r-ppj'),
          tahap: `Penolakan (${getRoleDisplayLabel(currentUser.role)})`,
          role: currentUser.role,
          actor_nama: currentUser.nama_lengkap,
          status: 'ditolak',
          catatan: reason,
          timestamp: now,
        },
      ],
    };
    Storage.updatePerpanjangan(updated);
    Storage.addNotification({
      target_user_id: item.user_id,
      judul: 'Usulan Perpanjangan Ditolak',
      pesan: `${item.no_registrasi} ditolak oleh ${currentUser.nama_lengkap}: ${reason}`,
      ref_type: 'perpanjangan',
      ref_id: item.id,
    });
    showToast('warning', 'Usulan perpanjangan ditolak', reason);
    onUpdated();
    onClose();
  };

  const handlePublishSk = async (e: React.FormEvent) => {
    e.preventDefault();
    let fileNama = `SK_Perpanjangan_${item.no_registrasi.replace(/\//g, '_')}.pdf`;
    let fileUrl: string | undefined;
    if (skFile) {
      const up = await prepareDocumentUpload(skFile, {
        jenis: 'perpanjangan',
        nip: item.user_nip,
        nama: item.user_nama,
        noReg: item.no_registrasi,
      });
      fileNama = up.nama_file;
      fileUrl = up.file_url;
    }
    Storage.uploadSkPerpanjangan(item.id, {
      nomor_sk: nomorSk.trim(),
      tanggal_sk: tanggalSk,
      tmt_selesai_disetujui: tmtDisetujui || item.tmt_selesai_usulan,
      file_nama: fileNama,
      file_url: fileUrl,
      actor: currentUser,
    });
    showToast(
      'success',
      'SK Perpanjangan Terbit',
      `Masa studi induk ${item.no_reg_tb} otomatis diperpanjang +${item.tambahan_semester} semester.`
    );
    onUpdated();
    onClose();
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detail Perpanjangan ${item.no_registrasi}`}
        className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="h-1 w-full bg-[#C8102E] shrink-0" />
          <div className="bg-white flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-lg bg-[#FDF2F4] text-[#C8102E] border border-[#F5C6CE] flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-slate-900 truncate">
                  Perpanjangan Masa Belajar · {item.no_registrasi}
                </h3>
                <p className={`text-xs font-semibold mt-0.5 ${getStatusTextClass(item.status)}`}>
                  {getStatusLabel(item.status)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup detail perpanjangan"
              className="p-1.5 text-slate-500 hover:text-[#C8102E] hover:bg-[#FDF2F4] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain bg-[#ECEEF1]">
            <Stepper
              jenis="perpanjangan"
              currentStatus={item.status}
              riwayat={item.riwayat_alur}
            />

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Pemohon</p>
                <p className="font-semibold text-slate-900">{item.user_nama}</p>
                <p className="text-xs font-mono text-slate-500 tabular-nums">{item.user_nip}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Unit Kerja & No. TB Induk</p>
                <p className="font-medium text-slate-900">{item.unit_kerja_nama}</p>
                <p className="text-xs font-mono text-slate-500">{item.no_reg_tb}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Perguruan Tinggi & Program Studi</p>
                <p className="font-medium text-slate-900">{item.universitas_tujuan}</p>
                <p className="text-xs text-slate-600">{item.program_studi}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Usulan Perubahan TMT Selesai</p>
                <p className="font-mono text-xs text-slate-600 tabular-nums">
                  Lama: {formatDateIndo(item.tmt_selesai_lama)}
                </p>
                <p className="font-mono text-sm font-semibold text-orange-700 tabular-nums">
                  Usulan: {formatDateIndo(item.tmt_selesai_usulan)} (+{item.tambahan_semester} smt)
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-700 mb-1">Alasan Perpanjangan</p>
              <p className="text-sm text-slate-700 leading-relaxed">{item.alasan_perpanjangan}</p>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">Dokumen Pendukung</p>
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {item.dokumen.map((d) => (
                  <li key={d.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{d.nama_dokumen}</p>
                      <p className="font-mono text-slate-500 truncate">{d.nama_file}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        downloadDocumentAsPdf({
                          fileName: d.nama_file,
                          judulDokumen: d.nama_dokumen,
                          namaPegawai: item.user_nama,
                          nipPegawai: item.user_nip,
                          unitKerja: item.unit_kerja_nama,
                          universitas: item.universitas_tujuan,
                          programStudi: item.program_studi,
                          existingUrl: d.file_url,
                        })
                      }
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-orange-700 font-medium whitespace-nowrap shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {item.status === 'sk_perpanjangan_terbit' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-emerald-900">
                    SK Perpanjangan Terbit · {item.nomor_sk_perpanjangan}
                  </p>
                  <p className="text-emerald-800 mt-0.5 tabular-nums">
                    TMT Selesai Disetujui: {formatDateIndo(item.tmt_selesai_disetujui)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadDocumentAsPdf({
                      fileName: item.file_sk_perpanjangan_nama || 'SK_Perpanjangan.pdf',
                      judulDokumen: 'SURAT KEPUTUSAN PERPANJANGAN MASA TUGAS BELAJAR',
                      nomorSurat: item.nomor_sk_perpanjangan,
                      tanggalSurat: item.tanggal_sk_perpanjangan,
                      namaPegawai: item.user_nama,
                      nipPegawai: item.user_nip,
                      unitKerja: item.unit_kerja_nama,
                      universitas: item.universitas_tujuan,
                      programStudi: item.program_studi,
                      tmtMulai: item.tmt_selesai_lama,
                      tmtSelesai: item.tmt_selesai_disetujui,
                      existingUrl: item.file_sk_perpanjangan_url,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh SK Perpanjangan
                </button>
              </div>
            )}

            {isAdminUploadSk && (
              <form
                onSubmit={handlePublishSk}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3"
              >
                <p className="text-sm font-bold text-slate-900">
                  Penerbitan & Unggah SK Perpanjangan Masa Belajar
                </p>
                <p className="text-xs text-slate-600">
                  Saat SK diterbitkan, durasi semester dan TMT selesai pada data Tugas Belajar induk ({item.no_reg_tb}) akan diperbarui otomatis.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nomor SK</label>
                    <input
                      type="text"
                      required
                      value={nomorSk}
                      onChange={(e) => setNomorSk(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal SK</label>
                    <input
                      type="date"
                      required
                      value={tanggalSk}
                      onChange={(e) => setTanggalSk(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">TMT Selesai Baru</label>
                    <input
                      type="date"
                      required
                      value={tmtDisetujui || item.tmt_selesai_usulan}
                      onChange={(e) => setTmtDisetujui(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg bg-white cursor-pointer text-xs text-slate-700">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{skFile ? skFile.name : 'Unggah berkas SK Perpanjangan PDF (opsional — sistem dapat generate PDF resmi)'}</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={(e) => setSkFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap shrink-0"
                  >
                    Terbitkan SK Perpanjangan
                  </button>
                </div>
              </form>
            )}

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Log Kronologis Persetujuan (Tanggal & Jam WIB)
              </p>
              <ul className="divide-y divide-slate-100 text-xs">
                {[...item.riwayat_alur].reverse().map((r) => (
                  <li key={r.id} className="py-2.5 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{r.tahap}</p>
                      <p className="text-slate-500">
                        {r.actor_nama} ({getRoleDisplayLabel(r.role)})
                        {r.catatan ? ` · “${r.catatan}”` : ''}
                      </p>
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap shrink-0">
                      <p className="font-medium text-slate-700">{formatDateIndo(r.timestamp)}</p>
                      <p>{formatTimeIndo(r.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            </div>
          </div>

          {(isPimpinanAction || isAdminAction || isKaBiroAction) && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg whitespace-nowrap shrink-0"
              >
                <XCircle className="w-4 h-4" />
                Tolak Usulan
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                Setujui (ACC)
              </button>
            </div>
          )}
        </div>
      </div>

      <RejectReasonModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Tolak Usulan Perpanjangan"
        description="Alasan penolakan akan tercatat pada riwayat alur dan dikirimkan ke pegawai pemohon."
        onConfirm={handleReject}
      />
    </>
  );
};
