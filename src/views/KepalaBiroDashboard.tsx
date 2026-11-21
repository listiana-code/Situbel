import React, { useMemo } from 'react';
import { Eye, CheckCircle2, Clock } from 'lucide-react';
import { formatDateIndo } from '../lib/dateUtils';
import { getStatusLabel, getStatusTextClass } from '../lib/statusUtils';
import { Storage } from '../lib/storage';
import type { DossierTarget, PengajuanPerpanjangan, User } from '../types';

interface KepalaBiroDashboardProps {
  user: User;
  activeMenu: string;
  onOpenDossier: (target: DossierTarget) => void;
  onOpenPerpanjangan: (item: PengajuanPerpanjangan) => void;
  dataVersion: number;
}

export const KepalaBiroDashboard: React.FC<KepalaBiroDashboardProps> = ({
  activeMenu,
  onOpenDossier,
  onOpenPerpanjangan,
  dataVersion,
}) => {
  const rekomendasis = useMemo(() => Storage.getRekomendasi(), [dataVersion]);
  const tbs = useMemo(() => Storage.getPengajuanTB(), [dataVersion]);
  const perpanjangans = useMemo(() => Storage.getPerpanjangan(), [dataVersion]);
  const monevs = useMemo(() => Storage.getMonev(), [dataVersion]);

  const pendingRek = rekomendasis.filter((r) => r.status === 'menunggu_konfirmasi_kabi');
  const pendingTb = tbs.filter((t) => t.status === 'menunggu_konfirmasi_kabi');
  const pendingPpj = perpanjangans.filter((p) => p.status === 'menunggu_acc_kabiro');

  const historyItems = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'rekomendasi' | 'tugas_belajar';
      noReg: string;
      nama: string;
      unit: string;
      status: string;
      updated: string;
    }> = [];
    rekomendasis.forEach((r) => {
      if (['terkonfirmasi_kabi', 'rekomendasi_terbit', 'dikembalikan_kabi', 'ditolak_kabi'].includes(r.status)) {
        list.push({
          id: r.id,
          type: 'rekomendasi',
          noReg: r.no_registrasi,
          nama: r.user_nama,
          unit: r.unit_kerja_nama,
          status: r.status,
          updated: r.updated_at,
        });
      }
    });
    tbs.forEach((t) => {
      if (
        ['terkonfirmasi_kabi', 'menunggu_ttd_ppk', 'sk_terbit', 'sedang_belajar', 'dikembalikan_kabi', 'ditolak_kabi'].includes(
          t.status
        )
      ) {
        list.push({
          id: t.id,
          type: 'tugas_belajar',
          noReg: t.no_registrasi,
          nama: t.user_nama,
          unit: t.unit_kerja_nama,
          status: t.status,
          updated: t.updated_at,
        });
      }
    });
    return list;
  }, [rekomendasis, tbs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {activeMenu === 'konfirmasi_rekomendasi'
            ? 'Konfirmasi Surat Rekomendasi (Read & Confirm)'
            : activeMenu === 'konfirmasi_tugas_belajar'
            ? 'Konfirmasi Tugas Belajar (Buka Penyusunan SK)'
            : activeMenu === 'konfirmasi_perpanjangan'
            ? 'Konfirmasi Perpanjangan Masa Belajar'
            : activeMenu === 'monitoring_monev'
            ? 'Monitoring Monev & IPK per Unit / Daerah'
            : activeMenu === 'riwayat_konfirmasi'
            ? 'Riwayat Konfirmasi Kepala Biro'
            : 'Dashboard Eksekutif Kepala Biro Kepegawaian'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Lakukan Read & Confirm, pengembalian perbaikan ke Admin Pusat, atau persetujuan pembukaan tahap SK.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Menunggu Read & Confirm Rek</p>
          <p className="text-2xl font-bold font-mono text-orange-700 mt-1 tabular-nums">
            {pendingRek.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Menunggu Konfirmasi Tubel</p>
          <p className="text-2xl font-bold font-mono text-orange-700 mt-1 tabular-nums">
            {pendingTb.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Perpanjangan Menunggu ACC</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {pendingPpj.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Pegawai Sedang Belajar</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {tbs.filter((t) => t.status === 'sedang_belajar').length}
          </p>
        </div>
      </div>

      {/* Contextual Table Views */}
      {(activeMenu === 'dashboard' || activeMenu === 'konfirmasi_rekomendasi') && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Antrean Konfirmasi Surat Rekomendasi
            </h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {pendingRek.length} berkas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">Universitas & Prodi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pendingRek.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-1.5" />
                      Semua usulan rekomendasi telah dikonfirmasi.
                    </td>
                  </tr>
                ) : (
                  pendingRek.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                        {r.no_registrasi}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{r.user_nama}</p>
                        <p className="text-[11px] text-slate-500">{r.unit_kerja_nama}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">{r.universitas_tujuan}</p>
                        <p className="text-[11px] text-slate-500">
                          {r.jenjang} {r.program_studi}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${getStatusTextClass(r.status)}`}>
                          {getStatusLabel(r.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDossier({ type: 'rekomendasi', id: r.id })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Read & Confirm
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeMenu === 'dashboard' || activeMenu === 'konfirmasi_tugas_belajar') && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Antrean Konfirmasi Tugas Belajar (Buka Tahap SK)
            </h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {pendingTb.length} berkas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">Jalur & Kampus</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pendingTb.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      Tidak ada pengajuan tugas belajar menunggu konfirmasi Kepala Biro.
                    </td>
                  </tr>
                ) : (
                  pendingTb.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                        {t.no_registrasi}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{t.user_nama}</p>
                        <p className="text-[11px] text-slate-500">{t.unit_kerja_nama}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">
                          {t.jenis === 'beasiswa' ? 'Beasiswa' : 'Mandiri'} · {t.universitas_tujuan}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {t.jenjang} {t.program_studi}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${getStatusTextClass(t.status)}`}>
                          {getStatusLabel(t.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDossier({ type: 'tugas_belajar', id: t.id })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Periksa & Konfirmasi
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeMenu === 'dashboard' || activeMenu === 'konfirmasi_perpanjangan') && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Usulan Perpanjangan Masa Belajar</h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {perpanjangans.length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">Tambahan & TMT Baru</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {perpanjangans.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                      {p.no_registrasi}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{p.user_nama}</p>
                      <p className="text-[11px] text-slate-500">{p.unit_kerja_nama}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      +{p.tambahan_semester} smt · s.d. {formatDateIndo(p.tmt_selesai_usulan, true)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${getStatusTextClass(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenPerpanjangan(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeMenu === 'monitoring_monev' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              Monitoring Monev Semester & IPK Pegawai Tugas Belajar
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">Pegawai & Unit</th>
                  <th className="py-3 px-4">Kampus & Prodi</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4 text-right">IPK Smt / Kum</th>
                  <th className="py-3 px-5">Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {monevs.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-900">{m.user_nama}</p>
                      <p className="text-[11px] text-slate-500">{m.unit_kerja_nama}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900">{m.universitas}</p>
                      <p className="text-[11px] text-slate-500">{m.program_studi}</p>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      Smt {m.semester} · {m.tahun_akademik}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {m.ipk_semester.toFixed(2)} / {m.ipk_kumulatif.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`font-semibold ${
                          m.status_evaluasi === 'diterima'
                            ? 'text-emerald-700'
                            : m.status_evaluasi === 'perlu_perbaikan'
                            ? 'text-amber-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {m.status_evaluasi.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeMenu === 'riwayat_konfirmasi' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Riwayat Konfirmasi Kepala Biro</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">Status Terkini</th>
                  <th className="py-3 px-4">Pembaruan</th>
                  <th className="py-3 px-5 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {historyItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      <Clock className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                      Belum ada riwayat konfirmasi.
                    </td>
                  </tr>
                ) : (
                  historyItems.map((h) => (
                    <tr key={`${h.type}-${h.id}`} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                        {h.noReg}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{h.nama}</p>
                        <p className="text-[11px] text-slate-500">{h.unit}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${getStatusTextClass(h.status)}`}>
                          {getStatusLabel(h.status)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 tabular-nums">
                        {formatDateIndo(h.updated, true)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDossier({ type: h.type, id: h.id })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Buka
                        </button>
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
