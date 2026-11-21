import React, { useMemo } from 'react';
import { Eye, CheckCircle2, Users } from 'lucide-react';
import { formatDateIndo } from '../lib/dateUtils';
import { getStatusLabel, getStatusTextClass } from '../lib/statusUtils';
import { Storage } from '../lib/storage';
import type { DossierTarget, PengajuanPerpanjangan, User } from '../types';

interface PimpinanDashboardProps {
  user: User;
  activeMenu: string;
  onOpenDossier: (target: DossierTarget) => void;
  onOpenPerpanjangan: (item: PengajuanPerpanjangan) => void;
  dataVersion: number;
}

export const PimpinanDashboard: React.FC<PimpinanDashboardProps> = ({
  user,
  activeMenu,
  onOpenDossier,
  onOpenPerpanjangan,
  dataVersion,
}) => {
  const allRek = useMemo(() => Storage.getRekomendasi(), [dataVersion]);
  const allTb = useMemo(() => Storage.getPengajuanTB(), [dataVersion]);
  const allPpj = useMemo(() => Storage.getPerpanjangan(), [dataVersion]);
  const allMonev = useMemo(() => Storage.getMonev(), [dataVersion]);
  const allUsers = useMemo(() => Storage.getUsers(), [dataVersion]);

  // Show unit items (and also allow reviewing any pending pimpinan item so demo testers can test PPJ/2026/001 smoothly)
  const unitRek = allRek.filter(
    (r) => r.unit_kerja_id === user.unit_kerja_id || r.status === 'menunggu_acc_pimpinan'
  );
  const unitTb = allTb.filter(
    (t) => t.unit_kerja_id === user.unit_kerja_id || t.status === 'menunggu_acc_pimpinan'
  );
  const unitPpj = allPpj.filter(
    (p) => p.unit_kerja_id === user.unit_kerja_id || p.status === 'menunggu_acc_pimpinan'
  );
  const unitMonev = allMonev.filter((m) => m.unit_kerja_id === user.unit_kerja_id);
  const unitStaff = allUsers.filter(
    (u) => u.unit_kerja_id === user.unit_kerja_id && u.role === 'pegawai'
  );

  const pendingRekCount = unitRek.filter((r) => r.status === 'menunggu_acc_pimpinan').length;
  const pendingTbCount = unitTb.filter((t) => t.status === 'menunggu_acc_pimpinan').length;
  const pendingPpjCount = unitPpj.filter((p) => p.status === 'menunggu_acc_pimpinan').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {activeMenu === 'acc_rekomendasi'
            ? 'Persetujuan Surat Rekomendasi (ACC)'
            : activeMenu === 'acc_tugas_belajar'
            ? 'Persetujuan Tugas Belajar Unit (ACC)'
            : activeMenu === 'acc_perpanjangan'
            ? 'Persetujuan Perpanjangan Masa Belajar'
            : activeMenu === 'monitoring_monev'
            ? 'Monitoring Monev & KHS Pegawai Unit'
            : activeMenu === 'monitoring_unit'
            ? 'Daftar Pegawai Unit Kerja'
            : 'Dashboard Pimpinan Unit Kerja'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {user.unit_kerja_nama} · Persetujuan usulan tugas belajar, perpanjangan, dan pantauan studi staf.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">ACC Rekomendasi</p>
          <p className="text-2xl font-bold font-mono text-orange-700 mt-1 tabular-nums">
            {pendingRekCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Menunggu persetujuan</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">ACC Tugas Belajar</p>
          <p className="text-2xl font-bold font-mono text-orange-700 mt-1 tabular-nums">
            {pendingTbCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Menunggu persetujuan</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">ACC Perpanjangan</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {pendingPpjCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Menunggu persetujuan</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Staf Sedang Belajar</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {unitTb.filter((t) => t.status === 'sedang_belajar').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Aktif kuliah di unit</p>
        </div>
      </div>

      {(activeMenu === 'dashboard' || activeMenu === 'acc_rekomendasi') && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Pengajuan Surat Rekomendasi</h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{unitRek.length} data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai</th>
                  <th className="py-3 px-4">Universitas & Program Studi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitRek.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-1.5" />
                      Belum ada pengajuan rekomendasi di unit ini.
                    </td>
                  </tr>
                ) : (
                  unitRek.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                        {r.no_registrasi}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{r.user_nama}</p>
                        <p className="text-[11px] font-mono text-slate-500">{r.user_nip}</p>
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                            r.status === 'menunggu_acc_pimpinan'
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {r.status === 'menunggu_acc_pimpinan' ? 'Tinjau & ACC' : 'Detail'}
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

      {(activeMenu === 'dashboard' || activeMenu === 'acc_tugas_belajar') && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Pengajuan Tugas Belajar Unit</h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{unitTb.length} data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai</th>
                  <th className="py-3 px-4">Jalur & Universitas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitTb.map((t) => (
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                          t.status === 'menunggu_acc_pimpinan'
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t.status === 'menunggu_acc_pimpinan' ? 'Tinjau & ACC' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeMenu === 'dashboard' || activeMenu === 'acc_perpanjangan') && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Usulan Perpanjangan Masa Belajar</h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{unitPpj.length} data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">Usulan TMT Selesai</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitPpj.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                      {p.no_registrasi}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{p.user_nama}</p>
                      <p className="text-[11px] text-slate-500">{p.unit_kerja_nama}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      +{p.tambahan_semester} smt · {formatDateIndo(p.tmt_selesai_usulan, true)}
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                          p.status === 'menunggu_acc_pimpinan'
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {p.status === 'menunggu_acc_pimpinan' ? 'Tinjau & ACC' : 'Detail'}
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
            <h2 className="text-base font-bold text-slate-900">Monitoring Monev & KHS Staf Unit</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">Pegawai</th>
                  <th className="py-3 px-4">Kampus & Prodi</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4 text-right">IPK Smt / Kum</th>
                  <th className="py-3 px-5">Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitMonev.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      Belum ada laporan monev KHS di unit kerja ini.
                    </td>
                  </tr>
                ) : (
                  unitMonev.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{m.user_nama}</td>
                      <td className="py-3.5 px-4">
                        {m.universitas} · {m.program_studi}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">Smt {m.semester}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums">
                        {m.ipk_semester.toFixed(2)} / {m.ipk_kumulatif.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-emerald-700">
                        {m.status_evaluasi.replace('_', ' ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeMenu === 'monitoring_unit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Pegawai di {user.unit_kerja_nama}</h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{unitStaff.length} pegawai</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">Nama & NIP</th>
                  <th className="py-3 px-4">Pangkat / Golongan</th>
                  <th className="py-3 px-4">Jabatan</th>
                  <th className="py-3 px-5">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      <Users className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                      Belum ada pegawai terdaftar di unit ini.
                    </td>
                  </tr>
                ) : (
                  unitStaff.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{st.nama_lengkap}</p>
                        <p className="font-mono text-[11px] text-slate-500">{st.nip}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{st.pangkat_golongan}</td>
                      <td className="py-3.5 px-4 text-slate-700">{st.jabatan}</td>
                      <td className="py-3.5 px-5 text-slate-500">{st.email}</td>
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
