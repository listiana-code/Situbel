import React, { useMemo, useState } from 'react';
import {
  Lock,
  UserCheck,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  FileCheck2,
  GraduationCap,
  Award,
  BarChart3,
} from 'lucide-react';
import { BasarnasLogo } from '../components/BasarnasLogo';
import { DEMO_DEFAULT_PASSWORD } from '../data/mockData';
import { getRoleDisplayLabel } from '../lib/statusUtils';
import { Storage } from '../lib/storage';
import type { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onGoRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onGoRegister }) => {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const demoUsers = useMemo(() => Storage.getUsers().filter((u) => u.status_aktif), []);
  const liveStats = useMemo(() => {
    const reks = Storage.getRekomendasi();
    const tbs = Storage.getPengajuanTB();
    const pgs = Storage.getPencantumanGelar();
    const activeStudies = tbs.filter((t) => t.status === 'sedang_belajar').length;
    const signedSk = tbs.filter((t) => Boolean(t.sk_digital_hash)).length;
    const total = reks.length + tbs.length + pgs.length;
    const completed =
      reks.filter((r) => r.status === 'rekomendasi_terbit').length +
      tbs.filter((t) => ['sk_terbit', 'sedang_belajar', 'selesai_aktif'].includes(t.status)).length +
      pgs.filter((p) => p.status === 'ms').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 75;
    return { total, activeStudies, signedSk, completionRate };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nip.trim() || !password) {
      setError('Masukkan NIP dan kata sandi Anda.');
      return;
    }
    const res = Storage.authenticate(nip, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onLoginSuccess(res.user);
  };

  const handleQuickLogin = (u: User) => {
    Storage.setCurrentUser(u);
    onLoginSuccess(u);
  };

  return (
    <div className="min-h-screen bg-[#F2F3F5] flex flex-col lg:flex-row">
      {/* Left Solid Crimson Brand Panel — Pure White & Red */}
      <div className="lg:w-[41%] xl:w-[45%] theme-crimson-hero kpi-grid-pattern text-white relative">
        <div className="lg:sticky lg:top-0 lg:min-h-screen p-5 sm:p-8 lg:p-8 xl:p-12 flex flex-col justify-between relative z-10">
          <div>
          {/* Institutional Brand */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-1 shadow-xs shrink-0">
              <BasarnasLogo size={36} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base sm:text-lg font-extrabold tracking-tight text-white">SITUBEL</p>
                <span className="px-2 py-0.5 rounded bg-white text-[10px] font-extrabold uppercase tracking-wider text-[#C8102E]">
                  BASARNAS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/90 truncate">
                Sistem Informasi Tugas Belajar Terpadu
              </p>
            </div>
          </div>

          {/* Executive Headline */}
          <div className="mt-6 sm:mt-8 xl:mt-10 max-w-lg">
            <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/85">
              EXECUTIVE KPI PORTAL · BIRO KEPEGAWAIAN
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl xl:text-[38px] font-extrabold tracking-tight text-white leading-[1.14]">
              Pengelolaan Tugas Belajar PNS Terpadu BASARNAS
            </h1>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/90 leading-relaxed">
              Layanan digital satu pintu untuk Surat Rekomendasi, Tugas Belajar Beasiswa & Biaya Mandiri,
              Perpanjangan Masa Studi, Monitoring KHS, hingga Pencantuman Gelar SIASN BKN.
            </p>
          </div>

          {/* Clean Crisp White-on-Red Live Summary Cards (No Charts) */}
          <div className="mt-5 sm:mt-7 xl:mt-8 grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-xl bg-white text-slate-900 p-3.5 sm:p-4 flex flex-col justify-between shadow-xs min-w-0">
              <BarChart3 className="w-4 h-4 text-[#C8102E] shrink-0" />
              <div className="mt-2.5">
                <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {liveStats.total}
                </p>
                <p className="text-[11px] font-semibold text-slate-600 leading-tight mt-0.5">
                  Total Berkas
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white text-slate-900 p-3.5 sm:p-4 flex flex-col justify-between shadow-xs min-w-0">
              <GraduationCap className="w-4 h-4 text-[#C8102E] shrink-0" />
              <div className="mt-2.5">
                <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {liveStats.activeStudies}
                </p>
                <p className="text-[11px] font-semibold text-slate-600 leading-tight mt-0.5">
                  Studi Aktif
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white text-slate-900 p-3.5 sm:p-4 flex flex-col justify-between shadow-xs min-w-0">
              <FileCheck2 className="w-4 h-4 text-[#C8102E] shrink-0" />
              <div className="mt-2.5">
                <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {liveStats.signedSk}
                </p>
                <p className="text-[11px] font-semibold text-slate-600 leading-tight mt-0.5">
                  SK BSrE
                </p>
              </div>
            </div>
          </div>

          {/* Regulatory Anchors — shown from sm+ so mobile reaches the login form fast */}
          <div className="hidden sm:block mt-7 xl:mt-8 pt-5 xl:pt-6 border-t border-white/20 space-y-2.5 text-xs text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">
              Dasar Regulasi Acuan
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-[11px] text-white/95">
              <p className="flex items-start gap-2">
                <Award className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                <span>SE Menpan RB No. 28/2021 · Pengembangan Kompetensi PNS Jalur Pendidikan</span>
              </p>
              <p className="flex items-start gap-2">
                <Award className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                <span>SE Kepala BKN No. 15/2024 · Pedoman Teknis Pencantuman Gelar & Uji Kompetensi</span>
              </p>
              <p className="flex items-start gap-2">
                <Award className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                <span>Perka Basarnas No. 10/2024 · Pedoman Tugas Belajar di Lingkungan Basarnas</span>
              </p>
            </div>
          </div>
        </div>

          <p className="hidden sm:block mt-6 xl:mt-8 text-[11px] text-white/90">
            Biro Kepegawaian dan Organisasi · Badan Nasional Pencarian dan Pertolongan (BASARNAS)
          </p>
        </div>
      </div>

      {/* Right Authentication & Demo Quick Access */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 xl:p-12 flex flex-col justify-center">
        <div className="w-full max-w-2xl mx-auto space-y-5 sm:space-y-6">
          {/* Manual Login Card */}
          <div className="kpi-card overflow-hidden">
            <div className="h-1 w-full bg-[#C8102E]" />
            <div className="p-5 sm:p-7 xl:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#C8102E]">
                    AUTENTIKASI PEGAWAI
                  </p>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                    Masuk ke SITUBEL
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Gunakan NIP 18 digit dan kata sandi akun kepegawaian Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onGoRegister}
                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#A50D26] bg-[#FDF2F4] hover:bg-[#FCE7EA] border border-[#F5C6CE] transition-colors whitespace-nowrap shrink-0 self-start"
                >
                  Registrasi Pegawai Baru →
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div className="min-w-0">
                    <label
                      htmlFor="login-nip"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      NIP (18 Digit)
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-nip"
                        type="text"
                        inputMode="numeric"
                        autoComplete="username"
                        value={nip}
                        onChange={(e) => {
                          setNip(e.target.value);
                          setError('');
                        }}
                        placeholder="199208152019031002"
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-[13px] font-mono bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showPass ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        placeholder="Masukkan kata sandi"
                        className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-[13px] bg-slate-50 focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="text-xs font-semibold text-[#A50D26] bg-[#FDF2F4] border border-[#F5C6CE] rounded-lg px-3 py-2"
                  >
                    {error}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-slate-600">
                    Kata sandi demo:{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-900">
                      {DEMO_DEFAULT_PASSWORD}
                    </code>
                  </p>
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Masuk Sekarang
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 1-Click Demo Quick Login Deck — Clean Uniform Styling */}
          <div className="kpi-card p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-[#FDF2F4] text-[#C8102E] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    Akses Cepat Demo (8 Peran Lengkap)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Klik salah satu profil untuk langsung masuk ke dashboard perannya
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-700 uppercase whitespace-nowrap shrink-0">
                {demoUsers.length} Akun
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="text-left p-3 sm:p-3.5 bg-slate-50/70 hover:bg-[#FDF2F4] border border-slate-200 hover:border-[#C8102E] rounded-lg transition-colors duration-150 group min-w-0"
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#C8102E] truncate">
                      {u.nama_lengkap}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#FDF2F4] border border-[#F5C6CE] text-[10px] font-bold text-[#A50D26] whitespace-nowrap shrink-0">
                      {getRoleDisplayLabel(u.role).split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    {getRoleDisplayLabel(u.role)} · {u.unit_kerja_nama}
                  </p>
                  <p className="text-[10px] font-mono font-medium text-slate-600 mt-1 tabular-nums">
                    NIP {u.nip}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
