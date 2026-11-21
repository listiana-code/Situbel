import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Users,
  LogOut,
  UserCircle2,
  CheckCheck,
  ChevronDown,
} from 'lucide-react';
import { formatDateTimeIndo } from '../lib/dateUtils';
import { getRoleDisplayLabel, getStatusLabel } from '../lib/statusUtils';
import { Storage } from '../lib/storage';
import type { DossierTarget, PengajuanPerpanjangan, User } from '../types';

interface HeaderProps {
  user: User;
  activeMenuLabel: string;
  onToggleSidebar: () => void;
  onSwitchUser: (targetUser: User) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenDossier: (target: DossierTarget) => void;
  onOpenPerpanjangan: (item: PengajuanPerpanjangan) => void;
  dataVersion: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeMenuLabel,
  onToggleSidebar,
  onSwitchUser,
  onOpenProfile,
  onLogout,
  onOpenDossier,
  onOpenPerpanjangan,
  dataVersion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifTick, setNotifTick] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onNotif = () => setNotifTick((t) => t + 1);
    window.addEventListener('situbel_notif_update', onNotif);
    return () => window.removeEventListener('situbel_notif_update', onNotif);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setNotifOpen(false);
        setRoleOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const allUsers = useMemo(() => Storage.getUsers(), [dataVersion]);
  const notifications = useMemo(
    () => Storage.getNotificationsForUser(user),
    [user, notifTick, dataVersion]
  );
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    const results: Array<{
      id: string;
      kind: 'rekomendasi' | 'tugas_belajar' | 'pencantuman_gelar' | 'perpanjangan';
      noReg: string;
      nama: string;
      nip: string;
      status: string;
      sub: string;
      rawPerpanjangan?: PengajuanPerpanjangan;
    }> = [];

    Storage.getRekomendasi().forEach((r) => {
      if (
        r.no_registrasi.toLowerCase().includes(q) ||
        r.user_nama.toLowerCase().includes(q) ||
        r.user_nip.includes(q) ||
        (r.nomor_surat_rekomendasi?.toLowerCase().includes(q) ?? false)
      ) {
        results.push({
          id: r.id,
          kind: 'rekomendasi',
          noReg: r.no_registrasi,
          nama: r.user_nama,
          nip: r.user_nip,
          status: r.status,
          sub: `${r.jenjang} ${r.program_studi} — ${r.universitas_tujuan}`,
        });
      }
    });

    Storage.getPengajuanTB().forEach((t) => {
      if (
        t.no_registrasi.toLowerCase().includes(q) ||
        t.user_nama.toLowerCase().includes(q) ||
        t.user_nip.includes(q) ||
        (t.kelengkapan_sk?.nomor_sk.toLowerCase().includes(q) ?? false)
      ) {
        results.push({
          id: t.id,
          kind: 'tugas_belajar',
          noReg: t.no_registrasi,
          nama: t.user_nama,
          nip: t.user_nip,
          status: t.status,
          sub: `${t.jenis === 'beasiswa' ? 'Beasiswa' : 'Mandiri'} · ${t.universitas_tujuan}`,
        });
      }
    });

    Storage.getPencantumanGelar().forEach((p) => {
      if (
        p.no_registrasi.toLowerCase().includes(q) ||
        p.user_nama.toLowerCase().includes(q) ||
        p.user_nip.includes(q)
      ) {
        results.push({
          id: p.id,
          kind: 'pencantuman_gelar',
          noReg: p.no_registrasi,
          nama: p.user_nama,
          nip: p.user_nip,
          status: p.status,
          sub: `Pencantuman Gelar ${p.gelar_diperoleh} — ${p.nama_kampus}`,
        });
      }
    });

    Storage.getPerpanjangan().forEach((pp) => {
      if (
        pp.no_registrasi.toLowerCase().includes(q) ||
        pp.user_nama.toLowerCase().includes(q) ||
        pp.user_nip.includes(q) ||
        (pp.nomor_sk_perpanjangan?.toLowerCase().includes(q) ?? false)
      ) {
        results.push({
          id: pp.id,
          kind: 'perpanjangan',
          noReg: pp.no_registrasi,
          nama: pp.user_nama,
          nip: pp.user_nip,
          status: pp.status,
          sub: `Perpanjangan +${pp.tambahan_semester} smt · ${pp.universitas_tujuan}`,
          rawPerpanjangan: pp,
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, dataVersion]);

  const initials = user.nama_lengkap
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  return (
    <header
      ref={containerRef}
      className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between gap-4"
    >
      {/* Left: Toggle + Contextual Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Buka atau tutup sidebar navigasi"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 hidden sm:block">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="truncate">SITUBEL</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-900 truncate">{activeMenuLabel}</span>
          </div>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onFocus={() => setSearchOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchOpen(true);
          }}
          placeholder="Cari no. registrasi, no. SK, NIP, atau nama..."
          aria-label="Pencarian global pengajuan SITUBEL"
          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-600 focus:outline-none transition-colors"
        />
        {searchOpen && searchQuery.trim().length >= 2 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
            {searchResults.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 text-center">
                Tidak ditemukan pengajuan untuk “{searchQuery}”.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {searchResults.map((res) => (
                  <li key={`${res.kind}-${res.id}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        if (res.kind === 'perpanjangan' && res.rawPerpanjangan) {
                          onOpenPerpanjangan(res.rawPerpanjangan);
                        } else if (res.kind !== 'perpanjangan') {
                          onOpenDossier({ type: res.kind, id: res.id });
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-900">
                          {res.noReg}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {getStatusLabel(res.status)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 mt-0.5 truncate">
                        {res.nama} · <span className="font-mono text-slate-500">{res.nip}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{res.sub}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Right: Demo Role Switcher, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* 1-Click Demo Role Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setRoleOpen((v) => !v);
              setNotifOpen(false);
              setProfileOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden md:inline">Ganti Peran</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleOpen && (
            <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-bold text-slate-900">Ganti Peran Demo (1-Klik)</p>
                <p className="text-[11px] text-slate-500">
                  Uji alur persetujuan lintas 8 peran SITUBEL secara langsung
                </p>
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {allUsers
                  .filter((u) => u.status_aktif)
                  .map((u) => {
                    const isCurrent = u.id === user.id;
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchUser(u);
                            setRoleOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between gap-2 ${
                            isCurrent ? 'bg-orange-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {u.nama_lengkap}
                            </p>
                            <p className="text-[11px] text-slate-600 truncate">
                              {getRoleDisplayLabel(u.role)} · {u.unit_kerja_nama}
                            </p>
                          </div>
                          {isCurrent && (
                            <span className="text-[11px] font-semibold text-orange-700 shrink-0">
                              Aktif
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setRoleOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Notifikasi"
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-600 text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">
                  Notifikasi ({unreadCount} belum dibaca)
                </p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => Storage.markAllNotificationsRead(user)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 hover:text-orange-800 whitespace-nowrap"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="p-6 text-xs text-slate-500 text-center">Belum ada notifikasi.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        Storage.markNotificationRead(n.id);
                        setNotifOpen(false);
                        if (n.ref_id && n.ref_type) {
                          if (n.ref_type === 'rekomendasi') {
                            onOpenDossier({ type: 'rekomendasi', id: n.ref_id });
                          } else if (n.ref_type === 'beasiswa' || n.ref_type === 'mandiri') {
                            onOpenDossier({ type: 'tugas_belajar', id: n.ref_id });
                          } else if (n.ref_type === 'pencantuman_gelar') {
                            onOpenDossier({ type: 'pencantuman_gelar', id: n.ref_id });
                          } else if (n.ref_type === 'perpanjangan') {
                            const found = Storage.getPerpanjangan().find((p) => p.id === n.ref_id);
                            if (found) onOpenPerpanjangan(found);
                          }
                        }
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                        n.is_read ? 'opacity-70' : 'bg-orange-50/40'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-900">{n.judul}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.pesan}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
                        {formatDateTimeIndo(n.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
              setRoleOpen(false);
            }}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.nama_lengkap}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
            )}
            <div className="hidden xl:block text-left max-w-[150px]">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.nama_lengkap}</p>
              <p className="text-[11px] font-mono text-slate-500 truncate">{user.nip}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user.nama_lengkap}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">{user.nip}</p>
                <p className="text-[11px] text-slate-600 mt-1 truncate">
                  {getRoleDisplayLabel(user.role)}
                </p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  <UserCircle2 className="w-4 h-4 text-slate-500" />
                  Pengaturan Profil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar dari SITUBEL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
