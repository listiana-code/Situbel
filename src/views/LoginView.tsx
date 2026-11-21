import React, { useMemo, useState } from 'react';
import { Lock, UserCheck, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Institutional Panel */}
      <div className="lg:w-[44%] theme-crimson-hero text-white p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-red-900/30">
        <div>
          <div className="flex items-center gap-3.5">
            <BasarnasLogo size={42} />
            <div>
              <p className="text-lg font-extrabold tracking-tight text-white">SITUBEL</p>
              <p className="text-xs text-slate-400">Sistem Informasi Tugas Belajar Terpadu</p>
            </div>
          </div>

          <div className="mt-12 max-w-md">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Pengelolaan Tugas Belajar PNS Terpadu BASARNAS
            </h1>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Layanan digital satu pintu untuk pengajuan Surat Rekomendasi, Tugas Belajar Beasiswa & Biaya Mandiri, Perpanjangan Masa Studi, Monitoring KHS, hingga Usulan Pencantuman Gelar ke SIASN BKN.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800 space-y-3 text-xs text-slate-300">
            <p className="font-semibold text-white">Dasar Regulasi Acuan</p>
            <p>SE Menpan RB No. 28 Tahun 2021 · Pengembangan Kompetensi PNS Jalur Pendidikan</p>
            <p>SE Kepala BKN No. 15 Tahun 2024 · Pedoman Teknis Pencantuman Gelar & Uji Kompetensi</p>
            <p>Perka Basarnas No. 10 Tahun 2024 · Pedoman Tugas Belajar di Lingkungan Basarnas</p>
          </div>
        </div>

        <p className="mt-10 text-[11px] text-slate-500">
          Biro Kepegawaian dan Organisasi · Badan Nasional Pencarian dan Pertolongan (BASARNAS)
        </p>
      </div>

      {/* Right Authentication & Demo Quick Access */}
      <div className="flex-1 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          {/* Manual Login Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Masuk ke SITUBEL</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gunakan NIP 18 digit dan kata sandi akun pegawai Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={onGoRegister}
                className="text-xs font-semibold text-orange-700 hover:text-orange-800 whitespace-nowrap"
              >
                Registrasi Pegawai Baru →
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="login-nip" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIP (18 Digit)
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-red-700">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-slate-500">
                  Kata sandi demo bawaan:{' '}
                  <code className="font-mono font-semibold text-slate-800">{DEMO_DEFAULT_PASSWORD}</code>
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* 1-Click Demo Quick Login Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Akses Cepat Demo (8 Peran Lengkap)
                </h3>
              </div>
              <span className="text-xs text-slate-500">Klik akun untuk langsung masuk</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="text-left p-3.5 bg-white border border-slate-200 hover:border-orange-500 hover:bg-orange-50/30 rounded-lg transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-orange-700 truncate">
                      {u.nama_lengkap}
                    </span>
                    <span className="text-[11px] font-semibold text-orange-700 whitespace-nowrap shrink-0">
                      {getRoleDisplayLabel(u.role).split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    {getRoleDisplayLabel(u.role)} · {u.unit_kerja_nama}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-1 tabular-nums">{u.nip}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
