import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { formatDateIndo, formatTimeIndo } from '../lib/dateUtils';
import { getRoleDisplayLabel, isRejectedStatus } from '../lib/statusUtils';
import type { RiwayatAlurItem, WorkflowStepConfig } from '../types';

export type StepperJenis =
  | 'rekomendasi'
  | 'beasiswa'
  | 'mandiri'
  | 'pencantuman_gelar'
  | 'perpanjangan';

interface StepperProps {
  steps?: WorkflowStepConfig[];
  currentStatus: string;
  jenis: StepperJenis;
  riwayat: RiwayatAlurItem[];
}

const PERPANJANGAN_STEPS: Array<{
  id: string;
  urutan: number;
  nama_step: string;
  role_penanggung_jawab: string;
}> = [
  { id: 'wf-ppj-1', urutan: 1, nama_step: 'Usulan Perpanjangan Pegawai', role_penanggung_jawab: 'pegawai' },
  { id: 'wf-ppj-2', urutan: 2, nama_step: 'Persetujuan Pimpinan Unit', role_penanggung_jawab: 'pimpinan_unit' },
  { id: 'wf-ppj-3', urutan: 3, nama_step: 'Verifikasi Admin Pusat', role_penanggung_jawab: 'admin_kepegawaian' },
  { id: 'wf-ppj-4', urutan: 4, nama_step: 'Persetujuan Kepala Biro', role_penanggung_jawab: 'kepala_biro_kepegawaian' },
  { id: 'wf-ppj-5', urutan: 5, nama_step: 'Penerbitan SK Perpanjangan', role_penanggung_jawab: 'admin_kepegawaian' },
];

function resolveActiveIndex(jenis: StepperJenis, status: string, totalSteps: number): number {
  if (jenis === 'rekomendasi') {
    const map: Record<string, number> = {
      diajukan: 0,
      menunggu_acc_pimpinan: 1,
      ditolak_pimpinan: 1,
      menunggu_acc_admin_daerah: 2,
      ditolak_admin_daerah: 2,
      verifikasi_admin: 3,
      ditolak_admin: 3,
      dikembalikan_kabi: 3,
      menunggu_konfirmasi_kabi: 4,
      ditolak_kabi: 4,
      terkonfirmasi_kabi: 5,
      rekomendasi_terbit: totalSteps,
    };
    return map[status] ?? 0;
  }
  if (jenis === 'beasiswa') {
    const map: Record<string, number> = {
      diajukan: 0,
      menunggu_acc_pimpinan: 1,
      ditolak_pimpinan: 1,
      menunggu_acc_admin_daerah: 2,
      ditolak_admin_daerah: 2,
      verifikasi_admin: 3,
      ditolak_admin: 3,
      menunggu_nilai_wawancara: 4,
      ditolak_pewawancara: 4,
      seleksi_wawancara: 5,
      menunggu_kelulusan_kampus: 6,
      surat_kampus_diunggah: 7,
      seleksi_lanjutan: 7,
      menunggu_konfirmasi_kabi: 7,
      dikembalikan_kabi: 7,
      ditolak_kabi: 7,
      terkonfirmasi_kabi: 8,
      draft_sk_diunggah: 8,
      menunggu_ttd_ppk: 8,
      ditolak_ppk: 8,
      sk_terbit: 9,
      menunggu_perjanjian: 9,
      perjanjian_ditandatangani: 9,
      sedang_belajar: totalSteps,
      selesai_aktif: totalSteps,
    };
    return map[status] ?? 0;
  }
  if (jenis === 'mandiri') {
    const map: Record<string, number> = {
      diajukan: 0,
      menunggu_acc_pimpinan: 1,
      ditolak_pimpinan: 1,
      menunggu_acc_admin_daerah: 2,
      ditolak_admin_daerah: 2,
      verifikasi_admin: 3,
      ditolak_admin: 3,
      dikembalikan_kabi: 3,
      menunggu_konfirmasi_kabi: 4,
      ditolak_kabi: 4,
      terkonfirmasi_kabi: 5,
      sk_pegawai_menunggu_verifikasi_admin: 5,
      draft_sk_diunggah: 5,
      menunggu_ttd_ppk: 6,
      ditolak_ppk: 6,
      sk_terbit: 7,
      sedang_belajar: totalSteps,
      selesai_aktif: totalSteps,
    };
    return map[status] ?? 0;
  }
  if (jenis === 'perpanjangan') {
    const map: Record<string, number> = {
      menunggu_acc_pimpinan: 1,
      ditolak_pimpinan: 1,
      menunggu_acc_admin_pusat: 2,
      ditolak_admin: 2,
      menunggu_acc_kabiro: 3,
      ditolak_kabiro: 3,
      menunggu_upload_sk_perpanjangan: 4,
      sk_perpanjangan_terbit: totalSteps,
    };
    return map[status] ?? 0;
  }
  // pencantuman_gelar
  const map: Record<string, number> = {
    lapor_selesai: 0,
    menunggu_acc_pimpinan: 1,
    ditolak_pimpinan: 1,
    menunggu_acc_admin_daerah: 2,
    ditolak_admin_daerah: 2,
    verifikasi_pangkat: 3,
    menunggu_kenaikan_pangkat: 3,
    diusulkan_siasn: 4,
    ms: totalSteps,
    bts: 5,
    tms: 5,
  };
  return map[status] ?? 0;
}

function getShortRoleLabel(role: string): string {
  const map: Record<string, string> = {
    pegawai: 'PEGAWAI',
    pimpinan_unit: 'PIMPINAN UNIT',
    admin_daerah: 'ADMIN DAERAH',
    admin_kepegawaian: 'ADMIN KEPEGAWAIAN',
    super_admin: 'SUPER ADMIN',
    kepala_biro_kepegawaian: 'KEPALA BIRO',
    pejabat_berwenang: 'PEJABAT BERWENANG',
    pewawancara: 'TIM PEWAWANCARA',
  };
  return map[role] ?? getRoleDisplayLabel(role).toUpperCase();
}

function findLogForStep(
  step: { urutan: number; nama_step: string; role_penanggung_jawab: string },
  stepIdx: number,
  riwayat: RiwayatAlurItem[],
  isDone: boolean,
  isCurrent: boolean
): RiwayatAlurItem | undefined {
  if (!isDone && !isCurrent) return undefined;
  if (riwayat.length === 0) return undefined;

  const keywords = step.nama_step
    .toLowerCase()
    .split(/[\s/&(),-]+/)
    .filter((w) => w.length >= 4);

  const exactMatch = [...riwayat].reverse().find((r) => {
    const t = r.tahap.toLowerCase();
    const roleMatches = r.role === step.role_penanggung_jawab;
    const textMatches = keywords.some((kw) => t.includes(kw));
    return roleMatches && textMatches;
  });
  if (exactMatch) return exactMatch;

  const roleMatch = [...riwayat]
    .reverse()
    .find((r) => r.role === step.role_penanggung_jawab);
  if (roleMatch && (isDone || stepIdx === 0)) return roleMatch;

  if (stepIdx < riwayat.length && isDone) {
    return riwayat[stepIdx];
  }
  return undefined;
}

export const Stepper: React.FC<StepperProps> = ({
  steps = [],
  currentStatus,
  jenis,
  riwayat,
}) => {
  const activeSteps =
    jenis === 'perpanjangan'
      ? PERPANJANGAN_STEPS
      : steps
          .filter((s) => s.jenis_pengajuan === jenis && s.is_active)
          .sort((a, b) => a.urutan - b.urutan);

  const totalSteps = activeSteps.length;
  const activeIdx = resolveActiveIndex(jenis, currentStatus, totalSteps);
  const rejected = isRejectedStatus(currentStatus);

  const currentStepName =
    activeIdx >= totalSteps
      ? 'Selesai / Aktif'
      : activeSteps[activeIdx]?.nama_step ?? 'Dalam Proses';

  const completedSteps = Math.min(totalSteps, Math.max(0, activeIdx));
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="kpi-card overflow-hidden">
      {/* Top Progress Accent Bar */}
      <div className="h-1.5 w-full bg-red-50">
        <div
          className={`h-full transition-all duration-300 ${
            rejected ? 'bg-red-600' : activeIdx >= totalSteps ? 'bg-emerald-600' : 'bg-[#C8102E]'
          }`}
          style={{ width: `${Math.max(6, progressPct)}%` }}
        />
      </div>

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-base font-extrabold text-slate-900">Alur Progres Pengajuan</h3>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                ({completedSteps}/{totalSteps} Tahapan)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Tahap saat ini:{' '}
              <span
                className={`font-bold ${
                  rejected
                    ? 'text-red-700'
                    : activeIdx >= totalSteps
                    ? 'text-emerald-700'
                    : 'text-[#A50D26]'
                }`}
              >
                {currentStepName}
              </span>
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold tabular-nums border ${
              rejected
                ? 'bg-red-50 text-red-700 border-red-200'
                : activeIdx >= totalSteps
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-[#A50D26] border-red-200'
            }`}
          >
            {progressPct}% Selesai
          </span>
        </div>

      {/* Horizontal Stepper Track */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <ol
          aria-label="Alur Progres Pengajuan"
          className="flex items-start min-w-max"
        >
          {activeSteps.map((step, idx) => {
            const isDone = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            const isRejectedStep = isCurrent && rejected;
            const matchingLog = findLogForStep(step, idx, riwayat, isDone, isCurrent);
            const fallbackLatestLog =
              isCurrent && !matchingLog && riwayat.length > 0
                ? riwayat[riwayat.length - 1]
                : undefined;
            const displayLog = matchingLog ?? (isRejectedStep ? fallbackLatestLog : undefined);

            const isFirst = idx === 0;
            const isLast = idx === totalSteps - 1;
            const leftLineDone = idx <= activeIdx;
            const rightLineDone = idx < activeIdx;

            return (
              <li
                key={step.id}
                className="relative flex flex-col items-center text-center w-[132px] sm:w-[144px] shrink-0 px-2"
              >
                {/* Connector Lines */}
                {!isFirst && (
                  <div
                    aria-hidden="true"
                    className={`absolute top-5 left-0 w-1/2 h-[2px] ${
                      leftLineDone
                        ? isRejectedStep
                          ? 'bg-red-300'
                          : 'bg-emerald-400'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className={`absolute top-5 right-0 w-1/2 h-[2px] ${
                      rightLineDone ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Node Circle */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold tabular-nums transition-colors ${
                    isRejectedStep
                      ? 'bg-red-600 text-white ring-4 ring-red-100'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-[#C8102E] text-white ring-4 ring-red-100'
                      : 'bg-white border-2 border-slate-300 text-slate-600'
                  }`}
                >
                  {isRejectedStep ? (
                    <X className="w-5 h-5 stroke-[2.5]" />
                  ) : isDone ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5 stroke-[2.2]" />
                  ) : (
                    <span>{step.urutan}</span>
                  )}
                </div>

                {/* Step Title */}
                <p
                  className={`mt-3 text-xs leading-snug line-clamp-3 ${
                    isRejectedStep
                      ? 'font-bold text-red-800'
                      : isCurrent
                      ? 'font-bold text-[#A50D26]'
                      : isDone
                      ? 'font-semibold text-slate-900'
                      : 'font-medium text-slate-500'
                  }`}
                >
                  {step.nama_step}
                </p>

                {/* Role Micro-label */}
                <p
                  className={`mt-1.5 text-[10px] font-semibold tracking-wide ${
                    isCurrent
                      ? 'text-[#A50D26]'
                      : isDone
                      ? 'text-slate-600'
                      : 'text-slate-500'
                  }`}
                >
                  {getShortRoleLabel(step.role_penanggung_jawab)}
                </p>

                {/* Date & Time (WIB) */}
                {displayLog && (
                  <div
                    className={`mt-1.5 text-[11px] font-medium tabular-nums leading-tight ${
                      isRejectedStep
                        ? 'text-red-700'
                        : isCurrent
                        ? 'text-indigo-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    <p>{formatDateIndo(displayLog.timestamp)}</p>
                    <p className="font-mono text-[10px] opacity-90 mt-0.5">
                      {formatTimeIndo(displayLog.timestamp)}
                    </p>
                  </div>
                )}

                {isCurrent && !displayLog && (
                  <div className="mt-1.5 text-[11px] font-medium text-indigo-600 tabular-nums leading-tight">
                    <p>Sedang diproses</p>
                    {riwayat.length > 0 && (
                      <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                        Masuk {formatDateIndo(riwayat[riwayat.length - 1].timestamp, true)},{' '}
                        {formatTimeIndo(riwayat[riwayat.length - 1].timestamp)}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      </div>
    </div>
  );
};
