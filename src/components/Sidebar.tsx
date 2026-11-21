import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  BookOpenCheck,
  Award,
  Clock,
  ClipboardCheck,
  Users,
  Building2,
  Settings,
  ShieldCheck,
  History,
  FileSignature,
  MessageSquareText,
  CalendarClock,
  FolderCheck,
  ChevronDown,
  ChevronRight,
  UserCog,
  X,
} from 'lucide-react';
import { BasarnasLogo } from './BasarnasLogo';
import { getRoleDisplayLabel } from '../lib/statusUtils';
import type { Role, User } from '../types';

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface SidebarMenuGroup {
  id: string;
  label: string;
  items: SidebarMenuItem[];
}

interface SidebarProps {
  user: User;
  activeMenu: string;
  onSelectMenu: (menuId: string) => void;
  isOpen: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  counts: {
    pendingRek: number;
    pendingTb: number;
    pendingPerpanjangan: number;
    pendingWawancara: number;
    pendingPpk: number;
    pendingKaBiro: number;
    pendingSiasn: number;
  };
}

function getMenuGroupsForRole(role: Role, counts: SidebarProps['counts']): SidebarMenuGroup[] {
  if (role === 'pegawai') {
    return [
      {
        id: 'utama',
        label: 'Ringkasan',
        items: [
          { id: 'dashboard', label: 'Dashboard Pegawai', icon: LayoutDashboard },
          { id: 'details_berkas', label: 'Detail & Berkas Saya', icon: FolderCheck },
        ],
      },
      {
        id: 'layanan_tb',
        label: 'Layanan Tugas Belajar',
        items: [
          { id: 'rekomendasi', label: 'Surat Rekomendasi', icon: FileText },
          { id: 'pengajuan_beasiswa', label: 'Tubel Beasiswa', icon: GraduationCap },
          { id: 'pengajuan_mandiri', label: 'Tubel Biaya Mandiri', icon: BookOpenCheck },
          { id: 'alur_beasiswa', label: 'Panduan & Alur', icon: ClipboardCheck },
        ],
      },
      {
        id: 'progres',
        label: 'Progres & Kelulusan',
        items: [
          { id: 'monev', label: 'Laporan & Monev KHS', icon: Clock },
          { id: 'perpanjangan', label: 'Perpanjangan Studi', icon: CalendarClock },
          { id: 'pencantuman_gelar', label: 'Pencantuman Gelar (BKN)', icon: Award },
          { id: 'riwayat', label: 'Riwayat Pengajuan', icon: History },
        ],
      },
    ];
  }

  if (role === 'pimpinan_unit') {
    return [
      {
        id: 'utama',
        label: 'Ringkasan Unit',
        items: [{ id: 'dashboard', label: 'Dashboard Pimpinan', icon: LayoutDashboard }],
      },
      {
        id: 'acc_unit',
        label: 'Persetujuan Unit (ACC)',
        items: [
          { id: 'acc_rekomendasi', label: 'ACC Rekomendasi', icon: FileText, badge: counts.pendingRek },
          { id: 'acc_tugas_belajar', label: 'ACC Tugas Belajar', icon: GraduationCap, badge: counts.pendingTb },
          { id: 'acc_perpanjangan', label: 'ACC Perpanjangan', icon: CalendarClock, badge: counts.pendingPerpanjangan },
        ],
      },
      {
        id: 'monitoring',
        label: 'Pengawasan Unit',
        items: [
          { id: 'monitoring_monev', label: 'Monitoring Monev & KHS', icon: Clock },
          { id: 'monitoring_unit', label: 'Daftar Pegawai Unit', icon: Users },
        ],
      },
    ];
  }

  if (role === 'admin_daerah') {
    return [
      {
        id: 'utama',
        label: 'Ringkasan Daerah',
        items: [{ id: 'dashboard', label: 'Dashboard Admin Daerah', icon: LayoutDashboard }],
      },
      {
        id: 'layanan_daerah',
        label: 'Layanan & ACC Daerah',
        items: [
          { id: 'verif_rekomendasi', label: 'ACC Rekomendasi', icon: FileText, badge: counts.pendingRek },
          { id: 'seleksi_beasiswa', label: 'ACC Tubel Beasiswa', icon: GraduationCap, badge: counts.pendingTb },
          { id: 'tubel_mandiri', label: 'ACC Tubel Mandiri', icon: BookOpenCheck },
          { id: 'draft_sk_admin', label: 'Pantau SK Pegawai', icon: FileSignature },
          { id: 'siasn_bkn', label: 'Pencantuman Gelar', icon: Award },
          { id: 'perpanjangan_studi', label: 'Perpanjangan Studi', icon: CalendarClock },
        ],
      },
      {
        id: 'kelola_daerah',
        label: 'Evaluasi & Data Daerah',
        items: [
          { id: 'evaluasi_monev', label: 'Evaluasi Monev Daerah', icon: Clock },
          { id: 'manajemen_user', label: 'Pegawai Wilayah', icon: Users },
          { id: 'audit_log', label: 'Audit Log', icon: History },
        ],
      },
    ];
  }

  if (role === 'admin_kepegawaian' || role === 'super_admin') {
    return [
      {
        id: 'utama',
        label: 'Ringkasan Pusat',
        items: [{ id: 'dashboard', label: role === 'super_admin' ? 'Dashboard Super Admin' : 'Dashboard Admin Pusat', icon: LayoutDashboard }],
      },
      {
        id: 'verif_tubel',
        label: role === 'super_admin' ? 'Semua Layanan Tubel' : 'Verifikasi & Layanan Tubel',
        items: [
          { id: 'verif_rekomendasi', label: 'Verif Rekomendasi', icon: FileText, badge: counts.pendingRek },
          { id: 'seleksi_beasiswa', label: 'Seleksi Beasiswa', icon: GraduationCap, badge: counts.pendingTb },
          { id: 'tubel_mandiri', label: 'Tubel Mandiri', icon: BookOpenCheck },
          { id: 'draft_sk_admin', label: 'Penyusunan Draft SK', icon: FileSignature },
          { id: 'perpanjangan_studi', label: 'Perpanjangan Studi', icon: CalendarClock, badge: counts.pendingPerpanjangan },
          { id: 'siasn_bkn', label: 'SIASN / BKN Gelar', icon: Award, badge: counts.pendingSiasn },
        ],
      },
      {
        id: 'evaluasi',
        label: 'Wawancara & Evaluasi',
        items: [
          { id: 'bank_soal', label: 'Bank Soal Wawancara', icon: MessageSquareText },
          { id: 'evaluasi_monev', label: 'Evaluasi Monev & Bulanan', icon: Clock },
        ],
      },
      {
        id: 'pengaturan',
        label: role === 'super_admin' ? 'Pengaturan & Master Sistem' : 'Pengaturan Sistem',
        items: [
          { id: 'konfigurasi_alur', label: 'Konfigurasi Alur', icon: Settings },
          { id: 'konfigurasi_berkas', label: 'Konfigurasi Berkas', icon: FolderCheck },
          { id: 'manajemen_user', label: 'Manajemen Pengguna', icon: Users },
          { id: 'master_unit', label: 'Master Unit Kerja', icon: Building2 },
          { id: 'audit_log', label: 'Audit Log Sistem', icon: History },
        ],
      },
    ];
  }

  if (role === 'kepala_biro_kepegawaian') {
    return [
      {
        id: 'utama',
        label: 'Ringkasan Eksekutif',
        items: [{ id: 'dashboard', label: 'Dashboard Kepala Biro', icon: LayoutDashboard }],
      },
      {
        id: 'konfirmasi',
        label: 'Konfirmasi Pengajuan',
        items: [
          { id: 'konfirmasi_tugas_belajar', label: 'Konfirmasi Tugas Belajar', icon: GraduationCap, badge: counts.pendingKaBiro },
          { id: 'konfirmasi_rekomendasi', label: 'Konfirmasi Rekomendasi', icon: FileText, badge: counts.pendingRek },
          { id: 'konfirmasi_perpanjangan', label: 'Konfirmasi Perpanjangan', icon: CalendarClock, badge: counts.pendingPerpanjangan },
        ],
      },
      {
        id: 'monitoring_kabi',
        label: 'Monitoring & Riwayat',
        items: [
          { id: 'monitoring_monev', label: 'Monitoring Monev Daerah', icon: Clock },
          { id: 'riwayat_konfirmasi', label: 'Riwayat Konfirmasi', icon: History },
        ],
      },
    ];
  }

  if (role === 'pewawancara') {
    return [
      {
        id: 'utama',
        label: 'Tim Assessor SDM',
        items: [
          { id: 'dashboard', label: 'Dashboard Pewawancara', icon: LayoutDashboard },
          { id: 'sesi_wawancara', label: 'Penilaian Wawancara', icon: MessageSquareText, badge: counts.pendingWawancara },
          { id: 'riwayat_penilaian', label: 'Riwayat Penilaian', icon: History },
        ],
      },
    ];
  }

  // pejabat_berwenang (PPK)
  return [
    {
      id: 'ppk',
      label: 'Otoritas Penandatanganan',
      items: [
        { id: 'dashboard', label: 'Draft SK Menunggu TTD', icon: FileSignature, badge: counts.pendingPpk },
        { id: 'arsip_sk', label: 'Arsip SK Terbit', icon: FolderCheck },
        { id: 'verifikasi_bsre', label: 'Verifikasi Sertifikat BSrE', icon: ShieldCheck },
      ],
    },
  ];
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeMenu,
  onSelectMenu,
  isOpen,
  mobileOpen,
  onCloseMobile,
  counts,
}) => {
  const groups = useMemo(() => getMenuGroupsForRole(user.role, counts), [user.role, counts]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full theme-crimson-hero text-slate-200 select-none border-r border-white/10">
      {/* Institutional Brand */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <BasarnasLogo size={34} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-white truncate leading-tight">
              SITUBEL
            </p>
            <p className="text-[11px] text-slate-400 truncate">BASARNAS RI</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Tutup menu navigasi"
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role context summary */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/15 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400 truncate">
          {getRoleDisplayLabel(user.role)}
        </p>
        <p className="text-xs font-semibold text-white truncate mt-0.5" title={user.unit_kerja_nama}>
          {user.unit_kerja_nama}
        </p>
      </div>

      {/* Navigation groups — sleek dark thin scrollbar */}
      <nav
        aria-label="Navigasi utama SITUBEL"
        className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-3 py-3.5 space-y-4 overscroll-contain"
      >
        {groups.map((group) => {
          const isCollapsed = Boolean(collapsedGroups[group.id]);
          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="truncate">{group.label}</span>
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-75" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-75" />
                )}
              </button>
              {!isCollapsed && (
                <ul className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeMenu === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectMenu(item.id);
                            onCloseMobile();
                          }}
                          className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                            active
                              ? 'bg-orange-600 text-white font-semibold shadow-sm'
                              : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                active ? 'text-white' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={`min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-mono font-bold tabular-nums inline-flex items-center justify-center shrink-0 ${
                                active
                                  ? 'bg-white/20 text-white'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Anchored Bottom Account Footer — always flush at bottom, never floats */}
      <div className="px-3 py-3 border-t border-white/10 bg-black/20 shrink-0">
        <button
          type="button"
          onClick={() => {
            onSelectMenu('setting_profil');
            onCloseMobile();
          }}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeMenu === 'setting_profil'
              ? 'bg-orange-600 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
          }`}
        >
          <UserCog
            className={`w-4 h-4 shrink-0 ${
              activeMenu === 'setting_profil' ? 'text-white' : 'text-slate-400'
            }`}
          />
          <div className="min-w-0 text-left flex-1">
            <p className="truncate leading-tight">Pengaturan Profil</p>
            <p
              className={`text-[10px] truncate mt-0.5 ${
                activeMenu === 'setting_profil' ? 'text-red-100' : 'text-slate-400'
              }`}
            >
              {user.nama_lengkap}
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Layout Spacer (reserves exact width next to fixed rail) */}
      <div
        aria-hidden="true"
        className={`hidden lg:block shrink-0 transition-[width] duration-200 ${
          isOpen ? 'w-64' : 'w-0'
        }`}
      />

      {/* Desktop Fixed Full-Viewport Sidebar — always 100% top-to-bottom, never floats */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 h-dvh transition-transform duration-200 ${
          isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full pointer-events-none'
        }`}
      >
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-dvh shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}
    </>
  );
};
