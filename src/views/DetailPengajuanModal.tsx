import React, { useMemo, useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  FileSignature,
  Upload,
  ShieldCheck,
  Award,
  Send,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDateIndo, formatDateTimeIndo } from '../lib/dateUtils';
import { prepareDocumentUpload } from '../lib/fileUtils';
import { downloadDocumentAsPdf } from '../lib/pdfDownloader';
import {
  getRejectionInfo,
  getRoleDisplayLabel,
  getStatusLabel,
  getStatusTextClass,
  isRejectedStatus,
} from '../lib/statusUtils';
import { generateId, Storage } from '../lib/storage';
import { DigitalSignModal } from '../components/DigitalSignModal';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { RejectReasonModal } from '../components/RejectReasonModal';
import { RiwayatDetailPanel, type PreviewRequest } from '../components/RiwayatDetailPanel';
import { useToast } from '../components/Toast';
import { UsulUlangBadge, UsulUlangNotice } from '../components/UsulUlangBadge';
import { UsulUlangModal } from '../components/UsulUlangModal';
import type {
  DocVerificationStatus,
  DokumenItem,
  DossierTarget,
  KelengkapanSK,
  PengajuanPencantumanGelar,
  PengajuanRekomendasi,
  PengajuanTugasBelajar,
  User,
} from '../types';

interface DetailPengajuanModalProps {
  target: DossierTarget | null;
  currentUser: User;
  onClose: () => void;
  onUpdated: () => void;
}

export const DetailPengajuanModal: React.FC<DetailPengajuanModalProps> = ({
  target,
  currentUser,
  onClose,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const [viewer, setViewer] = useState<PreviewRequest | null>(null);
  const [rejectConfig, setRejectConfig] = useState<{
    title: string;
    description: string;
    submitLabel: string;
    tone: 'danger' | 'warning';
    handler: (reason: string) => void;
  } | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [usulUlangOpen, setUsulUlangOpen] = useState(false);

  // Rekomendasi Publish Form
  const [noSuratRek, setNoSuratRek] = useState('B/218/KP.03.02/XI/BSN-2026');
  const [tglSuratRek, setTglSuratRek] = useState(new Date().toISOString().slice(0, 10));
  const [fileRek, setFileRek] = useState<File | null>(null);

  // Dynamic SK Form
  const [skNomor, setSkNomor] = useState('SK.059/KP.03.02/XI/BSN-2026');
  const [skTanggal, setSkTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [skSponsor, setSkSponsor] = useState('BASARNAS / Lembaga Penyelenggara Beasiswa');
  const [skKewajiban, setSkKewajiban] = useState(
    'Wajib melaporkan progres bulanan, KHS per semester, dan melaksanakan ikatan dinas 2n sesuai Perka Basarnas No. 10/2024.'
  );
  const [skFile, setSkFile] = useState<File | null>(null);

  // Pegawai: Surat Kampus & Perjanjian Beasiswa
  const [kampusFile, setKampusFile] = useState<File | null>(null);
  const [noPerjanjian, setNoPerjanjian] = useState('PRJ/042/BSN/XI/2026');
  const [perjanjianFile, setPerjanjianFile] = useState<File | null>(null);

  // Admin: Pencantuman Gelar SIASN / BKN
  const [periodeSiasn, setPeriodeSiasn] = useState('Periode Desember 2026');
  const [nomorPertek, setNomorPertek] = useState('AA-21004000812/BKN/2026');
  const [catatanBkn, setCatatanBkn] = useState('');

  const workflowSteps = useMemo(() => Storage.getWorkflowSteps(), []);
  const sistemCfg = useMemo(() => Storage.getPengaturanSistem(), []);
  const units = useMemo(() => Storage.getUnitKerja(), []);

  if (!target) return null;

  const rek: PengajuanRekomendasi | undefined =
    target.type === 'rekomendasi'
      ? Storage.getRekomendasi().find((r) => r.id === target.id)
      : undefined;
  const tb: PengajuanTugasBelajar | undefined =
    target.type === 'tugas_belajar'
      ? Storage.getPengajuanTB().find((t) => t.id === target.id)
      : undefined;
  const pg: PengajuanPencantumanGelar | undefined =
    target.type === 'pencantuman_gelar'
      ? Storage.getPencantumanGelar().find((p) => p.id === target.id)
      : undefined;

  const record = rek || tb || pg;
  if (!record) return null;

  const isAdminPusat =
    currentUser.role === 'admin_kepegawaian' || currentUser.role === 'super_admin';
  const isOwner = record.user_id === currentUser.id;
  const isUnitDaerah = Boolean(
    units.find((u) => u.id === record.unit_kerja_id)?.is_daerah
  );

  const stepperJenis: 'rekomendasi' | 'beasiswa' | 'mandiri' | 'pencantuman_gelar' =
    target.type === 'rekomendasi'
      ? 'rekomendasi'
      : target.type === 'pencantuman_gelar'
      ? 'pencantuman_gelar'
      : tb?.jenis === 'mandiri'
      ? 'mandiri'
      : 'beasiswa';

  const rejectionInfo = isRejectedStatus(record.status)
    ? getRejectionInfo(record.riwayat_alur)
    : null;

  const refresh = () => {
    onUpdated();
  };

  // ---- Toggle document checklist (Admin Pusat) ----
  const handleToggleDocumentCheck = (docId: string, nextStatus: DocVerificationStatus) => {
    if (!isAdminPusat) return;
    if (rek) {
      Storage.updateRekomendasi({
        ...rek,
        dokumen: rek.dokumen.map((d) =>
          d.id === docId ? { ...d, status_verifikasi: nextStatus } : d
        ),
        updated_at: new Date().toISOString(),
      });
    } else if (tb) {
      Storage.updatePengajuanTB({
        ...tb,
        dokumen: tb.dokumen.map((d) =>
          d.id === docId ? { ...d, status_verifikasi: nextStatus } : d
        ),
        updated_at: new Date().toISOString(),
      });
    } else if (pg) {
      Storage.updatePencantumanGelar({
        ...pg,
        dokumen: pg.dokumen.map((d) =>
          d.id === docId ? { ...d, status_verifikasi: nextStatus } : d
        ),
        updated_at: new Date().toISOString(),
      });
    }
    showToast('info', 'Status berkas diperbarui', `Ceklis dokumen diubah menjadi ${nextStatus.toUpperCase()}.`);
    refresh();
  };

  // ---- Rekomendasi Transition Helper ----
  const updateRekStatus = (
    nextStatus: PengajuanRekomendasi['status'],
    tahap: string,
    logStatus: 'disetujui' | 'ditolak' | 'dikembalikan' | 'diproses' | 'terbit',
    catatan?: string,
    notif?: { role?: User['role']; userId?: string; unitId?: string; judul: string; pesan: string }
  ) => {
    if (!rek) return;
    const now = new Date().toISOString();
    Storage.updateRekomendasi({
      ...rek,
      status: nextStatus,
      catatan_pimpinan:
        currentUser.role === 'pimpinan_unit' ? catatan ?? rek.catatan_pimpinan : rek.catatan_pimpinan,
      catatan_admin_daerah:
        currentUser.role === 'admin_daerah' ? catatan ?? rek.catatan_admin_daerah : rek.catatan_admin_daerah,
      catatan_admin: isAdminPusat ? catatan ?? rek.catatan_admin : rek.catatan_admin,
      catatan_kabi:
        currentUser.role === 'kepala_biro_kepegawaian' ? catatan ?? rek.catatan_kabi : rek.catatan_kabi,
      updated_at: now,
      riwayat_alur: [
        ...rek.riwayat_alur,
        {
          id: generateId('r-rek'),
          tahap,
          role: currentUser.role,
          actor_nama: currentUser.nama_lengkap,
          status: logStatus,
          catatan,
          timestamp: now,
        },
      ],
    });
    Storage.addAuditLog({
      user: currentUser,
      aksi: tahap,
      entitas: rek.no_registrasi,
      detail: catatan || `Status berubah menjadi ${getStatusLabel(nextStatus)}.`,
    });
    if (notif) {
      Storage.addNotification({
        target_role: notif.role,
        target_user_id: notif.userId,
        target_unit_id: notif.unitId,
        judul: notif.judul,
        pesan: notif.pesan,
        ref_type: 'rekomendasi',
        ref_id: rek.id,
      });
    }
    showToast(
      logStatus === 'ditolak' ? 'warning' : 'success',
      tahap,
      `Status kini: ${getStatusLabel(nextStatus)}`
    );
    refresh();
  };

  // ---- Tugas Belajar Transition Helper ----
  const updateTbStatus = (
    nextStatus: PengajuanTugasBelajar['status'],
    tahap: string,
    logStatus: 'disetujui' | 'ditolak' | 'dikembalikan' | 'diproses' | 'terbit',
    catatan?: string,
    extra?: Partial<PengajuanTugasBelajar>,
    notif?: { role?: User['role']; userId?: string; unitId?: string; judul: string; pesan: string }
  ) => {
    if (!tb) return;
    const now = new Date().toISOString();
    Storage.updatePengajuanTB({
      ...tb,
      ...extra,
      status: nextStatus,
      updated_at: now,
      riwayat_alur: [
        ...tb.riwayat_alur,
        {
          id: generateId('r-tb'),
          tahap,
          role: currentUser.role,
          actor_nama: currentUser.nama_lengkap,
          status: logStatus,
          catatan,
          timestamp: now,
        },
      ],
    });
    Storage.addAuditLog({
      user: currentUser,
      aksi: tahap,
      entitas: tb.no_registrasi,
      detail: catatan || `Status berubah menjadi ${getStatusLabel(nextStatus)}.`,
    });
    if (notif) {
      Storage.addNotification({
        target_role: notif.role,
        target_user_id: notif.userId,
        target_unit_id: notif.unitId,
        judul: notif.judul,
        pesan: notif.pesan,
        ref_type: tb.jenis,
        ref_id: tb.id,
      });
    }
    showToast(
      logStatus === 'ditolak' ? 'warning' : 'success',
      tahap,
      `Status kini: ${getStatusLabel(nextStatus)}`
    );
    refresh();
  };

  // ---- Pencantuman Gelar Transition Helper ----
  const updatePgStatus = (
    nextStatus: PengajuanPencantumanGelar['status'],
    tahap: string,
    logStatus: 'disetujui' | 'ditolak' | 'dikembalikan' | 'diproses' | 'terbit',
    catatan?: string,
    extra?: Partial<PengajuanPencantumanGelar>
  ) => {
    if (!pg) return;
    const now = new Date().toISOString();
    Storage.updatePencantumanGelar({
      ...pg,
      ...extra,
      status: nextStatus,
      updated_at: now,
      riwayat_alur: [
        ...pg.riwayat_alur,
        {
          id: generateId('r-pg'),
          tahap,
          role: currentUser.role,
          actor_nama: currentUser.nama_lengkap,
          status: logStatus,
          catatan,
          timestamp: now,
        },
      ],
    });
    Storage.addAuditLog({
      user: currentUser,
      aksi: tahap,
      entitas: pg.no_registrasi,
      detail: catatan || `Status berubah menjadi ${getStatusLabel(nextStatus)}.`,
    });
    Storage.addNotification({
      target_user_id: pg.user_id,
      judul: `Update Pencantuman Gelar ${pg.no_registrasi}`,
      pesan: `${tahap}: ${getStatusLabel(nextStatus)}.`,
      ref_type: 'pencantuman_gelar',
      ref_id: pg.id,
    });
    if (nextStatus === 'ms') {
      try {
        confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
      } catch {
        // ignore
      }
    }
    showToast(
      logStatus === 'ditolak' ? 'warning' : 'success',
      tahap,
      `Status kini: ${getStatusLabel(nextStatus)}`
    );
    refresh();
  };

  // ---- Specific Publish / Upload Handlers ----
  const handleAdminPublishRekomendasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rek) return;
    let fileNama = `Surat_Rekomendasi_${rek.no_registrasi.replace(/\//g, '_')}.pdf`;
    let fileUrl: string | undefined;
    if (fileRek) {
      const up = await prepareDocumentUpload(fileRek, {
        jenis: 'rekomendasi',
        nip: rek.user_nip,
        nama: rek.user_nama,
        noReg: rek.no_registrasi,
      });
      fileNama = up.nama_file;
      fileUrl = up.file_url;
    }
    const now = new Date().toISOString();
    Storage.updateRekomendasi({
      ...rek,
      status: 'rekomendasi_terbit',
      nomor_surat_rekomendasi: noSuratRek.trim(),
      tanggal_terbit_rekomendasi: tglSuratRek,
      file_rekomendasi_nama: fileNama,
      file_rekomendasi_url: fileUrl,
      diunggah_oleh_admin_nama: currentUser.nama_lengkap,
      updated_at: now,
      riwayat_alur: [
        ...rek.riwayat_alur,
        {
          id: generateId('r-rek'),
          tahap: 'Penerbitan & Upload Surat Rekomendasi',
          role: currentUser.role,
          actor_nama: currentUser.nama_lengkap,
          status: 'terbit',
          catatan: `Surat Rekomendasi No. ${noSuratRek.trim()} diterbitkan.`,
          timestamp: now,
        },
      ],
    });
    Storage.addAuditLog({
      user: currentUser,
      aksi: 'Terbitkan Surat Rekomendasi',
      entitas: rek.no_registrasi,
      detail: `Nomor ${noSuratRek.trim()} diterbitkan untuk ${rek.user_nama}.`,
    });
    Storage.addNotification({
      target_user_id: rek.user_id,
      judul: 'Surat Rekomendasi Resmi Terbit',
      pesan: `Surat Rekomendasi ${rek.no_registrasi} (${noSuratRek.trim()}) telah terbit dan siap diunduh.`,
      ref_type: 'rekomendasi',
      ref_id: rek.id,
    });
    showToast('success', 'Surat Rekomendasi Terbit', `Nomor ${noSuratRek.trim()} tersedia untuk diunduh pegawai.`);
    refresh();
  };

  const handleAdminSaveAndUploadSK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tb) return;
    let fileNama = `Draft_SK_${tb.jenis.toUpperCase()}_${tb.no_registrasi.replace(/\//g, '_')}.pdf`;
    let fileUrl: string | undefined;
    if (skFile) {
      const up = await prepareDocumentUpload(skFile, {
        jenis: tb.jenis,
        nip: tb.user_nip,
        nama: tb.user_nama,
        noReg: tb.no_registrasi,
      });
      fileNama = up.nama_file;
      fileUrl = up.file_url;
    }
    const kelengkapan: KelengkapanSK = {
      nomor_sk: skNomor.trim(),
      tanggal_sk: skTanggal,
      nama_pegawai: tb.user_nama,
      nip_pegawai: tb.user_nip,
      pangkat_golongan: tb.pangkat_golongan,
      jabatan: tb.jabatan,
      unit_kerja: tb.unit_kerja_nama,
      universitas: tb.universitas_tujuan,
      program_studi: tb.program_studi,
      jenjang: tb.jenjang,
      akreditasi: tb.akreditasi_prodi,
      sumber_dana: tb.sumber_pendanaan,
      sponsor: skSponsor.trim(),
      tmt_mulai: tb.tmt_mulai,
      tmt_selesai: tb.tmt_selesai,
      kewajiban_khusus: skKewajiban.trim(),
      pejabat_penandatangan: 'Marsekal Madya TNI Kusworo, S.E., M.M.',
      jabatan_penandatangan: 'Kepala Badan Nasional Pencarian dan Pertolongan',
    };
    updateTbStatus(
      'menunggu_ttd_ppk',
      'Penyusunan Draft SK & Pengajuan ke PPK',
      'diproses',
      `Draft SK No. ${skNomor.trim()} diunggah dan diajukan ke PPK untuk tanda tangan digital BSrE.`,
      {
        kelengkapan_sk: kelengkapan,
        file_sk_nama: fileNama,
        file_sk_url: fileUrl,
      },
      {
        role: 'pejabat_berwenang',
        judul: 'Draft SK Tugas Belajar Menunggu TTD Digital',
        pesan: `${tb.no_registrasi} (${tb.user_nama}) siap ditandatangani secara elektronik oleh PPK.`,
      }
    );
  };

  const handlePPKConfirmSign = ({ hash, catatan }: { hash: string; catatan: string }) => {
    if (!tb) return;
    const now = new Date().toISOString();
    const nextStatus = tb.jenis === 'beasiswa' ? 'menunggu_perjanjian' : 'sk_terbit';
    updateTbStatus(
      nextStatus,
      'Penandatanganan Digital SK oleh PPK (BSrE)',
      'terbit',
      `SK ditandatangani elektronik. Hash BSrE: ${hash}${catatan ? ` · ${catatan}` : ''}`,
      {
        sk_signed_at: now,
        sk_signer_nama: currentUser.nama_lengkap,
        sk_digital_hash: hash,
        catatan_ppk: catatan,
      },
      {
        userId: tb.user_id,
        judul: 'SK Tugas Belajar Resmi Diterbitkan (BSrE)',
        pesan:
          tb.jenis === 'beasiswa'
            ? `SK ${tb.no_registrasi} telah ditandatangani PPK (${hash}). Lanjutkan unggah Surat Perjanjian Beasiswa bermaterai.`
            : `SK ${tb.no_registrasi} telah ditandatangani PPK (${hash}) dan siap diunduh.`,
      }
    );
  };

  const handlePegawaiUploadKampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tb) return;
    let doc: DokumenItem = {
      id: generateId('doc-kmp'),
      kode_dokumen: 'SURAT_LULUS_KAMPUS',
      nama_dokumen: 'Surat Tanda Lulus Seleksi Kampus Tujuan (LoA)',
      nama_file: `LoA_${tb.universitas_tujuan.replace(/\s+/g, '_')}_${tb.user_nip}.pdf`,
      ukuran_mb: 0.85,
      uploaded_at: new Date().toISOString(),
      status_verifikasi: 'pending',
    };
    if (kampusFile) {
      const up = await prepareDocumentUpload(kampusFile, {
        jenis: tb.jenis,
        nip: tb.user_nip,
        nama: tb.user_nama,
        noReg: tb.no_registrasi,
      });
      doc = {
        ...doc,
        nama_file: up.nama_file,
        file_url: up.file_url,
        google_drive_file_id: up.google_drive_file_id,
        google_drive_path: up.google_drive_path,
        ukuran_mb: up.ukuran_mb,
      };
    }
    Storage.uploadSuratLulusKampus(tb.id, doc, currentUser);
    showToast('success', 'Surat lulus kampus diunggah', 'Menunggu verifikasi Admin Kepegawaian Pusat.');
    refresh();
  };

  const handlePegawaiSubmitPerjanjian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tb) return;
    let fileNama = `Perjanjian_Beasiswa_${tb.no_registrasi.replace(/\//g, '_')}.pdf`;
    let fileUrl: string | undefined;
    if (perjanjianFile) {
      const up = await prepareDocumentUpload(perjanjianFile, {
        jenis: tb.jenis,
        nip: tb.user_nip,
        nama: tb.user_nama,
        noReg: tb.no_registrasi,
      });
      fileNama = up.nama_file;
      fileUrl = up.file_url;
    }
    Storage.submitPerjanjianBeasiswa(
      tb.id,
      {
        nomor_perjanjian: noPerjanjian.trim(),
        pihak_pertama: 'Dr. Hendra Gunawan, S.H., M.Si.',
        pihak_kedua: tb.user_nama,
        universitas: tb.universitas_tujuan,
        durasi_semester: tb.durasi_semester,
        kewajiban_ikatan_dinas: `${tb.durasi_semester} semester × 2 (${tb.durasi_semester} tahun) ikatan dinas`,
        file_nama: fileNama,
        file_url: fileUrl,
        status_verifikasi: 'diunggah',
      },
      currentUser
    );
    showToast('success', 'Surat Perjanjian dikirim', 'Menunggu verifikasi Admin Pusat untuk mengaktifkan status belajar.');
    refresh();
  };

  const handleResubmitUsulUlang = ({
    catatanPerbaikan,
    newDoc,
  }: {
    catatanPerbaikan: string;
    newDoc?: DokumenItem;
  }) => {
    const now = new Date().toISOString();
    if (rek) {
      const nextCount = rek.usul_ulang_count + 1;
      Storage.updateRekomendasi({
        ...rek,
        status: 'menunggu_acc_pimpinan',
        usul_ulang_count: nextCount,
        dokumen: newDoc ? [...rek.dokumen, newDoc] : rek.dokumen,
        riwayat_usul_ulang: [
          ...rek.riwayat_usul_ulang,
          {
            ke: nextCount,
            tanggal: now,
            alasan_ditolak_sebelumnya: rejectionInfo?.reason ?? 'Perbaikan berkas',
            ditolak_oleh: rejectionInfo?.rejectedBy ?? 'Verifikator',
            catatan_perbaikan: catatanPerbaikan,
          },
        ],
        riwayat_alur: [
          ...rek.riwayat_alur,
          {
            id: generateId('r-uu'),
            tahap: `Usul Ulang ke-${nextCount} oleh Pegawai`,
            role: currentUser.role,
            actor_nama: currentUser.nama_lengkap,
            status: 'diproses',
            catatan: catatanPerbaikan,
            timestamp: now,
          },
        ],
        updated_at: now,
      });
    } else if (tb) {
      const nextCount = tb.usul_ulang_count + 1;
      Storage.updatePengajuanTB({
        ...tb,
        status: 'menunggu_acc_pimpinan',
        usul_ulang_count: nextCount,
        dokumen: newDoc ? [...tb.dokumen, newDoc] : tb.dokumen,
        riwayat_usul_ulang: [
          ...tb.riwayat_usul_ulang,
          {
            ke: nextCount,
            tanggal: now,
            alasan_ditolak_sebelumnya: rejectionInfo?.reason ?? 'Perbaikan berkas',
            ditolak_oleh: rejectionInfo?.rejectedBy ?? 'Verifikator',
            catatan_perbaikan: catatanPerbaikan,
          },
        ],
        riwayat_alur: [
          ...tb.riwayat_alur,
          {
            id: generateId('r-uu'),
            tahap: `Usul Ulang ke-${nextCount} oleh Pegawai`,
            role: currentUser.role,
            actor_nama: currentUser.nama_lengkap,
            status: 'diproses',
            catatan: catatanPerbaikan,
            timestamp: now,
          },
        ],
        updated_at: now,
      });
    }
    Storage.addNotification({
      target_role: 'pimpinan_unit',
      target_unit_id: record.unit_kerja_id,
      judul: 'Pengajuan Usul Ulang Masuk',
      pesan: `${record.no_registrasi} (${record.user_nama}) mengajukan usul ulang setelah perbaikan.`,
      ref_type: stepperJenis,
      ref_id: record.id,
    });
    showToast('success', 'Usul ulang terkirim', 'Pengajuan kembali diproses dari tahap ACC Pimpinan Unit.');
    refresh();
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Dossier ${record.no_registrasi}`}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-3 sm:p-5"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-white">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h2 className="text-lg font-bold text-slate-900 font-mono">{record.no_registrasi}</h2>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className={`text-xs font-semibold ${getStatusTextClass(record.status)}`}>
                  {getStatusLabel(record.status)}
                </span>
                {(rek || tb) && (
                  <UsulUlangBadge
                    usedCount={(rek || tb)!.usul_ulang_count}
                    maxAllowed={sistemCfg.max_usul_ulang}
                  />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {record.user_nama} · <span className="font-mono tabular-nums">{record.user_nip}</span> · {record.unit_kerja_nama}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dossier pengajuan"
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/70 space-y-5 overscroll-contain">
            {/* Rejection & Usul Ulang Notice */}
            {(rek || tb) && isRejectedStatus(record.status) && (
              <UsulUlangNotice
                usedCount={(rek || tb)!.usul_ulang_count}
                maxAllowed={sistemCfg.max_usul_ulang}
                reason={rejectionInfo?.reason}
                rejectedBy={rejectionInfo ? `${rejectionInfo.roleLabel} (${rejectionInfo.rejectedBy})` : undefined}
                onResubmit={isOwner ? () => setUsulUlangOpen(true) : undefined}
              />
            )}

            {/* Returned by Kepala Biro Notice */}
            {record.status === 'dikembalikan_kabi' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
                <p className="font-bold">Dikembalikan Kepala Biro untuk Perbaikan</p>
                <p className="mt-1 leading-relaxed">
                  {(rek?.catatan_kabi || tb?.catatan_kabi) ??
                    'Silakan periksa kelengkapan berkas dan teruskan kembali ke Kepala Biro.'}
                </p>
              </div>
            )}

            {/* Unified Horizontal Progress Stepper + 2-Column Detail & Berkas Layout */}
            <RiwayatDetailPanel
              rek={rek}
              tb={tb}
              pg={pg}
              workflowSteps={workflowSteps}
              canVerifyDocs={isAdminPusat}
              onToggleDocStatus={handleToggleDocumentCheck}
              onPreviewDocument={setViewer}
              extraLeftContent={
                <>
                  {/* Admin Pencantuman Gelar SIASN / BKN Decision Panel */}
                  {pg && isAdminPusat && (pg.status === 'verifikasi_pangkat' || pg.status === 'diusulkan_siasn') && (
                    <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Award className="w-4 h-4 text-orange-600" />
                        Pemrosesan SIASN / BKN (SE Kepala BKN No. 15/2024)
                      </h4>
                      {pg.status === 'verifikasi_pangkat' ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Periode Usulan SIASN (Linimasa Dua Bulanan)
                            </label>
                            <input
                              type="text"
                              value={periodeSiasn}
                              onChange={(e) => setPeriodeSiasn(e.target.value)}
                              className="w-full max-w-sm px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updatePgStatus(
                                  'diusulkan_siasn',
                                  'Pengusulan Pencantuman Gelar ke SIASN BKN',
                                  'disetujui',
                                  `Pangkat sesuai ketentuan. Diusulkan pada ${periodeSiasn}.`,
                                  { periode_submit: periodeSiasn, pangkat_sesuai: true }
                                )
                              }
                              className="px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
                            >
                              Usulkan ke SIASN BKN
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updatePgStatus(
                                  'menunggu_kenaikan_pangkat',
                                  'Penundaan — Menunggu Kenaikan Pangkat',
                                  'dikembalikan',
                                  'Pangkat/golongan saat ini belum memenuhi pangkat minimal jenjang pendidikan.',
                                  { pangkat_sesuai: false }
                                )
                              }
                              className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg whitespace-nowrap"
                            >
                              Tunda (Menunggu Kenaikan Pangkat)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Nomor Pertek BKN (Bila MS)
                              </label>
                              <input
                                type="text"
                                value={nomorPertek}
                                onChange={(e) => setNomorPertek(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Catatan Hasil BKN
                              </label>
                              <input
                                type="text"
                                value={catatanBkn}
                                onChange={(e) => setCatatanBkn(e.target.value)}
                                placeholder="Contoh: Disetujui pencantuman gelar pada SAPK/SIASN"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updatePgStatus(
                                  'ms',
                                  'Pencatatan Hasil BKN: Memenuhi Syarat (MS)',
                                  'terbit',
                                  catatanBkn || `Pertek BKN No. ${nomorPertek} terbit (MS).`,
                                  { nomor_pertek_bkn: nomorPertek, catatan_bkn: catatanBkn }
                                )
                              }
                              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap"
                            >
                              Catat MS (Memenuhi Syarat)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updatePgStatus(
                                  'bts',
                                  'Pencatatan Hasil BKN: Berkas Tidak Sesuai (BTS)',
                                  'ditolak',
                                  catatanBkn || 'Berkas Tidak Sesuai (BTS) — perlu kelengkapan ulang di SIASN.',
                                  { catatan_bkn: catatanBkn }
                                )
                              }
                              className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg whitespace-nowrap"
                            >
                              Catat BTS
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updatePgStatus(
                                  'tms',
                                  'Pencatatan Hasil BKN: Tidak Memenuhi Syarat (TMS)',
                                  'ditolak',
                                  catatanBkn || 'Tidak Memenuhi Syarat (TMS) sesuai verifikasi BKN.',
                                  { catatan_bkn: catatanBkn }
                                )
                              }
                              className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg whitespace-nowrap"
                            >
                              Catat TMS
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rekomendasi Issued Banner */}
                  {rek && rek.status === 'rekomendasi_terbit' && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs space-y-1">
                        <p className="text-sm font-bold text-emerald-900">
                          Surat Rekomendasi Resmi Terbit
                        </p>
                        <p className="font-mono text-emerald-800">
                          Nomor: {rek.nomor_surat_rekomendasi} · Terbit {formatDateIndo(rek.tanggal_terbit_rekomendasi)}
                        </p>
                        <p className="text-emerald-800">
                          Diterbitkan oleh: {rek.diunggah_oleh_admin_nama || 'Admin Kepegawaian Pusat'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          downloadDocumentAsPdf({
                            fileName: rek.file_rekomendasi_nama || `Rekomendasi_${rek.no_registrasi}.pdf`,
                            judulDokumen: 'SURAT REKOMENDASI TUGAS BELAJAR',
                            nomorSurat: rek.nomor_surat_rekomendasi,
                            tanggalSurat: rek.tanggal_terbit_rekomendasi,
                            namaPegawai: rek.user_nama,
                            nipPegawai: rek.user_nip,
                            pangkatGolongan: rek.pangkat_golongan,
                            jabatan: rek.jabatan,
                            unitKerja: rek.unit_kerja_nama,
                            universitas: rek.universitas_tujuan,
                            programStudi: rek.program_studi,
                            jenjang: rek.jenjang,
                            existingUrl: rek.file_rekomendasi_url,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        Unduh Surat Rekomendasi (PDF)
                      </button>
                    </div>
                  )}

                  {/* Rekomendasi Publish Form (Admin Pusat) */}
                  {rek && isAdminPusat && rek.status === 'terkonfirmasi_kabi' && (
                    <form
                      onSubmit={handleAdminPublishRekomendasi}
                      className="border border-slate-200 rounded-xl p-5 bg-white space-y-4"
                    >
                      <h4 className="text-sm font-bold text-slate-900">
                        Penerbitan & Upload Surat Rekomendasi Tugas Belajar
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nomor Surat Rekomendasi
                          </label>
                          <input
                            type="text"
                            required
                            value={noSuratRek}
                            onChange={(e) => setNoSuratRek(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Tanggal Terbit
                          </label>
                          <input
                            type="date"
                            required
                            value={tglSuratRek}
                            onChange={(e) => setTglSuratRek(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-pointer text-xs text-slate-700">
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>
                          {fileRek
                            ? fileRek.name
                            : 'Unggah berkas PDF Surat Rekomendasi (opsional — sistem juga membuat PDF resmi otomatis)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={(e) => setFileRek(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                        >
                          Terbitkan Surat Rekomendasi
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TB: Pegawai Upload Surat Lulus Kampus */}
                  {tb && isOwner && tb.status === 'menunggu_kelulusan_kampus' && (
                    <form
                      onSubmit={handlePegawaiUploadKampus}
                      className="border border-slate-200 rounded-xl p-5 bg-white space-y-3"
                    >
                      <h4 className="text-sm font-bold text-slate-900">
                        Unggah Surat Tanda Lulus Seleksi Kampus Tujuan (LoA)
                      </h4>
                      <p className="text-xs text-slate-600">
                        Setelah dinyatakan lulus wawancara, unggah Letter of Acceptance (LoA) / bukti lulus dari {tb.universitas_tujuan}.
                      </p>
                      <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-pointer text-xs text-slate-700">
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>{kampusFile ? kampusFile.name : 'Pilih berkas LoA / Surat Lulus Kampus (PDF)'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.png"
                          className="sr-only"
                          onChange={(e) => setKampusFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                        >
                          Kirim Surat Lulus Kampus
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TB: Admin Dynamic SK Generator */}
                  {tb && isAdminPusat && (tb.status === 'terkonfirmasi_kabi' || tb.status === 'ditolak_ppk') && (
                    <form
                      onSubmit={handleAdminSaveAndUploadSK}
                      className="border border-slate-200 rounded-xl p-5 bg-white space-y-4"
                    >
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-600" />
                        Penyusunan Draft SK Tugas Belajar {tb.jenis === 'beasiswa' ? 'Beasiswa' : 'Biaya Mandiri'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor SK</label>
                          <input
                            type="text"
                            required
                            value={skNomor}
                            onChange={(e) => setSkNomor(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal SK</label>
                          <input
                            type="date"
                            required
                            value={skTanggal}
                            onChange={(e) => setSkTanggal(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Sponsor / Sumber Dana</label>
                          <input
                            type="text"
                            required
                            value={skSponsor}
                            onChange={(e) => setSkSponsor(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Kewajiban Khusus & Ikatan Dinas</label>
                        <textarea
                          rows={2}
                          value={skKewajiban}
                          onChange={(e) => setSkKewajiban(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white resize-none"
                        />
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-pointer text-xs text-slate-700">
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>{skFile ? skFile.name : 'Unggah Draft SK PDF (opsional — PDF otomatis dibuat dari formulir di atas)'}</span>
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
                          className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                        >
                          Simpan Draft SK & Ajukan ke PPK
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TB: Existing SK Download & BSrE Signature Card */}
                  {tb?.kelengkapan_sk && (
                    <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            SK Tugas Belajar · {tb.kelengkapan_sk.nomor_sk}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                            Tanggal {formatDateIndo(tb.kelengkapan_sk.tanggal_sk)} · Masa studi{' '}
                            {formatDateIndo(tb.kelengkapan_sk.tmt_mulai, true)} s.d.{' '}
                            {formatDateIndo(tb.kelengkapan_sk.tmt_selesai, true)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            downloadDocumentAsPdf({
                              fileName: tb.file_sk_nama || `SK_${tb.no_registrasi}.pdf`,
                              judulDokumen: `KEPUTUSAN KEPALA BASARNAS TENTANG TUGAS BELAJAR ${tb.jenis.toUpperCase()}`,
                              nomorSurat: tb.kelengkapan_sk!.nomor_sk,
                              tanggalSurat: tb.kelengkapan_sk!.tanggal_sk,
                              namaPegawai: tb.kelengkapan_sk!.nama_pegawai,
                              nipPegawai: tb.kelengkapan_sk!.nip_pegawai,
                              pangkatGolongan: tb.kelengkapan_sk!.pangkat_golongan,
                              jabatan: tb.kelengkapan_sk!.jabatan,
                              unitKerja: tb.kelengkapan_sk!.unit_kerja,
                              universitas: tb.kelengkapan_sk!.universitas,
                              programStudi: tb.kelengkapan_sk!.program_studi,
                              jenjang: tb.kelengkapan_sk!.jenjang,
                              sumberDana: tb.kelengkapan_sk!.sumber_dana,
                              tmtMulai: tb.kelengkapan_sk!.tmt_mulai,
                              tmtSelesai: tb.kelengkapan_sk!.tmt_selesai,
                              penandatangan: tb.kelengkapan_sk!.pejabat_penandatangan,
                              jabatanPenandatangan: tb.kelengkapan_sk!.jabatan_penandatangan,
                              digitalHash: tb.sk_digital_hash,
                              catatanTambahan: tb.kelengkapan_sk!.kewajiban_khusus,
                              existingUrl: tb.file_sk_url,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Unduh SK Resmi (PDF)
                        </button>
                      </div>

                      {tb.sk_digital_hash && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center gap-3 text-xs">
                          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                          <div>
                            <p className="font-bold text-emerald-900">
                              Ditandatangani Elektronik (BSrE) oleh {tb.sk_signer_nama}
                            </p>
                            <p className="font-mono text-emerald-800 mt-0.5 tabular-nums">
                              Hash: {tb.sk_digital_hash} · {formatDateTimeIndo(tb.sk_signed_at)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TB: Pegawai Perjanjian Beasiswa Form */}
                  {tb &&
                    tb.jenis === 'beasiswa' &&
                    isOwner &&
                    (tb.status === 'menunggu_perjanjian' || tb.status === 'sk_terbit') && (
                      <form
                        onSubmit={handlePegawaiSubmitPerjanjian}
                        className="border border-slate-200 rounded-xl p-5 bg-white space-y-3"
                      >
                        <h4 className="text-sm font-bold text-slate-900">
                          Pengisian & Upload Surat Perjanjian Beasiswa Bermaterai
                        </h4>
                        <p className="text-xs text-slate-600">
                          Unggah scan Surat Perjanjian Tugas Belajar bermaterai Rp10.000 untuk mengaktifkan status belajar Anda.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Nomor Surat Perjanjian
                            </label>
                            <input
                              type="text"
                              required
                              value={noPerjanjian}
                              onChange={(e) => setNoPerjanjian(e.target.value)}
                              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-pointer text-xs text-slate-700">
                              <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                              <span className="truncate">
                                {perjanjianFile ? perjanjianFile.name : 'Pilih PDF Perjanjian Bermaterai'}
                              </span>
                              <input
                                type="file"
                                accept=".pdf"
                                className="sr-only"
                                onChange={(e) => setPerjanjianFile(e.target.files?.[0] ?? null)}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                          >
                            Kirim Surat Perjanjian
                          </button>
                        </div>
                      </form>
                    )}

                  {/* Admin Verify Perjanjian Beasiswa */}
                  {tb && isAdminPusat && tb.status === 'perjanjian_ditandatangani' && tb.perjanjian_beasiswa && (
                    <div className="border border-slate-200 rounded-xl p-5 bg-white flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs space-y-1">
                        <p className="text-sm font-bold text-slate-900">
                          Verifikasi Surat Perjanjian Beasiswa · {tb.perjanjian_beasiswa.nomor_perjanjian}
                        </p>
                        <p className="text-slate-600">
                          Berkas: <span className="font-mono">{tb.perjanjian_beasiswa.file_nama}</span> ·{' '}
                          {tb.perjanjian_beasiswa.kewajiban_ikatan_dinas}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            Storage.verifikasiPerjanjianBeasiswa(
                              tb.id,
                              false,
                              'Mohon lengkapi materai dan tanda tangan saksi.',
                              currentUser
                            );
                            showToast('warning', 'Perjanjian dikembalikan', 'Pegawai diminta mengunggah ulang perjanjian.');
                            refresh();
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg"
                        >
                          Minta Perbaikan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            Storage.verifikasiPerjanjianBeasiswa(
                              tb.id,
                              true,
                              'Perjanjian terverifikasi sah. Status aktif belajar.',
                              currentUser
                            );
                            showToast('success', 'Perjanjian Disetujui', 'Pegawai kini berstatus Sedang Belajar Aktif.');
                            refresh();
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                        >
                          Setujui & Aktifkan Studi
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mandiri Pegawai Activate after SK Terbit */}
                  {tb && tb.jenis === 'mandiri' && isOwner && tb.status === 'sk_terbit' && (
                    <div className="border border-slate-200 rounded-xl p-5 bg-white flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs">
                        <p className="text-sm font-bold text-slate-900">Konfirmasi Komitmen Mandiri</p>
                        <p className="text-slate-600 mt-0.5">
                          SK Tugas Belajar Mandiri Anda telah terbit. Konfirmasi komitmen untuk memulai status Sedang Belajar Aktif.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateTbStatus(
                            'sedang_belajar',
                            'Konfirmasi Komitmen Mandiri & Mulai Belajar Aktif',
                            'disetujui',
                            'Pegawai menyetujui komitmen tidak mengganggu jam dinas dan memulai studi aktif.'
                          )
                        }
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                      >
                        Aktifkan Status Sedang Belajar
                      </button>
                    </div>
                  )}
                </>
              }
            />
          </div>

          {/* Role-Specific Action Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Peran aktif: <strong className="text-slate-800">{getRoleDisplayLabel(currentUser.role)}</strong>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* === PIMPINAN UNIT ACTIONS === */}
              {currentUser.role === 'pimpinan_unit' && record.status === 'menunggu_acc_pimpinan' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectConfig({
                        title: 'Tolak Pengajuan (Pimpinan Unit)',
                        description: 'Pengajuan akan dikembalikan ke pegawai dengan status ditolak pimpinan unit.',
                        submitLabel: 'Tolak Pengajuan',
                        tone: 'danger',
                        handler: (reason) => {
                          if (rek) {
                            updateRekStatus('ditolak_pimpinan', 'Penolakan Pimpinan Unit', 'ditolak', reason, {
                              userId: rek.user_id,
                              judul: 'Pengajuan Rekomendasi Ditolak Pimpinan',
                              pesan: `${rek.no_registrasi} ditolak: ${reason}`,
                            });
                          } else if (tb) {
                            updateTbStatus('ditolak_pimpinan', 'Penolakan Pimpinan Unit', 'ditolak', reason, undefined, {
                              userId: tb.user_id,
                              judul: 'Pengajuan Tugas Belajar Ditolak Pimpinan',
                              pesan: `${tb.no_registrasi} ditolak: ${reason}`,
                            });
                          } else if (pg) {
                            updatePgStatus('ditolak_pimpinan', 'Penolakan Pimpinan Unit', 'ditolak', reason);
                          }
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextSt = isUnitDaerah ? 'menunggu_acc_admin_daerah' : pg ? 'verifikasi_pangkat' : 'verifikasi_admin';
                      const targetRole: User['role'] = isUnitDaerah ? 'admin_daerah' : 'admin_kepegawaian';
                      if (rek) {
                        updateRekStatus(nextSt as PengajuanRekomendasi['status'], 'Persetujuan / ACC Pimpinan Unit', 'disetujui', 'Disetujui oleh Pimpinan Unit Kerja.', {
                          role: targetRole,
                          unitId: isUnitDaerah ? rek.unit_kerja_id : undefined,
                          judul: 'Rekomendasi Disetujui Pimpinan Unit',
                          pesan: `${rek.no_registrasi} (${rek.user_nama}) siap diverifikasi.`,
                        });
                      } else if (tb) {
                        updateTbStatus(nextSt as PengajuanTugasBelajar['status'], 'Persetujuan / ACC Pimpinan Unit', 'disetujui', 'Disetujui oleh Pimpinan Unit Kerja.', undefined, {
                          role: targetRole,
                          unitId: isUnitDaerah ? tb.unit_kerja_id : undefined,
                          judul: 'Tugas Belajar Disetujui Pimpinan Unit',
                          pesan: `${tb.no_registrasi} (${tb.user_nama}) siap diverifikasi.`,
                        });
                      } else if (pg) {
                        updatePgStatus(nextSt as PengajuanPencantumanGelar['status'], 'Rekomendasi Pimpinan Unit', 'disetujui', 'Disetujui Pimpinan Unit.');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Setujui (ACC Pimpinan)
                  </button>
                </>
              )}

              {/* === ADMIN DAERAH ACTIONS === */}
              {currentUser.role === 'admin_daerah' && record.status === 'menunggu_acc_admin_daerah' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectConfig({
                        title: 'Tolak Berkas (Admin Daerah)',
                        description: 'Pengajuan akan ditandai ditolak oleh Admin Daerah Kantor SAR.',
                        submitLabel: 'Tolak Berkas',
                        tone: 'danger',
                        handler: (reason) => {
                          if (rek) {
                            updateRekStatus('ditolak_admin_daerah', 'Penolakan Admin Daerah', 'ditolak', reason, {
                              userId: rek.user_id,
                              judul: 'Rekomendasi Ditolak Admin Daerah',
                              pesan: `${rek.no_registrasi}: ${reason}`,
                            });
                          } else if (tb) {
                            updateTbStatus('ditolak_admin_daerah', 'Penolakan Admin Daerah', 'ditolak', reason, undefined, {
                              userId: tb.user_id,
                              judul: 'Tugas Belajar Ditolak Admin Daerah',
                              pesan: `${tb.no_registrasi}: ${reason}`,
                            });
                          } else if (pg) {
                            updatePgStatus('ditolak_admin_daerah', 'Penolakan Admin Daerah', 'ditolak', reason);
                          }
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (rek) {
                        updateRekStatus('verifikasi_admin', 'Konfirmasi / ACC Admin Daerah', 'disetujui', 'Berkas wilayah daerah lengkap, diteruskan ke Admin Pusat.', {
                          role: 'admin_kepegawaian',
                          judul: 'Berkas Daerah Diteruskan ke Pusat',
                          pesan: `${rek.no_registrasi} (${rek.user_nama}) siap diverifikasi Admin Pusat.`,
                        });
                      } else if (tb) {
                        updateTbStatus('verifikasi_admin', 'Konfirmasi / ACC Admin Daerah', 'disetujui', 'Berkas wilayah daerah lengkap, diteruskan ke Admin Pusat.', undefined, {
                          role: 'admin_kepegawaian',
                          judul: 'Tugas Belajar Daerah Diteruskan ke Pusat',
                          pesan: `${tb.no_registrasi} (${tb.user_nama}) siap diverifikasi Admin Pusat.`,
                        });
                      } else if (pg) {
                        updatePgStatus('verifikasi_pangkat', 'ACC Admin Daerah', 'disetujui', 'Diteruskan ke Admin Pusat untuk verifikasi pangkat.');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ACC & Teruskan ke Pusat
                  </button>
                </>
              )}

              {/* === ADMIN PUSAT / SUPER ADMIN ACTIONS === */}
              {isAdminPusat && rek && (rek.status === 'verifikasi_admin' || rek.status === 'dikembalikan_kabi') && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectConfig({
                        title: 'Tolak Pengajuan Rekomendasi',
                        description: 'Pegawai dapat melakukan usul ulang sesuai kuota yang berlaku.',
                        submitLabel: 'Tolak Pengajuan',
                        tone: 'danger',
                        handler: (reason) =>
                          updateRekStatus('ditolak_admin', 'Penolakan Admin Kepegawaian Pusat', 'ditolak', reason, {
                            userId: rek.user_id,
                            judul: 'Rekomendasi Ditolak Admin Pusat',
                            pesan: `${rek.no_registrasi}: ${reason}`,
                          }),
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateRekStatus('menunggu_konfirmasi_kabi', 'Teruskan ke Kepala Biro (Read & Confirm)', 'disetujui', 'Seluruh berkas wajib terverifikasi lengkap oleh Admin Pusat.', {
                        role: 'kepala_biro_kepegawaian',
                        judul: 'Menunggu Konfirmasi Kepala Biro',
                        pesan: `${rek.no_registrasi} (${rek.user_nama}) menunggu Read & Confirm.`,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
                  >
                    <Send className="w-4 h-4" />
                    Teruskan ke Kepala Biro
                  </button>
                </>
              )}

              {isAdminPusat && tb && tb.status === 'verifikasi_admin' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectConfig({
                        title: 'Tolak Pengajuan Tugas Belajar',
                        description: 'Catat alasan penolakan administrasi secara jelas.',
                        submitLabel: 'Tolak Administrasi',
                        tone: 'danger',
                        handler: (reason) =>
                          updateTbStatus('ditolak_admin', 'Tidak Lulus Verifikasi Administrasi', 'ditolak', reason, undefined, {
                            userId: tb.user_id,
                            judul: 'Tugas Belajar Ditolak Administrasi',
                            pesan: `${tb.no_registrasi}: ${reason}`,
                          }),
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </button>
                  {tb.jenis === 'beasiswa' ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateTbStatus(
                          'menunggu_nilai_wawancara',
                          'Lulus Seleksi Administrasi Beasiswa',
                          'disetujui',
                          'Berkas administrasi lengkap. Diteruskan ke Tim Pewawancara.',
                          undefined,
                          {
                            role: 'pewawancara',
                            judul: 'Kandidat Siap Penilaian Wawancara',
                            pesan: `${tb.no_registrasi} (${tb.user_nama}) lulus administrasi dan siap dinilai wawancara.`,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Lulus Administrasi → Wawancara
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        updateTbStatus(
                          'menunggu_konfirmasi_kabi',
                          'Verifikasi Mandiri & Teruskan ke Kepala Biro',
                          'disetujui',
                          'Berkas mandiri & kesesuaian jadwal dinas terverifikasi. Diteruskan ke Kepala Biro.',
                          undefined,
                          {
                            role: 'kepala_biro_kepegawaian',
                            judul: 'Tugas Belajar Mandiri Menunggu Konfirmasi',
                            pesan: `${tb.no_registrasi} (${tb.user_nama}) menunggu Read & Confirm Kepala Biro.`,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
                    >
                      <Send className="w-4 h-4" />
                      Teruskan ke Kepala Biro
                    </button>
                  )}
                </>
              )}

              {isAdminPusat && tb && tb.status === 'seleksi_wawancara' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectConfig({
                        title: 'Tetapkan Tidak Lulus Wawancara',
                        description: 'Kandidat dinyatakan tidak lulus tahap wawancara.',
                        submitLabel: 'Tetapkan Tidak Lulus',
                        tone: 'danger',
                        handler: (reason) =>
                          updateTbStatus('ditolak_pewawancara', 'Konfirmasi Tidak Lulus Wawancara', 'ditolak', reason, undefined, {
                            userId: tb.user_id,
                            judul: 'Hasil Seleksi Wawancara',
                            pesan: `${tb.no_registrasi} tidak lulus seleksi wawancara: ${reason}`,
                          }),
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" />
                    Tidak Lulus
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateTbStatus(
                        'menunggu_kelulusan_kampus',
                        'Konfirmasi Kelulusan Wawancara oleh Admin Pusat',
                        'disetujui',
                        'Dinyatakan lulus wawancara. Pegawai dipersilakan mengunggah surat tanda lulus kampus tujuan (LoA).',
                        undefined,
                        {
                          userId: tb.user_id,
                          judul: 'Lulus Seleksi Wawancara Beasiswa',
                          pesan: `Selamat! Anda lulus wawancara ${tb.no_registrasi}. Unggah Surat Lulus Kampus Tujuan di menu Detail & Berkas.`,
                        }
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Luluskan Wawancara → Seleksi Kampus
                  </button>
                </>
              )}

              {isAdminPusat && tb && (tb.status === 'surat_kampus_diunggah' || tb.status === 'dikembalikan_kabi') && (
                <button
                  type="button"
                  onClick={() =>
                    updateTbStatus(
                      'menunggu_konfirmasi_kabi',
                      'Verifikasi Surat Kampus & Teruskan ke Kepala Biro',
                      'disetujui',
                      'Surat tanda lulus kampus terverifikasi. Diteruskan ke Kepala Biro untuk Read & Confirm.',
                      undefined,
                      {
                        role: 'kepala_biro_kepegawaian',
                        judul: 'Beasiswa Siap Konfirmasi Kepala Biro',
                        pesan: `${tb.no_registrasi} (${tb.user_nama}) siap dikonfirmasi Kepala Biro.`,
                      }
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  Teruskan ke Kepala Biro
                </button>
              )}

              {/* === KEPALA BIRO ACTIONS (Read & Confirm / Return / Reject) === */}
              {currentUser.role === 'kepala_biro_kepegawaian' &&
                record.status === 'menunggu_konfirmasi_kabi' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setRejectConfig({
                          title: 'Tolak Pengajuan (Kepala Biro)',
                          description: 'Pengajuan akan ditolak final oleh Kepala Biro Kepegawaian.',
                          submitLabel: 'Tolak Final',
                          tone: 'danger',
                          handler: (reason) => {
                            if (rek) {
                              updateRekStatus('ditolak_kabi', 'Penolakan Kepala Biro', 'ditolak', reason, {
                                userId: rek.user_id,
                                judul: 'Rekomendasi Ditolak Kepala Biro',
                                pesan: `${rek.no_registrasi}: ${reason}`,
                              });
                            } else if (tb) {
                              updateTbStatus('ditolak_kabi', 'Penolakan Kepala Biro', 'ditolak', reason, undefined, {
                                userId: tb.user_id,
                                judul: 'Tugas Belajar Ditolak Kepala Biro',
                                pesan: `${tb.no_registrasi}: ${reason}`,
                              });
                            }
                          },
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg whitespace-nowrap"
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRejectConfig({
                          title: 'Kembalikan ke Admin Pusat untuk Perbaikan',
                          description: 'Berkas dikembalikan (tidak mati) agar Admin Pusat dapat melengkapi catatan.',
                          submitLabel: 'Kembalikan Berkas',
                          tone: 'warning',
                          handler: (reason) => {
                            if (rek) {
                              updateRekStatus('dikembalikan_kabi', 'Dikembalikan Kepala Biro untuk Perbaikan', 'dikembalikan', reason, {
                                role: 'admin_kepegawaian',
                                judul: 'Rekomendasi Dikembalikan Kepala Biro',
                                pesan: `${rek.no_registrasi} dikembalikan: ${reason}`,
                              });
                            } else if (tb) {
                              updateTbStatus('dikembalikan_kabi', 'Dikembalikan Kepala Biro untuk Perbaikan', 'dikembalikan', reason, undefined, {
                                role: 'admin_kepegawaian',
                                judul: 'Tugas Belajar Dikembalikan Kepala Biro',
                                pesan: `${tb.no_registrasi} dikembalikan: ${reason}`,
                              });
                            }
                          },
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 bg-white border border-amber-300 hover:bg-amber-50 rounded-lg whitespace-nowrap"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Kembalikan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (rek) {
                          updateRekStatus('terkonfirmasi_kabi', 'Konfirmasi Kepala Biro (Read & Confirm)', 'disetujui', 'Terkonfirmasi Kepala Biro. Admin Pusat dipersilakan menerbitkan Surat Rekomendasi.', {
                            role: 'admin_kepegawaian',
                            judul: 'Rekomendasi Terkonfirmasi Kepala Biro',
                            pesan: `${rek.no_registrasi} siap diterbitkan Surat Rekomendasinya.`,
                          });
                        } else if (tb) {
                          updateTbStatus('terkonfirmasi_kabi', 'Konfirmasi Kepala Biro (Read & Confirm)', 'disetujui', 'Terkonfirmasi Kepala Biro. Admin Pusat dipersilakan menyusun Draft SK.', undefined, {
                            role: 'admin_kepegawaian',
                            judul: 'Tugas Belajar Terkonfirmasi Kepala Biro',
                            pesan: `${tb.no_registrasi} siap disusun Draft SK Tugas Belajarnya.`,
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Read & Confirm (Setujui)
                    </button>
                  </>
                )}

              {/* === PPK ACTIONS === */}
              {currentUser.role === 'pejabat_berwenang' && tb && tb.status === 'menunggu_ttd_ppk' && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectConfig({
                        title: 'Tolak Draft SK Tugas Belajar',
                        description: 'Draft SK akan dikembalikan ke Admin Kepegawaian untuk revisi.',
                        submitLabel: 'Tolak Draft SK',
                        tone: 'danger',
                        handler: (reason) =>
                          updateTbStatus('ditolak_ppk', 'Draft SK Ditolak PPK', 'ditolak', reason, { catatan_ppk: reason }, {
                            role: 'admin_kepegawaian',
                            judul: 'Draft SK Ditolak PPK',
                            pesan: `${tb.no_registrasi} ditolak PPK: ${reason}`,
                          }),
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak Draft SK
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap"
                  >
                    <FileSignature className="w-4 h-4" />
                    Tanda Tangan Digital (BSrE)
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg whitespace-nowrap"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <DocumentViewerModal
        open={Boolean(viewer)}
        onClose={() => setViewer(null)}
        title={viewer?.title ?? ''}
        fileName={viewer?.fileName ?? ''}
        fileUrl={viewer?.fileUrl}
        pdfPayload={viewer?.pdfPayload}
      />

      <RejectReasonModal
        open={Boolean(rejectConfig)}
        onClose={() => setRejectConfig(null)}
        title={rejectConfig?.title ?? ''}
        description={rejectConfig?.description}
        submitLabel={rejectConfig?.submitLabel}
        tone={rejectConfig?.tone}
        onConfirm={(reason) => rejectConfig?.handler(reason)}
      />

      {tb && (
        <DigitalSignModal
          open={signOpen}
          onClose={() => setSignOpen(false)}
          signerName={currentUser.nama_lengkap}
          signerJabatan={currentUser.jabatan}
          documentTitle={`SK Tugas Belajar ${tb.jenis === 'beasiswa' ? 'Beasiswa' : 'Biaya Mandiri'} — ${tb.user_nama}`}
          documentNumber={tb.kelengkapan_sk?.nomor_sk ?? tb.no_registrasi}
          onConfirmSign={handlePPKConfirmSign}
        />
      )}

      {(rek || tb) && (
        <UsulUlangModal
          open={usulUlangOpen}
          onClose={() => setUsulUlangOpen(false)}
          noRegistrasi={record.no_registrasi}
          jenisLabel={stepperJenis}
          usedCount={(rek || tb)!.usul_ulang_count}
          maxAllowed={sistemCfg.max_usul_ulang}
          rejectionInfo={rejectionInfo}
          currentUser={currentUser}
          onSubmitResubmission={handleResubmitUsulUlang}
        />
      )}
    </>
  );
};
