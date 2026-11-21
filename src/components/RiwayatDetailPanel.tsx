import React from 'react';
import {
  GraduationCap,
  FileText,
  Award,
  Eye,
  FileCheck2,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatDateIndo, formatDateTimeIndo, formatTimeIndo } from '../lib/dateUtils';
import { getRoleDisplayLabel, getStatusLabel, getStatusTextClass } from '../lib/statusUtils';
import { Stepper } from './Stepper';
import type { OfficialPdfPayload } from '../lib/pdfDownloader';
import type {
  DocVerificationStatus,
  PengajuanPencantumanGelar,
  PengajuanRekomendasi,
  PengajuanTugasBelajar,
  WorkflowStepConfig,
} from '../types';

export interface PreviewRequest {
  title: string;
  fileName: string;
  fileUrl?: string;
  pdfPayload?: OfficialPdfPayload;
}

interface RiwayatDetailPanelProps {
  rek?: PengajuanRekomendasi;
  tb?: PengajuanTugasBelajar;
  pg?: PengajuanPencantumanGelar;
  workflowSteps: WorkflowStepConfig[];
  canVerifyDocs?: boolean;
  onToggleDocStatus?: (docId: string, nextStatus: DocVerificationStatus) => void;
  onPreviewDocument: (req: PreviewRequest) => void;
  extraLeftContent?: React.ReactNode;
}

export const RiwayatDetailPanel: React.FC<RiwayatDetailPanelProps> = ({
  rek,
  tb,
  pg,
  workflowSteps,
  canVerifyDocs = false,
  onToggleDocStatus,
  onPreviewDocument,
  extraLeftContent,
}) => {
  const record = rek || tb || pg;
  if (!record) return null;

  const stepperJenis: 'rekomendasi' | 'beasiswa' | 'mandiri' | 'pencantuman_gelar' = rek
    ? 'rekomendasi'
    : pg
    ? 'pencantuman_gelar'
    : tb?.jenis === 'mandiri'
    ? 'mandiri'
    : 'beasiswa';

  const latestLog =
    record.riwayat_alur.length > 0
      ? record.riwayat_alur[record.riwayat_alur.length - 1]
      : undefined;

  const titleLine = rek
    ? `${rek.jenjang} — ${rek.program_studi}`
    : tb
    ? `${tb.jenjang} — ${tb.program_studi}`
    : `${pg!.jenjang} (${pg!.gelar_diperoleh}) — ${pg!.program_studi}`;

  const subtitleLine = rek
    ? `${rek.universitas_tujuan} (${rek.negara})`
    : tb
    ? `${tb.universitas_tujuan} (${tb.dalam_luar_negeri})`
    : `${pg!.nama_kampus} · No. Ijazah ${pg!.no_ijazah}`;

  const jenisTag = rek
    ? 'Rekomendasi'
    : pg
    ? 'Pencantuman Gelar'
    : tb?.jenis === 'beasiswa'
    ? 'Beasiswa'
    : 'Biaya Mandiri';

  const akreditasiText = rek
    ? `${rek.akreditasi_prodi} (Prodi) · ${rek.akreditasi_univ} (PT)`
    : tb
    ? tb.akreditasi_prodi
    : pg?.pangkat_sesuai
    ? 'Pangkat Sesuai SE BKN 15/2024'
    : 'Menunggu Kenaikan Pangkat';

  const sumberDanaText = rek
    ? rek.jalur_rencana === 'beasiswa'
      ? 'Rencana Beasiswa'
      : 'Rencana Biaya Mandiri'
    : tb
    ? tb.sumber_pendanaan
    : pg?.periode_submit || 'Usulan SIASN BKN';

  const periodeStudiText = rek
    ? `TA ${rek.tahun_akademik}`
    : tb
    ? `${formatDateIndo(tb.tmt_mulai, true)} s.d. ${formatDateIndo(tb.tmt_selesai, true)}`
    : `Lulus ${formatDateIndo(pg!.tanggal_lulus, true)}`;

  const allDocsValid =
    record.dokumen.length > 0 &&
    record.dokumen.every((d) => d.status_verifikasi === 'valid');

  return (
    <div className="space-y-5">
      {/* Top Horizontal Alur Progres Pengajuan */}
      <Stepper
        steps={workflowSteps}
        currentStatus={record.status}
        jenis={stepperJenis}
        riwayat={record.riwayat_alur}
      />

      {/* 2-Column Structured Content Layout matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (8/12): Study Metadata, Latest Progress Note, Quick Previews, Selection & Full History */}
        <div className="lg:col-span-8 space-y-5">
          {/* Primary Study Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
            {/* Title Row */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  {pg ? (
                    <Award className="w-5 h-5" />
                  ) : rek ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <GraduationCap className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {titleLine}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitleLine}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
                  {jenisTag}
                </p>
                <p className={`text-[11px] font-semibold mt-0.5 ${getStatusTextClass(record.status)}`}>
                  {getStatusLabel(record.status)}
                </p>
              </div>
            </div>

            {/* 3x2 Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-500">ID Registrasi</p>
                <p className="font-mono font-semibold text-slate-900 mt-1 tabular-nums">
                  {record.no_registrasi}
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  {pg ? 'Verifikasi Pangkat' : 'Akreditasi Prodi'}
                </p>
                <p className="font-semibold text-slate-900 mt-1">{akreditasiText}</p>
              </div>
              <div>
                <p className="text-slate-500">
                  {pg ? 'Periode SIASN' : 'Sumber Pembiayaan'}
                </p>
                <p className="font-semibold text-slate-900 mt-1">{sumberDanaText}</p>
              </div>
              <div>
                <p className="text-slate-500">
                  {pg ? 'Tanggal Kelulusan' : 'Periode Studi'}
                </p>
                <p className="font-semibold text-slate-900 mt-1 tabular-nums">
                  {periodeStudiText}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Unit Kerja</p>
                <p className="font-semibold text-slate-900 mt-1">{record.unit_kerja_nama}</p>
              </div>
              <div>
                <p className="text-slate-500">Pangkat / Golongan</p>
                <p className="font-semibold text-slate-900 mt-1">{record.pangkat_golongan}</p>
              </div>
            </div>

            {/* Catatan Progres Terakhir */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">
                  Catatan Progres Terakhir
                </p>
                {latestLog && (
                  <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {formatDateIndo(latestLog.timestamp)} · {formatTimeIndo(latestLog.timestamp)}
                  </p>
                )}
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {latestLog?.catatan ||
                  `${latestLog?.tahap ?? 'Pengajuan diproses'} oleh ${latestLog?.actor_nama ?? record.user_nama}.`}
              </p>
              {latestLog && (
                <p className="text-[11px] text-slate-500">
                  Diproses oleh <span className="font-medium text-slate-700">{latestLog.actor_nama}</span> ({getRoleDisplayLabel(latestLog.role)})
                </p>
              )}
            </div>

            {/* Quick Action Document Preview Buttons (matching screenshot footer buttons) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {rek && rek.status === 'rekomendasi_terbit' && (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewDocument({
                      title: 'Surat Rekomendasi Tugas Belajar',
                      fileName: rek.file_rekomendasi_nama || `Surat_Rekomendasi_${rek.no_registrasi}.pdf`,
                      fileUrl: rek.file_rekomendasi_url,
                      pdfPayload: {
                        fileName: rek.file_rekomendasi_nama || `Surat_Rekomendasi_${rek.no_registrasi}.pdf`,
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
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  Pratinjau Surat Rekomendasi
                </button>
              )}

              {tb?.kelengkapan_sk && (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewDocument({
                      title: `SK Tugas Belajar ${tb.jenis === 'beasiswa' ? 'Beasiswa' : 'Mandiri'}`,
                      fileName: tb.file_sk_nama || `SK_${tb.no_registrasi}.pdf`,
                      fileUrl: tb.file_sk_url,
                      pdfPayload: {
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
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Pratinjau SK Tugas Belajar
                </button>
              )}

              {tb?.perjanjian_beasiswa && (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewDocument({
                      title: 'Surat Perjanjian Tugas Belajar Beasiswa',
                      fileName:
                        tb.perjanjian_beasiswa!.file_nama ||
                        `Perjanjian_${tb.no_registrasi}.pdf`,
                      fileUrl: tb.perjanjian_beasiswa!.file_url,
                      pdfPayload: {
                        fileName:
                          tb.perjanjian_beasiswa!.file_nama ||
                          `Perjanjian_${tb.no_registrasi}.pdf`,
                        judulDokumen: 'SURAT PERJANJIAN TUGAS BELAJAR BEASISWA',
                        nomorSurat: tb.perjanjian_beasiswa!.nomor_perjanjian,
                        namaPegawai: tb.user_nama,
                        nipPegawai: tb.user_nip,
                        pangkatGolongan: tb.pangkat_golongan,
                        jabatan: tb.jabatan,
                        unitKerja: tb.unit_kerja_nama,
                        universitas: tb.universitas_tujuan,
                        programStudi: tb.program_studi,
                        jenjang: tb.jenjang,
                        catatanTambahan: `Kewajiban Ikatan Dinas: ${tb.perjanjian_beasiswa!.kewajiban_ikatan_dinas}. Pihak Pertama: ${tb.perjanjian_beasiswa!.pihak_pertama}.`,
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50/80 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  Pratinjau Surat Perjanjian
                </button>
              )}

              {tb?.sk_digital_hash && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-700 ml-auto">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  BSrE: {tb.sk_digital_hash}
                </span>
              )}
            </div>
          </div>

          {/* Hasil Seleksi & Uji Kompetensi (if interview result exists) */}
          {tb?.hasil_wawancara && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Hasil Seleksi & Penilaian Wawancara
                </h4>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {formatDateTimeIndo(tb.hasil_wawancara.tanggal_wawancara)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <p className="text-slate-600">
                    Assessor: <strong className="text-slate-900">{tb.hasil_wawancara.pewawancara_nama}</strong>
                  </p>
                  <p className="text-slate-700 mt-1">{tb.hasil_wawancara.catatan_umum}</p>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <p className="text-lg font-mono font-bold text-slate-900">
                    {tb.hasil_wawancara.rata_rata_skor.toFixed(1)}
                    <span className="text-xs font-normal text-slate-500">
                      {' '}/ PG {tb.hasil_wawancara.passing_grade}
                    </span>
                  </p>
                  <p
                    className={`font-semibold ${
                      tb.hasil_wawancara.rekomendasi_hasil === 'lulus'
                        ? 'text-emerald-700'
                        : tb.hasil_wawancara.rekomendasi_hasil === 'tidak_lulus'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {tb.hasil_wawancara.rekomendasi_hasil.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Extra interactive workflow panels (e.g. SK form, Perjanjian upload, SIASN form) */}
          {extraLeftContent}

          {/* Chronological Activity Log with Date + Time WIB */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Log Kronologis Tahapan (Tanggal & Jam WIB)
              </h4>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {record.riwayat_alur.length} catatan
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {[...record.riwayat_alur].reverse().map((log) => (
                <li key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{log.tahap}</p>
                    <p className="text-slate-500 mt-0.5">
                      {log.actor_nama} · {getRoleDisplayLabel(log.role)}
                    </p>
                    {log.catatan && (
                      <p className="text-slate-700 mt-1 italic">“{log.catatan}”</p>
                    )}
                  </div>
                  <div className="sm:text-right font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                    <p className="font-medium text-slate-700">{formatDateIndo(log.timestamp)}</p>
                    <p>{formatTimeIndo(log.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN (4/12): Berkas Persyaratan Terkini matching screenshot */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Berkas Persyaratan Terkini</h3>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {record.dokumen.length} File Terunggah
              </p>
            </div>
            {allDocsValid && (
              <CheckCircle2
                className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
                aria-label="Semua berkas valid"
              />
            )}
          </div>

          <div className="space-y-3">
            {record.dokumen.map((doc) => (
              <div
                key={doc.id}
                className="border border-slate-200 rounded-xl p-3.5 space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {doc.nama_dokumen}
                  </p>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                      doc.status_verifikasi === 'valid'
                        ? 'text-emerald-700'
                        : doc.status_verifikasi === 'bts'
                        ? 'text-red-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {doc.status_verifikasi === 'valid'
                      ? 'VALID'
                      : doc.status_verifikasi === 'bts'
                      ? 'BTS'
                      : 'PENDING'}
                  </span>
                </div>

                <p className="text-[11px] font-mono text-slate-500 truncate">{doc.nama_file}</p>
                <p className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {doc.ukuran_mb} MB · {formatDateIndo(doc.uploaded_at, true)}, {formatTimeIndo(doc.uploaded_at)}
                </p>

                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewDocument({
                        title: doc.nama_dokumen,
                        fileName: doc.nama_file,
                        fileUrl: doc.file_url,
                        pdfPayload: {
                          fileName: doc.nama_file,
                          judulDokumen: doc.nama_dokumen,
                          namaPegawai: record.user_nama,
                          nipPegawai: record.user_nip,
                          pangkatGolongan: record.pangkat_golongan,
                          jabatan: record.jabatan,
                          unitKerja: record.unit_kerja_nama,
                          universitas:
                            rek?.universitas_tujuan ||
                            tb?.universitas_tujuan ||
                            pg?.nama_kampus,
                          programStudi: record.program_studi,
                          jenjang: record.jenjang,
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat Dokumen
                  </button>

                  {canVerifyDocs && onToggleDocStatus && (
                    <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                      {(['valid', 'bts', 'pending'] as DocVerificationStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => onToggleDocStatus(doc.id, st)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            doc.status_verifikasi === st
                              ? st === 'valid'
                                ? 'bg-emerald-700 text-white'
                                : st === 'bts'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st === 'valid' ? 'Valid' : st === 'bts' ? 'BTS' : 'Pending'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
