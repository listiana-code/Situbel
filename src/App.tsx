import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AlertProvider, useAlert } from './components/AlertProvider';
import { Header } from './components/Header';
import { PerpanjanganDetailModal } from './components/PerpanjanganDetailModal';
import { Sidebar } from './components/Sidebar';
import { ToastProvider, useToast } from './components/Toast';
import { Storage } from './lib/storage';
import { AdminDashboard } from './views/AdminDashboard';
import { DetailPengajuanModal } from './views/DetailPengajuanModal';
import { KepalaBiroDashboard } from './views/KepalaBiroDashboard';
import { LoginView } from './views/LoginView';
import { PegawaiDashboard } from './views/PegawaiDashboard';
import { PewawancaraDashboard } from './views/PewawancaraDashboard';
import { PimpinanDashboard } from './views/PimpinanDashboard';
import { PPKDashboard } from './views/PPKDashboard';
import { ProfileSettingsView } from './views/ProfileSettingsView';
import { RegisterView } from './views/RegisterView';
import type { DossierTarget, PengajuanPerpanjangan, User } from './types';

const MENU_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  details_berkas: 'Detail & Berkas Saya',
  rekomendasi: 'Surat Rekomendasi',
  pengajuan_beasiswa: 'Tugas Belajar Beasiswa',
  pengajuan_mandiri: 'Tugas Belajar Biaya Mandiri',
  alur_beasiswa: 'Panduan & Alur Layanan',
  monev: 'Laporan Bulanan & Monev KHS',
  perpanjangan: 'Perpanjangan Masa Belajar',
  pencantuman_gelar: 'Pencantuman Gelar (BKN)',
  riwayat: 'Riwayat Pengajuan',
  acc_rekomendasi: 'ACC Rekomendasi',
  acc_tugas_belajar: 'ACC Tugas Belajar',
  acc_perpanjangan: 'ACC Perpanjangan',
  monitoring_monev: 'Monitoring Monev & KHS',
  monitoring_unit: 'Daftar Pegawai Unit',
  verif_rekomendasi: 'Verifikasi Rekomendasi',
  seleksi_beasiswa: 'Seleksi Beasiswa',
  tubel_mandiri: 'Tugas Belajar Mandiri',
  draft_sk_admin: 'Penyusunan Draft SK',
  perpanjangan_studi: 'Perpanjangan Studi',
  siasn_bkn: 'SIASN / BKN Pencantuman Gelar',
  bank_soal: 'Bank Soal Wawancara',
  evaluasi_monev: 'Evaluasi Monev & Bulanan',
  konfigurasi_alur: 'Konfigurasi Alur',
  konfigurasi_berkas: 'Konfigurasi Berkas Wajib',
  manajemen_user: 'Manajemen Pengguna',
  master_unit: 'Master Unit Kerja',
  audit_log: 'Audit Log Sistem',
  konfirmasi_tugas_belajar: 'Konfirmasi Tugas Belajar',
  konfirmasi_rekomendasi: 'Konfirmasi Rekomendasi',
  konfirmasi_perpanjangan: 'Konfirmasi Perpanjangan',
  riwayat_konfirmasi: 'Riwayat Konfirmasi',
  sesi_wawancara: 'Penilaian Wawancara',
  riwayat_penilaian: 'Riwayat Penilaian',
  arsip_sk: 'Arsip SK Terbit',
  verifikasi_bsre: 'Verifikasi Sertifikat BSrE',
  setting_profil: 'Pengaturan Profil',
};

function SitubelShell() {
  const { showToast } = useToast();
  const { showConfirm } = useAlert();

  const [currentUser, setCurrentUser] = useState<User | null>(() => Storage.getCurrentUser());
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => Storage.getSidebarOpen());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [dossierTarget, setDossierTarget] = useState<DossierTarget | null>(null);
  const [activePerpanjangan, setActivePerpanjangan] = useState<PengajuanPerpanjangan | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const onUserChange = () => {
      setCurrentUser(Storage.getCurrentUser());
      setDataVersion((v) => v + 1);
    };
    const onDataUpdate = () => setDataVersion((v) => v + 1);
    window.addEventListener('situbel_user_change', onUserChange);
    window.addEventListener('situbel_data_update', onDataUpdate);
    return () => {
      window.removeEventListener('situbel_user_change', onUserChange);
      window.removeEventListener('situbel_data_update', onDataUpdate);
    };
  }, []);

  const badgeCounts = useMemo(() => {
    const reks = Storage.getRekomendasi();
    const tbs = Storage.getPengajuanTB();
    const ppjs = Storage.getPerpanjangan();
    const pgs = Storage.getPencantumanGelar();

    if (!currentUser) {
      return {
        pendingRek: 0,
        pendingTb: 0,
        pendingPerpanjangan: 0,
        pendingWawancara: 0,
        pendingPpk: 0,
        pendingKaBiro: 0,
        pendingSiasn: 0,
      };
    }

    const role = currentUser.role;
    const pendingRek =
      role === 'pimpinan_unit'
        ? reks.filter((r) => r.status === 'menunggu_acc_pimpinan').length
        : role === 'admin_daerah'
        ? reks.filter(
            (r) =>
              r.unit_kerja_id === currentUser.unit_kerja_id &&
              r.status === 'menunggu_acc_admin_daerah'
          ).length
        : role === 'kepala_biro_kepegawaian'
        ? reks.filter((r) => r.status === 'menunggu_konfirmasi_kabi').length
        : reks.filter((r) =>
            ['verifikasi_admin', 'dikembalikan_kabi', 'terkonfirmasi_kabi'].includes(r.status)
          ).length;

    const pendingTb =
      role === 'pimpinan_unit'
        ? tbs.filter((t) => t.status === 'menunggu_acc_pimpinan').length
        : role === 'admin_daerah'
        ? tbs.filter(
            (t) =>
              t.unit_kerja_id === currentUser.unit_kerja_id &&
              t.status === 'menunggu_acc_admin_daerah'
          ).length
        : tbs.filter((t) =>
            ['verifikasi_admin', 'seleksi_wawancara', 'surat_kampus_diunggah'].includes(t.status)
          ).length;

    const pendingPerpanjangan =
      role === 'pimpinan_unit'
        ? ppjs.filter((p) => p.status === 'menunggu_acc_pimpinan').length
        : role === 'kepala_biro_kepegawaian'
        ? ppjs.filter((p) => p.status === 'menunggu_acc_kabiro').length
        : ppjs.filter((p) =>
            ['menunggu_acc_admin_pusat', 'menunggu_upload_sk_perpanjangan'].includes(p.status)
          ).length;

    return {
      pendingRek,
      pendingTb,
      pendingPerpanjangan,
      pendingWawancara: tbs.filter((t) => t.status === 'menunggu_nilai_wawancara').length,
      pendingPpk: tbs.filter((t) => t.status === 'menunggu_ttd_ppk').length,
      pendingKaBiro: tbs.filter((t) => t.status === 'menunggu_konfirmasi_kabi').length,
      pendingSiasn: pgs.filter((p) =>
        ['verifikasi_pangkat', 'diusulkan_siasn'].includes(p.status)
      ).length,
    };
  }, [currentUser, dataVersion]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen((v) => !v);
    } else {
      const next = !sidebarOpen;
      setSidebarOpen(next);
      Storage.setSidebarOpen(next);
    }
  };

  const handleSwitchUser = (targetUser: User) => {
    Storage.setCurrentUser(targetUser);
    setCurrentUser(targetUser);
    setActiveMenu('dashboard');
    setDossierTarget(null);
    setActivePerpanjangan(null);
    showToast('info', `Berpindah ke ${targetUser.nama_lengkap}`, `Peran aktif: ${targetUser.jabatan}`);
  };

  const handleLogout = async () => {
    const ok = await showConfirm({
      title: 'Keluar dari SITUBEL?',
      message: 'Sesi Anda saat ini akan diakhiri dan Anda akan diarahkan kembali ke halaman masuk.',
      tone: 'warning',
      confirmLabel: 'Ya, Keluar',
      cancelLabel: 'Batal',
    });
    if (!ok) return;
    Storage.setCurrentUser(null);
    setCurrentUser(null);
    setActiveMenu('dashboard');
    setAuthScreen('login');
  };

  const handleResetDemo = async () => {
    const ok = await showConfirm({
      title: 'Reset Seluruh Data Demo?',
      message:
        'Semua pengajuan, penilaian wawancara, konfigurasi, dan log akan dikembalikan ke data awal bawaan SITUBEL BASARNAS.',
      tone: 'danger',
      confirmLabel: 'Reset Data Demo',
      cancelLabel: 'Batal',
    });
    if (!ok) return;
    Storage.resetAllData();
    setDossierTarget(null);
    setActivePerpanjangan(null);
    setDataVersion((v) => v + 1);
    showToast('success', 'Data demo dipulihkan', 'Seluruh data awal SITUBEL telah dimuat ulang.');
  };

  if (!currentUser) {
    if (authScreen === 'register') {
      return (
        <RegisterView
          onBackLogin={() => setAuthScreen('login')}
          onRegistered={(u) => {
            setCurrentUser(u);
            setActiveMenu('dashboard');
            showToast('success', 'Registrasi berhasil', `Selamat datang di SITUBEL, ${u.nama_lengkap}.`);
          }}
        />
      );
    }
    return (
      <LoginView
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setActiveMenu('dashboard');
          showToast('success', `Selamat datang, ${u.nama_lengkap}`, u.unit_kerja_nama);
        }}
        onGoRegister={() => setAuthScreen('register')}
      />
    );
  }

  const refreshAll = () => setDataVersion((v) => v + 1);

  const renderMainView = () => {
    if (activeMenu === 'setting_profil') {
      return (
        <ProfileSettingsView
          user={currentUser}
          onUserUpdated={(u) => {
            setCurrentUser(u);
            refreshAll();
          }}
        />
      );
    }

    switch (currentUser.role) {
      case 'pegawai':
        return (
          <PegawaiDashboard
            user={currentUser}
            activeMenu={activeMenu}
            onSelectMenu={setActiveMenu}
            onOpenDossier={setDossierTarget}
            onOpenPerpanjangan={setActivePerpanjangan}
            onUpdated={refreshAll}
            dataVersion={dataVersion}
          />
        );
      case 'pimpinan_unit':
        return (
          <PimpinanDashboard
            user={currentUser}
            activeMenu={activeMenu}
            onOpenDossier={setDossierTarget}
            onOpenPerpanjangan={setActivePerpanjangan}
            dataVersion={dataVersion}
          />
        );
      case 'kepala_biro_kepegawaian':
        return (
          <KepalaBiroDashboard
            user={currentUser}
            activeMenu={activeMenu}
            onOpenDossier={setDossierTarget}
            onOpenPerpanjangan={setActivePerpanjangan}
            dataVersion={dataVersion}
          />
        );
      case 'pewawancara':
        return (
          <PewawancaraDashboard
            user={currentUser}
            activeMenu={activeMenu}
            onOpenDossier={setDossierTarget}
            onUpdated={refreshAll}
            dataVersion={dataVersion}
          />
        );
      case 'pejabat_berwenang':
        return (
          <PPKDashboard
            user={currentUser}
            activeMenu={activeMenu}
            onOpenDossier={setDossierTarget}
            dataVersion={dataVersion}
          />
        );
      case 'admin_kepegawaian':
      case 'super_admin':
      case 'admin_daerah':
      default:
        return (
          <AdminDashboard
            user={currentUser}
            activeMenu={activeMenu}
            onOpenDossier={setDossierTarget}
            onOpenPerpanjangan={setActivePerpanjangan}
            onUpdated={refreshAll}
            dataVersion={dataVersion}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-[#ECEEF1] text-slate-900">
      <Sidebar
        user={currentUser}
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        isOpen={sidebarOpen}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        counts={badgeCounts}
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <Header
          user={currentUser}
          activeMenuLabel={MENU_LABELS[activeMenu] ?? 'Dashboard'}
          onToggleSidebar={handleToggleSidebar}
          onSwitchUser={handleSwitchUser}
          onOpenProfile={() => setActiveMenu('setting_profil')}
          onLogout={handleLogout}
          onOpenDossier={setDossierTarget}
          onOpenPerpanjangan={setActivePerpanjangan}
          dataVersion={dataVersion}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1480px] w-full mx-auto">
          {renderMainView()}
        </main>

        <footer className="px-4 sm:px-6 lg:px-7 py-3.5 border-t border-slate-200/90 bg-white flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C8102E]" aria-hidden="true" />
            <p className="font-medium text-slate-600">
              SITUBEL — Biro Kepegawaian dan Organisasi · Badan Nasional Pencarian dan Pertolongan (BASARNAS)
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A50D26] bg-red-50 hover:bg-red-100 border border-red-200/80 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data Demo
          </button>
        </footer>
      </div>

      {/* Universal Dossier Modal */}
      <DetailPengajuanModal
        target={dossierTarget}
        currentUser={currentUser}
        onClose={() => setDossierTarget(null)}
        onUpdated={refreshAll}
      />

      {/* Perpanjangan Detail Modal */}
      <PerpanjanganDetailModal
        item={
          activePerpanjangan
            ? Storage.getPerpanjangan().find((p) => p.id === activePerpanjangan.id) ?? activePerpanjangan
            : null
        }
        currentUser={currentUser}
        onClose={() => setActivePerpanjangan(null)}
        onUpdated={refreshAll}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AlertProvider>
        <SitubelShell />
      </AlertProvider>
    </ToastProvider>
  );
}
