import React, { useMemo, useState } from 'react';
import { ArrowLeft, UserPlus, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { BasarnasLogo } from '../components/BasarnasLogo';
import { generateId, Storage } from '../lib/storage';
import type { User } from '../types';

interface RegisterViewProps {
  onBackLogin: () => void;
  onRegistered: (user: User) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onBackLogin, onRegistered }) => {
  const units = useMemo(() => Storage.getUnitKerja(), []);
  const [nip, setNip] = useState('');
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [unitId, setUnitId] = useState(units[0]?.id ?? '');
  const [pangkat, setPangkat] = useState('Penata Muda (III/a)');
  const [jabatan, setJabatan] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanNip = nip.replace(/\s+/g, '');
    if (cleanNip.length < 8) {
      setError('NIP minimal 8 digit angka.');
      return;
    }
    const existing = Storage.getUsers().find((u) => u.nip === cleanNip);
    if (existing) {
      setError('NIP tersebut sudah terdaftar di SITUBEL. Silakan masuk menggunakan akun yang ada.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const selectedUnit = units.find((u) => u.id === unitId) ?? units[0];
    const newUser: User = {
      id: generateId('usr'),
      nip: cleanNip,
      nama_lengkap: nama.trim(),
      email: email.trim() || `${cleanNip}@basarnas.go.id`,
      password,
      role: 'pegawai',
      unit_kerja_id: selectedUnit?.id ?? 'unit-renker',
      unit_kerja_nama: selectedUnit?.nama_unit ?? 'Biro Perencanaan dan Kerjasama',
      pangkat_golongan: pangkat.trim(),
      jabatan: jabatan.trim() || 'Pelaksana',
      status_aktif: true,
      created_at: new Date().toISOString(),
    };

    Storage.addUser(newUser);
    Storage.setCurrentUser(newUser);
    Storage.addAuditLog({
      user: newUser,
      aksi: 'Registrasi Mandiri Pegawai',
      entitas: newUser.nip,
      detail: `Pegawai baru ${newUser.nama_lengkap} mendaftar pada unit ${newUser.unit_kerja_nama}.`,
    });
    onRegistered(newUser);
  };

  return (
    <div className="min-h-screen bg-[#ECEEF1] flex flex-col lg:flex-row">
      {/* Left Solid Crimson Brand Strip — Pure White & Red */}
      <div className="lg:w-[36%] xl:w-[38%] theme-crimson-hero kpi-grid-pattern text-white relative">
        <div className="lg:sticky lg:top-0 lg:min-h-screen p-5 sm:p-8 lg:p-8 xl:p-11 flex flex-col justify-between">
          <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-1 shadow-xs shrink-0">
              <BasarnasLogo size={36} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold tracking-tight text-white">SITUBEL BASARNAS</p>
              <p className="text-[11px] text-white/90">Registrasi Mandiri PNS</p>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 xl:mt-10">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/85">
              AKTIVASI AKUN LAYANAN
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Buat Akun Kepegawaian SITUBEL
            </h1>
            <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-white/90 leading-relaxed">
              Daftarkan NIP Anda untuk mengajukan Surat Rekomendasi, Tugas Belajar Beasiswa/Mandiri,
              pelaporan Monev KHS, serta usulan Pencantuman Gelar SIASN BKN.
            </p>
          </div>

          {/* Feature Highlights — hidden on compact mobile so registration form is immediately reachable */}
          <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-1 gap-3 mt-7 xl:mt-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Terhubung dengan Unit Kerja',
                desc: 'Otomatis diarahkan ke alur persetujuan Pimpinan Unit & Admin Daerah/Pusat.',
              },
              {
                icon: Building2,
                title: `${units.length} Unit Pusat & Kantor SAR Daerah`,
                desc: 'Mendukung seluruh unit kerja BASARNAS di seluruh Indonesia.',
              },
              {
                icon: CheckCircle2,
                title: 'Aktivasi Instan',
                desc: 'Akun pegawai langsung aktif untuk mulai mengajukan berkas secara digital.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl bg-white text-slate-900 p-3.5 flex items-start gap-3 shadow-xs"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#FDF2F4] text-[#C8102E] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

          <p className="hidden sm:block mt-6 xl:mt-8 text-[11px] text-white/90">
            Biro Kepegawaian dan Organisasi · BASARNAS RI
          </p>
        </div>
      </div>

      {/* Right Registration Form Panel */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 xl:p-12 flex items-center justify-center">
        <div className="w-full max-w-2xl kpi-card overflow-hidden">
          <div className="h-1 w-full bg-[#C8102E]" />
          <div className="p-5 sm:p-7 xl:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#A50D26]">
                  FORMULIR PENDAFTARAN
                </p>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                  Identitas Pegawai Negeri Sipil
                </h2>
              </div>
              <button
                type="button"
                onClick={onBackLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Login
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">NIP (18 Digit)</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="199801012022031001"
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Pratama Putra, S.T."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Unit Kerja</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none truncate"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama_unit} ({u.kode_unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pangkat / Golongan
                  </label>
                  <input
                    type="text"
                    required
                    value={pangkat}
                    onChange={(e) => setPangkat(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Contoh: Rescuer Ahli Pertama"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Kedinasan
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@basarnas.go.id"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2 border-t border-slate-100">
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kata Sandi (Min. 6 Karakter)
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Konfirmasi Kata Sandi
                  </label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F4F5F7] focus:bg-white border border-slate-300 rounded-lg focus:border-[#C8102E] focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#A50D26] bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                >
                  {error}
                </p>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  Daftar & Masuk SITUBEL
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
