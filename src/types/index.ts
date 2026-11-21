export type Role =
  | 'pegawai'
  | 'pimpinan_unit'
  | 'admin_daerah'
  | 'admin_kepegawaian'
  | 'super_admin'
  | 'kepala_biro_kepegawaian'
  | 'pejabat_berwenang'
  | 'pewawancara';

export type JenisPengajuan =
  | 'rekomendasi'
  | 'beasiswa'
  | 'mandiri'
  | 'pencantuman_gelar'
  | 'perpanjangan';

export type TahapRekomendasi =
  | 'diajukan'
  | 'menunggu_acc_pimpinan'
  | 'ditolak_pimpinan'
  | 'menunggu_acc_admin_daerah'
  | 'ditolak_admin_daerah'
  | 'verifikasi_admin'
  | 'ditolak_admin'
  | 'menunggu_konfirmasi_kabi'
  | 'dikembalikan_kabi'
  | 'ditolak_kabi'
  | 'terkonfirmasi_kabi'
  | 'rekomendasi_terbit';

export type TahapTugasBelajar =
  | 'diajukan'
  | 'menunggu_acc_pimpinan'
  | 'ditolak_pimpinan'
  | 'menunggu_acc_admin_daerah'
  | 'ditolak_admin_daerah'
  | 'verifikasi_admin'
  | 'ditolak_admin'
  | 'menunggu_nilai_wawancara'
  | 'seleksi_wawancara'
  | 'ditolak_pewawancara'
  | 'menunggu_kelulusan_kampus'
  | 'surat_kampus_diunggah'
  | 'seleksi_lanjutan'
  | 'menunggu_konfirmasi_kabi'
  | 'dikembalikan_kabi'
  | 'ditolak_kabi'
  | 'terkonfirmasi_kabi'
  | 'sk_pegawai_menunggu_verifikasi_admin'
  | 'draft_sk_diunggah'
  | 'menunggu_ttd_ppk'
  | 'ditolak_ppk'
  | 'sk_terbit'
  | 'menunggu_perjanjian'
  | 'perjanjian_ditandatangani'
  | 'sedang_belajar'
  | 'selesai_aktif';

export type TahapPencantumanGelar =
  | 'lapor_selesai'
  | 'menunggu_acc_pimpinan'
  | 'ditolak_pimpinan'
  | 'menunggu_acc_admin_daerah'
  | 'ditolak_admin_daerah'
  | 'verifikasi_pangkat'
  | 'menunggu_kenaikan_pangkat'
  | 'diusulkan_siasn'
  | 'ms'
  | 'bts'
  | 'tms';

export type TahapPerpanjangan =
  | 'menunggu_acc_pimpinan'
  | 'ditolak_pimpinan'
  | 'menunggu_acc_admin_pusat'
  | 'ditolak_admin'
  | 'menunggu_acc_kabiro'
  | 'ditolak_kabiro'
  | 'menunggu_upload_sk_perpanjangan'
  | 'sk_perpanjangan_terbit';

export interface User {
  id: string;
  nip: string;
  nama_lengkap: string;
  email: string;
  telepon?: string;
  password: string;
  role: Role;
  unit_kerja_id: string;
  unit_kerja_nama: string;
  pangkat_golongan: string;
  jabatan: string;
  status_aktif: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface UnitKerja {
  id: string;
  nama_unit: string;
  kode_unit: string;
  pimpinan_nama: string;
  pimpinan_user_id?: string;
  is_daerah?: boolean;
  created_at: string;
}

export type DocVerificationStatus = 'pending' | 'valid' | 'bts';

export interface DokumenItem {
  id: string;
  kode_dokumen: string;
  nama_dokumen: string;
  nama_file: string;
  file_url?: string;
  google_drive_file_id?: string;
  google_drive_path?: string;
  ukuran_mb: number;
  uploaded_at: string;
  status_verifikasi: DocVerificationStatus;
  catatan?: string;
}

export interface RiwayatAlurItem {
  id: string;
  tahap: string;
  role: Role | string;
  actor_nama: string;
  status: 'disetujui' | 'ditolak' | 'dikembalikan' | 'diproses' | 'terbit';
  catatan?: string;
  timestamp: string;
}

export interface RiwayatUsulUlangItem {
  ke: number;
  tanggal: string;
  alasan_ditolak_sebelumnya: string;
  ditolak_oleh: string;
  catatan_perbaikan: string;
}

export interface PengajuanRekomendasi {
  id: string;
  no_registrasi: string;
  user_id: string;
  user_nama: string;
  user_nip: string;
  unit_kerja_id: string;
  unit_kerja_nama: string;
  pangkat_golongan: string;
  jabatan: string;
  jenjang: 'D-IV' | 'S1' | 'S2' | 'S3' | 'Spesialis';
  program_studi: string;
  universitas_tujuan: string;
  akreditasi_prodi: string;
  akreditasi_univ: string;
  negara: string;
  tahun_akademik: string;
  jalur_rencana: 'beasiswa' | 'mandiri';
  status: TahapRekomendasi;
  dokumen: DokumenItem[];
  catatan_pimpinan?: string;
  catatan_admin_daerah?: string;
  catatan_admin?: string;
  catatan_kabi?: string;
  nomor_surat_rekomendasi?: string;
  tanggal_terbit_rekomendasi?: string;
  file_rekomendasi_nama?: string;
  file_rekomendasi_url?: string;
  diunggah_oleh_admin_nama?: string;
  usul_ulang_count: number;
  riwayat_usul_ulang: RiwayatUsulUlangItem[];
  riwayat_alur: RiwayatAlurItem[];
  created_at: string;
  updated_at: string;
}

export interface KelengkapanSK {
  nomor_sk: string;
  tanggal_sk: string;
  nama_pegawai: string;
  nip_pegawai: string;
  pangkat_golongan: string;
  jabatan: string;
  unit_kerja: string;
  universitas: string;
  program_studi: string;
  jenjang: string;
  akreditasi: string;
  sumber_dana: string;
  sponsor: string;
  tmt_mulai: string;
  tmt_selesai: string;
  kewajiban_khusus: string;
  pejabat_penandatangan: string;
  jabatan_penandatangan: string;
}

export interface SuratPerjanjianBeasiswa {
  nomor_perjanjian: string;
  pihak_pertama: string;
  pihak_kedua: string;
  universitas: string;
  durasi_semester: number;
  kewajiban_ikatan_dinas: string;
  file_nama?: string;
  file_url?: string;
  signed_at?: string;
  status_verifikasi: 'belum_isi' | 'diunggah' | 'disetujui' | 'ditolak';
  catatan_verifikasi?: string;
}

export interface LaporanProgresBulanan {
  id: string;
  bulan: string;
  tahun: number;
  status_studi:
    | 'aktif_kuliah'
    | 'praktikum_riset'
    | 'seminar_proposal'
    | 'penulisan_tesis'
    | 'ujian_kelulusan';
  sks_ditempuh: number;
  ipk_sementara: number;
  ringkasan_aktivitas: string;
  kendala?: string;
  bukti_nama?: string;
  bukti_url?: string;
  status_evaluasi: 'menunggu_review' | 'diterima' | 'perlu_perbaikan';
  catatan_admin?: string;
  created_at: string;
}

export interface PengajuanTugasBelajar {
  id: string;
  no_registrasi: string;
  jenis: 'beasiswa' | 'mandiri';
  rekomendasi_id?: string;
  no_rekomendasi?: string;
  user_id: string;
  user_nama: string;
  user_nip: string;
  unit_kerja_id: string;
  unit_kerja_nama: string;
  pangkat_golongan: string;
  jabatan: string;
  jenjang: 'D-IV' | 'S1' | 'S2' | 'S3' | 'Spesialis';
  program_studi: string;
  universitas_tujuan: string;
  akreditasi_prodi: string;
  dalam_luar_negeri: 'Dalam Negeri' | 'Luar Negeri';
  negara: string;
  durasi_semester: number;
  sumber_pendanaan: string;
  nama_beasiswa?: string;
  tmt_mulai: string;
  tmt_selesai: string;
  status: TahapTugasBelajar;
  dokumen: DokumenItem[];
  catatan_pimpinan?: string;
  catatan_admin_daerah?: string;
  catatan_admin?: string;
  catatan_pewawancara?: string;
  catatan_kabi?: string;
  catatan_ppk?: string;
  hasil_wawancara?: HasilWawancara;
  surat_lulus_kampus?: DokumenItem;
  kelengkapan_sk?: KelengkapanSK;
  file_sk_nama?: string;
  file_sk_url?: string;
  sk_signed_at?: string;
  sk_signer_nama?: string;
  sk_digital_hash?: string;
  sk_pegawai_file?: DokumenItem;
  perjanjian_beasiswa?: SuratPerjanjianBeasiswa;
  laporan_bulanan: LaporanProgresBulanan[];
  usul_ulang_count: number;
  riwayat_usul_ulang: RiwayatUsulUlangItem[];
  riwayat_alur: RiwayatAlurItem[];
  created_at: string;
  updated_at: string;
}

export interface PengajuanPencantumanGelar {
  id: string;
  no_registrasi: string;
  user_id: string;
  user_nama: string;
  user_nip: string;
  unit_kerja_id: string;
  unit_kerja_nama: string;
  pangkat_golongan: string;
  jabatan: string;
  pengajuan_tb_id?: string;
  jenjang: 'D-IV' | 'S1' | 'S2' | 'S3' | 'Spesialis';
  gelar_diperoleh: string;
  nama_kampus: string;
  program_studi: string;
  no_ijazah: string;
  tanggal_lulus: string;
  tanggal_lapor: string;
  batas_lapor_15_hari: string;
  tepat_waktu: boolean;
  pangkat_sesuai: boolean;
  catatan_pangkat?: string;
  status: TahapPencantumanGelar;
  periode_submit?: string;
  nomor_pertek_bkn?: string;
  catatan_bkn?: string;
  dokumen: DokumenItem[];
  riwayat_alur: RiwayatAlurItem[];
  created_at: string;
  updated_at: string;
}

export interface PengajuanPerpanjangan {
  id: string;
  no_registrasi: string;
  pengajuan_tb_id: string;
  no_reg_tb: string;
  user_id: string;
  user_nama: string;
  user_nip: string;
  unit_kerja_id: string;
  unit_kerja_nama: string;
  universitas_tujuan: string;
  program_studi: string;
  tmt_selesai_lama: string;
  tmt_selesai_usulan: string;
  tambahan_semester: number;
  alasan_perpanjangan: string;
  status: TahapPerpanjangan;
  dokumen: DokumenItem[];
  catatan_pimpinan?: string;
  catatan_admin?: string;
  catatan_kabiro?: string;
  nomor_sk_perpanjangan?: string;
  tanggal_sk_perpanjangan?: string;
  tmt_selesai_disetujui?: string;
  file_sk_perpanjangan_nama?: string;
  file_sk_perpanjangan_url?: string;
  riwayat_alur: RiwayatAlurItem[];
  created_at: string;
  updated_at: string;
}

export interface LaporanMonev {
  id: string;
  pengajuan_tb_id: string;
  no_reg_tb: string;
  user_id: string;
  user_nama: string;
  user_nip: string;
  unit_kerja_id: string;
  unit_kerja_nama: string;
  universitas: string;
  program_studi: string;
  semester: number;
  tahun_akademik: string;
  ipk_semester: number;
  ipk_kumulatif: number;
  ringkasan_progres: string;
  kendala?: string;
  khs_file_nama: string;
  khs_file_url?: string;
  status_evaluasi: 'menunggu_review' | 'diterima' | 'perlu_perbaikan';
  catatan_evaluasi_admin?: string;
  created_at: string;
}

export interface WorkflowStepConfig {
  id: string;
  jenis_pengajuan: 'rekomendasi' | 'beasiswa' | 'mandiri' | 'pencantuman_gelar';
  urutan: number;
  nama_step: string;
  role_penanggung_jawab: Role | string;
  punya_opsi_tolak: boolean;
  is_active: boolean;
}

export interface RequiredDocumentConfig {
  id: string;
  jenis_pengajuan: 'rekomendasi' | 'beasiswa' | 'mandiri' | 'pencantuman_gelar';
  kode_dokumen: string;
  nama_dokumen: string;
  wajib: boolean;
  format_diizinkan: string;
  max_size_mb: number;
  keterangan: string;
  has_template?: boolean;
  template_format?: 'doc' | 'pdf';
  template_file_base64?: string;
  template_file_name?: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_nama: string;
  user_role: Role;
  aksi: string;
  entitas: string;
  detail: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  target_user_id?: string;
  target_role?: Role;
  target_unit_id?: string;
  judul: string;
  pesan: string;
  ref_type?: JenisPengajuan;
  ref_id?: string;
  is_read: boolean;
  created_at: string;
}

export type SkalaWawancara = 'MS' | 'CMS' | 'KMS' | 'TMS';

export interface SoalWawancara {
  id: string;
  kategori: string;
  pertanyaan: string;
  panduan_penilaian: string;
  jenis: 'wajib' | 'acak';
  is_active: boolean;
}

export interface JawabanWawancaraItem {
  soal_id: string;
  kategori: string;
  pertanyaan: string;
  jenis: 'wajib' | 'acak';
  skala: SkalaWawancara;
  skor: number;
  catatan?: string;
}

export interface HasilWawancara {
  id: string;
  pengajuan_tb_id: string;
  pewawancara_id: string;
  pewawancara_nama: string;
  tanggal_wawancara: string;
  jawaban: JawabanWawancaraItem[];
  rata_rata_skor: number;
  passing_grade: number;
  rekomendasi_hasil: 'lulus' | 'tidak_lulus' | 'pertimbangan';
  catatan_umum: string;
}

export interface PengaturanWawancara {
  passing_grade: number;
  jumlah_soal_acak: number;
}

export interface PengaturanSistem {
  max_usul_ulang: number;
  nama_instansi: string;
  tahun_anggaran_aktif: string;
}

export interface DossierTarget {
  type: 'rekomendasi' | 'tugas_belajar' | 'pencantuman_gelar';
  id: string;
}
