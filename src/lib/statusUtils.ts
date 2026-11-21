import type { Role, RiwayatAlurItem } from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  pegawai: 'Pegawai',
  pimpinan_unit: 'Pimpinan Unit',
  admin_daerah: 'Admin Daerah',
  admin_kepegawaian: 'Admin Kepegawaian (Pusat)',
  super_admin: 'Super Admin',
  kepala_biro_kepegawaian: 'Kepala Biro Kepegawaian',
  pejabat_berwenang: 'Pejabat Pembina Kepegawaian (PPK)',
  pewawancara: 'Tim Pewawancara',
};

export function getRoleDisplayLabel(role: string): string {
  return ROLE_LABELS[role as Role] ?? role;
}

export const STATUS_LABELS: Record<string, string> = {
  diajukan: 'Diajukan Pegawai',
  menunggu_acc_pimpinan: 'Menunggu ACC Pimpinan Unit',
  ditolak_pimpinan: 'Ditolak Pimpinan Unit',
  menunggu_acc_admin_daerah: 'Menunggu ACC Admin Daerah',
  ditolak_admin_daerah: 'Ditolak Admin Daerah',
  verifikasi_admin: 'Verifikasi Admin Pusat',
  ditolak_admin: 'Ditolak Admin Pusat',
  menunggu_nilai_wawancara: 'Menunggu Penilaian Wawancara',
  seleksi_wawancara: 'Konfirmasi Hasil Wawancara',
  ditolak_pewawancara: 'Tidak Lulus Wawancara',
  menunggu_kelulusan_kampus: 'Menunggu Surat Lulus Kampus',
  surat_kampus_diunggah: 'Verifikasi Surat Kampus',
  seleksi_lanjutan: 'Seleksi Lanjutan',
  menunggu_konfirmasi_kabi: 'Menunggu Konfirmasi Kepala Biro',
  dikembalikan_kabi: 'Dikembalikan Kepala Biro',
  ditolak_kabi: 'Ditolak Kepala Biro',
  terkonfirmasi_kabi: 'Terkonfirmasi Kepala Biro',
  rekomendasi_terbit: 'Surat Rekomendasi Terbit',
  sk_pegawai_menunggu_verifikasi_admin: 'Verifikasi SK Pegawai',
  draft_sk_diunggah: 'Draft SK Diunggah',
  menunggu_ttd_ppk: 'Menunggu TTD Digital PPK',
  ditolak_ppk: 'Ditolak PPK',
  sk_terbit: 'SK Tugas Belajar Terbit',
  menunggu_perjanjian: 'Menunggu Perjanjian Beasiswa',
  perjanjian_ditandatangani: 'Verifikasi Perjanjian Beasiswa',
  sedang_belajar: 'Sedang Belajar Aktif',
  selesai_aktif: 'Selesai Studi / Aktif Kembali',
  lapor_selesai: 'Pelaporan Selesai Studi',
  verifikasi_pangkat: 'Verifikasi Pangkat (Admin)',
  menunggu_kenaikan_pangkat: 'Menunggu Kenaikan Pangkat',
  diusulkan_siasn: 'Diusulkan ke BKN / SIASN',
  ms: 'Memenuhi Syarat (MS)',
  bts: 'Berkas Tidak Sesuai (BTS)',
  tms: 'Tidak Memenuhi Syarat (TMS)',
  menunggu_acc_admin_pusat: 'Menunggu ACC Admin Pusat',
  menunggu_acc_kabiro: 'Menunggu ACC Kepala Biro',
  ditolak_kabiro: 'Ditolak Kepala Biro',
  menunggu_upload_sk_perpanjangan: 'Menunggu Penerbitan SK Perpanjangan',
  sk_perpanjangan_terbit: 'SK Perpanjangan Terbit',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function isRejectedStatus(status: string): boolean {
  return (
    status.startsWith('ditolak_') ||
    status === 'tms' ||
    status === 'bts'
  );
}

export function isReturnedStatus(status: string): boolean {
  return status === 'dikembalikan_kabi';
}

export function isFinalApprovedStatus(status: string): boolean {
  return [
    'rekomendasi_terbit',
    'sk_terbit',
    'sedang_belajar',
    'selesai_aktif',
    'ms',
    'sk_perpanjangan_terbit',
  ].includes(status);
}

export type SemanticTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function getStatusTone(status: string): SemanticTone {
  if (isFinalApprovedStatus(status)) return 'success';
  if (isRejectedStatus(status)) return 'danger';
  if (isReturnedStatus(status) || status === 'menunggu_kenaikan_pangkat') return 'warning';
  if (
    status.includes('menunggu_') ||
    status.includes('verifikasi_') ||
    status === 'diusulkan_siasn' ||
    status === 'terkonfirmasi_kabi' ||
    status === 'seleksi_wawancara' ||
    status === 'surat_kampus_diunggah' ||
    status === 'perjanjian_ditandatangani'
  ) {
    return 'info';
  }
  return 'neutral';
}

export function getStatusTextClass(status: string): string {
  const tone = getStatusTone(status);
  switch (tone) {
    case 'success':
      return 'text-emerald-700';
    case 'danger':
      return 'text-red-700';
    case 'warning':
      return 'text-amber-700';
    case 'info':
      return 'text-rose-700';
    default:
      return 'text-slate-600';
  }
}

export interface RejectionInfo {
  rejectedBy: string;
  roleLabel: string;
  reason: string;
  timestamp: string;
}

export function getRejectionInfo(
  riwayat: RiwayatAlurItem[],
  fallbackReason?: string
): RejectionInfo | null {
  const reversed = [...riwayat].reverse();
  const entry = reversed.find(
    (r) => r.status === 'ditolak' || r.status === 'dikembalikan'
  );
  if (!entry && !fallbackReason) return null;
  return {
    rejectedBy: entry?.actor_nama ?? 'Verifikator',
    roleLabel: entry ? getRoleDisplayLabel(entry.role) : 'Pejabat Verifikator',
    reason: entry?.catatan || fallbackReason || 'Berkas perlu diperbaiki sesuai ketentuan.',
    timestamp: entry?.timestamp ?? '',
  };
}

export interface UsulUlangQuota {
  used: number;
  max: number;
  remaining: number;
  canResubmit: boolean;
}

export function getUsulUlangQuota(
  usedCount: number,
  maxAllowed: number
): UsulUlangQuota {
  const remaining = Math.max(0, maxAllowed - usedCount);
  return {
    used: usedCount,
    max: maxAllowed,
    remaining,
    canResubmit: remaining > 0,
  };
}
