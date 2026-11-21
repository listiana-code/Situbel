import React, { useMemo } from 'react';
import {
  Eye,
  CheckCircle2,
  Users,
  FileText,
  GraduationCap,
  CalendarClock,
  BookOpen,
} from 'lucide-react';
import { KpiGraduatedStrip, PageBannerHeader } from '../components/KpiVisuals';
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
  const activeStudyCount = unitTb.filter((t) => t.status === 'sedang_belajar').length;

  const totalPending = pendingRekCount + pendingTbCount + pendingPpjCount;
  const totalUnitDocs = unitRek.length + unitTb.length + unitPpj.length;
  const processedCount = Math.max(0, totalUnitDocs - totalPending);
  const approvalRate = totalUnitDocs > 0 ? Math.round((processedCount / totalUnitDocs) * 100) : 100;

  const pageTitle =
    activeMenu === 'acc_rekomendasi'
      ? 'Persetujuan Surat Rekomendasi (ACC)'
      : activeMenu === 'acc_tugas_belajar'
      ? 'Persetujuan Tugas Belajar Unit (ACC)'
      : activeMenu === 'acc_perpanjangan'
      ? 'Persetujuan Perpanjangan Masa Belajar'
      : activeMenu === 'monitoring_monev'
      ? 'Monitoring Monev & KHS Pegawai Unit'
      : activeMenu === 'monitoring_unit'
      ? 'Daftar Pegawai Unit Kerja'
      : 'Dashboard Pimpinan Unit Kerja';

  return (
    <div className="space-y-6">
      <PageBannerHeader
        eyebrow={`PIMPINAN UNIT · ${user.unit_kerja_nama}`}
        title={pageTitle}
        description="Persetujuan usulan surat rekomendasi, tugas belajar, perpanjangan masa studi, serta pantauan progres studi staf unit."
        rightSlot={
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200/80 rounded-xl px-4 py-2.5">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A50D26]">
                Antrean ACC Unit
              </p>
              <p className="text-lg font-extrabold font-mono text-[#7F0C16] tabular-nums leading-tight">
                {totalPending} berkas
              </p>
            </div>
          </div>
        }
      />

      {/* Signature 4-Tier Graduated Crimson KPI Strip */}
      <KpiGraduatedStrip
        items={[
          {
            label: 'ACC Rekomendasi',
            value: pendingRekCount,
            sublabel: `${unitRek.length} total pengajuan unit`,
            icon: FileText,
          },
          {
            label: 'ACC Tugas Belajar',
            value: pendingTbCount,
            sublabel: `${unitTb.length} usulan beasiswa & mandiri`,
            icon: GraduationCap,
          },
          {
            label: 'ACC Perpanjangan',
            value: pendingPpjCount,
            sublabel: `${unitPpj.length} usulan perpanjangan studi`,
            icon: CalendarClock,
          },
          {
            label: 'Staf Sedang Belajar',
            value: activeStudyCount,
            sublabel: `${unitStaff.length} pegawai terdaftar di unit`,
            icon: BookOpen,
          },
        ]}
      />

      {(activeMenu === 'dashboard' || activeMenu === 'acc_rekomendasi') && (
        <div className="kpi-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pengajuan Surat Rekomendasi</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tinjau kelayakan rencana studi pegawai sebelum diteruskan ke Admin Daerah/Pusat.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200/80 text-xs font-mono font-bold text-[#A50D26] tabular-nums shrink-0">
              {unitRek.length} data
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse kpi-table">
              <thead>
                <tr>
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
                    <tr key={r.id}>
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                            r.status === 'menunggu_acc_pimpinan'
                              ? 'bg-[#C8102E] hover:bg-[#A50D26] text-white shadow-xs'
                              : 'bg-white border border-slate-200 hover:border-[#C8102E] hover:text-[#A50D26] text-slate-700'
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
        <div className="kpi-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pengajuan Tugas Belajar Unit</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pengajuan Tugas Belajar jalur Beasiswa maupun Biaya Mandiri.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200/80 text-xs font-mono font-bold text-[#A50D26] tabular-nums shrink-0">
              {unitTb.length} data
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse kpi-table">
              <thead>
                <tr>
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai</th>
                  <th className="py-3 px-4">Jalur & Universitas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitTb.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                          t.status === 'menunggu_acc_pimpinan'
                            ? 'bg-[#C8102E] hover:bg-[#A50D26] text-white shadow-xs'
                            : 'bg-white border border-slate-200 hover:border-[#C8102E] hover:text-[#A50D26] text-slate-700'
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
        <div className="kpi-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Usulan Perpanjangan Masa Belajar</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Persetujuan perpanjangan durasi semester studi pegawai unit.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200/80 text-xs font-mono font-bold text-[#A50D26] tabular-nums shrink-0">
              {unitPpj.length} data
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse kpi-table">
              <thead>
                <tr>
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">Usulan TMT Selesai</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {unitPpj.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                          p.status === 'menunggu_acc_pimpinan'
                            ? 'bg-[#C8102E] hover:bg-[#A50D26] text-white shadow-xs'
                            : 'bg-white border border-slate-200 hover:border-[#C8102E] hover:text-[#A50D26] text-slate-700'
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
        <div className="kpi-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Monitoring Monev & KHS Staf Unit</h2>
            <span className="px-2.5 py-1 rounded-md bg-red-50 text-xs font-mono font-bold text-[#A50D26]">
              {unitMonev.length} laporan
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse kpi-table">
              <thead>
                <tr>
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
                    <tr key={m.id}>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{m.user_nama}</td>
                      <td className="py-3.5 px-4">
                        {m.universitas} · {m.program_studi}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">Smt {m.semester}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                        {m.ipk_semester.toFixed(2)} / {m.ipk_kumulatif.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-emerald-700 capitalize">
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
        <div className="kpi-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Pegawai di {user.unit_kerja_nama}</h2>
            <span className="px-2.5 py-1 rounded-md bg-red-50 text-xs font-mono font-bold text-[#A50D26] tabular-nums">
              {unitStaff.length} pegawai
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse kpi-table">
              <thead>
                <tr>
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
                    <tr key={st.id}>
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
