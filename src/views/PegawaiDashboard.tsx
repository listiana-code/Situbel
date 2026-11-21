import React, { useMemo, useState } from 'react';
import {
  FileText,
  GraduationCap,
  BookOpenCheck,
  Award,
  Download,
  Eye,
  Upload,
  Plus,
  CalendarClock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { addSemestersToDate, addWorkingDays, formatDateIndo, formatTimeIndo } from '../lib/dateUtils';
import { prepareDocumentUpload } from '../lib/fileUtils';
import { getStatusLabel, getStatusTextClass } from '../lib/statusUtils';
import { generateId, Storage } from '../lib/storage';
import { downloadTemplateDocument } from '../lib/templateDownloader';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { RiwayatDetailPanel, type PreviewRequest } from '../components/RiwayatDetailPanel';
import { useToast } from '../components/Toast';
import type {
  DokumenItem,
  DossierTarget,
  LaporanMonev,
  LaporanProgresBulanan,
  PengajuanPencantumanGelar,
  PengajuanPerpanjangan,
  PengajuanRekomendasi,
  PengajuanTugasBelajar,
  User,
} from '../types';

interface PegawaiDashboardProps {
  user: User;
  activeMenu: string;
  onSelectMenu: (menu: string) => void;
  onOpenDossier: (target: DossierTarget) => void;
  onOpenPerpanjangan: (item: PengajuanPerpanjangan) => void;
  onUpdated: () => void;
  dataVersion: number;
}

export const PegawaiDashboard: React.FC<PegawaiDashboardProps> = ({
  user,
  activeMenu,
  onSelectMenu,
  onOpenDossier,
  onOpenPerpanjangan,
  onUpdated,
  dataVersion,
}) => {
  const { showToast } = useToast();

  const myRek = useMemo(
    () => Storage.getRekomendasi().filter((r) => r.user_id === user.id),
    [user.id, dataVersion]
  );
  const myTb = useMemo(
    () => Storage.getPengajuanTB().filter((t) => t.user_id === user.id),
    [user.id, dataVersion]
  );
  const myPg = useMemo(
    () => Storage.getPencantumanGelar().filter((p) => p.user_id === user.id),
    [user.id, dataVersion]
  );
  const myPpj = useMemo(
    () => Storage.getPerpanjangan().filter((p) => p.user_id === user.id),
    [user.id, dataVersion]
  );
  const myMonev = useMemo(
    () => Storage.getMonev().filter((m) => m.user_id === user.id),
    [user.id, dataVersion]
  );
  const requiredDocs = useMemo(() => Storage.getRequiredDocs(), [dataVersion]);
  const workflowSteps = useMemo(() => Storage.getWorkflowSteps(), [dataVersion]);

  const activeStudies = myTb.filter((t) => t.status === 'sedang_belajar');
  const issuedRek = myRek.filter((r) => r.status === 'rekomendasi_terbit');

  // --- Inline Riwayat / Detail & Berkas Selection & Preview ---
  const [selectedHistoryKey, setSelectedHistoryKey] = useState<string>('');
  const [previewReq, setPreviewReq] = useState<PreviewRequest | null>(null);

  // --- Form states: Rekomendasi ---
  const [rekJenjang, setRekJenjang] = useState<PengajuanRekomendasi['jenjang']>('S2');
  const [rekProdi, setRekProdi] = useState('');
  const [rekUniv, setRekUniv] = useState('');
  const [rekAkrProdi, setRekAkrProdi] = useState('Unggul');
  const [rekAkrUniv, setRekAkrUniv] = useState('Unggul');
  const [rekNegara, setRekNegara] = useState('Indonesia');
  const [rekTahun, setRekTahun] = useState('2026/2027');
  const [rekJalur, setRekJalur] = useState<'beasiswa' | 'mandiri'>('beasiswa');
  const [rekFiles, setRekFiles] = useState<Record<string, File | null>>({});

  // --- Form states: Tugas Belajar (Beasiswa / Mandiri) ---
  const [tbRekId, setTbRekId] = useState('');
  const [tbJenjang, setTbJenjang] = useState<PengajuanTugasBelajar['jenjang']>('S2');
  const [tbProdi, setTbProdi] = useState('');
  const [tbUniv, setTbUniv] = useState('');
  const [tbAkr, setTbAkr] = useState('Unggul');
  const [tbLokasi, setTbLokasi] = useState<'Dalam Negeri' | 'Luar Negeri'>('Dalam Negeri');
  const [tbDurasi, setTbDurasi] = useState(4);
  const [tbDana, setTbDana] = useState('Beasiswa LPDP — PNS');
  const [tbTmtMulai, setTbTmtMulai] = useState('2026-08-01');
  const [tbFiles, setTbFiles] = useState<Record<string, File | null>>({});

  // --- Form states: Monev & Bulanan ---
  const [monevTab, setMonevTab] = useState<'semester' | 'bulanan'>('semester');
  const [selTbId, setSelTbId] = useState(activeStudies[0]?.id ?? '');
  const [mnvSemester, setMnvSemester] = useState(1);
  const [mnvTahun, setMnvTahun] = useState('2026/2027 Ganjil');
  const [mnvIpkSmt, setMnvIpkSmt] = useState('3.75');
  const [mnvIpkKum, setMnvIpkKum] = useState('3.75');
  const [mnvRingkasan, setMnvRingkasan] = useState('');
  const [mnvKendala, setMnvKendala] = useState('');
  const [mnvKhsFile, setMnvKhsFile] = useState<File | null>(null);

  const [blnNama, setBlnNama] = useState('November');
  const [blnStatus, setBlnStatus] = useState<LaporanProgresBulanan['status_studi']>('aktif_kuliah');
  const [blnSks, setBlnSks] = useState('18');
  const [blnIpk, setBlnIpk] = useState('3.80');
  const [blnAktivitas, setBlnAktivitas] = useState('');

  // --- Form states: Perpanjangan ---
  const [ppjTbId, setPpjTbId] = useState(activeStudies[0]?.id ?? '');
  const [ppjTambahan, setPpjTambahan] = useState(1);
  const [ppjAlasan, setPpjAlasan] = useState('');
  const [ppjFile, setPpjFile] = useState<File | null>(null);

  // --- Form states: Pencantuman Gelar ---
  const [pgJenjang, setPgJenjang] = useState<PengajuanPencantumanGelar['jenjang']>('S2');
  const [pgGelar, setPgGelar] = useState('');
  const [pgKampus, setPgKampus] = useState('');
  const [pgProdi, setPgProdi] = useState('');
  const [pgNoIjazah, setPgNoIjazah] = useState('');
  const [pgTglLulus, setPgTglLulus] = useState(new Date().toISOString().slice(0, 10));
  const [pgFiles, setPgFiles] = useState<Record<string, File | null>>({});

  // Prefill TB form when selecting an issued recommendation
  const handleSelectIssuedRek = (id: string) => {
    setTbRekId(id);
    const found = issuedRek.find((r) => r.id === id);
    if (found) {
      setTbJenjang(found.jenjang);
      setTbProdi(found.program_studi);
      setTbUniv(found.universitas_tujuan);
      setTbAkr(found.akreditasi_prodi);
    }
  };

  // --- Submit Rekomendasi ---
  const handleSubmitRekomendasi = async (e: React.FormEvent) => {
    e.preventDefault();
    const docsCfg = requiredDocs.filter((d) => d.jenis_pengajuan === 'rekomendasi' && d.is_active);
    const noReg = `REK/2026/${String(Storage.getRekomendasi().length + 1).padStart(3, '0')}`;
    const uploadedDocs: DokumenItem[] = [];

    for (const cfg of docsCfg) {
      const f = rekFiles[cfg.kode_dokumen];
      if (f) {
        const up = await prepareDocumentUpload(f, {
          jenis: 'rekomendasi',
          nip: user.nip,
          nama: user.nama_lengkap,
          noReg,
        });
        uploadedDocs.push({
          id: generateId('doc'),
          kode_dokumen: cfg.kode_dokumen,
          nama_dokumen: cfg.nama_dokumen,
          nama_file: up.nama_file,
          file_url: up.file_url,
          google_drive_file_id: up.google_drive_file_id,
          google_drive_path: up.google_drive_path,
          ukuran_mb: up.ukuran_mb,
          uploaded_at: new Date().toISOString(),
          status_verifikasi: 'pending',
        });
      } else {
        uploadedDocs.push({
          id: generateId('doc'),
          kode_dokumen: cfg.kode_dokumen,
          nama_dokumen: cfg.nama_dokumen,
          nama_file: `${cfg.kode_dokumen}_${user.nip}.pdf`,
          ukuran_mb: 0.65,
          uploaded_at: new Date().toISOString(),
          status_verifikasi: 'pending',
        });
      }
    }

    const now = new Date().toISOString();
    const newItem: PengajuanRekomendasi = {
      id: generateId('rek'),
      no_registrasi: noReg,
      user_id: user.id,
      user_nama: user.nama_lengkap,
      user_nip: user.nip,
      unit_kerja_id: user.unit_kerja_id,
      unit_kerja_nama: user.unit_kerja_nama,
      pangkat_golongan: user.pangkat_golongan,
      jabatan: user.jabatan,
      jenjang: rekJenjang,
      program_studi: rekProdi.trim(),
      universitas_tujuan: rekUniv.trim(),
      akreditasi_prodi: rekAkrProdi,
      akreditasi_univ: rekAkrUniv,
      negara: rekNegara.trim() || 'Indonesia',
      tahun_akademik: rekTahun.trim(),
      jalur_rencana: rekJalur,
      status: 'menunggu_acc_pimpinan',
      dokumen: uploadedDocs,
      usul_ulang_count: 0,
      riwayat_usul_ulang: [],
      riwayat_alur: [
        {
          id: generateId('r-rek'),
          tahap: 'Pengajuan berkas oleh Pegawai',
          role: user.role,
          actor_nama: user.nama_lengkap,
          status: 'diproses',
          catatan: `Mengajukan Surat Rekomendasi ${rekJenjang} ${rekProdi.trim()} di ${rekUniv.trim()}.`,
          timestamp: now,
        },
      ],
      created_at: now,
      updated_at: now,
    };

    Storage.addRekomendasi(newItem);
    Storage.addAuditLog({
      user,
      aksi: 'Ajukan Surat Rekomendasi',
      entitas: noReg,
      detail: `${rekJenjang} ${rekProdi.trim()} — ${rekUniv.trim()}.`,
    });
    Storage.addNotification({
      target_role: 'pimpinan_unit',
      target_unit_id: user.unit_kerja_id,
      judul: 'Pengajuan Surat Rekomendasi Baru',
      pesan: `${noReg} atas nama ${user.nama_lengkap} menunggu ACC Pimpinan Unit.`,
      ref_type: 'rekomendasi',
      ref_id: newItem.id,
    });
    setRekProdi('');
    setRekUniv('');
    setRekFiles({});
    showToast('success', 'Pengajuan Rekomendasi Terkirim', `Nomor registrasi ${noReg} menunggu ACC Pimpinan Unit.`);
    onUpdated();
    onSelectMenu('details_berkas');
  };

  // --- Submit Tugas Belajar (Beasiswa / Mandiri) ---
  const handleSubmitTB = async (e: React.FormEvent, jenis: 'beasiswa' | 'mandiri') => {
    e.preventDefault();
    const docsCfg = requiredDocs.filter((d) => d.jenis_pengajuan === jenis && d.is_active);
    const prefix = jenis === 'beasiswa' ? 'TB/BSW/2026/' : 'TB/MDR/2026/';
    const noReg = `${prefix}${String(Storage.getPengajuanTB().length + 1).padStart(3, '0')}`;
    const uploadedDocs: DokumenItem[] = [];

    for (const cfg of docsCfg) {
      const f = tbFiles[cfg.kode_dokumen];
      if (f) {
        const up = await prepareDocumentUpload(f, {
          jenis,
          nip: user.nip,
          nama: user.nama_lengkap,
          noReg,
        });
        uploadedDocs.push({
          id: generateId('doc'),
          kode_dokumen: cfg.kode_dokumen,
          nama_dokumen: cfg.nama_dokumen,
          nama_file: up.nama_file,
          file_url: up.file_url,
          google_drive_file_id: up.google_drive_file_id,
          google_drive_path: up.google_drive_path,
          ukuran_mb: up.ukuran_mb,
          uploaded_at: new Date().toISOString(),
          status_verifikasi: 'pending',
        });
      } else {
        uploadedDocs.push({
          id: generateId('doc'),
          kode_dokumen: cfg.kode_dokumen,
          nama_dokumen: cfg.nama_dokumen,
          nama_file: `${cfg.kode_dokumen}_${user.nip}.pdf`,
          ukuran_mb: 0.72,
          uploaded_at: new Date().toISOString(),
          status_verifikasi: 'pending',
        });
      }
    }

    const now = new Date().toISOString();
    const selectedRek = issuedRek.find((r) => r.id === tbRekId);
    const newTb: PengajuanTugasBelajar = {
      id: generateId('tb'),
      no_registrasi: noReg,
      jenis,
      rekomendasi_id: selectedRek?.id,
      no_rekomendasi: selectedRek?.no_registrasi,
      user_id: user.id,
      user_nama: user.nama_lengkap,
      user_nip: user.nip,
      unit_kerja_id: user.unit_kerja_id,
      unit_kerja_nama: user.unit_kerja_nama,
      pangkat_golongan: user.pangkat_golongan,
      jabatan: user.jabatan,
      jenjang: tbJenjang,
      program_studi: tbProdi.trim(),
      universitas_tujuan: tbUniv.trim(),
      akreditasi_prodi: tbAkr,
      dalam_luar_negeri: tbLokasi,
      negara: tbLokasi === 'Dalam Negeri' ? 'Indonesia' : 'Luar Negeri',
      durasi_semester: Number(tbDurasi) || 4,
      sumber_pendanaan: jenis === 'mandiri' ? 'Biaya Mandiri Pegawai' : tbDana.trim(),
      nama_beasiswa: jenis === 'beasiswa' ? tbDana.trim() : undefined,
      tmt_mulai: tbTmtMulai,
      tmt_selesai: addSemestersToDate(tbTmtMulai, Number(tbDurasi) || 4),
      status: 'menunggu_acc_pimpinan',
      dokumen: uploadedDocs,
      laporan_bulanan: [],
      usul_ulang_count: 0,
      riwayat_usul_ulang: [],
      riwayat_alur: [
        {
          id: generateId('r-tb'),
          tahap:
            jenis === 'beasiswa'
              ? 'Pendaftaran beasiswa oleh Pegawai'
              : 'Pendaftaran & upload berkas mandiri',
          role: user.role,
          actor_nama: user.nama_lengkap,
          status: 'diproses',
          catatan: `Mengajukan Tugas Belajar ${jenis === 'beasiswa' ? 'Beasiswa' : 'Biaya Mandiri'} di ${tbUniv.trim()}.`,
          timestamp: now,
        },
      ],
      created_at: now,
      updated_at: now,
    };

    Storage.addPengajuanTB(newTb);
    Storage.addAuditLog({
      user,
      aksi: `Ajukan Tugas Belajar (${jenis})`,
      entitas: noReg,
      detail: `${tbJenjang} ${tbProdi.trim()} — ${tbUniv.trim()}.`,
    });
    Storage.addNotification({
      target_role: 'pimpinan_unit',
      target_unit_id: user.unit_kerja_id,
      judul: `Pengajuan Tugas Belajar ${jenis === 'beasiswa' ? 'Beasiswa' : 'Mandiri'} Baru`,
      pesan: `${noReg} (${user.nama_lengkap}) menunggu ACC Pimpinan Unit.`,
      ref_type: jenis,
      ref_id: newTb.id,
    });
    setTbProdi('');
    setTbUniv('');
    setTbFiles({});
    showToast('success', 'Pengajuan Tugas Belajar Terkirim', `Nomor registrasi ${noReg} menunggu ACC Pimpinan Unit.`);
    onUpdated();
    onSelectMenu('details_berkas');
  };

  // --- Submit Monev Semester ---
  const handleSubmitMonev = async (e: React.FormEvent) => {
    e.preventDefault();
    const study = activeStudies.find((s) => s.id === (selTbId || activeStudies[0]?.id));
    if (!study) {
      showToast('warning', 'Tidak ada studi aktif', 'Anda belum memiliki Tugas Belajar berstatus Sedang Belajar.');
      return;
    }
    let khsNama = `KHS_Smt${mnvSemester}_${user.nip}.pdf`;
    let khsUrl: string | undefined;
    if (mnvKhsFile) {
      const up = await prepareDocumentUpload(mnvKhsFile, {
        jenis: 'monev',
        nip: user.nip,
        nama: user.nama_lengkap,
        noReg: study.no_registrasi,
      });
      khsNama = up.nama_file;
      khsUrl = up.file_url;
    }
    const item: LaporanMonev = {
      id: generateId('mnv'),
      pengajuan_tb_id: study.id,
      no_reg_tb: study.no_registrasi,
      user_id: user.id,
      user_nama: user.nama_lengkap,
      user_nip: user.nip,
      unit_kerja_id: user.unit_kerja_id,
      unit_kerja_nama: user.unit_kerja_nama,
      universitas: study.universitas_tujuan,
      program_studi: study.program_studi,
      semester: Number(mnvSemester),
      tahun_akademik: mnvTahun,
      ipk_semester: Number(mnvIpkSmt),
      ipk_kumulatif: Number(mnvIpkKum),
      ringkasan_progres: mnvRingkasan.trim(),
      kendala: mnvKendala.trim() || undefined,
      khs_file_nama: khsNama,
      khs_file_url: khsUrl,
      status_evaluasi: 'menunggu_review',
      created_at: new Date().toISOString(),
    };
    Storage.addMonev(item);
    Storage.addAuditLog({
      user,
      aksi: 'Kirim Monev KHS Semester',
      entitas: study.no_registrasi,
      detail: `Semester ${mnvSemester} · IPK Smt ${mnvIpkSmt} / Kum ${mnvIpkKum}.`,
    });
    setMnvRingkasan('');
    setMnvKendala('');
    setMnvKhsFile(null);
    showToast('success', 'Laporan Monev KHS Terkirim', 'Menunggu evaluasi Admin Kepegawaian Pusat.');
    onUpdated();
  };

  // --- Submit Laporan Bulanan ---
  const handleSubmitBulanan = (e: React.FormEvent) => {
    e.preventDefault();
    const study = activeStudies.find((s) => s.id === (selTbId || activeStudies[0]?.id));
    if (!study) {
      showToast('warning', 'Tidak ada studi aktif', 'Anda belum memiliki Tugas Belajar berstatus Sedang Belajar.');
      return;
    }
    Storage.addLaporanBulanan(
      study.id,
      {
        id: generateId('lb'),
        bulan: blnNama,
        tahun: 2026,
        status_studi: blnStatus,
        sks_ditempuh: Number(blnSks) || 0,
        ipk_sementara: Number(blnIpk) || 0,
        ringkasan_aktivitas: blnAktivitas.trim(),
        status_evaluasi: 'menunggu_review',
        created_at: new Date().toISOString(),
      },
      user
    );
    setBlnAktivitas('');
    showToast('success', 'Laporan Progres Bulanan Terkirim', `Laporan ${blnNama} 2026 telah dicatat.`);
    onUpdated();
  };

  // --- Submit Perpanjangan ---
  const handleSubmitPerpanjangan = async (e: React.FormEvent) => {
    e.preventDefault();
    const study = activeStudies.find((s) => s.id === (ppjTbId || activeStudies[0]?.id));
    if (!study) {
      showToast('warning', 'Tidak ada studi aktif', 'Perpanjangan hanya dapat diajukan untuk studi berstatus Sedang Belajar.');
      return;
    }
    const noReg = `PPJ/2026/${String(Storage.getPerpanjangan().length + 1).padStart(3, '0')}`;
    const tmtBaru = addSemestersToDate(study.tmt_selesai, Number(ppjTambahan) || 1);
    let docNama = `Surat_Keterangan_Kampus_${noReg.replace(/\//g, '_')}.pdf`;
    let docUrl: string | undefined;
    if (ppjFile) {
      const up = await prepareDocumentUpload(ppjFile, {
        jenis: 'perpanjangan',
        nip: user.nip,
        nama: user.nama_lengkap,
        noReg,
      });
      docNama = up.nama_file;
      docUrl = up.file_url;
    }
    const now = new Date().toISOString();
    const newPpj: PengajuanPerpanjangan = {
      id: generateId('ppj'),
      no_registrasi: noReg,
      pengajuan_tb_id: study.id,
      no_reg_tb: study.no_registrasi,
      user_id: user.id,
      user_nama: user.nama_lengkap,
      user_nip: user.nip,
      unit_kerja_id: user.unit_kerja_id,
      unit_kerja_nama: user.unit_kerja_nama,
      universitas_tujuan: study.universitas_tujuan,
      program_studi: study.program_studi,
      tmt_selesai_lama: study.tmt_selesai,
      tmt_selesai_usulan: tmtBaru,
      tambahan_semester: Number(ppjTambahan) || 1,
      alasan_perpanjangan: ppjAlasan.trim(),
      status: 'menunggu_acc_pimpinan',
      dokumen: [
        {
          id: generateId('doc-ppj'),
          kode_dokumen: 'PPJ_KAMPUS',
          nama_dokumen: 'Surat Keterangan Perpanjangan Kampus & Progres Studi',
          nama_file: docNama,
          file_url: docUrl,
          ukuran_mb: 0.9,
          uploaded_at: now,
          status_verifikasi: 'pending',
        },
      ],
      riwayat_alur: [
        {
          id: generateId('r-ppj'),
          tahap: 'Usulan Perpanjangan Masa Belajar',
          role: user.role,
          actor_nama: user.nama_lengkap,
          status: 'diproses',
          catatan: `Usulan perpanjangan +${ppjTambahan} semester s.d. ${tmtBaru}.`,
          timestamp: now,
        },
      ],
      created_at: now,
      updated_at: now,
    };
    Storage.addPerpanjangan(newPpj);
    Storage.addNotification({
      target_role: 'pimpinan_unit',
      target_unit_id: user.unit_kerja_id,
      judul: 'Usulan Perpanjangan Masa Belajar Baru',
      pesan: `${noReg} (${user.nama_lengkap}) menunggu ACC Pimpinan Unit.`,
      ref_type: 'perpanjangan',
      ref_id: newPpj.id,
    });
    setPpjAlasan('');
    setPpjFile(null);
    showToast('success', 'Usulan Perpanjangan Terkirim', `${noReg} menunggu persetujuan Pimpinan Unit.`);
    onUpdated();
  };

  // --- Submit Pencantuman Gelar ---
  const handleSubmitPencantumanGelar = async (e: React.FormEvent) => {
    e.preventDefault();
    const noReg = `PG/2026/${String(Storage.getPencantumanGelar().length + 1).padStart(3, '0')}`;
    const tglLapor = new Date().toISOString().slice(0, 10);
    const batas15 = addWorkingDays(pgTglLulus, 15);
    const tepatWaktu = tglLapor <= batas15;

    const docsCfg = requiredDocs.filter((d) => d.jenis_pengajuan === 'pencantuman_gelar' && d.is_active);
    const uploadedDocs: DokumenItem[] = [];
    for (const cfg of docsCfg) {
      const f = pgFiles[cfg.kode_dokumen];
      if (f) {
        const up = await prepareDocumentUpload(f, {
          jenis: 'pencantuman_gelar',
          nip: user.nip,
          nama: user.nama_lengkap,
          noReg,
        });
        uploadedDocs.push({
          id: generateId('doc'),
          kode_dokumen: cfg.kode_dokumen,
          nama_dokumen: cfg.nama_dokumen,
          nama_file: up.nama_file,
          file_url: up.file_url,
          ukuran_mb: up.ukuran_mb,
          uploaded_at: new Date().toISOString(),
          status_verifikasi: 'pending',
        });
      } else {
        uploadedDocs.push({
          id: generateId('doc'),
          kode_dokumen: cfg.kode_dokumen,
          nama_dokumen: cfg.nama_dokumen,
          nama_file: `${cfg.kode_dokumen}_${user.nip}.pdf`,
          ukuran_mb: 1.05,
          uploaded_at: new Date().toISOString(),
          status_verifikasi: 'pending',
        });
      }
    }

    const now = new Date().toISOString();
    const newPg: PengajuanPencantumanGelar = {
      id: generateId('pg'),
      no_registrasi: noReg,
      user_id: user.id,
      user_nama: user.nama_lengkap,
      user_nip: user.nip,
      unit_kerja_id: user.unit_kerja_id,
      unit_kerja_nama: user.unit_kerja_nama,
      pangkat_golongan: user.pangkat_golongan,
      jabatan: user.jabatan,
      jenjang: pgJenjang,
      gelar_diperoleh: pgGelar.trim(),
      nama_kampus: pgKampus.trim(),
      program_studi: pgProdi.trim(),
      no_ijazah: pgNoIjazah.trim(),
      tanggal_lulus: pgTglLulus,
      tanggal_lapor: tglLapor,
      batas_lapor_15_hari: batas15,
      tepat_waktu: tepatWaktu,
      pangkat_sesuai: true,
      status: 'menunggu_acc_pimpinan',
      dokumen: uploadedDocs,
      riwayat_alur: [
        {
          id: generateId('r-pg'),
          tahap: 'Pelaporan selesai studi oleh Pegawai',
          role: user.role,
          actor_nama: user.nama_lengkap,
          status: 'diproses',
          catatan: `Melaporkan kelulusan ${pgJenjang} (${pgGelar.trim()}) dari ${pgKampus.trim()}.`,
          timestamp: now,
        },
      ],
      created_at: now,
      updated_at: now,
    };

    Storage.addPencantumanGelar(newPg);
    Storage.addNotification({
      target_role: 'pimpinan_unit',
      target_unit_id: user.unit_kerja_id,
      judul: 'Laporan Selesai Studi & Pencantuman Gelar',
      pesan: `${noReg} (${user.nama_lengkap}) melaporkan selesai studi dan menunggu ACC Pimpinan.`,
      ref_type: 'pencantuman_gelar',
      ref_id: newPg.id,
    });
    setPgGelar('');
    setPgKampus('');
    setPgProdi('');
    setPgNoIjazah('');
    setPgFiles({});
    showToast('success', 'Laporan Pencantuman Gelar Terkirim', `${noReg} menunggu rekomendasi Pimpinan Unit.`);
    onUpdated();
  };

  // --- Shared Document Upload Section for Forms ---
  const renderRequiredDocInputs = (
    jenis: 'rekomendasi' | 'beasiswa' | 'mandiri' | 'pencantuman_gelar',
    filesMap: Record<string, File | null>,
    setFilesMap: React.Dispatch<React.SetStateAction<Record<string, File | null>>>
  ) => {
    const docsCfg = requiredDocs.filter((d) => d.jenis_pengajuan === jenis && d.is_active);
    return (
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Dokumen Persyaratan Wajib ({docsCfg.length} berkas)
          </h3>
          <span className="text-xs text-slate-500">Unduh template resmi bila tersedia</span>
        </div>
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
          {docsCfg.map((cfg) => (
            <div key={cfg.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900">
                  {cfg.nama_dokumen}
                  {cfg.wajib && <span className="text-red-600 ml-1">*</span>}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {cfg.keterangan} · Format: {cfg.format_diizinkan.toUpperCase()} (Maks {cfg.max_size_mb} MB)
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cfg.has_template && (
                  <button
                    type="button"
                    onClick={() => downloadTemplateDocument(cfg)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap"
                  >
                    <Download className="w-3 h-3" />
                    Template
                  </button>
                )}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-md cursor-pointer whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  <span className="max-w-[140px] truncate">
                    {filesMap[cfg.kode_dokumen]?.name || 'Unggah Berkas'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={(e) =>
                      setFilesMap((prev) => ({
                        ...prev,
                        [cfg.kode_dokumen]: e.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // === RENDER BY ACTIVE MENU ===
  if (activeMenu === 'rekomendasi') {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengajuan Surat Rekomendasi Tugas Belajar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Lengkapi rencana studi dan 4 berkas wajib untuk penerbitan Surat Rekomendasi Biro Kepegawaian.
          </p>
        </div>

        <form onSubmit={handleSubmitRekomendasi} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenjang Pendidikan</label>
              <select
                value={rekJenjang}
                onChange={(e) => setRekJenjang(e.target.value as PengajuanRekomendasi['jenjang'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="D-IV">D-IV</option>
                <option value="S1">S1</option>
                <option value="S2">S2 (Magister)</option>
                <option value="S3">S3 (Doktor)</option>
                <option value="Spesialis">Spesialis</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rencana Jalur</label>
              <select
                value={rekJalur}
                onChange={(e) => setRekJalur(e.target.value as 'beasiswa' | 'mandiri')}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="beasiswa">Tugas Belajar Beasiswa</option>
                <option value="mandiri">Tugas Belajar Biaya Mandiri</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Perguruan Tinggi Tujuan</label>
              <input
                type="text"
                required
                value={rekUniv}
                onChange={(e) => setRekUniv(e.target.value)}
                placeholder="Contoh: Universitas Gadjah Mada"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Program Studi</label>
              <input
                type="text"
                required
                value={rekProdi}
                onChange={(e) => setRekProdi(e.target.value)}
                placeholder="Contoh: Magister Manajemen Bencana"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Akreditasi Program Studi</label>
              <select
                value={rekAkrProdi}
                onChange={(e) => setRekAkrProdi(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Unggul">Unggul / A</option>
                <option value="Baik Sekali">Baik Sekali / B</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Akreditasi Perguruan Tinggi</label>
              <select
                value={rekAkrUniv}
                onChange={(e) => setRekAkrUniv(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Unggul">Unggul / A</option>
                <option value="Baik Sekali">Baik Sekali / B</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Negara</label>
              <input
                type="text"
                required
                value={rekNegara}
                onChange={(e) => setRekNegara(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tahun Akademik</label>
              <input
                type="text"
                required
                value={rekTahun}
                onChange={(e) => setRekTahun(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {renderRequiredDocInputs('rekomendasi', rekFiles, setRekFiles)}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Kirim Pengajuan Rekomendasi
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (activeMenu === 'pengajuan_beasiswa' || activeMenu === 'pengajuan_mandiri') {
    const jenis = activeMenu === 'pengajuan_beasiswa' ? 'beasiswa' : 'mandiri';
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pengajuan Tugas Belajar {jenis === 'beasiswa' ? 'Beasiswa' : 'Biaya Mandiri'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {jenis === 'beasiswa'
              ? 'Alur 11 tahapan meliputi seleksi administrasi, penilaian wawancara Tim Assessor SDM, seleksi kampus, SK PPK, dan perjanjian bermaterai.'
              : 'Alur 8 tahapan biaya mandiri di luar jam kerja dinas dengan izin pimpinan unit, konfirmasi Kepala Biro, dan SK digital PPK.'}
          </p>
        </div>

        <form
          onSubmit={(e) => handleSubmitTB(e, jenis)}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          {issuedRek.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
              <label className="block text-xs font-bold text-emerald-900 mb-1.5">
                Tautkan Surat Rekomendasi yang Sudah Terbit (Prefill Otomatis)
              </label>
              <select
                value={tbRekId}
                onChange={(e) => handleSelectIssuedRek(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg bg-white"
              >
                <option value="">— Isi manual tanpa tautan rekomendasi —</option>
                {issuedRek.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.no_registrasi} ({r.nomor_surat_rekomendasi}) · {r.jenjang} {r.program_studi} — {r.universitas_tujuan}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenjang</label>
              <select
                value={tbJenjang}
                onChange={(e) => setTbJenjang(e.target.value as PengajuanTugasBelajar['jenjang'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="D-IV">D-IV</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
                <option value="Spesialis">Spesialis</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Studi</label>
              <select
                value={tbLokasi}
                onChange={(e) => setTbLokasi(e.target.value as 'Dalam Negeri' | 'Luar Negeri')}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Dalam Negeri">Dalam Negeri</option>
                <option value="Luar Negeri">Luar Negeri</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Perguruan Tinggi</label>
              <input
                type="text"
                required
                value={tbUniv}
                onChange={(e) => setTbUniv(e.target.value)}
                placeholder="Contoh: Institut Teknologi Bandung"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Program Studi</label>
              <input
                type="text"
                required
                value={tbProdi}
                onChange={(e) => setTbProdi(e.target.value)}
                placeholder="Contoh: Magister Teknik Kelautan"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Durasi Studi (Semester)</label>
              <input
                type="number"
                min={2}
                max={8}
                required
                value={tbDurasi}
                onChange={(e) => setTbDurasi(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rencana TMT Mulai</label>
              <input
                type="date"
                required
                value={tbTmtMulai}
                onChange={(e) => setTbTmtMulai(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            {jenis === 'beasiswa' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Program Beasiswa / Sponsor
                </label>
                <input
                  type="text"
                  required
                  value={tbDana}
                  onChange={(e) => setTbDana(e.target.value)}
                  placeholder="Contoh: Beasiswa LPDP PNS / Pusbindiklatren Bappenas / DIPA Basarnas"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            )}
          </div>

          {renderRequiredDocInputs(jenis, tbFiles, setTbFiles)}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Kirim Pengajuan Tugas Belajar
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (activeMenu === 'alur_beasiswa') {
    const groups: Array<{ key: 'rekomendasi' | 'beasiswa' | 'mandiri' | 'pencantuman_gelar'; title: string }> = [
      { key: 'rekomendasi', title: '01. Alur Surat Rekomendasi (6 Langkah)' },
      { key: 'beasiswa', title: '02. Alur Tugas Belajar Beasiswa (11 Langkah)' },
      { key: 'mandiri', title: '03. Alur Tugas Belajar Biaya Mandiri (8 Langkah)' },
      { key: 'pencantuman_gelar', title: '04. Alur Pencantuman Gelar SIASN BKN (6 Langkah)' },
    ];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panduan & Alur Layanan SITUBEL</h1>
          <p className="text-sm text-slate-500 mt-1">
            Mengacu pada SE Menpan RB No. 28/2021, SE Kepala BKN No. 15/2024, dan Perka Basarnas No. 10/2024.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {groups.map((g) => {
            const steps = workflowSteps
              .filter((s) => s.jenis_pengajuan === g.key && s.is_active)
              .sort((a, b) => a.urutan - b.urutan);
            return (
              <div key={g.key} className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200">
                  {g.title}
                </h2>
                <ol className="mt-3 space-y-2 text-xs text-slate-700">
                  {steps.map((st) => (
                    <li key={st.id} className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-orange-700 tabular-nums shrink-0">
                        {String(st.urutan).padStart(2, '0')}.
                      </span>
                      <span>{st.nama_step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeMenu === 'monev') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Laporan Bulanan & Monev KHS Semester</h1>
            <p className="text-sm text-slate-500 mt-1">
              Laporkan progres belajar bulanan dan unggah Kartu Hasil Studi (KHS) setiap akhir semester.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setMonevTab('semester')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                monevTab === 'semester' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Monev Semester (KHS)
            </button>
            <button
              type="button"
              onClick={() => setMonevTab('bulanan')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                monevTab === 'bulanan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Laporan Progres Bulanan
            </button>
          </div>
        </div>

        {activeStudies.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm font-semibold text-slate-900">Belum Ada Tugas Belajar Aktif</p>
            <p className="text-xs text-slate-500 mt-1">
              Menu pelaporan Monev dan Bulanan aktif setelah SK Tugas Belajar terbit dan berstatus Sedang Belajar.
            </p>
          </div>
        ) : monevTab === 'semester' ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <form
              onSubmit={handleSubmitMonev}
              className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 h-fit"
            >
              <h2 className="text-sm font-bold text-slate-900">Unggah Monev & KHS Baru</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Studi Aktif</label>
                <select
                  value={selTbId || activeStudies[0].id}
                  onChange={(e) => setSelTbId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {activeStudies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.no_registrasi} · {s.universitas_tujuan}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester ke-</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={mnvSemester}
                    onChange={(e) => setMnvSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Akademik</label>
                  <input
                    type="text"
                    required
                    value={mnvTahun}
                    onChange={(e) => setMnvTahun(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IPK Semester</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={4}
                    required
                    value={mnvIpkSmt}
                    onChange={(e) => setMnvIpkSmt(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IPK Kumulatif</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={4}
                    required
                    value={mnvIpkKum}
                    onChange={(e) => setMnvIpkKum(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Progres</label>
                <textarea
                  rows={3}
                  required
                  value={mnvRingkasan}
                  onChange={(e) => setMnvRingkasan(e.target.value)}
                  placeholder="Mata kuliah yang diselesaikan, seminar proposal, riset tesis..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
                />
              </div>
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-pointer text-xs text-slate-700">
                <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">{mnvKhsFile ? mnvKhsFile.name : 'Unggah Berkas KHS (PDF)'}</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  className="sr-only"
                  onChange={(e) => setMnvKhsFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
              >
                Kirim Laporan Monev KHS
              </button>
            </form>

            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900">Riwayat Monev KHS Saya ({myMonev.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {myMonev.length === 0 ? (
                  <p className="p-8 text-xs text-slate-500 text-center">Belum ada laporan monev.</p>
                ) : (
                  myMonev.map((m) => (
                    <div key={m.id} className="p-4 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          Semester {m.semester} · {m.tahun_akademik} ({m.universitas})
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          IPK {m.ipk_semester.toFixed(2)} / Kum {m.ipk_kumulatif.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-slate-600">{m.ringkasan_progres}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-[11px] text-slate-400">{m.khs_file_nama}</span>
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
                      </div>
                      {m.catatan_evaluasi_admin && (
                        <p className="text-[11px] text-slate-500 italic">
                          Evaluasi Admin: “{m.catatan_evaluasi_admin}”
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <form
              onSubmit={handleSubmitBulanan}
              className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 h-fit"
            >
              <h2 className="text-sm font-bold text-slate-900">Kirim Laporan Bulanan</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bulan</label>
                  <select
                    value={blnNama}
                    onChange={(e) => setBlnNama(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(
                      (b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Studi</label>
                  <select
                    value={blnStatus}
                    onChange={(e) => setBlnStatus(e.target.value as LaporanProgresBulanan['status_studi'])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="aktif_kuliah">Aktif Kuliah</option>
                    <option value="praktikum_riset">Praktikum / Riset</option>
                    <option value="seminar_proposal">Seminar Proposal</option>
                    <option value="penulisan_tesis">Penulisan Tesis / Disertasi</option>
                    <option value="ujian_kelulusan">Ujian Kelulusan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKS Ditempuh</label>
                  <input
                    type="number"
                    value={blnSks}
                    onChange={(e) => setBlnSks(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IPK Sementara</label>
                  <input
                    type="number"
                    step="0.01"
                    value={blnIpk}
                    onChange={(e) => setBlnIpk(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Aktivitas</label>
                <textarea
                  rows={3}
                  required
                  value={blnAktivitas}
                  onChange={(e) => setBlnAktivitas(e.target.value)}
                  placeholder="Progres perkuliahan, riset, atau bimbingan dosen bulan ini..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
              >
                Kirim Laporan Bulanan
              </button>
            </form>

            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900">Riwayat Laporan Bulanan</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {activeStudies.flatMap((s) =>
                  (s.laporan_bulanan || []).map((lb) => (
                    <div key={lb.id} className="p-4 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {lb.bulan} {lb.tahun} · {lb.status_studi.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-slate-700 tabular-nums">
                          {lb.sks_ditempuh} SKS · IPK {lb.ipk_sementara.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-slate-600">{lb.ringkasan_aktivitas}</p>
                      <p className="text-[11px] font-semibold text-emerald-700">
                        Status Evaluasi: {lb.status_evaluasi.replace('_', ' ')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeMenu === 'perpanjangan') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usulan Perpanjangan Masa Belajar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ajukan perpanjangan masa studi apabila diperlukan. SK Perpanjangan akan otomatis memperbarui durasi studi induk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form
            onSubmit={handleSubmitPerpanjangan}
            className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
          >
            <h2 className="text-sm font-bold text-slate-900">Formulir Usulan Perpanjangan</h2>
            {activeStudies.length === 0 ? (
              <p className="text-xs text-slate-500">
                Anda belum memiliki Tugas Belajar berstatus Sedang Belajar.
              </p>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Tugas Belajar Induk</label>
                  <select
                    value={ppjTbId || activeStudies[0].id}
                    onChange={(e) => setPpjTbId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {activeStudies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.no_registrasi} · {s.universitas_tujuan} (s.d. {formatDateIndo(s.tmt_selesai, true)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tambahan Semester</label>
                  <select
                    value={ppjTambahan}
                    onChange={(e) => setPpjTambahan(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={1}>+1 Semester (6 Bulan)</option>
                    <option value={2}>+2 Semester (12 Bulan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Perpanjangan</label>
                  <textarea
                    rows={3}
                    required
                    value={ppjAlasan}
                    onChange={(e) => setPpjAlasan(e.target.value)}
                    placeholder="Uraikan alasan akademis/kedinasan serta target penyelesaian..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg resize-none"
                  />
                </div>
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-pointer text-xs text-slate-700">
                  <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">
                    {ppjFile ? ppjFile.name : 'Unggah Surat Keterangan Kampus (PDF)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={(e) => setPpjFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="submit"
                  className="w-full py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                >
                  Kirim Usulan Perpanjangan
                </button>
              </>
            )}
          </form>

          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Riwayat Perpanjangan Saya ({myPpj.length})</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {myPpj.length === 0 ? (
                <p className="p-8 text-xs text-slate-500 text-center">Belum ada usulan perpanjangan.</p>
              ) : (
                myPpj.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-mono font-semibold text-slate-900">{p.no_registrasi}</p>
                      <p className="text-slate-600 mt-0.5">
                        {p.universitas_tujuan} · +{p.tambahan_semester} smt (s.d. {formatDateIndo(p.tmt_selesai_usulan, true)})
                      </p>
                      <p className={`font-semibold mt-1 ${getStatusTextClass(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPerpanjangan(p)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shrink-0"
                    >
                      Detail
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeMenu === 'pencantuman_gelar') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pelaporan Selesai Studi & Pencantuman Gelar (BKN)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Laporkan kelulusan maksimal 15 hari kerja pasca tanggal lulus untuk pengusulan ke SIASN BKN (SE Kepala BKN No. 15/2024).
          </p>
        </div>

        <form onSubmit={handleSubmitPencantumanGelar} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenjang Lulus</label>
              <select
                value={pgJenjang}
                onChange={(e) => setPgJenjang(e.target.value as PengajuanPencantumanGelar['jenjang'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
                <option value="Spesialis">Spesialis</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Gelar Diperoleh</label>
              <input
                type="text"
                required
                value={pgGelar}
                onChange={(e) => setPgGelar(e.target.value)}
                placeholder="Contoh: M.A.P. / M.T."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Lulus (Ijazah)</label>
              <input
                type="date"
                required
                value={pgTglLulus}
                onChange={(e) => setPgTglLulus(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Kampus</label>
              <input
                type="text"
                required
                value={pgKampus}
                onChange={(e) => setPgKampus(e.target.value)}
                placeholder="Universitas Diponegoro"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Program Studi</label>
              <input
                type="text"
                required
                value={pgProdi}
                onChange={(e) => setPgProdi(e.target.value)}
                placeholder="Magister Administrasi Publik"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Ijazah</label>
              <input
                type="text"
                required
                value={pgNoIjazah}
                onChange={(e) => setPgNoIjazah(e.target.value)}
                placeholder="632012026000419"
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {renderRequiredDocInputs('pencantuman_gelar', pgFiles, setPgFiles)}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
            >
              Kirim Laporan Pencantuman Gelar
            </button>
          </div>
        </form>

        {myPg.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Riwayat Pencantuman Gelar Saya</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {myPg.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-mono font-semibold text-slate-900">
                      {p.no_registrasi} · Gelar {p.gelar_diperoleh}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      {p.nama_kampus} — {p.program_studi}
                    </p>
                    <p className={`font-semibold mt-1 ${getStatusTextClass(p.status)}`}>
                      {getStatusLabel(p.status)}
                      {p.nomor_pertek_bkn ? ` · Pertek BKN: ${p.nomor_pertek_bkn}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDossier({ type: 'pencantuman_gelar', id: p.id })}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shrink-0"
                  >
                    Detail
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // === DASHBOARD / DETAILS_BERKAS / RIWAYAT ===
  const allMyRecords = [
    ...myRek.map((r) => ({
      key: `rekomendasi-${r.id}`,
      id: r.id,
      type: 'rekomendasi' as const,
      noReg: r.no_registrasi,
      layanan: 'Surat Rekomendasi',
      tujuan: `${r.jenjang} ${r.program_studi} — ${r.universitas_tujuan}`,
      status: r.status,
      updated: r.updated_at,
      rek: r,
      tb: undefined as PengajuanTugasBelajar | undefined,
      pg: undefined as PengajuanPencantumanGelar | undefined,
    })),
    ...myTb.map((t) => ({
      key: `tugas_belajar-${t.id}`,
      id: t.id,
      type: 'tugas_belajar' as const,
      noReg: t.no_registrasi,
      layanan: t.jenis === 'beasiswa' ? 'Tugas Belajar Beasiswa' : 'Tugas Belajar Mandiri',
      tujuan: `${t.jenjang} ${t.program_studi} — ${t.universitas_tujuan}`,
      status: t.status,
      updated: t.updated_at,
      rek: undefined as PengajuanRekomendasi | undefined,
      tb: t,
      pg: undefined as PengajuanPencantumanGelar | undefined,
    })),
    ...myPg.map((p) => ({
      key: `pencantuman_gelar-${p.id}`,
      id: p.id,
      type: 'pencantuman_gelar' as const,
      noReg: p.no_registrasi,
      layanan: 'Pencantuman Gelar (BKN)',
      tujuan: `${p.gelar_diperoleh} · ${p.program_studi} — ${p.nama_kampus}`,
      status: p.status,
      updated: p.updated_at,
      rek: undefined as PengajuanRekomendasi | undefined,
      tb: undefined as PengajuanTugasBelajar | undefined,
      pg: p,
    })),
  ].sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

  const activeRecord =
    allMyRecords.find((r) => r.key === selectedHistoryKey) ?? allMyRecords[0] ?? null;

  // === FULL-PAGE RIWAYAT & DETAIL BERKAS VIEW (matching screenshot layout) ===
  if (activeMenu === 'riwayat' || activeMenu === 'details_berkas') {
    return (
      <>
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {activeMenu === 'details_berkas'
                  ? 'Detail & Berkas Pengajuan Saya'
                  : 'Riwayat & Alur Progres Pengajuan'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Pantau seluruh tahapan persetujuan beserta tanggal & jam WIB serta pratinjau berkas persyaratan terkini.
              </p>
            </div>
            {activeRecord && (
              <button
                type="button"
                onClick={() => onOpenDossier({ type: activeRecord.type, id: activeRecord.id })}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap shrink-0"
              >
                <Eye className="w-4 h-4" />
                Buka Dossier & Aksi ({activeRecord.noReg})
              </button>
            )}
          </div>

          {allMyRecords.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-900">Belum Ada Riwayat Pengajuan</p>
              <p className="text-xs text-slate-500">
                Mulai dari pengajuan Surat Rekomendasi atau Tugas Belajar untuk memantau alur progres di sini.
              </p>
            </div>
          ) : (
            <>
              {/* Selectable Pengajuan Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {allMyRecords.map((item) => {
                  const selected = activeRecord?.key === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedHistoryKey(item.key)}
                      className={`text-left rounded-xl p-3.5 border transition-colors ${
                        selected
                          ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 truncate">
                          {item.noReg}
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-700 uppercase shrink-0">
                          {item.layanan.replace('Tugas Belajar ', '')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.tujuan}</p>
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                        <span className={`text-[11px] font-semibold truncate ${getStatusTextClass(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
                          {formatDateIndo(item.updated, true)}, {formatTimeIndo(item.updated)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Screenshot-matched Horizontal Stepper + 2-Column Detail & Berkas Panel */}
              {activeRecord && (
                <RiwayatDetailPanel
                  rek={activeRecord.rek}
                  tb={activeRecord.tb}
                  pg={activeRecord.pg}
                  workflowSteps={workflowSteps}
                  onPreviewDocument={setPreviewReq}
                />
              )}
            </>
          )}

          {/* Perpanjangan Summary if exists */}
          {myPpj.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-orange-600" />
                <h2 className="text-base font-bold text-slate-900">Riwayat Usulan Perpanjangan Masa Belajar</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {myPpj.map((p) => (
                  <div key={p.id} className="px-6 py-3.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-mono font-semibold text-slate-900">
                        {p.no_registrasi} · Induk {p.no_reg_tb}
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        +{p.tambahan_semester} semester s.d. {formatDateIndo(p.tmt_selesai_usulan, true)} ·{' '}
                        <span className={`font-semibold ${getStatusTextClass(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPerpanjangan(p)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
                    >
                      Lihat Alur & Detail
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DocumentViewerModal
          open={Boolean(previewReq)}
          onClose={() => setPreviewReq(null)}
          title={previewReq?.title ?? ''}
          fileName={previewReq?.fileName ?? ''}
          fileUrl={previewReq?.fileUrl}
          pdfPayload={previewReq?.pdfPayload}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Selamat datang, {user.nama_lengkap}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user.jabatan} · {user.unit_kerja_nama} · <span className="font-mono">{user.nip}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectMenu('rekomendasi')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ajukan Rekomendasi Baru
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Surat Rekomendasi</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{myRek.length}</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">{issuedRek.length} telah terbit</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Pengajuan Tugas Belajar</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{myTb.length}</p>
          <p className="text-[11px] text-orange-700 mt-0.5">{activeStudies.length} sedang belajar aktif</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Laporan Monev KHS</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{myMonev.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Semester terlapor</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Perpanjangan & Gelar</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {myPpj.length + myPg.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {myPpj.length} perpanjangan · {myPg.length} gelar
          </p>
        </div>
      </div>

      {/* Quick Service Shortcuts on Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { id: 'rekomendasi', title: 'Surat Rekomendasi', desc: '4 berkas wajib · 6 tahap', icon: FileText },
          { id: 'pengajuan_beasiswa', title: 'Tubel Beasiswa', desc: 'LPDP / Bappenas / DIPA', icon: GraduationCap },
          { id: 'pengajuan_mandiri', title: 'Tubel Biaya Mandiri', desc: 'Kuliah luar jam dinas', icon: BookOpenCheck },
          { id: 'pencantuman_gelar', title: 'Pencantuman Gelar', desc: 'Usulan SIASN BKN 15 hari', icon: Award },
        ].map((srv) => {
          const Icon = srv.icon;
          return (
            <button
              key={srv.id}
              type="button"
              onClick={() => onSelectMenu(srv.id)}
              className="text-left bg-white border border-slate-200 hover:border-orange-500 rounded-xl p-4 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-orange-600" />
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-600 transition-colors" />
              </div>
              <p className="text-sm font-bold text-slate-900 mt-3">{srv.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{srv.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Main Applications Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Daftar Pengajuan & Berkas Saya</h2>
          <button
            type="button"
            onClick={() => onSelectMenu('riwayat')}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Lihat Alur Progres Lengkap →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <th className="py-3 px-5">No. Registrasi</th>
                <th className="py-3 px-4">Layanan</th>
                <th className="py-3 px-4">Program Studi & Perguruan Tinggi</th>
                <th className="py-3 px-4">Status Terkini</th>
                <th className="py-3 px-4">Pembaruan Terakhir</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {allMyRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    <CheckCircle2 className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                    Belum ada pengajuan atas nama Anda. Mulai dari pengajuan Surat Rekomendasi.
                  </td>
                </tr>
              ) : (
                allMyRecords.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                      {item.noReg}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{item.layanan}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.tujuan}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${getStatusTextClass(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      {formatDateIndo(item.updated, true)}, {formatTimeIndo(item.updated)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHistoryKey(item.key);
                            onSelectMenu('riwayat');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg whitespace-nowrap"
                        >
                          Alur Progres
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDossier({ type: item.type, id: item.id })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Perpanjangan Summary if exists */}
      {myPpj.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-orange-600" />
            <h2 className="text-base font-bold text-slate-900">Usulan Perpanjangan Studi Saya</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {myPpj.map((p) => (
              <div key={p.id} className="px-6 py-3.5 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-mono font-semibold text-slate-900">
                    {p.no_registrasi} · Induk {p.no_reg_tb}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    +{p.tambahan_semester} semester s.d. {formatDateIndo(p.tmt_selesai_usulan, true)} ·{' '}
                    <span className={`font-semibold ${getStatusTextClass(p.status)}`}>
                      {getStatusLabel(p.status)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPerpanjangan(p)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
                >
                  Detail
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
