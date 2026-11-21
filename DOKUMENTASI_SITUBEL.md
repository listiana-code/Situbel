# Dokumentasi Lengkap Project SiMantab / SITUBEL

> **Untuk AI Agent:** Dokumen ini adalah versi Markdown terstruktur dari `Dokumentasi_SITUBEL_SiMantab_ee60df4c.pdf` (sumber: `SiMantab-main.zip`, disusun 21 November 2026) yang dioptimalkan agar cepat dipindai oleh coding agent. Seluruh nama file, enum status, peran, handler, skema database, akun demo, dan daftar risiko dipertahankan utuh.

## Quick Reference (Ringkasan Cepat)

| Field | Nilai |
| --- | --- |
| **Nama Aplikasi** | SITUBEL — Sistem Informasi Tugas Belajar Terpadu (BASARNAS) |
| **Arsip Sumber** | `SiMantab-main.zip` (2.366.005 byte; 76 entri; ±3,9 MB setelah ekstrak) |
| **Stack** | SPA: React 19 + TypeScript + Vite 8 + Tailwind CSS v4 |
| **Asal Project** | Google AI Studio (`public/assets/aistudio/`, `metadata.json`, flag `DISABLE_HMR`) |
| **Ukuran Kode** | ±31.800 baris di `src/` (TypeScript/TSX) |
| **Persistence Saat Ini** | `localStorage` browser (mode demo); Supabase & Google Drive masih berupa stub/simulasi |
| **Jumlah Peran** | **8 peran** di kode (`README.md` lama hanya menyebut 5) |
| **Regulasi Acuan** | SE Menpan RB No. 28/2021 · SE Kepala BKN No. 15/2024 · Perka Basarnas No. 10/2024 |

---

## Daftar Isi

1. [Ringkasan Project](#1-ringkasan-project)
2. [Teknologi & Cara Menjalankan](#2-teknologi--cara-menjalankan)
3. [Struktur Folder Lengkap](#3-struktur-folder-lengkap)
4. [Penjelasan File di Root](#4-penjelasan-file-di-root)
5. [Arsitektur Kode (`src/`)](#5-arsitektur-kode-src)
6. [Peran, Menu, & Alur Kerja](#6-peran-menu--alur-kerja)
7. [Dokumen Wajib & Template (`REQUIRED_DOCS`)](#7-dokumen-wajib--template-required_docs)
8. [Data Demo Bawaan](#8-data-demo-bawaan)
9. [Database (`supabase_schema.sql` & `seed.sql`)](#9-database-supabase_schemasql--seedsql)
10. [API Lapisan Data (`Storage`)](#10-api-lapisan-data-storage)
11. [Konfigurasi, Deployment, & Temuan Risiko](#11-konfigurasi-deployment--temuan-risiko)
12. [Aset Gambar (`public/assets/aistudio/`)](#12-aset-gambar-publicassetsaistudio)
13. [Cakupan Pembacaan (Transparansi)](#13-cakupan-pembacaan-transparansi)

---

## 1. Ringkasan Project

SITUBEL (Sistem Informasi Tugas Belajar Terpadu) mendigitalkan layanan pengembangan kompetensi PNS jalur pendidikan di lingkungan **BASARNAS** (Badan Nasional Pencarian dan Pertolongan):

1. **Surat Rekomendasi Tugas Belajar**
2. **Tugas Belajar Beasiswa**
3. **Tugas Belajar Biaya Mandiri**
4. **Perpanjangan Masa Belajar**
5. **Pencantuman Gelar** pasca studi (pengusulan ke BKN / SIASN)

**Dasar Regulasi:**
- **SE Menpan RB No. 28/2021** — Pengembangan Kompetensi PNS Jalur Pendidikan
- **SE Kepala BKN No. 15/2024** — Pedoman Teknis Pencantuman Gelar & Uji Kompetensi
- **Perka Basarnas No. 10/2024** — Pedoman Tugas Belajar di Lingkungan Basarnas

---

## 2. Teknologi & Cara Menjalankan

### 2.1 Dependensi (`package.json`)

| Paket | Versi | Fungsi | Status Pemakaian |
| --- | --- | --- | --- |
| `react`, `react-dom` | `^19.0.1` | Library UI | Aktif |
| `vite`, `@vitejs/plugin-react` | `^8.3.0` / `^6.1.1` | Build tool & dev server | Aktif |
| `tailwindcss`, `@tailwindcss/vite`, `autoprefixer` | `^4.3.3` / `^4.3.3` / `^10.4.21` | Styling utility-first | Aktif |
| `jspdf` | `^4.2.1` | Generate PDF surat, dokumen, template di browser | Aktif |
| `lucide-react` | `^0.546.0` | Ikon | Aktif |
| `motion` | `^12.23.24` | Animasi | Aktif |
| `canvas-confetti` (+ tipe) | `^1.9.4` | Efek konfeti perayaan | Aktif |
| `typescript` | `^7.0.2` | Type checking (`tsc --noEmit`) | Aktif |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/express` | — | Definisi tipe | Dev |
| `@google/genai` | `^2.4.0` | SDK Gemini | **Tidak diimpor di `src/`** |
| `express`, `dotenv`, `tsx`, `esbuild` | `^4.21.2` / `^17.2.3` / `^4.21.2` / `^0.25.0` | Server & tooling | **Tidak terpakai di `src/`** |

### 2.2 Script NPM

```bash
npm run dev       # vite --port=3000 --host=0.0.0.0
npm run build     # vite build
npm run preview   # vite preview
npm run clean     # rm -rf dist server.js
npm run lint      # tsc --noEmit
```

### 2.3 Konfigurasi Build

- `vite.config.ts`: plugin React + Tailwind, alias `@` ke root project, HMR dapat dimatikan via `DISABLE_HMR=true`.
- `tsconfig.json`: `target: ES2022`, `module: ESNext`, `jsx: react-jsx`, `moduleResolution: bundler`, `noEmit: true`, path alias `@/*`.
- `index.html`: judul `SITUBEL - Sistem Informasi Tugas Belajar`, meta SEO/OG/Twitter, mount `#root`, entrypoint `/src/main.tsx`.
- `bun.lock`: lockfile Bun (78 KB).

---

## 3. Struktur Folder Lengkap

Seluruh 76 entri pada arsip `SiMantab-main.zip` (ukuran dalam byte):

```text
SiMantab-main/
├── .env.example                    763
├── .gitignore                      73
├── README.md                       4.723
├── bun.lock                        78.189
├── index.html                      863
├── metadata.json                   329
├── package.json                    983
├── seed.sql                        5.223
├── supabase_schema.sql             10.095
├── tsconfig.json                   538
├── vite.config.ts                  705
├── public/assets/aistudio/         19 berkas PNG (lihat Bab 12)
└── src/
    ├── App.tsx                     11.192
    ├── main.tsx                    159
    ├── index.css                   129
    ├── components/
    │   ├── AlertProvider.tsx       7.953
    │   ├── DigitalSignModal.tsx    9.751
    │   ├── DocumentViewerModal.tsx 8.401
    │   ├── Header.tsx              32.256
    │   ├── Pagination.tsx          4.593
    │   ├── PerpanjanganDetailModal.tsx 30.802
    │   ├── ProfileModal.tsx        26.518
    │   ├── RejectReasonModal.tsx   5.330
    │   ├── Sidebar.tsx             28.232
    │   ├── Stepper.tsx             31.677
    │   ├── Toast.tsx               3.783
    │   ├── UsulUlangBadge.tsx      7.209
    │   └── UsulUlangModal.tsx      31.261
    ├── data/
    │   └── mockData.ts             73.226
    ├── lib/
    │   ├── dateUtils.ts            2.711
    │   ├── fileUtils.ts            1.238
    │   ├── googleDrive.ts          1.649
    │   ├── pdfDownloader.ts        12.159
    │   ├── statusUtils.ts          4.415
    │   ├── storage.ts              36.818
    │   ├── supabaseClient.ts       1.258
    │   └── templateDownloader.ts   10.901
    ├── types/
    │   └── index.ts                18.907
    └── views/
        ├── AdminDashboard.tsx      402.442
        ├── DetailPengajuanModal.tsx 260.382
        ├── KepalaBiroDashboard.tsx 48.160
        ├── LoginView.tsx           8.561
        ├── PPKDashboard.tsx        16.369
        ├── PegawaiDashboard.tsx    289.235
        ├── PewawancaraDashboard.tsx 38.839
        ├── PimpinanDashboard.tsx   82.361
        ├── ProfileSettingsView.tsx 33.267
        └── RegisterView.tsx        10.180
```

---

## 4. Penjelasan File di Root

| File | Ringkasan Isi & Fungsi |
| --- | --- |
| `README.md` | Judul SITUBEL, dasar regulasi, deskripsi 5 peran (tidak sinkron dengan kode), panduan setup Supabase & Google Drive Service Account, env vars, deploy Vercel, daftar akun demo. |
| `package.json` | Paket `react-example` (`private: true`, `type: module`), script & dependensi. |
| `bun.lock` | Lockfile Bun. |
| `index.html` | Induk SPA dengan meta SEO & Open Graph. |
| `metadata.json` | Metadata AI Studio (`requestFramePermissions: []`, `majorCapabilities: MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`). |
| `vite.config.ts` | Konfigurasi Vite (React, Tailwind, alias `@`, `DISABLE_HMR`). |
| `tsconfig.json` | Konfigurasi TypeScript. |
| `.env.example` | Daftar env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `APP_JWT_SECRET`, `GEMINI_API_KEY`, `APP_URL`. |
| `.gitignore` | Abaikan `node_modules`, `build`, `dist`, `coverage`, `.DS_Store`, `*.log`, `.env*` (kecuali `.env.example`). |
| `supabase_schema.sql` | Skema 13 tabel PostgreSQL + RLS (lihat Bab 9). |
| `seed.sql` | Data awal: 5 unit kerja, 6 pengguna, 24 langkah workflow. |

---

## 5. Arsitektur Kode (`src/`)

### 5.1 Berkas Inti

| File | Fungsi |
| --- | --- |
| `src/main.tsx` | Mount `<App />` ke `#root` dan import `index.css`. |
| `src/index.css` | Import Tailwind, `overflow-x: hidden`, `max-width: 100vw`, `box-sizing: border-box`. |
| `src/App.tsx` | Komponen akar: state user aktif (`Storage`), sidebar (`situbel_sidebar_open`), menu aktif, prefill pengajuan; routing antara `LoginView`/`RegisterView` vs shell utama (`Header`, `Sidebar`, dashboard per peran, footer + Reset Data Demo, `DetailPengajuanModal`, `ProfileModal`); listener event `situbel_user_change`. |

### 5.2 Utilitas & Lapisan Data (`src/lib/`)

| File | Fungsi |
| --- | --- |
| `storage.ts` (908 baris) | Persistence berbasis `localStorage` dengan key prefix `situbel_*` (`_current_user`, `_users`, `_unit_kerja`, `_rekomendasi`, `_pengajuan_tb`, `_pencantuman_gelar`, `_monev`, `_perpanjangan`, `_workflow_steps`, `_required_docs`, `_audit_logs`, `_notifications`, `_soal_wawancara`, `_pengaturan_wawancara`, `_pengaturan_sistem`). Menangani CRUD, merge seed yang hilang, deduplikasi audit/notif, serta alur khusus. |
| `supabaseClient.ts` | **Stub** klien Supabase: membaca `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` dari `process.env`; `from().select/insert/update/delete` & `auth.getUser/signOut` hanya mengembalikan data kosong. |
| `googleDrive.ts` | **Simulasi** upload Drive: `uploadToDrive()` menghasilkan `fileId` acak, nama ter-sanitasi, ukuran MB, dan link palsu; `generateGoogleDrivePath()` menyusun `Root/{Jenis}/{NIP_Nama}/{IDPengajuan}`. |
| `fileUtils.ts` | `readUploadedFileAsUrl()`: ubah file upload ke Data URL (≤ 2,5 MB) atau Object URL untuk pratinjau. |
| `dateUtils.ts` | `formatDateIndo`, `formatTimeIndo`, `formatDateTimeIndo`, `formatDateTimeDetailed` (format Indonesia + WIB). |
| `statusUtils.ts` | `isRejectedStatus`, `isFinalApprovedStatus`, `getRoleDisplayLabel`, `getRejectionInfo`, `getUsulUlangQuota`. |
| `pdfDownloader.ts` | `downloadDocumentAsPdf()`: unduh `.pdf` dari blob URL jika ada, atau generate PDF resmi dengan `jsPDF` (nomor surat, pegawai, unit, universitas, prodi, sumber dana, TMT, penandatangan). |
| `templateDownloader.ts` | `downloadTemplateDocument()`: unduh template kustom base64 yang diunggah admin, atau generate otomatis `.doc`/`.pdf`. |

### 5.3 Model Data (`src/types/index.ts`, 605 baris)

- **`Role`** (8 nilai):
  `pegawai` | `pimpinan_unit` | `admin_daerah` | `admin_kepegawaian` | `super_admin` | `kepala_biro_kepegawaian` | `pejabat_berwenang` | `pewawancara`
- **`JenisPengajuan`** (5 nilai):
  `rekomendasi` | `beasiswa` | `mandiri` | `pencantuman_gelar` | `perpanjangan`
- **`TahapRekomendasi`** (12 status):
  `diajukan`, `menunggu_acc_pimpinan`, `ditolak_pimpinan`, `menunggu_acc_admin_daerah`, `ditolak_admin_daerah`, `verifikasi_admin`, `ditolak_admin`, `menunggu_konfirmasi_kabi`, `dikembalikan_kabi`, `ditolak_kabi`, `terkonfirmasi_kabi`, `rekomendasi_terbit`
- **`TahapTugasBelajar`** (26 status):
  `diajukan`, `menunggu_acc_pimpinan`, `ditolak_pimpinan`, `menunggu_acc_admin_daerah`, `ditolak_admin_daerah`, `verifikasi_admin`, `ditolak_admin`, `menunggu_nilai_wawancara`, `seleksi_wawancara`, `ditolak_pewawancara`, `menunggu_kelulusan_kampus`, `surat_kampus_diunggah`, `seleksi_lanjutan`, `menunggu_konfirmasi_kabi`, `dikembalikan_kabi`, `ditolak_kabi`, `terkonfirmasi_kabi`, `sk_pegawai_menunggu_verifikasi_admin`, `draft_sk_diunggah`, `menunggu_ttd_ppk`, `ditolak_ppk`, `sk_terbit`, `menunggu_perjanjian`, `perjanjian_ditandatangani`, `sedang_belajar`, `selesai_aktif`
- **`TahapPencantumanGelar`** (11 status):
  `lapor_selesai`, `menunggu_acc_pimpinan`, `ditolak_pimpinan`, `menunggu_acc_admin_daerah`, `ditolak_admin_daerah`, `verifikasi_pangkat`, `menunggu_kenaikan_pangkat`, `diusulkan_siasn`, `ms` *(Memenuhi Syarat)*, `bts` *(Berkas Tidak Sesuai)*, `tms` *(Tidak Memenuhi Syarat)*
- **`TahapPerpanjangan`** (8 status):
  `menunggu_acc_pimpinan`, `ditolak_pimpinan`, `menunggu_acc_admin_pusat`, `ditolak_admin`, `menunggu_acc_kabiro`, `ditolak_kabiro`, `menunggu_upload_sk_perpanjangan`, `sk_perpanjangan_terbit`
- **Entitas Utama**:
  `User`, `UnitKerja`, `DokumenItem`, `PengajuanRekomendasi`, `PengajuanTugasBelajar`, `PengajuanPencantumanGelar`, `PengajuanPerpanjangan`, `LaporanMonev`, `LaporanProgresBulanan`, `KelengkapanSK`, `RiwayatAlurItem`, `RiwayatUsulUlangItem`, `PengaturanSistem` (`max_usul_ulang`, default `2`), `WorkflowStepConfig`, `RequiredDocumentConfig`, `AuditLog`, `AppNotification`, `SoalWawancara`, `OpsiPenilaian`, `JawabanWawancaraItem`, `HasilWawancara`, `PengaturanWawancara`

### 5.4 Data Contoh (`src/data/mockData.ts`, 1.776 baris)

Konstanta awal yang dimuat saat inisialisasi atau reset:
- `INITIAL_USERS` (9 akun)
- `INITIAL_UNIT_KERJA` (8 unit)
- `INITIAL_REKOMENDASI` (3), `INITIAL_PENGAJUAN_TB` (7), `INITIAL_PENCANTUMAN_GELAR` (1), `INITIAL_MONEV`, `INITIAL_PERPANJANGAN` (1)
- `INITIAL_WORKFLOW_STEPS` (6 rekomendasi, 11 beasiswa, 8 mandiri, 6 pencantuman gelar)
- `INITIAL_REQUIRED_DOCS`, `INITIAL_AUDIT_LOGS`, `INITIAL_NOTIFICATIONS`, `INITIAL_PENGATURAN_WAWANCARA`, `INITIAL_SOAL_WAWANCARA` (10 soal)

### 5.5 Komponen (`src/components/`)

| Komponen | Fungsi |
| --- | --- |
| `Header.tsx` | Toggle sidebar, pencarian global (no. reg, no. SK, NIP, nama; min. 2 huruf), notifikasi pop-over, demo role switcher 1-klik, menu profil & logout. |
| `Sidebar.tsx` | Menu dropdown bertingkat per peran (desktop & mobile), badge hitung antrean, bagian Pengaturan Akun. |
| `Stepper.tsx` | Timeline tahapan (selesai, aktif, ditolak, terkunci) dengan tanggal/jam dari `riwayat_alur`. |
| `DocumentViewerModal.tsx` | Pratinjau PDF/gambar + tombol unduh. |
| `DigitalSignModal.tsx` | Simulasi TTD elektronik BSrE/BSN; generate hash `DS-BSN-…` via `crypto.getRandomValues`. |
| `RejectReasonModal.tsx` | Dialog wajib isi alasan penolakan/pengembalian berkas. |
| `UsulUlangModal.tsx` | Form pengajuan ulang setelah ditolak (info penolakan, catatan perbaikan, upload berkas, sisa kuota). |
| `UsulUlangBadge.tsx` | Komponen `UsulUlangBadge` & `UsulUlangNotice` penampil sisa kuota usul ulang. |
| `PerpanjanganDetailModal.tsx` | Detail usulan perpanjangan + ACC/tolak per peran + upload SK perpanjangan. |
| `ProfileModal.tsx` | Edit profil, foto (kamera HP/galeri JPG/PNG/WebP), dan kata sandi. |
| `Pagination.tsx` | Navigasi halaman tabel. |
| `Toast.tsx` | `ToastProvider` / `useToast` (`success`, `info`, `warning`, `error`). |
| `AlertProvider.tsx` | `AlertProvider` / `useAlert` (`showAlert`, `showConfirm`; tone `info`, `warning`, `danger`). |

### 5.6 Layar per Peran (`src/views/`)

| File | Baris (Arsip) | Fungsi |
| --- | --- | --- |
| `LoginView.tsx` | 201 | Login NIP + kata sandi & Quick Login 1-klik. Menolak NIP tak terdaftar/nonaktif. *(Catatan: di arsip asli password tidak diverifikasi — lihat Bab 11)*. |
| `RegisterView.tsx` | 245 | Registrasi mandiri pegawai (NIP unik, nama, unit, pangkat, jabatan, password min. 6 + konfirmasi). |
| `PegawaiDashboard.tsx` | 5.105 | Pengajuan rekomendasi (4 berkas wajib), TB beasiswa & mandiri, unggah surat lulus kampus, SK mandiri, perjanjian, laporan bulanan, monev/KHS, perpanjangan, pencantuman gelar, riwayat. |
| `PimpinanDashboard.tsx` | 1.599 | ACC/tolak rekomendasi, TB, dan perpanjangan; monitoring monev/KHS & pegawai unit. |
| `AdminDashboard.tsx` | 7.535 | Dipakai `admin_kepegawaian`, `super_admin`, `admin_daerah`: verifikasi, seleksi, SK dinamis, perpanjangan, SIASN, bank soal, monev, konfigurasi alur & berkas, manajemen user, master unit, audit log. |
| `KepalaBiroDashboard.tsx` | 943 | Read & Confirm rekomendasi, TB, perpanjangan; monitoring monev daerah; riwayat konfirmasi. |
| `PPKDashboard.tsx` | 340 | Antrean draft SK menunggu TTD, TTD digital, arsip SK, verifikasi BSrE, tolak draft SK. |
| `PewawancaraDashboard.tsx` | 804 | Sesi penilaian wawancara & riwayat penilaian. |
| `DetailPengajuanModal.tsx` | 4.777 | Dossier universal: seluruh handler aksi tiap peran (Bab 6.3) dan timeline progres. |
| `ProfileSettingsView.tsx` | 716 | Pengaturan profil penuh (foto, identitas, kontak, jabatan, pangkat, unit, ganti sandi). |

---

## 6. Peran, Menu, & Alur Kerja

### 6.1 Matriks Peran & Menu Sidebar

| Peran | Menu ID → Label |
| --- | --- |
| `pegawai` | `dashboard`; `details_berkas` (Detail & Berkas); **Layanan**: `rekomendasi`, `pengajuan_beasiswa`, `pengajuan_mandiri`, `alur_beasiswa`; **Progres & Kelulusan**: `monev`, `perpanjangan`, `pencantuman_gelar`; `riwayat` |
| `pimpinan_unit` | `dashboard`; **ACC**: `acc_rekomendasi`, `acc_tugas_belajar`, `acc_perpanjangan`; `monitoring_monev`; `monitoring_unit` |
| `admin_kepegawaian` | `dashboard`; **Verifikasi & Layanan**: `seleksi_beasiswa`, `tubel_mandiri`, `verif_rekomendasi`, `draft_sk_admin`, `perpanjangan_studi`, `siasn_bkn`; **Wawancara & Evaluasi**: `bank_soal`, `evaluasi_monev`; **Pengaturan**: `konfigurasi_alur`, `konfigurasi_berkas`, `manajemen_user`, `master_unit`, `audit_log` |
| `admin_daerah` | `dashboard`; **Layanan & ACC Daerah**: `seleksi_beasiswa`, `tubel_mandiri`, `verif_rekomendasi`, `draft_sk_admin`, `siasn_bkn`; `manajemen_user` (pegawai daerah); `evaluasi_monev`; `perpanjangan_studi`; `audit_log` |
| `super_admin` | Seluruh menu `admin_kepegawaian` + pengelolaan penuh semua akun & master sistem |
| `pewawancara` | `dashboard`; `sesi_wawancara` (Penilaian Wawancara); `riwayat_penilaian` |
| `kepala_biro_kepegawaian` | `dashboard`; **Konfirmasi**: `konfirmasi_tugas_belajar` (Buka SK), `konfirmasi_rekomendasi`, `konfirmasi_perpanjangan`; `monitoring_monev`; `riwayat_konfirmasi` |
| `pejabat_berwenang` (PPK) | Menu khusus `PPKDashboard`: draft SK menunggu TTD, arsip SK, verifikasi BSrE |

> Semua peran juga memiliki menu `setting_profil` (**Pengaturan Profil**).

### 6.2 Alur Persetujuan (`workflow_steps` di `mockData.ts`)

1. **Surat Rekomendasi (6 langkah):**
   `Pegawai ajukan` → `ACC Pimpinan Unit` → `ACC Admin Daerah` → `Verifikasi Admin Pusat` → `Read & Confirm Kepala Biro` → `Penerbitan & Upload Surat Rekomendasi (Admin Pusat)`
2. **Tugas Belajar Beasiswa (11 langkah):**
   `Pendaftaran Pegawai` → `ACC Pimpinan Unit` → `ACC Admin Daerah` → `Seleksi Administrasi (Admin Pusat)` → `Penilaian Wawancara (Tim Pewawancara)` → `Konfirmasi Kelulusan Wawancara (Admin Pusat)` → `Seleksi Kampus & Upload Surat Lulus (Pegawai)` → `Verifikasi Kampus & Konfirmasi Kepala Biro` → `Draft/Upload SK (Admin Pusat) + TTD Digital PPK` → `Isi & Upload Surat Perjanjian Bermaterai (Pegawai)` → `Sedang Belajar Aktif & Laporan Progres Bulanan`
3. **Tugas Belajar Mandiri (8 langkah):**
   `Daftar & Upload Berkas + Rekomendasi` → `Izin & Rekomendasi Pimpinan Unit` → `ACC Admin Daerah` → `Verifikasi Berkas & Jadwal Dinas (Admin Pusat)` → `Konfirmasi Kepala Biro` → `Penyusunan Data & Upload Draft SK (Admin Pusat)` → `Reviu & TTD Digital SK (PPK)` → `Komitmen Mandiri & SK Terbit (Pegawai)`
4. **Pencantuman Gelar (6 langkah):**
   `Lapor Selesai Studi (maks. 15 hari kerja)` → `ACC Pimpinan Unit` → `ACC Admin Daerah` → `Verifikasi Berkas & Kesesuaian Pangkat (Admin Pusat)` → `Usulan ke BKN/SIASN (linimasa dua bulanan)` → `Pencatatan Hasil BKN (MS / BTS / TMS)`
5. **Perpanjangan Masa Belajar:**
   `Usulan Pegawai` → `ACC Pimpinan Unit` → `ACC Admin Pusat` → `ACC Kepala Biro` → `Upload SK Perpanjangan oleh Admin Pusat` *(otomatis memperbarui durasi & TMT selesai pada TB induk)*

> **Catatan:** `seed.sql` hanya memuat versi ringkas (24 langkah, tanpa Admin Daerah & Pewawancara). Aplikasi memakai versi lengkap di `mockData.ts`.

### 6.3 Handler Aksi di `DetailPengajuanModal.tsx`

| Peran | Daftar Handler |
| --- | --- |
| **Pimpinan Unit** | `handlePimpinanAccRekomendasi`, `handlePimpinanRejectRekomendasi`, `handlePimpinanAccTB`, `handlePimpinanRejectTB` |
| **Admin Daerah** | `handleAdminDaerahAccRekomendasi`, `handleAdminDaerahRejectRekomendasi`, `handleAdminDaerahAccTB`, `handleAdminDaerahRejectTB` |
| **Admin Pusat** | `handleAdminRejectRekomendasi`, `handleAdminForwardRekomendasiToKaBiro`, `handleAdminUploadRekomendasi`, `handleAdminRejectTB`, `handleAdminLulusSeleksiAdministrasi`, `handleAdminLulusSeleksiWawancara`, `handleAdminSimpanSeleksiBeasiswa`, `handleAdminForwardTBToKaBiro`, `handleAdminSaveAndUploadSK`, `handleAdminLuluskanWawancaraModal`, `handleAdminVerifSuratKampusModal`, `handleAdminConfirmSKPegawaiModal`, `handleAdminRejectSKPegawaiModal`, `handleToggleDocumentCheck` |
| **Kepala Biro** | `handleKaBiroConfirmRekomendasi`, `handleKaBiroReturnRekomendasi`, `handleKaBiroRejectRekomendasi`, `handleKaBiroConfirmTB`, `handleKaBiroReturnTB`, `handleKaBiroRejectTB` |
| **Pewawancara** | `handlePewawancaraRejectTB` |
| **PPK** | `handlePPKRejectTB`, `handlePPKConfirmSign` |
| **Pegawai** | `handlePegawaiUploadSKModal` (SK mandiri), `handlePegawaiSignPerjanjian` |

### 6.4 Fitur Lintas Peran

- **Usul Ulang:** berkas ditolak bisa diajukan ulang dengan catatan perbaikan, dibatasi `max_usul_ulang` (default `2×`, dapat diubah Super Admin).
- **2 Jenis Pengembalian:** *Ditolak* (berhenti/usul ulang) vs *Dikembalikan Kepala Biro* (perbaikan oleh Admin Pusat).
- **Timeline `riwayat_alur`:** mencatat tahap, peran, aktor, status, catatan, timestamp lengkap.
- **Notifikasi & Audit Log:** per user/peran + histori aksi global.
- **Ceklis Administrasi Berkas:** status verifikasi `valid` | `bts` | `pending`.
- **SK Dinamis (`KelengkapanSK`):** nomor, tanggal, identitas pegawai, kampus, prodi, jenjang, akreditasi, sumber dana, sponsor, TMT mulai/selesai, kewajiban khusus, penandatangan (beasiswa & mandiri terpisah).
- **Surat Perjanjian Beasiswa:** status `belum_isi` | `diunggah` | `disetujui` | `ditolak`.
- **Laporan Bulanan Beasiswa:** status studi (aktif kuliah, praktikum/riset, seminar proposal, penulisan tesis, ujian kelulusan), SKS, IPK sementara, kendala, bukti, evaluasi (`menunggu_review` | `diterima` | `perlu_perbaikan`).
- **Monev Semester:** IPK semester & kumulatif, ringkasan progres, upload KHS, evaluasi admin.

---

## 7. Dokumen Wajib & Template (`REQUIRED_DOCS`)

Dapat dikonfigurasi Admin melalui menu **Konfigurasi Berkas**. Konfigurasi bawaan di `mockData.ts`:

| Jenis | Nama Dokumen | Template | Format | Maks (MB) |
| --- | --- | --- | --- | --- |
| Rekomendasi | Surat Pengantar Unit Kerja | Word | `pdf, doc, docx` | 5 |
| Rekomendasi | Ijazah Terakhir Legalisir | — | `pdf` | 5 |
| Rekomendasi | Akreditasi Program Studi | — | `pdf, jpg, png` | 3 |
| Rekomendasi | Akreditasi Perguruan Tinggi | — | `pdf, jpg, png` | 3 |
| Mandiri | Surat Usulan & Rekomendasi Pimpinan Unit Kerja | Ya | `pdf, doc, docx` | 5 |
| Mandiri | Letter of Acceptance (LoA) Unconditional / Bukti Lulus PTN/PTS | — | `pdf` | 5 |
| Beasiswa | Surat Pengantar dari Unit | Ya | `pdf, doc, docx` | 5 |
| Beasiswa | SKP (Sasaran Kinerja Pegawai) | — | `pdf` | 10 |
| Beasiswa | SK Jabatan | — | `pdf` | 5 |
| Beasiswa | SK Pangkat Terakhir | — | `pdf` | 5 |
| Beasiswa | Surat Sehat / Surat Dokter / Puskesmas | Ya | `pdf, jpg` | 5 |
| Pencantuman Gelar | Ijazah Asli & Legalisir | — | `pdf` | 5 |
| Pencantuman Gelar | Transkrip Nilai Akademik | — | `pdf` | 5 |
| Pencantuman Gelar | SK Tugas Belajar Awal | Ya | `pdf` | 3 |

> Selain daftar `REQUIRED_DOCS`, struktur pengajuan TB juga mendukung 8 berkas klasik: surat rekomendasi, LoA/bukti lulus, bukti beasiswa/pembiayaan mandiri, sertifikat bahasa (TOEFL/IELTS/TOAFL), SK CPNS/PNS/pangkat, SKP 2 tahun, surat bebas hukuman disiplin & pidana, surat kesediaan ikatan dinas (2n), serta surat tanda lulus seleksi kampus.

---

## 8. Data Demo Bawaan

### 8.1 Akun Demo (9 akun di `mockData.ts` + catatan PPK)

| NIP | Nama | Role | Unit & Jabatan |
| --- | --- | --- | --- |
| `199208152019031002` | Ahmad Fauzi, S.T. | `pegawai` | Biro Perencanaan dan Kerjasama — Analis Kebijakan Ahli Pertama |
| `199506122020122005` | Siti Rahmawati, S.Kom. | `pegawai` | Pusat Data dan Informasi — Pranata Komputer Ahli Pertama |
| `197504121998031001` | Ir. Bambang Suryanto, M.M. | `pimpinan_unit` | Biro Perencanaan dan Kerjasama — Kepala Biro |
| `198803242011012003` | Rina Kartika, S.AP. | `admin_kepegawaian` | Biro Kepegawaian dan Organisasi — Subkoordinator Tim Kerja Pengembangan Karier |
| `197011051996031002` | Dr. Hendra Gunawan, S.H., M.Si. | `kepala_biro_kepegawaian` | Biro Kepegawaian dan Organisasi — Kepala Biro |
| `198205142008011003` | Dr. Wahyu Pratama, M.Psi., Psikolog | `pewawancara` | Biro Kepegawaian — Assessor SDM Aparatur |
| `198001012005011001` | Super Admin SITUBEL | `super_admin` | Biro Kepegawaian (Pusat) — Super Administrator |
| `198904152014021002` | Budi Darmawan, S.Sos. (Admin Medan) | `admin_daerah` | Kantor SAR Kelas A Medan — Pranata SDM Aparatur |
| `199602202021021003` | Rizky Pratama, S.Tr.Kel. | `pegawai` | Kantor SAR Kelas A Medan — Rescuer Ahli Pertama |

> **Catatan PPK:** `README.md` dan `seed.sql` menyebut akun PPK **Marsekal Madya TNI Kusworo** (`196802101990031001`, role `pejabat_berwenang`). Pada arsip asli `mockData.ts` akun tersebut belum dimasukkan, tetapi `Storage.getCurrentUser()` dan `PPKDashboard` tetap mendukung role tersebut.

### 8.2 Unit Kerja (8 Unit)

| Kode | Nama Unit | Pimpinan |
| --- | --- | --- |
| `RO-RENKER` | Biro Perencanaan dan Kerjasama | Ir. Bambang Suryanto, M.M. |
| `RO-PEGOR` | Biro Kepegawaian dan Organisasi (Pusat) | Dr. Hendra Gunawan, S.H., M.Si. |
| `SAR-MDN` | Kantor SAR Kelas A Medan | Mustari, S.E., M.M. |
| `SAR-SBY` | Kantor SAR Kelas A Surabaya | Nanang Sigit, S.IP., M.M. |
| `SAR-MKS` | Kantor SAR Kelas A Makassar | Mexianus Bekabel, S.Sos. |
| `DIT-SIAGA` | Direktorat Kesiapsiagaan | Agus Sudarto, S.Sos. |
| `DIT-OPS` | Direktorat Operasi | Brigjen TNI (Mar) Edy Prakoso |
| `PUSDATIN` | Pusat Data dan Informasi | Dwi Hendro Santoso, M.T. |

### 8.3 Pengajuan Contoh (12 Record)

| No. Registrasi | Pemohon | Status Awal |
| --- | --- | --- |
| `REK/2025/001` | Ahmad Fauzi, S.T. | `menunggu_konfirmasi_kabi` |
| `REK/2025/002` | Siti Rahmawati, S.Kom. | `rekomendasi_terbit` |
| `REK/2025/003` | Rizky Pratama, S.Tr.Kel. | `menunggu_acc_admin_daerah` |
| `TB/BSW/2025/001` | Ahmad Fauzi, S.T. | `menunggu_nilai_wawancara` |
| `TB/MDR/2025/002` | Siti Rahmawati, S.Kom. | `terkonfirmasi_kabi` |
| `TB/BSW/2025/003` | Budi Wicaksono, S.T., M.T. | `menunggu_ttd_ppk` |
| `TB/BSW/2024/009` | Ahmad Fauzi, S.T. | `sedang_belajar` |
| `TB/BSW/2025/077` | Rizky Pratama, S.Tr.Kel. | `menunggu_acc_admin_daerah` |
| `TB/MDR/2025/088` | Rizky Pratama, S.Tr.Kel. | `menunggu_acc_admin_daerah` |
| `TB/MDR/2024/052` | Rizky Pratama, S.Tr.Kel. | `sedang_belajar` |
| `PG/2025/001` | Dedi Setiawan, S.Pd., M.A.P. | `diusulkan_siasn` |
| `PPJ/2026/001` | Rizky Pratama, S.Tr.Kel. | `menunggu_acc_pimpinan` |

### 8.4 Bank Soal Wawancara (10 Soal) & Skala Penilaian

- **Pengaturan bawaan:** `passing_grade = 75`, `jumlah_soal_acak = 3` per kandidat.
- **Skala nilai:** `MS` (Memenuhi Syarat) = `100`, `CMS` (Cukup) = `75`, `KMS` (Kurang) = `50`, `TMS` (Tidak Memenuhi) = `25`.
- **Rekomendasi akhir:** `lulus` | `tidak_lulus` | `pertimbangan` (berdasarkan rata-rata skor vs `passing_grade`).

| # | Kategori | Inti Pertanyaan | Jenis |
| --- | --- | --- | --- |
| 1 | Komitmen Kedinasan | Relevansi program studi dengan peta jabatan & renstra unit | Wajib |
| 2 | Kapasitas Akademik & Disiplin | Komitmen menjaga nama baik korps & lulus tepat waktu | Wajib |
| 3 | Integritas & Loyalitas Ikatan Dinas | Kesiapan perjanjian ikatan dinas 2× masa studi & penempatan | Wajib |
| 4 | Rencana Kontribusi SAR | Inovasi/kontribusi untuk kesiapsiagaan & operasi SAR | Wajib |
| 5 | Manajemen Studi & Monev | Manajemen waktu riset & pelaporan monev semester | Acak |
| 6 | Problem Solving & Ketahanan Mental | Mitigasi kendala akademik/riset/dosen pembimbing | Acak |
| 7 | Kesiapan Personal & Keluarga | Adaptasi, relokasi, dukungan keluarga | Acak |
| 8 | Wawasan Kebangsaan & Kode Etik ASN | Kode etik ASN, netralitas, larangan partisan/komersial | Acak |
| 9 | Jejaring & Kemitraan Akademik | Jembatan riset & kemitraan kampus–Basarnas | Acak |
| 10 | Riset Terapan Kebencanaan | Rencana topik tesis/disertasi & penerapannya | Acak |

---

## 9. Database (`supabase_schema.sql` & `seed.sql`)

PostgreSQL (ekstensi `uuid-ossp`), terdiri dari **13 tabel**:

| Tabel | Kolom Penting |
| --- | --- |
| `users` | `id` (UUID), `nip` (unique), `nama_lengkap`, `email`, `password_hash`, `role` (`CHECK` 5 nilai: `pegawai`, `pimpinan_unit`, `admin_kepegawaian`, `kepala_biro_kepegawaian`, `pejabat_berwenang`), `unit_kerja_id`, `pangkat_golongan`, `jabatan`, `status_aktif`, `avatar_url`, `created_at`, `updated_at` |
| `unit_kerja` | `id`, `nama_unit`, `kode_unit` (unique), `pimpinan_user_id` (FK `users`), `created_at` |
| `workflow_steps` | `jenis_pengajuan`, `urutan`, `nama_step`, `role_penanggung_jawab`, `punya_opsi_tolak`, `is_active` |
| `required_documents` | `jenis_pengajuan`, `kode_dokumen`, `nama_dokumen`, `wajib`, `format_diizinkan`, `max_size_mb`, `keterangan`, `is_active` |
| `pengajuan_rekomendasi` | `no_registrasi` (unique), `user_id`, `unit_kerja_id`, `jenjang`, `program_studi`, `universitas_tujuan`, `akreditasi_prodi/univ`, `negara`, `tahun_akademik`, `status`, `catatan_pimpinan/admin/kabi`, `nomor_surat_rekomendasi`, `tanggal_terbit_rekomendasi`, `file_rekomendasi_url/drive_id`, `diunggah_oleh_admin_id` |
| `pengajuan_tugas_belajar` | `no_registrasi`, `jenis` (`beasiswa`/`mandiri`), `user_id`, `rekomendasi_id`, `jenjang`, `program_studi`, `universitas_tujuan`, `dalam_luar_negeri`, `durasi_semester`, `sumber_pendanaan`, `nama_beasiswa`, `status`, `catatan_*`, `kelengkapan_sk` (JSONB), `file_sk_url/drive_id`, `sk_signed_at`, `sk_signer_id`, `sk_digital_hash`, `perjanjian_signed_at`, `file_perjanjian_*` |
| `dokumen_pengajuan` | `rekomendasi_id`, `pengajuan_tb_id`, `required_document_id`, `nama_dokumen`, `nama_file`, `google_drive_file_id`, `google_drive_web_link`, `ukuran_file_mb`, `status_verifikasi`, `catatan` |
| `seleksi_hasil` | `pengajuan_id`, `jenis_tes` (`administrasi`/`psikotes`/`wawancara`/`bahasa`), `hasil` (`lulus`/`tidak`/`pending`), `skor`, `catatan`, `dinilai_oleh_user_id` |
| `laporan_progres_studi` | `pengajuan_id`, `semester`, `tahun`, `ipk_semester`, `ipk_kumulatif`, `isi_laporan`, `file_drive_id`, `catatan_evaluasi_admin` |
| `pengajuan_pencantuman_gelar` | `no_registrasi`, `user_id`, `pengajuan_tb_id`, `jenjang`, `gelar_diperoleh`, `nama_kampus`, `program_studi`, `no_ijazah`, `tanggal_lulus`, `tanggal_lapor`, `batas_lapor_15_hari`, `kesesuaian_pangkat` (JSONB), `status`, `periode_submit`, `nomor_pertek_bkn` |
| `pengajuan_status_log` | `pengajuan_id`, `jenis_pengajuan`, `status_sebelumnya`, `status_baru`, `catatan`, `diproses_oleh_user_id`, `timestamp` |
| `audit_log` | `user_id`, `user_nama`, `user_role`, `aksi`, `detail` (JSONB), `timestamp` |
| `app_settings` | `key` (PK), `value` (JSONB), `updated_at` |

### 9.1 Row Level Security (RLS)
- Aktif di: `pengajuan_rekomendasi`, `pengajuan_tugas_belajar`, `pengajuan_pencantuman_gelar`, `dokumen_pengajuan`.
- Policy tersedia untuk `pengajuan_rekomendasi` dan `pengajuan_tugas_belajar` (pegawai baca milik sendiri; pimpinan baca staf unit; admin/kabiro/PPK akses penuh).
- **Gap:** Belum ada policy pada `pengajuan_pencantuman_gelar` dan `dokumen_pengajuan` (karena RLS aktif tanpa policy, akses default tertutup).

### 9.2 `seed.sql`
- 5 unit kerja (`RO-RENKER`, `RO-PEGOR`, `DIT-SIAGA`, `DIT-OPS`, `PUSDATIN`).
- 6 pengguna (Ahmad Fauzi, Siti Rahmawati, Ir. Bambang Suryanto, Rina Kartika, Dr. Hendra Gunawan, Marsekal Madya TNI Kusworo) dengan hash sandi tiruan.
- 24 langkah workflow versi ringkas (rekomendasi 5, beasiswa 8, mandiri 7, pencantuman gelar 4).

---

## 10. API Lapisan Data (`Storage`)

| Domain | Metode di `src/lib/storage.ts` |
| --- | --- |
| **Sesi** | `getCurrentUser`, `setCurrentUser` |
| **User & Unit** | `getUsers`, `updateUser`, `addUser`, `deleteUser`, `getUnitKerja`, `addUnitKerja`, `updateUnitKerja` |
| **Rekomendasi** | `getRekomendasi`, `addRekomendasi`, `updateRekomendasi`, `deleteRekomendasi` |
| **Tugas Belajar** | `getPengajuanTB`, `addPengajuanTB`, `updatePengajuanTB`, `deletePengajuanTB` |
| **Pencantuman Gelar** | `getPencantumanGelar`, `addPencantumanGelar`, `updatePencantumanGelar`, `deletePencantumanGelar` |
| **Monev** | `getMonev`, `addMonev`, `updateMonev`, `deleteMonev` |
| **Perpanjangan** | `getPerpanjangan`, `addPerpanjangan`, `updatePerpanjangan`, `deletePerpanjangan`, `uploadSkPerpanjangan` *(update durasi & TMT TB induk)* |
| **Konfigurasi** | `getWorkflowSteps`, `updateWorkflowSteps`, `getRequiredDocs`, `updateRequiredDocs`, `addRequiredDoc`, `deleteRequiredDoc` |
| **Audit & Notifikasi** | `getAuditLogs`, `addAuditLog`, `getNotifications`, `addNotification`, `markNotificationRead`, `markAllNotificationsRead` |
| **Wawancara** | `getSoalWawancara`, `addSoalWawancara`, `updateSoalWawancara`, `deleteSoalWawancara`, `getPengaturanWawancara`, `updatePengaturanWawancara`, `saveHasilWawancara` |
| **Seleksi & Perjanjian** | `uploadSuratLulusKampus`, `submitPerjanjianBeasiswa`, `verifikasiPerjanjianBeasiswa` |
| **Laporan Bulanan** | `addLaporanBulanan`, `evaluasiLaporanBulanan` |
| **Sistem** | `getPengaturanSistem`, `updatePengaturanSistem`, `resetAllData` |

**Custom Window Events untuk sinkronisasi UI:**
`situbel_user_change` · `situbel_notif_update` · `situbel_data_update`

---

## 11. Konfigurasi, Deployment, & Temuan Risiko

### 11.1 Alur Deploy (sesuai `README.md`)
1. Buat project Supabase → jalankan `supabase_schema.sql` lalu `seed.sql` → ambil Project URL & Anon Key.
2. Aktifkan Google Drive API → buat Service Account + JSON key → share folder root Drive (akses Editor) ke email Service Account.
3. Isi environment variable di `.env.local` atau pengaturan Vercel.
4. Push ke GitHub → import ke Vercel → auto-deploy di branch `main`.

### 11.2 Daftar Temuan & Risiko (Wajib Diperhatikan Sebelum Produksi)

| # | Severity | Temuan | Dampak / Tindak Lanjut |
| --- | --- | --- | --- |
| 1 | Tinggi | **Masih prototipe `localStorage`** | `supabaseClient.ts` & `googleDrive.ts` hanya stub; data tidak sinkron antar perangkat/user. |
| 2 | Kritis | **Login tidak verifikasi sandi** | Di arsip asli `LoginView.tsx` hanya mencocokkan NIP tanpa cek kata sandi. |
| 3 | Sedang | **`README.md` tidak sinkron** | Menyebut 5 peran & prefix `NEXT_PUBLIC_*`, padahal kode pakai 8 peran & Vite (`VITE_*`). |
| 4 | Tinggi | **`seed.sql` tidak cocok skema** | Mengisi kolom `unit_kerja.pimpinan_nama` yang tidak ada di `supabase_schema.sql` (`INSERT` akan gagal). |
| 5 | Tinggi | **Skema SQL belum dukung 8 peran** | `CHECK` pada `users.role` hanya 5 nilai (`admin_daerah`, `super_admin`, `pewawancara` ditolak); `workflow_steps` SQL belum lengkap. |
| 6 | Tinggi | **RLS tidak cocok skema auth** | Policy memakai `auth.uid()` (Supabase Auth), sedangkan rancangan app memakai login NIP + JWT kustom. |
| 7 | Rendah | **Dependensi tidak terpakai** | `express`, `@google/genai`, `dotenv`, `tsx`, `esbuild` tidak diimpor; cek versi `typescript ^7.0.2` & `vite ^8.3.0`. |
| 8 | Kritis | **Contoh kredensial di `.env.example`** | Ganti `APP_JWT_SECRET` & private key contoh sebelum produksi. |
| 9 | Tinggi | **TTD digital masih simulasi** | `DigitalSignModal` hanya menghasilkan hash acak, belum terintegrasi BSrE BSSN. |
| 10 | Sedang | **Batas penyimpanan file browser** | File ≤ 2,5 MB masuk `localStorage` (kuota ±5 MB/domain); file lebih besar pakai Object URL yang hilang saat reload. |
| 11 | Sedang | **Monolith view sangat besar** | `AdminDashboard` (7.535 baris), `PegawaiDashboard` (5.105), `DetailPengajuanModal` (4.777) layak dipecah ke sub-komponen. |

---

## 12. Aset Gambar (`public/assets/aistudio/`)

Terdapat **19 berkas PNG** peninggalan sesi AI Studio yang **tidak dirujuk** oleh kode di `src/` maupun `index.html`:

| Berkas | Dimensi (px) | Ukuran (KB) | Berkas | Dimensi (px) | Ukuran (KB) |
| --- | --- | --- | --- | --- | --- |
| `image_03252632.png` | 411 × 229 | 7 | `image_a7f2b31d.png` | 1086 × 556 | 131 |
| `image_2b0878f5.png` | 670 × 127 | 9 | `image_aeb7fc6e.png` | 1486 × 645 | 75 |
| `image_3c916310.png` | 1290 × 147 | 26 | `image_bcbd2c4f.png` | 424 × 730 | 32 |
| `image_582a4e24.png` | 1147 × 597 | 58 | `image_be5b4c27.png` | 1452 × 733 | 110 |
| `image_69be4466.png` | 1297 × 745 | 156 | `image_c89c889d.png` | 336 × 181 | 13 |
| `image_6bbcdb2e.png` | 553 × 108 | 5 | `image_dc09e835.png` | 1918 × 892 | 240 |
| `image_6f4b5c2c.png` | 381 × 166 | 13 | `image_dfe38e92.png` | 1800 × 804 | 542 |
| `image_7f0b5130.png` | 301 × 121 | 8 | `image_f2498c9f.png` | 447 × 342 | 23 |
| `image_8aecf775.png` | 1884 × 742 | 656 | `image_fdc9b9ed.png` | 1864 × 292 | 31 |
| `image_927998e8.png` | 1485 × 370 | 28 | | | |

---

## 13. Cakupan Pembacaan (Transparansi)

- **Dibaca utuh:** seluruh file konfigurasi root, `README.md`, kedua file SQL, `App.tsx`, semua file `src/lib/` (kecuali isi penuh `storage.ts`, dibaca daftar fungsi & kunci), `src/types/index.ts`, `LoginView.tsx`.
- **Dibaca terstruktur/sebagian:** `mockData.ts` (per entitas), `Sidebar.tsx` (seluruh menu), komponen lain (nama, props, fungsi utama).
- **Dipetakan strukturnya saja (menu, heading, nama handler, jumlah baris):** `AdminDashboard.tsx`, `PegawaiDashboard.tsx`, `DetailPengajuanModal.tsx`, `PimpinanDashboard.tsx`, `KepalaBiroDashboard.tsx`, `PewawancaraDashboard.tsx`, `PPKDashboard.tsx`, `ProfileSettingsView.tsx`, dan sebagian besar modal.
- **Tidak dibuka:** 19 gambar PNG di `public/assets/aistudio/`.
