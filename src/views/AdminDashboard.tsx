import React, { useMemo, useState } from 'react';
import {
  Eye,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  RotateCcw,
  Upload,
  Search,
  FileText,
  GraduationCap,
  FileSignature,
  Award,
} from 'lucide-react';
import {
  KpiGraduatedStrip,
  PageBannerHeader,
} from '../components/KpiVisuals';
import { formatDateIndo, formatDateTimeIndo } from '../lib/dateUtils';
import { readUploadedFileAsUrl } from '../lib/fileUtils';
import { getRoleDisplayLabel, getStatusLabel, getStatusTextClass } from '../lib/statusUtils';
import { generateId, Storage } from '../lib/storage';
import { downloadTemplateDocument } from '../lib/templateDownloader';
import { Pagination } from '../components/Pagination';
import { useAlert } from '../components/AlertProvider';
import { useToast } from '../components/Toast';
import type {
  DossierTarget,
  PengajuanPerpanjangan,
  RequiredDocumentConfig,
  Role,
  SoalWawancara,
  UnitKerja,
  User,
} from '../types';

interface AdminDashboardProps {
  user: User;
  activeMenu: string;
  onOpenDossier: (target: DossierTarget) => void;
  onOpenPerpanjangan: (item: PengajuanPerpanjangan) => void;
  onUpdated: () => void;
  dataVersion: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  activeMenu,
  onOpenDossier,
  onOpenPerpanjangan,
  onUpdated,
  dataVersion,
}) => {
  const { showToast } = useToast();
  const { showConfirm } = useAlert();
  const isDaerah = user.role === 'admin_daerah';
  const isSuper = user.role === 'super_admin';

  const [filterText, setFilterText] = useState('');
  const [page, setPage] = useState(1);

  // Bank Soal Form
  const [newSoalKat, setNewSoalKat] = useState('');
  const [newSoalTanya, setNewSoalTanya] = useState('');
  const [newSoalPanduan, setNewSoalPanduan] = useState('');
  const [newSoalJenis, setNewSoalJenis] = useState<'wajib' | 'acak'>('acak');

  // Required Docs Form
  const [docJenis, setDocJenis] = useState<RequiredDocumentConfig['jenis_pengajuan']>('rekomendasi');
  const [docNama, setDocNama] = useState('');
  const [docFormat, setDocFormat] = useState('pdf');
  const [docMaxMb, setDocMaxMb] = useState(5);
  const [docKet, setDocKet] = useState('');

  // Master Unit Form
  const [unitNama, setUnitNama] = useState('');
  const [unitKode, setUnitKode] = useState('');
  const [unitPimpinan, setUnitPimpinan] = useState('');
  const [unitIsDaerah, setUnitIsDaerah] = useState(true);

  // New User Form
  const [usrNip, setUsrNip] = useState('');
  const [usrNama, setUsrNama] = useState('');
  const [usrRole, setUsrRole] = useState<Role>('pegawai');
  const [usrUnitId, setUsrUnitId] = useState(user.unit_kerja_id);
  const [usrJabatan, setUsrJabatan] = useState('');

  // Load scoped datasets
  const rawRek = useMemo(() => Storage.getRekomendasi(), [dataVersion]);
  const rawTb = useMemo(() => Storage.getPengajuanTB(), [dataVersion]);
  const rawPg = useMemo(() => Storage.getPencantumanGelar(), [dataVersion]);
  const rawPpj = useMemo(() => Storage.getPerpanjangan(), [dataVersion]);
  const rawMonev = useMemo(() => Storage.getMonev(), [dataVersion]);
  const rawUsers = useMemo(() => Storage.getUsers(), [dataVersion]);
  const units = useMemo(() => Storage.getUnitKerja(), [dataVersion]);
  const bankSoal = useMemo(() => Storage.getSoalWawancara(), [dataVersion]);
  const wwcCfg = useMemo(() => Storage.getPengaturanWawancara(), [dataVersion]);
  const sysCfg = useMemo(() => Storage.getPengaturanSistem(), [dataVersion]);
  const workflowSteps = useMemo(() => Storage.getWorkflowSteps(), [dataVersion]);
  const requiredDocs = useMemo(() => Storage.getRequiredDocs(), [dataVersion]);
  const auditLogs = useMemo(() => Storage.getAuditLogs(), [dataVersion]);

  const rekomendasis = isDaerah
    ? rawRek.filter((r) => r.unit_kerja_id === user.unit_kerja_id)
    : rawRek;
  const tbs = isDaerah
    ? rawTb.filter((t) => t.unit_kerja_id === user.unit_kerja_id)
    : rawTb;
  const pgs = isDaerah
    ? rawPg.filter((p) => p.unit_kerja_id === user.unit_kerja_id)
    : rawPg;
  const ppjs = isDaerah
    ? rawPpj.filter((p) => p.unit_kerja_id === user.unit_kerja_id)
    : rawPpj;
  const monevs = isDaerah
    ? rawMonev.filter((m) => m.unit_kerja_id === user.unit_kerja_id)
    : rawMonev;
  const usersList = isDaerah
    ? rawUsers.filter((u) => u.unit_kerja_id === user.unit_kerja_id)
    : rawUsers;

  const q = filterText.trim().toLowerCase();

  // ---- Handlers for Admin Configuration Modules ----
  const handleAddSoal = (e: React.FormEvent) => {
    e.preventDefault();
    const item: SoalWawancara = {
      id: generateId('soal'),
      kategori: newSoalKat.trim(),
      pertanyaan: newSoalTanya.trim(),
      panduan_penilaian: newSoalPanduan.trim() || 'Nilai relevansi dan kedalaman jawaban.',
      jenis: newSoalJenis,
      is_active: true,
    };
    Storage.addSoalWawancara(item);
    Storage.addAuditLog({
      user,
      aksi: 'Tambah Soal Wawancara',
      entitas: item.kategori,
      detail: `Menambahkan soal ${item.jenis}: ${item.pertanyaan.slice(0, 60)}`,
    });
    setNewSoalKat('');
    setNewSoalTanya('');
    setNewSoalPanduan('');
    showToast('success', 'Soal ditambahkan', `Kategori ${item.kategori} tersimpan ke Bank Soal.`);
    onUpdated();
  };

  const handleAddRequiredDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const item: RequiredDocumentConfig = {
      id: generateId('reqdoc'),
      jenis_pengajuan: docJenis,
      kode_dokumen: `DOC_${Date.now().toString(36).toUpperCase()}`,
      nama_dokumen: docNama.trim(),
      wajib: true,
      format_diizinkan: docFormat.trim() || 'pdf',
      max_size_mb: Number(docMaxMb) || 5,
      keterangan: docKet.trim() || 'Dokumen persyaratan resmi.',
      has_template: true,
      template_format: 'doc',
      is_active: true,
    };
    Storage.addRequiredDoc(item);
    setDocNama('');
    setDocKet('');
    showToast('success', 'Berkas wajib ditambahkan', `${item.nama_dokumen} aktif pada formulir pegawai.`);
    onUpdated();
  };

  const handleUploadCustomTemplate = async (docCfg: RequiredDocumentConfig, file: File) => {
    const base64 = await readUploadedFileAsUrl(file);
    const updated = requiredDocs.map((d) =>
      d.id === docCfg.id
        ? {
          ...d,
          has_template: true,
          template_file_base64: base64,
          template_file_name: file.name,
        }
        : d
    );
    Storage.updateRequiredDocs(updated);
    showToast('success', 'Template diperbarui', `Berkas ${file.name} menjadi template resmi ${docCfg.nama_dokumen}.`);
    onUpdated();
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const item: UnitKerja = {
      id: generateId('unit'),
      nama_unit: unitNama.trim(),
      kode_unit: unitKode.trim().toUpperCase(),
      pimpinan_nama: unitPimpinan.trim(),
      is_daerah: unitIsDaerah,
      created_at: new Date().toISOString(),
    };
    Storage.addUnitKerja(item);
    setUnitNama('');
    setUnitKode('');
    setUnitPimpinan('');
    showToast('success', 'Unit kerja ditambahkan', `${item.nama_unit} (${item.kode_unit}).`);
    onUpdated();
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (Storage.getUsers().some((u) => u.nip === usrNip.trim())) {
      showToast('error', 'NIP sudah terdaftar', 'Gunakan NIP yang unik.');
      return;
    }
    const unit = units.find((u) => u.id === usrUnitId) ?? units[0];
    const newUser: User = {
      id: generateId('usr'),
      nip: usrNip.trim(),
      nama_lengkap: usrNama.trim(),
      email: `${usrNip.trim()}@basarnas.go.id`,
      password: 'basarnas2025',
      role: isDaerah ? 'pegawai' : usrRole,
      unit_kerja_id: isDaerah ? user.unit_kerja_id : unit.id,
      unit_kerja_nama: isDaerah ? user.unit_kerja_nama : unit.nama_unit,
      pangkat_golongan: 'Penata Muda (III/a)',
      jabatan: usrJabatan.trim() || 'Pelaksana',
      status_aktif: true,
      created_at: new Date().toISOString(),
    };
    Storage.addUser(newUser);
    setUsrNip('');
    setUsrNama('');
    setUsrJabatan('');
    showToast('success', 'Pengguna ditambahkan', `${newUser.nama_lengkap} aktif (sandi default: basarnas2025).`);
    onUpdated();
  };

  // === SUB-VIEWS ===
  if (activeMenu === 'bank_soal') {
    return (
      <div className="space-y-6">
        <PageBannerHeader
          eyebrow="MODUL SELEKSI WAWANCARA"
          title="Bank Soal Wawancara & Passing Grade"
          description="Kelola pertanyaan wajib dan acak serta ambang batas kelulusan Tim Pewawancara SDM."
        />

        {/* Pengaturan Passing Grade & Jumlah Acak */}
        <div className="kpi-card p-5 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Passing Grade Kelulusan (0–100)
            </label>
            <input
              type="number"
              min={25}
              max={100}
              value={wwcCfg.passing_grade}
              onChange={(e) => {
                Storage.updatePengaturanWawancara({
                  ...wwcCfg,
                  passing_grade: Number(e.target.value) || 75,
                });
                onUpdated();
              }}
              className="w-36 px-3 py-2 text-sm font-mono font-bold bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jumlah Soal Acak per Peserta
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={wwcCfg.jumlah_soal_acak}
              onChange={(e) => {
                Storage.updatePengaturanWawancara({
                  ...wwcCfg,
                  jumlah_soal_acak: Number(e.target.value) || 3,
                });
                onUpdated();
              }}
              className="w-36 px-3 py-2 text-sm font-mono font-bold bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
            />
          </div>
          <p className="text-xs font-medium text-slate-600 bg-red-50 border border-red-200/70 rounded-lg px-3 py-2">
            Skala baku: <strong className="text-[#A50D26]">MS = 100</strong> · CMS = 75 · KMS = 50 · TMS = 25
          </p>
        </div>

        {/* Add Soal Form */}
        <form onSubmit={handleAddSoal} className="kpi-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Tambah Pertanyaan Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={newSoalKat}
              onChange={(e) => setNewSoalKat(e.target.value)}
              placeholder="Kategori (mis. Inovasi Operasi SAR)"
              className="px-3 py-2 text-xs bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
            />
            <select
              value={newSoalJenis}
              onChange={(e) => setNewSoalJenis(e.target.value as 'wajib' | 'acak')}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
            >
              <option value="wajib">Soal Wajib</option>
              <option value="acak">Soal Acak</option>
            </select>
            <input
              type="text"
              value={newSoalPanduan}
              onChange={(e) => setNewSoalPanduan(e.target.value)}
              placeholder="Panduan indikator penilaian..."
              className="px-3 py-2 text-xs bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={newSoalTanya}
              onChange={(e) => setNewSoalTanya(e.target.value)}
              placeholder="Tulis teks pertanyaan wawancara lengkap..."
              className="flex-1 px-3 py-2 text-xs bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-lg whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Simpan Soal
            </button>
          </div>
        </form>

        {/* List Soal */}
        <div className="kpi-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Daftar Bank Soal ({bankSoal.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {bankSoal.map((s, idx) => (
              <div key={s.id} className="px-6 py-4 flex items-start justify-between gap-4 text-xs hover:bg-red-50/30 transition-colors">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">
                    {idx + 1}. {s.kategori} ·{' '}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.jenis === 'wajib'
                          ? 'bg-red-50 text-[#A50D26] border border-red-200'
                          : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {s.jenis === 'wajib' ? 'Wajib' : 'Acak'}
                    </span>
                  </p>
                  <p className="text-slate-700 leading-relaxed">{s.pertanyaan}</p>
                  <p className="text-[11px] text-slate-500 italic">Panduan: {s.panduan_penilaian}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await showConfirm({
                      title: 'Hapus Soal Wawancara?',
                      message: `Pertanyaan kategori "${s.kategori}" (${s.jenis === 'wajib' ? 'Soal Wajib' : 'Soal Acak'}) akan dihapus dari Bank Soal: "${s.pertanyaan.slice(0, 90)}${s.pertanyaan.length > 90 ? '…' : ''}"`,
                      tone: 'danger',
                      confirmLabel: 'Ya, Hapus Soal',
                      cancelLabel: 'Batal',
                    });
                    if (!ok) return;
                    Storage.deleteSoalWawancara(s.id);
                    Storage.addAuditLog({
                      user,
                      aksi: 'Hapus Soal Wawancara',
                      entitas: s.kategori,
                      detail: `Menghapus soal ${s.jenis}: ${s.pertanyaan.slice(0, 60)}`,
                    });
                    showToast('info', 'Soal dihapus', s.kategori);
                    onUpdated();
                  }}
                  aria-label={`Hapus soal ${s.kategori}`}
                  title="Hapus soal"
                  className="p-1.5 text-slate-500 hover:text-[#C8102E] hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeMenu === 'evaluasi_monev') {
    const monthlyEntries = tbs.flatMap((t) =>
      (t.laporan_bulanan || []).map((lb) => ({ tb: t, lb }))
    );

    return (
      <div className="space-y-6">
        <PageBannerHeader
          eyebrow="MONITORING & EVALUASI AKADEMIK"
          title="Evaluasi Monev Semester & Laporan Bulanan"
          description="Tinjau KHS semester, tren IPK, serta laporan progres bulanan pegawai tugas belajar."
        />

        <div className="kpi-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Laporan Monev KHS Semester ({monevs.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">Pegawai & Unit</th>
                  <th className="py-3 px-4">Semester & Kampus</th>
                  <th className="py-3 px-4 text-right">IPK Smt / Kum</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Evaluasi Admin</th>
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
                      <p className="font-medium text-slate-900">
                        Smt {m.semester} · {m.universitas}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">{m.ringkasan_progres}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                      {m.ipk_semester.toFixed(2)} / {m.ipk_kumulatif.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${m.status_evaluasi === 'diterima'
                            ? 'text-emerald-700'
                            : m.status_evaluasi === 'perlu_perbaikan'
                              ? 'text-amber-700'
                              : 'text-blue-700'
                          }`}
                      >
                        {m.status_evaluasi.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          Storage.updateMonev({
                            ...m,
                            status_evaluasi: 'diterima',
                            catatan_evaluasi_admin: `Diterima oleh ${user.nama_lengkap} (${formatDateIndo(new Date(), true)}).`,
                          });
                          showToast('success', 'Monev Diterima', `${m.user_nama} Semester ${m.semester}.`);
                          onUpdated();
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md"
                      >
                        Terima
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          Storage.updateMonev({
                            ...m,
                            status_evaluasi: 'perlu_perbaikan',
                            catatan_evaluasi_admin: 'Mohon lengkapi legalisir KHS dan progres tesis.',
                          });
                          showToast('warning', 'Ditandai Perlu Perbaikan', m.user_nama);
                          onUpdated();
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md"
                      >
                        Perbaikan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              Laporan Progres Bulanan ({monthlyEntries.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {monthlyEntries.length === 0 ? (
              <p className="p-8 text-xs text-slate-500 text-center">Belum ada laporan bulanan masuk.</p>
            ) : (
              monthlyEntries.map(({ tb, lb }) => (
                <div key={lb.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {tb.user_nama} · {lb.bulan} {lb.tahun} ({lb.status_studi.replace('_', ' ')})
                    </p>
                    <p className="text-slate-600 mt-0.5">{lb.ringkasan_aktivitas}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5 tabular-nums">
                      {lb.sks_ditempuh} SKS · IPK {lb.ipk_sementara.toFixed(2)} · Status: {lb.status_evaluasi}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        Storage.evaluasiLaporanBulanan(tb.id, lb.id, 'diterima', 'Progres baik.', user);
                        showToast('success', 'Laporan Bulanan Diterima', `${tb.user_nama} (${lb.bulan})`);
                        onUpdated();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                    >
                      Terima
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        Storage.evaluasiLaporanBulanan(tb.id, lb.id, 'perlu_perbaikan', 'Lengkapi bukti bimbingan.', user);
                        showToast('warning', 'Perlu Perbaikan', `${tb.user_nama} (${lb.bulan})`);
                        onUpdated();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg"
                    >
                      Revisi
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeMenu === 'konfigurasi_alur') {
    return (
      <div className="space-y-6">
        <PageBannerHeader
          eyebrow="PENGATURAN ALUR KERJA"
          title="Konfigurasi Alur Persetujuan & Kuota Usul Ulang"
          description="Atur batas maksimal usul ulang pasca penolakan dan aktif/nonaktifkan tahapan workflow per layanan."
        />

        <div className="kpi-card p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Batas Maksimal Usul Ulang (max_usul_ulang)</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Jumlah maksimal pengajuan ulang bagi berkas yang ditolak (bawaan: 2×).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={5}
              value={sysCfg.max_usul_ulang}
              onChange={(e) => {
                Storage.updatePengaturanSistem({
                  ...sysCfg,
                  max_usul_ulang: Number(e.target.value) || 2,
                });
                showToast('success', 'Kuota usul ulang diperbarui', `Batas maksimal kini ${e.target.value} kali.`);
                onUpdated();
              }}
              className="w-20 px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg text-center"
            />
            <span className="text-xs text-slate-600">kali</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              Daftar Tahapan Alur Kerja ({workflowSteps.length} langkah)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">Layanan</th>
                  <th className="py-3 px-3">Urutan</th>
                  <th className="py-3 px-4">Nama Tahapan</th>
                  <th className="py-3 px-4">Penanggung Jawab</th>
                  <th className="py-3 px-5 text-right">Status Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {workflowSteps.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-5 font-semibold text-slate-900 capitalize">
                      {st.jenis_pengajuan.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 tabular-nums">{st.urutan}</td>
                    <td className="py-2.5 px-4 text-slate-800">{st.nama_step}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {getRoleDisplayLabel(st.role_penanggung_jawab)}
                    </td>
                    <td className="py-2.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-2.5">
                        <span
                          className={`text-[11px] font-semibold ${
                            st.is_active ? 'text-slate-800' : 'text-slate-500'
                          }`}
                        >
                          {st.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={st.is_active}
                          aria-label={`${st.is_active ? 'Nonaktifkan' : 'Aktifkan'} tahapan ${st.nama_step}`}
                          onClick={() => {
                            const nextActive = !st.is_active;
                            const next = workflowSteps.map((x) =>
                              x.id === st.id ? { ...x, is_active: nextActive } : x
                            );
                            Storage.updateWorkflowSteps(next);
                            showToast(
                              'info',
                              nextActive ? 'Tahapan diaktifkan' : 'Tahapan dinonaktifkan',
                              st.nama_step
                            );
                            onUpdated();
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8102E] ${
                            st.is_active ? 'bg-[#C8102E]' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                              st.is_active ? 'translate-x-[19px]' : 'translate-x-[3px]'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeMenu === 'konfigurasi_berkas') {
    return (
      <div className="space-y-6">
        <PageBannerHeader
          eyebrow="MASTER BERKAS PERSYARATAN"
          title="Konfigurasi Dokumen Wajib & Template"
          description="Atur berkas persyaratan tiap layanan, format file diizinkan, batas ukuran, serta unggah template resmi Word/PDF."
        />

        <form onSubmit={handleAddRequiredDoc} className="kpi-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Tambah Dokumen Wajib Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={docJenis}
              onChange={(e) => setDocJenis(e.target.value as RequiredDocumentConfig['jenis_pengajuan'])}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="rekomendasi">Rekomendasi</option>
              <option value="beasiswa">Beasiswa</option>
              <option value="mandiri">Mandiri</option>
              <option value="pencantuman_gelar">Pencantuman Gelar</option>
            </select>
            <input
              type="text"
              required
              value={docNama}
              onChange={(e) => setDocNama(e.target.value)}
              placeholder="Nama Dokumen Wajib"
              className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={docFormat}
                onChange={(e) => setDocFormat(e.target.value)}
                placeholder="pdf, doc"
                className="w-24 px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                min={1}
                max={20}
                value={docMaxMb}
                onChange={(e) => setDocMaxMb(Number(e.target.value))}
                className="w-16 px-2 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={docKet}
              onChange={(e) => setDocKet(e.target.value)}
              placeholder="Keterangan singkat pengisian untuk pegawai..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Berkas
            </button>
          </div>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">Layanan</th>
                  <th className="py-3 px-4">Dokumen & Keterangan</th>
                  <th className="py-3 px-4">Format & Maks</th>
                  <th className="py-3 px-5 text-right">Template & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {requiredDocs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-5 font-semibold text-slate-900 capitalize">
                      {d.jenis_pengajuan.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{d.nama_dokumen}</p>
                      <p className="text-[11px] text-slate-500">{d.keterangan}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 tabular-nums">
                      {d.format_diizinkan.toUpperCase()} · {d.max_size_mb} MB
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadTemplateDocument(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                      >
                        <Download className="w-3 h-3" />
                        Unduh
                      </button>
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md cursor-pointer">
                        <Upload className="w-3 h-3" />
                        Ganti Template
                        <input
                          type="file"
                          accept=".doc,.docx,.pdf"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadCustomTemplate(d, f);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          Storage.deleteRequiredDoc(d.id);
                          showToast('info', 'Dokumen wajib dihapus', d.nama_dokumen);
                          onUpdated();
                        }}
                        aria-label="Hapus berkas"
                        className="p-1 text-slate-400 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeMenu === 'manajemen_user') {
    return (
      <div className="space-y-6">
        <PageBannerHeader
          eyebrow="KELOLA AKSES & PENGGUNA"
          title={isDaerah ? `Manajemen Pegawai ${user.unit_kerja_nama}` : 'Manajemen Pengguna SITUBEL'}
          description="Tambah akun pegawai baru, kelola peran akses, serta aktif/nonaktifkan status pengguna."
        />

        <form onSubmit={handleAddUser} className="kpi-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Tambah Akun Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              type="text"
              required
              value={usrNip}
              onChange={(e) => setUsrNip(e.target.value)}
              placeholder="NIP 18 digit"
              className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              required
              value={usrNama}
              onChange={(e) => setUsrNama(e.target.value)}
              placeholder="Nama Lengkap"
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              value={usrJabatan}
              onChange={(e) => setUsrJabatan(e.target.value)}
              placeholder="Jabatan"
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            {!isDaerah && (
              <>
                <select
                  value={usrRole}
                  onChange={(e) => setUsrRole(e.target.value as Role)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="pegawai">Pegawai</option>
                  <option value="pimpinan_unit">Pimpinan Unit</option>
                  <option value="admin_daerah">Admin Daerah</option>
                  <option value="admin_kepegawaian">Admin Kepegawaian</option>
                  <option value="kepala_biro_kepegawaian">Kepala Biro</option>
                  <option value="pewawancara">Pewawancara</option>
                  <option value="pejabat_berwenang">PPK</option>
                  {isSuper && <option value="super_admin">Super Admin</option>}
                </select>
                <select
                  value={usrUnitId}
                  onChange={(e) => setUsrUnitId(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_unit}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Pengguna
            </button>
          </div>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">Nama & NIP</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Unit Kerja & Jabatan</th>
                  <th className="py-3 px-5 text-right">Status Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-5">
                      <p className="font-semibold text-slate-900">{u.nama_lengkap}</p>
                      <p className="font-mono text-[11px] text-slate-500">{u.nip}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {getRoleDisplayLabel(u.role)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800">{u.unit_kerja_nama}</p>
                      <p className="text-[11px] text-slate-500">{u.jabatan}</p>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        disabled={u.id === user.id}
                        onClick={() => {
                          Storage.updateUser({ ...u, status_aktif: !u.status_aktif });
                          showToast(
                            'info',
                            'Status akun diperbarui',
                            `${u.nama_lengkap} kini ${!u.status_aktif ? 'Aktif' : 'Nonaktif'}.`
                          );
                          onUpdated();
                        }}
                        className={`text-xs font-semibold disabled:opacity-40 ${u.status_aktif ? 'text-emerald-700' : 'text-red-700'
                          }`}
                      >
                        {u.status_aktif ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeMenu === 'master_unit') {
    return (
      <div className="space-y-6">
        <PageBannerHeader
          eyebrow="DATA MASTER ORGANISASI"
          title="Master Unit Kerja BASARNAS"
          description="Daftar biro, direktorat pusat, dan Kantor SAR daerah yang terhubung ke alur verifikasi SITUBEL."
        />

        <form onSubmit={handleAddUnit} className="kpi-card p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Tambah Unit Kerja Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              value={unitNama}
              onChange={(e) => setUnitNama(e.target.value)}
              placeholder="Nama Unit (mis. Kantor SAR Kelas A Bali)"
              className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              required
              value={unitKode}
              onChange={(e) => setUnitKode(e.target.value)}
              placeholder="Kode (SAR-DPS)"
              className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              required
              value={unitPimpinan}
              onChange={(e) => setUnitPimpinan(e.target.value)}
              placeholder="Nama Pimpinan Unit"
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={unitIsDaerah}
                onChange={(e) => setUnitIsDaerah(e.target.checked)}
                className="rounded border-slate-300 text-orange-600"
              />
              Unit Daerah (melalui tahap verifikasi Admin Daerah)
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Simpan Unit
            </button>
          </div>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">Kode</th>
                  <th className="py-3 px-4">Nama Unit Kerja</th>
                  <th className="py-3 px-4">Pimpinan</th>
                  <th className="py-3 px-5">Klasifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-5 font-mono font-semibold text-slate-900">{u.kode_unit}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.nama_unit}</td>
                    <td className="py-3 px-4 text-slate-700">{u.pimpinan_nama}</td>
                    <td className="py-3 px-5 text-slate-600">
                      {u.is_daerah ? 'Kantor SAR Daerah' : 'Unit Pusat'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeMenu === 'audit_log') {
    const filteredLogs = auditLogs.filter(
      (l) =>
        !q ||
        l.user_nama.toLowerCase().includes(q) ||
        l.aksi.toLowerCase().includes(q) ||
        l.entitas.toLowerCase().includes(q) ||
        l.detail.toLowerCase().includes(q)
    );
    const pageSize = 10;
    const paged = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

    return (
      <div className="space-y-6">
        <PageBannerHeader
          eyebrow="JEJAK AUDIT KEAMANAN"
          title="Audit Log Aktivitas Sistem"
          description="Rekam jejak seluruh verifikasi, persetujuan, penandatanganan, dan perubahan konfigurasi SITUBEL."
          rightSlot={
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter aktor, aksi, atau nomor..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
              />
            </div>
          }
        />

        <div className="kpi-card p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-2.5 px-3.5">Waktu (WIB)</th>
                  <th className="py-2.5 px-3.5">Aktor & Peran</th>
                  <th className="py-2.5 px-3.5">Aksi & Entitas</th>
                  <th className="py-2.5 px-3.5">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paged.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {formatDateTimeIndo(log.timestamp)}
                    </td>
                    <td className="py-3 px-3.5">
                      <p className="font-semibold text-slate-900">{log.user_nama}</p>
                      <p className="text-[11px] text-slate-500">{getRoleDisplayLabel(log.user_role)}</p>
                    </td>
                    <td className="py-3 px-3.5">
                      <p className="font-semibold text-slate-900">{log.aksi}</p>
                      <p className="font-mono text-[11px] text-orange-700">{log.entitas}</p>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalItems={filteredLogs.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    );
  }

  // === OPERATIONAL QUEUES & DASHBOARD OVERVIEW ===
  const filteredRek = rekomendasis.filter(
    (r) =>
      !q ||
      r.no_registrasi.toLowerCase().includes(q) ||
      r.user_nama.toLowerCase().includes(q) ||
      r.universitas_tujuan.toLowerCase().includes(q)
  );
  const filteredBeasiswa = tbs
    .filter((t) => t.jenis === 'beasiswa')
    .filter(
      (t) =>
        !q ||
        t.no_registrasi.toLowerCase().includes(q) ||
        t.user_nama.toLowerCase().includes(q) ||
        t.universitas_tujuan.toLowerCase().includes(q)
    );
  const filteredMandiri = tbs
    .filter((t) => t.jenis === 'mandiri')
    .filter(
      (t) =>
        !q ||
        t.no_registrasi.toLowerCase().includes(q) ||
        t.user_nama.toLowerCase().includes(q) ||
        t.universitas_tujuan.toLowerCase().includes(q)
    );
  const draftSkQueue = tbs.filter((t) =>
    ['terkonfirmasi_kabi', 'ditolak_ppk', 'menunggu_ttd_ppk', 'sk_terbit', 'menunggu_perjanjian', 'perjanjian_ditandatangani'].includes(
      t.status
    )
  );

  const sectionTitle =
    activeMenu === 'verif_rekomendasi'
      ? isDaerah
        ? 'ACC Surat Rekomendasi Daerah'
        : 'Verifikasi & Penerbitan Surat Rekomendasi'
      : activeMenu === 'seleksi_beasiswa'
        ? isDaerah
          ? 'ACC Tugas Belajar Beasiswa Daerah'
          : 'Seleksi Administrasi & Wawancara Beasiswa'
        : activeMenu === 'tubel_mandiri'
          ? 'Layanan Tugas Belajar Biaya Mandiri'
          : activeMenu === 'draft_sk_admin'
            ? 'Penyusunan Draft SK Dinamis & Pemantauan TTD PPK'
            : activeMenu === 'perpanjangan_studi'
              ? 'Layanan Perpanjangan Masa Belajar'
              : activeMenu === 'siasn_bkn'
                ? 'Pencantuman Gelar & Usulan SIASN BKN'
                : isDaerah
                  ? `Dashboard Admin Daerah — ${user.unit_kerja_nama}`
                  : isSuper
                    ? 'Dashboard Super Administrator SITUBEL'
                    : 'Dashboard Admin Kepegawaian Pusat';

  const totalAllRecords = rekomendasis.length + tbs.length + pgs.length + ppjs.length;
  const totalCompletedRecords =
    rekomendasis.filter((r) => r.status === 'rekomendasi_terbit').length +
    tbs.filter((t) => ['sk_terbit', 'sedang_belajar', 'selesai_aktif'].includes(t.status)).length +
    pgs.filter((p) => p.status === 'ms').length +
    ppjs.filter((p) => p.status === 'sk_perpanjangan_terbit').length;
  const completionPct =
    totalAllRecords > 0 ? Math.round((totalCompletedRecords / totalAllRecords) * 100) : 100;
  const pendingRekFollowUp = rekomendasis.filter((r) =>
    isDaerah
      ? r.status === 'menunggu_acc_admin_daerah'
      : ['verifikasi_admin', 'dikembalikan_kabi', 'terkonfirmasi_kabi'].includes(r.status)
  ).length;

  return (
    <div className="space-y-6">
      <PageBannerHeader
        eyebrow={
          isDaerah
            ? `ADMINISTRATOR DAERAH · ${user.unit_kerja_nama}`
            : isSuper
              ? 'SUPER ADMINISTRATOR · BIRO KEPEGAWAIAN PUSAT'
              : 'ADMIN KEPEGAWAIAN PUSAT · BASARNAS RI'
        }
        title={sectionTitle}
        description={
          isDaerah
            ? 'Verifikasi tingkat wilayah Kantor SAR Daerah sebelum diteruskan ke Biro Kepegawaian Pusat.'
            : 'Verifikasi dokumen, seleksi beasiswa/mandiri, penyusunan draft SK dinamis, dan pelaporan SIASN BKN.'
        }
        rightSlot={
          activeMenu !== 'dashboard' ? (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter nomor, nama, atau kampus..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
              />
            </div>
          ) : undefined
        }
      />

      {/* Signature 4-Tier Graduated Crimson KPI Strip */}
      <KpiGraduatedStrip
        items={[
          {
            label: 'Surat Rekomendasi',
            value: rekomendasis.length,
            sublabel: `${pendingRekFollowUp} perlu tindak lanjut`,
            icon: FileText,
          },
          {
            label: 'Tugas Belajar',
            value: tbs.length,
            sublabel: `${tbs.filter((t) => t.status === 'sedang_belajar').length} sedang belajar aktif`,
            icon: GraduationCap,
          },
          {
            label: 'Draft SK & TTD PPK',
            value: draftSkQueue.length,
            sublabel: 'Tahap penerbitan & BSrE',
            icon: FileSignature,
          },
          {
            label: 'Gelar & Perpanjangan',
            value: pgs.length + ppjs.length,
            sublabel: `${pgs.length} gelar SIASN · ${ppjs.length} perpanjangan`,
            icon: Award,
          },
        ]}
      />

      {/* Table: Rekomendasi */}
      {(activeMenu === 'dashboard' || activeMenu === 'verif_rekomendasi') && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Pengajuan Surat Rekomendasi</h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{filteredRek.length} data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">Tujuan Studi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRek.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">{r.no_registrasi}</td>
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-lg whitespace-nowrap transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Verifikasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table: Tugas Belajar (Beasiswa / Mandiri / Draft SK / Dashboard) */}
      {(activeMenu === 'dashboard' ||
        activeMenu === 'seleksi_beasiswa' ||
        activeMenu === 'tubel_mandiri' ||
        activeMenu === 'draft_sk_admin') && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {activeMenu === 'seleksi_beasiswa'
                  ? 'Daftar Pengajuan Tugas Belajar Beasiswa'
                  : activeMenu === 'tubel_mandiri'
                    ? 'Daftar Pengajuan Tugas Belajar Biaya Mandiri'
                    : activeMenu === 'draft_sk_admin'
                      ? 'Antrean Penyusunan Draft SK & Verifikasi Perjanjian'
                      : 'Pengajuan Tugas Belajar (Beasiswa & Mandiri)'}
              </h2>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {(activeMenu === 'seleksi_beasiswa'
                  ? filteredBeasiswa
                  : activeMenu === 'tubel_mandiri'
                    ? filteredMandiri
                    : activeMenu === 'draft_sk_admin'
                      ? draftSkQueue
                      : tbs
                ).length}{' '}
                data
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
                    <th className="py-3 px-5 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {(activeMenu === 'seleksi_beasiswa'
                    ? filteredBeasiswa
                    : activeMenu === 'tubel_mandiri'
                      ? filteredMandiri
                      : activeMenu === 'draft_sk_admin'
                        ? draftSkQueue
                        : tbs
                  ).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5">
                        <p className="font-mono font-semibold text-slate-900">{t.no_registrasi}</p>
                        {t.kelengkapan_sk && (
                          <p className="font-mono text-[11px] text-slate-500">{t.kelengkapan_sk.nomor_sk}</p>
                        )}
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${['verifikasi_admin', 'menunggu_acc_admin_daerah', 'terkonfirmasi_kabi', 'seleksi_wawancara', 'surat_kampus_diunggah', 'perjanjian_ditandatangani'].includes(
                            t.status
                          )
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Proses
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Table: Perpanjangan */}
      {activeMenu === 'perpanjangan_studi' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Daftar Usulan Perpanjangan Masa Belajar</h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{ppjs.length} usulan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">TMT Lama → Usulan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {ppjs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">{p.no_registrasi}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{p.user_nama}</p>
                      <p className="text-[11px] text-slate-500">{p.unit_kerja_nama}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {formatDateIndo(p.tmt_selesai_lama, true)} → {formatDateIndo(p.tmt_selesai_usulan, true)} (+
                      {p.tambahan_semester} smt)
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Proses
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table: Pencantuman Gelar SIASN BKN */}
      {activeMenu === 'siasn_bkn' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Pengusulan Pencantuman Gelar ke SIASN BKN</h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{pgs.length} usulan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-5">No. Registrasi</th>
                  <th className="py-3 px-4">Pegawai & Unit</th>
                  <th className="py-3 px-4">Gelar & Kampus</th>
                  <th className="py-3 px-4">Status BKN</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pgs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      <CheckCircle2 className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                      Belum ada pengajuan pencantuman gelar.
                    </td>
                  </tr>
                ) : (
                  pgs.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                        {p.no_registrasi}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{p.user_nama}</p>
                        <p className="text-[11px] text-slate-500">{p.unit_kerja_nama}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">
                          {p.jenjang} ({p.gelar_diperoleh}) · {p.nama_kampus}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {p.periode_submit || 'Menunggu periode usulan'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${getStatusTextClass(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </span>
                        {p.nomor_pertek_bkn && (
                          <p className="font-mono text-[11px] text-emerald-700 mt-0.5">
                            {p.nomor_pertek_bkn}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDossier({ type: 'pencantuman_gelar', id: p.id })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Proses SIASN
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
