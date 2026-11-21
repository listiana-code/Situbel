import {
  INITIAL_AUDIT_LOGS,
  INITIAL_MONEV,
  INITIAL_NOTIFICATIONS,
  INITIAL_PENCANTUMAN_GELAR,
  INITIAL_PENGAJUAN_TB,
  INITIAL_PENGATURAN_SISTEM,
  INITIAL_PENGATURAN_WAWANCARA,
  INITIAL_PERPANJANGAN,
  INITIAL_REKOMENDASI,
  INITIAL_REQUIRED_DOCS,
  INITIAL_SOAL_WAWANCARA,
  INITIAL_UNIT_KERJA,
  INITIAL_USERS,
  INITIAL_WORKFLOW_STEPS,
} from '../data/mockData';
import type {
  AppNotification,
  AuditLog,
  DokumenItem,
  HasilWawancara,
  LaporanMonev,
  LaporanProgresBulanan,
  PengajuanPencantumanGelar,
  PengajuanPerpanjangan,
  PengajuanRekomendasi,
  PengajuanTugasBelajar,
  PengaturanSistem,
  PengaturanWawancara,
  RequiredDocumentConfig,
  Role,
  SoalWawancara,
  SuratPerjanjianBeasiswa,
  UnitKerja,
  User,
  WorkflowStepConfig,
} from '../types';

const KEYS = {
  CURRENT_USER: 'situbel_current_user',
  USERS: 'situbel_users',
  UNIT_KERJA: 'situbel_unit_kerja',
  REKOMENDASI: 'situbel_rekomendasi',
  PENGAJUAN_TB: 'situbel_pengajuan_tb',
  PENCANTUMAN_GELAR: 'situbel_pencantuman_gelar',
  MONEV: 'situbel_monev',
  PERPANJANGAN: 'situbel_perpanjangan',
  WORKFLOW_STEPS: 'situbel_workflow_steps',
  REQUIRED_DOCS: 'situbel_required_docs',
  AUDIT_LOGS: 'situbel_audit_logs',
  NOTIFICATIONS: 'situbel_notifications',
  SOAL_WAWANCARA: 'situbel_soal_wawancara',
  PENGATURAN_WAWANCARA: 'situbel_pengaturan_wawancara',
  PENGATURAN_SISTEM: 'situbel_pengaturan_sistem',
  SIDEBAR_OPEN: 'situbel_sidebar_open',
} as const;

function emit(eventName: 'situbel_user_change' | 'situbel_notif_update' | 'situbel_data_update') {
  window.dispatchEvent(new CustomEvent(eventName));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T, eventName?: 'situbel_user_change' | 'situbel_notif_update' | 'situbel_data_update'): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (eventName) emit(eventName);
    return true;
  } catch {
    // Handle storage quota overflow gracefully by stripping oversized base64 urls if needed
    return false;
  }
}

export function generateId(prefix: string): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}-${Date.now().toString(36)}-${hex}`;
}

export const Storage = {
  // ---- Session ----
  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(KEYS.CURRENT_USER);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      const users = Storage.getUsers();
      return users.find((u) => u.id === parsed.id) ?? parsed;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      writeJson(KEYS.CURRENT_USER, user, 'situbel_user_change');
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
      emit('situbel_user_change');
    }
  },

  authenticate(nip: string, password: string): { ok: true; user: User } | { ok: false; error: string } {
    const cleanNip = nip.trim();
    const users = Storage.getUsers();
    const found = users.find((u) => u.nip === cleanNip);
    if (!found) {
      return { ok: false, error: 'NIP tidak terdaftar dalam sistem SITUBEL.' };
    }
    if (!found.status_aktif) {
      return { ok: false, error: 'Akun pegawai dalam status nonaktif. Hubungi Admin Kepegawaian.' };
    }
    if (found.password !== password) {
      return { ok: false, error: 'Kata sandi tidak sesuai. Periksa kembali kredensial Anda.' };
    }
    Storage.setCurrentUser(found);
    return { ok: true, user: found };
  },

  // ---- Users & Unit Kerja ----
  getUsers(): User[] {
    const stored = readJson<User[]>(KEYS.USERS, INITIAL_USERS);
    // Ensure PPK & default accounts exist if migrating older seed
    const ids = new Set(stored.map((u) => u.id));
    const missing = INITIAL_USERS.filter((u) => !ids.has(u.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      writeJson(KEYS.USERS, merged);
      return merged;
    }
    return stored;
  },

  addUser(user: User): void {
    const list = [user, ...Storage.getUsers()];
    writeJson(KEYS.USERS, list, 'situbel_data_update');
  },

  updateUser(updated: User): void {
    const list = Storage.getUsers().map((u) => (u.id === updated.id ? updated : u));
    writeJson(KEYS.USERS, list, 'situbel_data_update');
    const cur = Storage.getCurrentUser();
    if (cur && cur.id === updated.id) {
      Storage.setCurrentUser(updated);
    }
  },

  deleteUser(id: string): void {
    const list = Storage.getUsers().filter((u) => u.id !== id);
    writeJson(KEYS.USERS, list, 'situbel_data_update');
  },

  getUnitKerja(): UnitKerja[] {
    return readJson<UnitKerja[]>(KEYS.UNIT_KERJA, INITIAL_UNIT_KERJA);
  },

  addUnitKerja(unit: UnitKerja): void {
    writeJson(KEYS.UNIT_KERJA, [...Storage.getUnitKerja(), unit], 'situbel_data_update');
  },

  updateUnitKerja(updated: UnitKerja): void {
    const list = Storage.getUnitKerja().map((u) => (u.id === updated.id ? updated : u));
    writeJson(KEYS.UNIT_KERJA, list, 'situbel_data_update');
  },

  // ---- Rekomendasi ----
  getRekomendasi(): PengajuanRekomendasi[] {
    return readJson<PengajuanRekomendasi[]>(KEYS.REKOMENDASI, INITIAL_REKOMENDASI);
  },

  addRekomendasi(item: PengajuanRekomendasi): void {
    writeJson(KEYS.REKOMENDASI, [item, ...Storage.getRekomendasi()], 'situbel_data_update');
  },

  updateRekomendasi(updated: PengajuanRekomendasi): void {
    const list = Storage.getRekomendasi().map((r) => (r.id === updated.id ? updated : r));
    writeJson(KEYS.REKOMENDASI, list, 'situbel_data_update');
  },

  deleteRekomendasi(id: string): void {
    writeJson(
      KEYS.REKOMENDASI,
      Storage.getRekomendasi().filter((r) => r.id !== id),
      'situbel_data_update'
    );
  },

  // ---- Tugas Belajar ----
  getPengajuanTB(): PengajuanTugasBelajar[] {
    return readJson<PengajuanTugasBelajar[]>(KEYS.PENGAJUAN_TB, INITIAL_PENGAJUAN_TB);
  },

  addPengajuanTB(item: PengajuanTugasBelajar): void {
    writeJson(KEYS.PENGAJUAN_TB, [item, ...Storage.getPengajuanTB()], 'situbel_data_update');
  },

  updatePengajuanTB(updated: PengajuanTugasBelajar): void {
    const list = Storage.getPengajuanTB().map((t) => (t.id === updated.id ? updated : t));
    writeJson(KEYS.PENGAJUAN_TB, list, 'situbel_data_update');
  },

  deletePengajuanTB(id: string): void {
    writeJson(
      KEYS.PENGAJUAN_TB,
      Storage.getPengajuanTB().filter((t) => t.id !== id),
      'situbel_data_update'
    );
  },

  // ---- Pencantuman Gelar ----
  getPencantumanGelar(): PengajuanPencantumanGelar[] {
    return readJson<PengajuanPencantumanGelar[]>(
      KEYS.PENCANTUMAN_GELAR,
      INITIAL_PENCANTUMAN_GELAR
    );
  },

  addPencantumanGelar(item: PengajuanPencantumanGelar): void {
    writeJson(
      KEYS.PENCANTUMAN_GELAR,
      [item, ...Storage.getPencantumanGelar()],
      'situbel_data_update'
    );
  },

  updatePencantumanGelar(updated: PengajuanPencantumanGelar): void {
    const list = Storage.getPencantumanGelar().map((p) => (p.id === updated.id ? updated : p));
    writeJson(KEYS.PENCANTUMAN_GELAR, list, 'situbel_data_update');
  },

  deletePencantumanGelar(id: string): void {
    writeJson(
      KEYS.PENCANTUMAN_GELAR,
      Storage.getPencantumanGelar().filter((p) => p.id !== id),
      'situbel_data_update'
    );
  },

  // ---- Monev ----
  getMonev(): LaporanMonev[] {
    return readJson<LaporanMonev[]>(KEYS.MONEV, INITIAL_MONEV);
  },

  addMonev(item: LaporanMonev): void {
    writeJson(KEYS.MONEV, [item, ...Storage.getMonev()], 'situbel_data_update');
  },

  updateMonev(updated: LaporanMonev): void {
    const list = Storage.getMonev().map((m) => (m.id === updated.id ? updated : m));
    writeJson(KEYS.MONEV, list, 'situbel_data_update');
  },

  deleteMonev(id: string): void {
    writeJson(
      KEYS.MONEV,
      Storage.getMonev().filter((m) => m.id !== id),
      'situbel_data_update'
    );
  },

  // ---- Perpanjangan ----
  getPerpanjangan(): PengajuanPerpanjangan[] {
    return readJson<PengajuanPerpanjangan[]>(KEYS.PERPANJANGAN, INITIAL_PERPANJANGAN);
  },

  addPerpanjangan(item: PengajuanPerpanjangan): void {
    writeJson(KEYS.PERPANJANGAN, [item, ...Storage.getPerpanjangan()], 'situbel_data_update');
  },

  updatePerpanjangan(updated: PengajuanPerpanjangan): void {
    const list = Storage.getPerpanjangan().map((p) => (p.id === updated.id ? updated : p));
    writeJson(KEYS.PERPANJANGAN, list, 'situbel_data_update');
  },

  deletePerpanjangan(id: string): void {
    writeJson(
      KEYS.PERPANJANGAN,
      Storage.getPerpanjangan().filter((p) => p.id !== id),
      'situbel_data_update'
    );
  },

  uploadSkPerpanjangan(
    perpanjanganId: string,
    payload: {
      nomor_sk: string;
      tanggal_sk: string;
      tmt_selesai_disetujui: string;
      file_nama: string;
      file_url?: string;
      actor: User;
    }
  ): PengajuanPerpanjangan | null {
    const list = Storage.getPerpanjangan();
    const target = list.find((p) => p.id === perpanjanganId);
    if (!target) return null;

    const now = new Date().toISOString();
    const updated: PengajuanPerpanjangan = {
      ...target,
      status: 'sk_perpanjangan_terbit',
      nomor_sk_perpanjangan: payload.nomor_sk,
      tanggal_sk_perpanjangan: payload.tanggal_sk,
      tmt_selesai_disetujui: payload.tmt_selesai_disetujui,
      file_sk_perpanjangan_nama: payload.file_nama,
      file_sk_perpanjangan_url: payload.file_url,
      updated_at: now,
      riwayat_alur: [
        ...target.riwayat_alur,
        {
          id: generateId('r-ppj'),
          tahap: 'Penerbitan SK Perpanjangan Masa Belajar',
          role: payload.actor.role,
          actor_nama: payload.actor.nama_lengkap,
          status: 'terbit',
          catatan: `SK Perpanjangan No. ${payload.nomor_sk} diterbitkan. TMT Selesai baru: ${payload.tmt_selesai_disetujui}.`,
          timestamp: now,
        },
      ],
    };
    Storage.updatePerpanjangan(updated);

    // Automatically extend parent Tugas Belajar duration & TMT selesai
    const tbs = Storage.getPengajuanTB();
    const parentTb = tbs.find((t) => t.id === target.pengajuan_tb_id);
    if (parentTb) {
      const updatedTb: PengajuanTugasBelajar = {
        ...parentTb,
        durasi_semester: parentTb.durasi_semester + target.tambahan_semester,
        tmt_selesai: payload.tmt_selesai_disetujui,
        kelengkapan_sk: parentTb.kelengkapan_sk
          ? { ...parentTb.kelengkapan_sk, tmt_selesai: payload.tmt_selesai_disetujui }
          : undefined,
        updated_at: now,
        riwayat_alur: [
          ...parentTb.riwayat_alur,
          {
            id: generateId('r-tb-ext'),
            tahap: 'Perpanjangan Masa Belajar Disetujui',
            role: payload.actor.role,
            actor_nama: payload.actor.nama_lengkap,
            status: 'terbit',
            catatan: `Masa studi diperpanjang +${target.tambahan_semester} semester s.d. ${payload.tmt_selesai_disetujui} (SK ${payload.nomor_sk}).`,
            timestamp: now,
          },
        ],
      };
      Storage.updatePengajuanTB(updatedTb);
    }

    Storage.addAuditLog({
      user: payload.actor,
      aksi: 'Terbitkan SK Perpanjangan',
      entitas: target.no_registrasi,
      detail: `SK ${payload.nomor_sk} diterbitkan; TMT selesai ${target.no_reg_tb} diperpanjang menjadi ${payload.tmt_selesai_disetujui}.`,
    });

    Storage.addNotification({
      target_user_id: target.user_id,
      judul: 'SK Perpanjangan Masa Belajar Terbit',
      pesan: `SK Perpanjangan ${target.no_registrasi} (${payload.nomor_sk}) telah terbit. Masa studi otomatis diperbarui.`,
      ref_type: 'perpanjangan',
      ref_id: target.id,
    });

    return updated;
  },

  // ---- Workflow & Required Docs Config ----
  getWorkflowSteps(): WorkflowStepConfig[] {
    return readJson<WorkflowStepConfig[]>(KEYS.WORKFLOW_STEPS, INITIAL_WORKFLOW_STEPS);
  },

  updateWorkflowSteps(steps: WorkflowStepConfig[]): void {
    writeJson(KEYS.WORKFLOW_STEPS, steps, 'situbel_data_update');
  },

  getRequiredDocs(): RequiredDocumentConfig[] {
    return readJson<RequiredDocumentConfig[]>(KEYS.REQUIRED_DOCS, INITIAL_REQUIRED_DOCS);
  },

  updateRequiredDocs(docs: RequiredDocumentConfig[]): void {
    writeJson(KEYS.REQUIRED_DOCS, docs, 'situbel_data_update');
  },

  addRequiredDoc(doc: RequiredDocumentConfig): void {
    writeJson(KEYS.REQUIRED_DOCS, [...Storage.getRequiredDocs(), doc], 'situbel_data_update');
  },

  deleteRequiredDoc(id: string): void {
    writeJson(
      KEYS.REQUIRED_DOCS,
      Storage.getRequiredDocs().filter((d) => d.id !== id),
      'situbel_data_update'
    );
  },

  // ---- Wawancara ----
  getSoalWawancara(): SoalWawancara[] {
    return readJson<SoalWawancara[]>(KEYS.SOAL_WAWANCARA, INITIAL_SOAL_WAWANCARA);
  },

  addSoalWawancara(soal: SoalWawancara): void {
    writeJson(KEYS.SOAL_WAWANCARA, [...Storage.getSoalWawancara(), soal], 'situbel_data_update');
  },

  updateSoalWawancara(updated: SoalWawancara): void {
    const list = Storage.getSoalWawancara().map((s) => (s.id === updated.id ? updated : s));
    writeJson(KEYS.SOAL_WAWANCARA, list, 'situbel_data_update');
  },

  deleteSoalWawancara(id: string): void {
    writeJson(
      KEYS.SOAL_WAWANCARA,
      Storage.getSoalWawancara().filter((s) => s.id !== id),
      'situbel_data_update'
    );
  },

  getPengaturanWawancara(): PengaturanWawancara {
    return readJson<PengaturanWawancara>(KEYS.PENGATURAN_WAWANCARA, INITIAL_PENGATURAN_WAWANCARA);
  },

  updatePengaturanWawancara(cfg: PengaturanWawancara): void {
    writeJson(KEYS.PENGATURAN_WAWANCARA, cfg, 'situbel_data_update');
  },

  saveHasilWawancara(tbId: string, hasil: HasilWawancara, actor: User): PengajuanTugasBelajar | null {
    const tb = Storage.getPengajuanTB().find((t) => t.id === tbId);
    if (!tb) return null;
    const now = new Date().toISOString();
    const nextStatus =
      hasil.rekomendasi_hasil === 'tidak_lulus' ? 'ditolak_pewawancara' : 'seleksi_wawancara';
    const updated: PengajuanTugasBelajar = {
      ...tb,
      hasil_wawancara: hasil,
      catatan_pewawancara: hasil.catatan_umum,
      status: nextStatus,
      updated_at: now,
      riwayat_alur: [
        ...tb.riwayat_alur,
        {
          id: generateId('r-wwc'),
          tahap: 'Penilaian Wawancara (Tim Pewawancara)',
          role: actor.role,
          actor_nama: actor.nama_lengkap,
          status: hasil.rekomendasi_hasil === 'tidak_lulus' ? 'ditolak' : 'disetujui',
          catatan: `Skor rata-rata ${hasil.rata_rata_skor.toFixed(1)} (Passing Grade ${hasil.passing_grade}) — Rekomendasi: ${hasil.rekomendasi_hasil.toUpperCase()}. ${hasil.catatan_umum}`,
          timestamp: now,
        },
      ],
    };
    Storage.updatePengajuanTB(updated);
    Storage.addAuditLog({
      user: actor,
      aksi: 'Simpan Nilai Wawancara',
      entitas: tb.no_registrasi,
      detail: `Skor ${hasil.rata_rata_skor.toFixed(1)} — hasil ${hasil.rekomendasi_hasil}.`,
    });
    Storage.addNotification({
      target_role: 'admin_kepegawaian',
      judul: 'Hasil Wawancara Beasiswa Masuk',
      pesan: `${tb.no_registrasi} (${tb.user_nama}) selesai dinilai dengan skor ${hasil.rata_rata_skor.toFixed(1)}.`,
      ref_type: 'beasiswa',
      ref_id: tb.id,
    });
    return updated;
  },

  // ---- Seleksi Kampus & Perjanjian ----
  uploadSuratLulusKampus(tbId: string, doc: DokumenItem, actor: User): PengajuanTugasBelajar | null {
    const tb = Storage.getPengajuanTB().find((t) => t.id === tbId);
    if (!tb) return null;
    const now = new Date().toISOString();
    const updated: PengajuanTugasBelajar = {
      ...tb,
      surat_lulus_kampus: doc,
      status: 'surat_kampus_diunggah',
      updated_at: now,
      riwayat_alur: [
        ...tb.riwayat_alur,
        {
          id: generateId('r-kmp'),
          tahap: 'Unggah Surat Tanda Lulus Kampus Tujuan',
          role: actor.role,
          actor_nama: actor.nama_lengkap,
          status: 'diproses',
          catatan: `Mengunggah ${doc.nama_file} untuk verifikasi Admin Pusat.`,
          timestamp: now,
        },
      ],
    };
    Storage.updatePengajuanTB(updated);
    Storage.addNotification({
      target_role: 'admin_kepegawaian',
      judul: 'Surat Lulus Kampus Diunggah',
      pesan: `${tb.user_nama} mengunggah surat lulus kampus untuk ${tb.no_registrasi}.`,
      ref_type: 'beasiswa',
      ref_id: tb.id,
    });
    return updated;
  },

  submitPerjanjianBeasiswa(
    tbId: string,
    perjanjian: SuratPerjanjianBeasiswa,
    actor: User
  ): PengajuanTugasBelajar | null {
    const tb = Storage.getPengajuanTB().find((t) => t.id === tbId);
    if (!tb) return null;
    const now = new Date().toISOString();
    const updated: PengajuanTugasBelajar = {
      ...tb,
      perjanjian_beasiswa: {
        ...perjanjian,
        signed_at: now,
        status_verifikasi: 'diunggah',
      },
      status: 'perjanjian_ditandatangani',
      updated_at: now,
      riwayat_alur: [
        ...tb.riwayat_alur,
        {
          id: generateId('r-prj'),
          tahap: 'Pengisian & Unggah Surat Perjanjian Beasiswa Bermaterai',
          role: actor.role,
          actor_nama: actor.nama_lengkap,
          status: 'diproses',
          catatan: `Surat Perjanjian No. ${perjanjian.nomor_perjanjian} diunggah untuk verifikasi Admin Pusat.`,
          timestamp: now,
        },
      ],
    };
    Storage.updatePengajuanTB(updated);
    Storage.addNotification({
      target_role: 'admin_kepegawaian',
      judul: 'Surat Perjanjian Beasiswa Diunggah',
      pesan: `${tb.user_nama} mengunggah surat perjanjian bermaterai untuk ${tb.no_registrasi}.`,
      ref_type: 'beasiswa',
      ref_id: tb.id,
    });
    return updated;
  },

  verifikasiPerjanjianBeasiswa(
    tbId: string,
    approved: boolean,
    catatan: string,
    actor: User
  ): PengajuanTugasBelajar | null {
    const tb = Storage.getPengajuanTB().find((t) => t.id === tbId);
    if (!tb || !tb.perjanjian_beasiswa) return null;
    const now = new Date().toISOString();
    const updated: PengajuanTugasBelajar = {
      ...tb,
      perjanjian_beasiswa: {
        ...tb.perjanjian_beasiswa,
        status_verifikasi: approved ? 'disetujui' : 'ditolak',
        catatan_verifikasi: catatan,
      },
      status: approved ? 'sedang_belajar' : 'menunggu_perjanjian',
      updated_at: now,
      riwayat_alur: [
        ...tb.riwayat_alur,
        {
          id: generateId('r-vprj'),
          tahap: approved ? 'Status Aktif Sedang Belajar' : 'Perbaikan Surat Perjanjian',
          role: actor.role,
          actor_nama: actor.nama_lengkap,
          status: approved ? 'disetujui' : 'dikembalikan',
          catatan: catatan || (approved ? 'Surat perjanjian disetujui. Status pegawai aktif belajar.' : 'Mohon perbaiki dokumen perjanjian.'),
          timestamp: now,
        },
      ],
    };
    Storage.updatePengajuanTB(updated);
    Storage.addNotification({
      target_user_id: tb.user_id,
      judul: approved ? 'Status Tugas Belajar Aktif' : 'Perjanjian Beasiswa Perlu Perbaikan',
      pesan: approved
        ? `Perjanjian ${tb.no_registrasi} disetujui. Anda kini berstatus Sedang Belajar Aktif.`
        : `Perjanjian ${tb.no_registrasi} dikembalikan: ${catatan}`,
      ref_type: 'beasiswa',
      ref_id: tb.id,
    });
    return updated;
  },

  // ---- Laporan Bulanan ----
  addLaporanBulanan(tbId: string, laporan: LaporanProgresBulanan, actor: User): void {
    const tb = Storage.getPengajuanTB().find((t) => t.id === tbId);
    if (!tb) return;
    const updated: PengajuanTugasBelajar = {
      ...tb,
      laporan_bulanan: [laporan, ...(tb.laporan_bulanan || [])],
      updated_at: new Date().toISOString(),
    };
    Storage.updatePengajuanTB(updated);
    Storage.addAuditLog({
      user: actor,
      aksi: 'Kirim Laporan Bulanan',
      entitas: tb.no_registrasi,
      detail: `Laporan progres ${laporan.bulan} ${laporan.tahun} (IPK ${laporan.ipk_sementara}).`,
    });
  },

  evaluasiLaporanBulanan(
    tbId: string,
    laporanId: string,
    status: 'diterima' | 'perlu_perbaikan',
    catatan: string,
    actor: User
  ): void {
    const tb = Storage.getPengajuanTB().find((t) => t.id === tbId);
    if (!tb) return;
    const updated: PengajuanTugasBelajar = {
      ...tb,
      laporan_bulanan: tb.laporan_bulanan.map((l) =>
        l.id === laporanId ? { ...l, status_evaluasi: status, catatan_admin: catatan } : l
      ),
      updated_at: new Date().toISOString(),
    };
    Storage.updatePengajuanTB(updated);
    Storage.addAuditLog({
      user: actor,
      aksi: 'Evaluasi Laporan Bulanan',
      entitas: tb.no_registrasi,
      detail: `Evaluasi laporan bulanan: ${status}. ${catatan}`,
    });
  },

  // ---- Audit Logs & Notifications ----
  getAuditLogs(): AuditLog[] {
    return readJson<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog(entry: { user: User; aksi: string; entitas: string; detail: string }): void {
    const logs = Storage.getAuditLogs();
    const next: AuditLog = {
      id: generateId('aud'),
      user_id: entry.user.id,
      user_nama: entry.user.nama_lengkap,
      user_role: entry.user.role,
      aksi: entry.aksi,
      entitas: entry.entitas,
      detail: entry.detail,
      timestamp: new Date().toISOString(),
    };
    writeJson(KEYS.AUDIT_LOGS, [next, ...logs].slice(0, 200), 'situbel_data_update');
  },

  getNotifications(): AppNotification[] {
    return readJson<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  getNotificationsForUser(user: User): AppNotification[] {
    return Storage.getNotifications().filter((n) => {
      if (n.target_user_id && n.target_user_id === user.id) return true;
      if (n.target_role && n.target_role === user.role) {
        if (n.target_unit_id && n.target_unit_id !== user.unit_kerja_id) return false;
        return true;
      }
      if (user.role === 'super_admin' && n.target_role === 'admin_kepegawaian') return true;
      return false;
    });
  },

  addNotification(input: {
    target_user_id?: string;
    target_role?: Role;
    target_unit_id?: string;
    judul: string;
    pesan: string;
    ref_type?: AppNotification['ref_type'];
    ref_id?: string;
  }): void {
    const current = Storage.getNotifications();
    const isDup = current.some(
      (n) =>
        n.judul === input.judul &&
        n.pesan === input.pesan &&
        n.ref_id === input.ref_id &&
        Date.now() - new Date(n.created_at).getTime() < 5000
    );
    if (isDup) return;
    const next: AppNotification = {
      id: generateId('ntf'),
      ...input,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    writeJson(KEYS.NOTIFICATIONS, [next, ...current].slice(0, 120), 'situbel_notif_update');
  },

  markNotificationRead(id: string): void {
    const list = Storage.getNotifications().map((n) => (n.id === id ? { ...n, is_read: true } : n));
    writeJson(KEYS.NOTIFICATIONS, list, 'situbel_notif_update');
  },

  markAllNotificationsRead(user: User): void {
    const userNotifIds = new Set(Storage.getNotificationsForUser(user).map((n) => n.id));
    const list = Storage.getNotifications().map((n) =>
      userNotifIds.has(n.id) ? { ...n, is_read: true } : n
    );
    writeJson(KEYS.NOTIFICATIONS, list, 'situbel_notif_update');
  },

  // ---- System Settings ----
  getPengaturanSistem(): PengaturanSistem {
    return readJson<PengaturanSistem>(KEYS.PENGATURAN_SISTEM, INITIAL_PENGATURAN_SISTEM);
  },

  updatePengaturanSistem(cfg: PengaturanSistem): void {
    writeJson(KEYS.PENGATURAN_SISTEM, cfg, 'situbel_data_update');
  },

  getSidebarOpen(): boolean {
    try {
      const val = localStorage.getItem(KEYS.SIDEBAR_OPEN);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  },

  setSidebarOpen(open: boolean): void {
    try {
      localStorage.setItem(KEYS.SIDEBAR_OPEN, String(open));
    } catch {
      // ignore
    }
  },

  resetAllData(): void {
    const currentUser = Storage.getCurrentUser();
    Object.values(KEYS).forEach((k) => {
      if (k !== KEYS.SIDEBAR_OPEN) localStorage.removeItem(k);
    });
    if (currentUser) {
      const matchingInitial =
        INITIAL_USERS.find((u) => u.id === currentUser.id) ??
        INITIAL_USERS.find((u) => u.role === currentUser.role) ??
        INITIAL_USERS[0];
      writeJson(KEYS.CURRENT_USER, matchingInitial, 'situbel_user_change');
    }
    emit('situbel_data_update');
    emit('situbel_notif_update');
  },
};
