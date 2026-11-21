import React, { useMemo, useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <BasarnasLogo size={36} />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Registrasi Mandiri Pegawai</h1>
              <p className="text-xs text-slate-500">Buat akun SITUBEL BASARNAS menggunakan NIP</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackLogin}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">NIP</label>
              <input
                type="text"
                required
                inputMode="numeric"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="199801012022031001"
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Pratama Putra, S.T."
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit Kerja</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:border-orange-600 focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama_unit} ({u.kode_unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pangkat / Golongan
              </label>
              <input
                type="text"
                required
                value={pangkat}
                onChange={(e) => setPangkat(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jabatan</label>
              <input
                type="text"
                required
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Rescuer Ahli Pertama"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Kedinasan
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@basarnas.go.id"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi (Min. 6 Karakter)
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Konfirmasi Kata Sandi
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Daftar & Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
