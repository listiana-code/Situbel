import React, { useMemo, useState } from 'react';
import { Camera, Save, KeyRound, UserCheck } from 'lucide-react';
import { readUploadedFileAsUrl } from '../lib/fileUtils';
import { getRoleDisplayLabel } from '../lib/statusUtils';
import { Storage } from '../lib/storage';
import { useToast } from '../components/Toast';
import type { User } from '../types';

interface ProfileSettingsViewProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  user,
  onUserUpdated,
}) => {
  const { showToast } = useToast();
  const units = useMemo(() => Storage.getUnitKerja(), []);

  const [nama, setNama] = useState(user.nama_lengkap);
  const [email, setEmail] = useState(user.email);
  const [telepon, setTelepon] = useState(user.telepon ?? '');
  const [pangkat, setPangkat] = useState(user.pangkat_golongan);
  const [jabatan, setJabatan] = useState(user.jabatan);
  const [unitId, setUnitId] = useState(user.unit_kerja_id);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? '');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Format tidak didukung', 'Pilih berkas foto JPG, PNG, atau WebP.');
      return;
    }
    const url = await readUploadedFileAsUrl(file);
    setAvatarUrl(url);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedUnit = units.find((u) => u.id === unitId);
    const updated: User = {
      ...user,
      nama_lengkap: nama.trim(),
      email: email.trim(),
      telepon: telepon.trim(),
      pangkat_golongan: pangkat.trim(),
      jabatan: jabatan.trim(),
      unit_kerja_id: selectedUnit?.id ?? user.unit_kerja_id,
      unit_kerja_nama: selectedUnit?.nama_unit ?? user.unit_kerja_nama,
      avatar_url: avatarUrl || undefined,
    };
    Storage.updateUser(updated);
    Storage.addAuditLog({
      user: updated,
      aksi: 'Perbarui Profil Akun',
      entitas: updated.nip,
      detail: 'Memperbarui data identitas kepegawaian dan foto profil.',
    });
    onUserUpdated(updated);
    showToast('success', 'Profil diperbarui', 'Data kepegawaian Anda berhasil disimpan.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPassword !== user.password) {
      showToast('error', 'Kata sandi lama salah', 'Masukkan kata sandi saat ini dengan benar.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('warning', 'Kata sandi terlalu pendek', 'Gunakan minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('warning', 'Konfirmasi tidak cocok', 'Pastikan kata sandi baru sama persis.');
      return;
    }
    const updated: User = { ...user, password: newPassword };
    Storage.updateUser(updated);
    onUserUpdated(updated);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('success', 'Kata sandi diubah', 'Gunakan kata sandi baru saat masuk berikutnya.');
  };

  const initials = user.nama_lengkap
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Profil & Keamanan Akun</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola foto profil, identitas kepegawaian, kontak dinas, dan kata sandi masuk SITUBEL.
        </p>
      </div>

      {/* Profile Identity Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-center gap-5 pb-6 border-b border-slate-200">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.nama_lengkap}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-900 text-white text-xl font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-base font-bold text-slate-900">{user.nama_lengkap}</p>
            <p className="text-xs text-slate-500">
              {getRoleDisplayLabel(user.role)} · <span className="font-mono">{user.nip}</span>
            </p>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
              <Camera className="w-3.5 h-3.5" />
              Ganti Foto (Galeri / Kamera)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                className="sr-only"
                onChange={handlePhotoChange}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Lengkap & Gelar
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              NIP (Tetap)
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
              <UserCheck className="w-4 h-4 shrink-0" />
              {user.nip}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Kedinasan
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="tel"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              placeholder="0812-xxxx-xxxx"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
            />
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jabatan</label>
            <input
              type="text"
              required
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
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
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan Profil
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Ubah Kata Sandi</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:border-orange-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Konfirmasi Kata Sandi Baru
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

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Perbarui Kata Sandi
          </button>
        </div>
      </form>
    </div>
  );
};
