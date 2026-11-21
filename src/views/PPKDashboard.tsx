import React, { useMemo, useState } from 'react';
import { FileSignature, ShieldCheck, Download, Eye, Search, CheckCircle2 } from 'lucide-react';
import { formatDateIndo, formatDateTimeIndo } from '../lib/dateUtils';
import { downloadDocumentAsPdf } from '../lib/pdfDownloader';
import { getStatusLabel, getStatusTextClass } from '../lib/statusUtils';
import { Storage } from '../lib/storage';
import type { DossierTarget, User } from '../types';

interface PPKDashboardProps {
  user: User;
  activeMenu: string;
  onOpenDossier: (target: DossierTarget) => void;
  dataVersion: number;
}

export const PPKDashboard: React.FC<PPKDashboardProps> = ({
  activeMenu,
  onOpenDossier,
  dataVersion,
}) => {
  const [hashQuery, setHashQuery] = useState('');

  const allTb = useMemo(() => Storage.getPengajuanTB(), [dataVersion]);
  const pendingDrafts = useMemo(
    () => allTb.filter((t) => t.status === 'menunggu_ttd_ppk'),
    [allTb]
  );
  const signedArchive = useMemo(
    () => allTb.filter((t) => Boolean(t.sk_digital_hash)),
    [allTb]
  );

  const verifiedMatch = useMemo(() => {
    const q = hashQuery.trim().toLowerCase();
    if (!q) return null;
    return (
      signedArchive.find(
        (t) =>
          t.sk_digital_hash?.toLowerCase() === q ||
          t.kelengkapan_sk?.nomor_sk.toLowerCase() === q ||
          t.no_registrasi.toLowerCase() === q
      ) ?? null
    );
  }, [hashQuery, signedArchive]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {activeMenu === 'arsip_sk'
              ? 'Arsip SK Tugas Belajar Terbit'
              : activeMenu === 'verifikasi_bsre'
              ? 'Verifikasi Sertifikat Elektronik (BSrE)'
              : 'Otoritas Penandatanganan SK (PPK)'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reviu draft Surat Keputusan Tugas Belajar dan bubuhkan tanda tangan elektronik BSrE — BSSN.
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Menunggu Tanda Tangan Digital</p>
          <p className="text-3xl font-bold font-mono text-orange-700 mt-1 tabular-nums">
            {pendingDrafts.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Draft SK siap disahkan</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">SK Ditandatangani (BSrE)</p>
          <p className="text-3xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {signedArchive.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Terverifikasi hash elektronik</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Total Tugas Belajar Terdaftar</p>
          <p className="text-3xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {allTb.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Beasiswa dan Biaya Mandiri</p>
        </div>
      </div>

      {activeMenu === 'verifikasi_bsre' ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Cek Keaslian Hash Sertifikat Elektronik BSrE
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan kode hash (contoh: <span className="font-mono text-slate-800">DS-BSN-7F4A92C8E104B3D9</span>) atau nomor SK untuk memvalidasi keaslian dokumen.
            </p>
          </div>
          <div className="relative max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={hashQuery}
              onChange={(e) => setHashQuery(e.target.value)}
              placeholder="DS-BSN-... atau SK.019/KP.03.02/..."
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
            />
          </div>

          {hashQuery.trim().length > 0 && (
            verifiedMatch ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  Sertifikat Elektronik Valid & Terdaftar
                </div>
                <p className="text-emerald-900">
                  Pemegang SK: <strong>{verifiedMatch.user_nama}</strong> ({verifiedMatch.user_nip})
                </p>
                <p className="font-mono text-emerald-800">
                  Nomor SK: {verifiedMatch.kelengkapan_sk?.nomor_sk} · Hash: {verifiedMatch.sk_digital_hash}
                </p>
                <p className="text-emerald-800">
                  Ditandatangani oleh {verifiedMatch.sk_signer_nama} pada {formatDateTimeIndo(verifiedMatch.sk_signed_at)}
                </p>
              </div>
            ) : (
              <p className="text-xs font-medium text-red-700">
                Kode hash atau nomor SK tidak ditemukan dalam arsip tanda tangan elektronik SITUBEL.
              </p>
            )
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              {activeMenu === 'arsip_sk'
                ? 'Arsip SK Tugas Belajar Bertanda Tangan Elektronik'
                : 'Daftar Draft SK Menunggu Tanda Tangan Digital PPK'}
            </h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {(activeMenu === 'arsip_sk' ? signedArchive : pendingDrafts).length} dokumen
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi & SK</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">Studi & Jalur</th>
                  <th className="py-3 px-4">Status / Hash BSrE</th>
                  <th className="py-3 px-5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {(activeMenu === 'arsip_sk' ? signedArchive : pendingDrafts).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      {activeMenu === 'arsip_sk'
                        ? 'Belum ada arsip SK yang ditandatangani.'
                        : 'Tidak ada draft SK yang menunggu tanda tangan saat ini.'}
                    </td>
                  </tr>
                ) : (
                  (activeMenu === 'arsip_sk' ? signedArchive : pendingDrafts).map((tb) => (
                    <tr key={tb.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5">
                        <p className="font-mono font-semibold text-slate-900">{tb.no_registrasi}</p>
                        <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                          {tb.kelengkapan_sk?.nomor_sk || 'Draft belum bernomor'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{tb.user_nama}</p>
                        <p className="text-[11px] text-slate-500">
                          {tb.unit_kerja_nama} · <span className="font-mono">{tb.user_nip}</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">
                          {tb.jenjang} {tb.program_studi}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {tb.universitas_tujuan} · {tb.jenis === 'beasiswa' ? 'Beasiswa' : 'Biaya Mandiri'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        {tb.sk_digital_hash ? (
                          <div>
                            <p className="font-mono font-semibold text-emerald-700">
                              {tb.sk_digital_hash}
                            </p>
                            <p className="text-[11px] text-slate-500 tabular-nums">
                              {formatDateIndo(tb.sk_signed_at, true)}
                            </p>
                          </div>
                        ) : (
                          <span className={`font-semibold ${getStatusTextClass(tb.status)}`}>
                            {getStatusLabel(tb.status)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => onOpenDossier({ type: 'tugas_belajar', id: tb.id })}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                            tb.status === 'menunggu_ttd_ppk'
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {tb.status === 'menunggu_ttd_ppk' ? (
                            <>
                              <FileSignature className="w-3.5 h-3.5" />
                              Reviu & TTD BSrE
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Detail
                            </>
                          )}
                        </button>
                        {tb.kelengkapan_sk && tb.sk_digital_hash && (
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
                              })
                            }
                            aria-label="Unduh SK PDF"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
