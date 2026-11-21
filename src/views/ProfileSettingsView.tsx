import React, { useMemo, useState } from 'react';
import { Camera, Save, KeyRound, UserCheck, Building2, ShieldCheck, Mail } from 'lucide-react';
import { PageBannerHeader } from '../components/KpiVisuals';
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
    <div className="space-y-6">
      <PageBannerHeader
        eyebrow="PENGATURAN AKUN KEPEGAWAIAN"
        title="Profil & Keamanan Akun"
        description="Kelola foto profil, identitas kepegawaian, kontak dinas, dan kata sandi masuk SITUBEL."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Executive Identity Summary Card (4 cols) */}
        <div className="lg:col-span-4 kpi-card overflow-hidden">
          <div className="bg-[#C8102E] p-6 text-center relative">
            <div className="flex flex-col items-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.nama_lengkap}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white text-[#C8102E] text-2xl font-extrabold flex items-center justify-center border-4 border-white/40 shadow-sm">
                  {initials}
                </div>
              )}
              <h2 className="mt-4 text-base font-extrabold text-white">{user.nama_lengkap}</h2>
              <span className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-[10px] font-bold uppercase tracking-wider text-[#A50D26]">
                {getRoleDisplayLabel(user.role)}
              </span>
              <label className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg cursor-pointer transition-colors">
                <Camera className="w-3.5 h-3.5" />
                Ganti Foto Profil
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

          <div className="p-5 space-y-3 text-xs">
            <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-500">Nomor Induk Pegawai (NIP)</p>
                <p className="font-mono font-bold text-slate-900 mt-0.5 tabular-nums">{user.nip}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-500">Unit Kerja & Jabatan</p>
                <p className="font-semibold text-slate-900 mt-0.5">{user.unit_kerja_nama}</p>
                <p className="text-slate-600">{user.jabatan}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pb-3 border-b border-slate-100">
              <Mail className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">Email Kedinasan</p>
                <p className="font-medium text-slate-900 mt-0.5 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-500">Status Akun</p>
                <p className="font-bold text-emerald-700 mt-0.5">Aktif · Terverifikasi BASARNAS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Forms Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Profile Identity Form */}
          <form onSubmit={handleSaveProfile} className="kpi-card p-6 space-y-5">
            <div className="pb-3.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Biodata & Identitas Kepegawaian</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Informasi ini otomatis digunakan pada formulir Surat Rekomendasi dan Draft SK.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP (Tetap)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2 text-sm font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-500">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  {user.nip}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Kedinasan
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pangkat / Golongan
                </label>
                <input
                  type="text"
                  required
                  value={pangkat}
                  onChange={(e) => setPangkat(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jabatan</label>
                <input
                  type="text"
                  required
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Unit Kerja</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_unit} ({u.kode_unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#C8102E] hover:bg-[#A50D26] rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan Profil
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="kpi-card p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-8 h-8 rounded-lg bg-red-50 text-[#A50D26] flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Keamanan & Kata Sandi</h3>
                <p className="text-xs text-slate-500">Perbarui kata sandi akun SITUBEL secara berkala.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-[#F4F5F7] focus:bg-white focus:border-[#C8102E] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-[#A50D26] bg-[#FDF2F4] hover:bg-[#C8102E] hover:text-white border border-[#F5C6CE] hover:border-[#C8102E] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Perbarui Kata Sandi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
