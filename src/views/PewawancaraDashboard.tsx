import React, { useMemo, useState } from 'react';
import { MessageSquareText, CheckCircle2, Eye, ClipboardList } from 'lucide-react';
import { formatDateIndo } from '../lib/dateUtils';
import { getStatusLabel, getStatusTextClass } from '../lib/statusUtils';
import { generateId, Storage } from '../lib/storage';
import { useToast } from '../components/Toast';
import type {
  DossierTarget,
  JawabanWawancaraItem,
  PengajuanTugasBelajar,
  SkalaWawancara,
  SoalWawancara,
  User,
} from '../types';

interface PewawancaraDashboardProps {
  user: User;
  activeMenu: string;
  onOpenDossier: (target: DossierTarget) => void;
  onUpdated: () => void;
  dataVersion: number;
}

const SKALA_SCORES: Record<SkalaWawancara, { score: number; label: string }> = {
  MS: { score: 100, label: 'MS (Memenuhi Syarat · 100)' },
  CMS: { score: 75, label: 'CMS (Cukup · 75)' },
  KMS: { score: 50, label: 'KMS (Kurang · 50)' },
  TMS: { score: 25, label: 'TMS (Tidak Memenuhi · 25)' },
};

function selectQuestionsForCandidate(
  bank: SoalWawancara[],
  tbId: string,
  randomCount: number
): SoalWawancara[] {
  const active = bank.filter((s) => s.is_active);
  const wajib = active.filter((s) => s.jenis === 'wajib');
  const acak = active.filter((s) => s.jenis === 'acak');
  // Deterministic shuffle per candidate id so questions stay consistent during session
  const seed = tbId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const shuffled = [...acak].sort((a, b) => {
    const ha = (a.id.charCodeAt(a.id.length - 1) * 31 + seed) % 97;
    const hb = (b.id.charCodeAt(b.id.length - 1) * 31 + seed) % 97;
    return ha - hb;
  });
  return [...wajib, ...shuffled.slice(0, randomCount)];
}

export const PewawancaraDashboard: React.FC<PewawancaraDashboardProps> = ({
  user,
  activeMenu,
  onOpenDossier,
  onUpdated,
  dataVersion,
}) => {
  const { showToast } = useToast();
  const [selectedTb, setSelectedTb] = useState<PengajuanTugasBelajar | null>(null);
  const [answers, setAnswers] = useState<Record<string, { skala: SkalaWawancara; catatan: string }>>({});
  const [catatanUmum, setCatatanUmum] = useState('');
  const [overrideRekomendasi, setOverrideRekomendasi] = useState<'auto' | 'lulus' | 'pertimbangan' | 'tidak_lulus'>('auto');

  const allTb = useMemo(() => Storage.getPengajuanTB(), [dataVersion]);
  const bankSoal = useMemo(() => Storage.getSoalWawancara(), [dataVersion]);
  const cfg = useMemo(() => Storage.getPengaturanWawancara(), [dataVersion]);

  const queue = useMemo(
    () => allTb.filter((t) => t.status === 'menunggu_nilai_wawancara'),
    [allTb]
  );
  const history = useMemo(
    () => allTb.filter((t) => Boolean(t.hasil_wawancara)),
    [allTb]
  );

  const sessionQuestions = useMemo(() => {
    if (!selectedTb) return [];
    return selectQuestionsForCandidate(bankSoal, selectedTb.id, cfg.jumlah_soal_acak);
  }, [selectedTb, bankSoal, cfg.jumlah_soal_acak]);

  const openSession = (tb: PengajuanTugasBelajar) => {
    const qs = selectQuestionsForCandidate(bankSoal, tb.id, cfg.jumlah_soal_acak);
    const initial: Record<string, { skala: SkalaWawancara; catatan: string }> = {};
    qs.forEach((q) => {
      initial[q.id] = { skala: 'MS', catatan: '' };
    });
    setAnswers(initial);
    setCatatanUmum('');
    setOverrideRekomendasi('auto');
    setSelectedTb(tb);
  };

  const liveAverage = useMemo(() => {
    if (sessionQuestions.length === 0) return 0;
    const sum = sessionQuestions.reduce((acc, q) => {
      const sk = answers[q.id]?.skala ?? 'CMS';
      return acc + SKALA_SCORES[sk].score;
    }, 0);
    return sum / sessionQuestions.length;
  }, [sessionQuestions, answers]);

  const computedRecommendation: 'lulus' | 'tidak_lulus' | 'pertimbangan' =
    overrideRekomendasi !== 'auto'
      ? overrideRekomendasi
      : liveAverage >= cfg.passing_grade
      ? 'lulus'
      : liveAverage >= cfg.passing_grade - 10
      ? 'pertimbangan'
      : 'tidak_lulus';

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTb) return;
    const jawabanItems: JawabanWawancaraItem[] = sessionQuestions.map((q) => {
      const ans = answers[q.id] ?? { skala: 'CMS', catatan: '' };
      return {
        soal_id: q.id,
        kategori: q.kategori,
        pertanyaan: q.pertanyaan,
        jenis: q.jenis,
        skala: ans.skala,
        skor: SKALA_SCORES[ans.skala].score,
        catatan: ans.catatan.trim() || undefined,
      };
    });

    Storage.saveHasilWawancara(
      selectedTb.id,
      {
        id: generateId('wwc'),
        pengajuan_tb_id: selectedTb.id,
        pewawancara_id: user.id,
        pewawancara_nama: user.nama_lengkap,
        tanggal_wawancara: new Date().toISOString(),
        jawaban: jawabanItems,
        rata_rata_skor: Number(liveAverage.toFixed(1)),
        passing_grade: cfg.passing_grade,
        rekomendasi_hasil: computedRecommendation,
        catatan_umum:
          catatanUmum.trim() ||
          `Penilaian selesai dengan skor rata-rata ${liveAverage.toFixed(1)} (Passing Grade ${cfg.passing_grade}).`,
      },
      user
    );

    showToast(
      'success',
      'Hasil Wawancara Tersimpan',
      `${selectedTb.user_nama} memperoleh skor ${liveAverage.toFixed(1)} (${computedRecommendation.toUpperCase()}).`
    );
    setSelectedTb(null);
    onUpdated();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {activeMenu === 'riwayat_penilaian'
            ? 'Riwayat Penilaian Wawancara'
            : activeMenu === 'sesi_wawancara'
            ? 'Sesi Penilaian Wawancara Beasiswa'
            : 'Dashboard Tim Pewawancara SDM'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Passing Grade aktif: <strong className="font-mono text-slate-900">{cfg.passing_grade}</strong> · Soal wajib +{' '}
          <strong className="font-mono text-slate-900">{cfg.jumlah_soal_acak}</strong> soal acak per peserta.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Menunggu Penilaian</p>
          <p className="text-3xl font-bold font-mono text-orange-700 mt-1 tabular-nums">
            {queue.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Peserta lulus administrasi</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Telah Dinilai</p>
          <p className="text-3xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {history.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Tersimpan di arsip penilaian</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-500">Bank Soal Aktif</p>
          <p className="text-3xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {bankSoal.filter((s) => s.is_active).length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {bankSoal.filter((s) => s.jenis === 'wajib' && s.is_active).length} wajib ·{' '}
            {bankSoal.filter((s) => s.jenis === 'acak' && s.is_active).length} acak
          </p>
        </div>
      </div>

      {/* Active Grading Form */}
      {selectedTb && (
        <form
          onSubmit={handleSaveEvaluation}
          className="bg-white border border-orange-300 rounded-xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <p className="text-xs font-mono text-orange-700 font-semibold">
                SESI PENILAIAN AKTIF · {selectedTb.no_registrasi}
              </p>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedTb.user_nama} — {selectedTb.jenjang} {selectedTb.program_studi}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {selectedTb.universitas_tujuan} · {selectedTb.unit_kerja_nama} · {selectedTb.sumber_pendanaan}
              </p>
            </div>
            <div className="text-right tabular-nums">
              <p className="text-xs text-slate-500">Skor Rata-Rata Sementara</p>
              <p
                className={`text-2xl font-mono font-bold ${
                  liveAverage >= cfg.passing_grade ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {liveAverage.toFixed(1)}
                <span className="text-xs font-normal text-slate-500"> / {cfg.passing_grade}</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {sessionQuestions.map((q, idx) => {
              const cur = answers[q.id] ?? { skala: 'MS', catatan: '' };
              return (
                <div key={q.id} className="pb-4 border-b border-slate-100 last:border-b-0 space-y-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {idx + 1}. {q.kategori}
                    </p>
                    <span className="text-[11px] font-medium text-slate-500">
                      {q.jenis === 'wajib' ? 'Soal Wajib' : 'Soal Acak'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{q.pertanyaan}</p>
                  <p className="text-[11px] text-slate-500 italic">Panduan: {q.panduan_penilaian}</p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(['MS', 'CMS', 'KMS', 'TMS'] as SkalaWawancara[]).map((sk) => (
                      <button
                        key={sk}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: { ...cur, skala: sk },
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                          cur.skala === sk
                            ? sk === 'MS'
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : sk === 'CMS'
                              ? 'bg-blue-700 text-white border-blue-700'
                              : sk === 'KMS'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {SKALA_SCORES[sk].label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={cur.catatan}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: { ...cur, catatan: e.target.value },
                      }))
                    }
                    placeholder="Catatan singkat pewawancara untuk indikator ini (opsional)..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-orange-600 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rekomendasi Akhir Pewawancara
              </label>
              <select
                value={overrideRekomendasi}
                onChange={(e) =>
                  setOverrideRekomendasi(
                    e.target.value as 'auto' | 'lulus' | 'pertimbangan' | 'tidak_lulus'
                  )
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="auto">
                  Otomatis sesuai Passing Grade ({computedRecommendation.toUpperCase()})
                </option>
                <option value="lulus">Lulus</option>
                <option value="pertimbangan">Pertimbangan Admin Pusat</option>
                <option value="tidak_lulus">Tidak Lulus</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kesimpulan / Catatan Umum
              </label>
              <input
                type="text"
                value={catatanUmum}
                onChange={(e) => setCatatanUmum(e.target.value)}
                placeholder="Ringkasan kesiapan akademik, motivasi, dan komitmen ikatan dinas..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedTb(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan Nilai Wawancara
            </button>
          </div>
        </form>
      )}

      {/* Queue or History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {activeMenu === 'riwayat_penilaian'
              ? 'Riwayat Peserta Telah Dinilai'
              : 'Antrean Peserta Menunggu Wawancara'}
          </h2>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {(activeMenu === 'riwayat_penilaian' ? history : queue).length} peserta
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <th className="py-3 px-5">No. Registrasi</th>
                <th className="py-3 px-4">Kandidat & Unit</th>
                <th className="py-3 px-4">Program Studi Tujuan</th>
                <th className="py-3 px-4">
                  {activeMenu === 'riwayat_penilaian' ? 'Skor & Hasil' : 'Status'}
                </th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {(activeMenu === 'riwayat_penilaian' ? history : queue).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    {activeMenu === 'riwayat_penilaian'
                      ? 'Belum ada riwayat penilaian wawancara.'
                      : 'Tidak ada peserta yang menunggu wawancara saat ini.'}
                  </td>
                </tr>
              ) : (
                (activeMenu === 'riwayat_penilaian' ? history : queue).map((tb) => (
                  <tr key={tb.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                      {tb.no_registrasi}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{tb.user_nama}</p>
                      <p className="text-[11px] text-slate-500">
                        {tb.unit_kerja_nama} · <span className="font-mono">{tb.user_nip}</span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900">
                        {tb.jenjang} {tb.program_studi}
                      </p>
                      <p className="text-[11px] text-slate-500">{tb.universitas_tujuan}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {activeMenu === 'riwayat_penilaian' && tb.hasil_wawancara ? (
                        <div className="tabular-nums">
                          <span className="font-mono font-bold text-slate-900">
                            {tb.hasil_wawancara.rata_rata_skor.toFixed(1)}
                          </span>{' '}
                          ·{' '}
                          <span
                            className={`font-semibold ${
                              tb.hasil_wawancara.rekomendasi_hasil === 'lulus'
                                ? 'text-emerald-700'
                                : tb.hasil_wawancara.rekomendasi_hasil === 'tidak_lulus'
                                ? 'text-red-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {tb.hasil_wawancara.rekomendasi_hasil.toUpperCase()}
                          </span>
                          <p className="text-[11px] text-slate-400">
                            {formatDateIndo(tb.hasil_wawancara.tanggal_wawancara, true)}
                          </p>
                        </div>
                      ) : (
                        <span className={`font-semibold ${getStatusTextClass(tb.status)}`}>
                          {getStatusLabel(tb.status)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-2">
                      {tb.status === 'menunggu_nilai_wawancara' && (
                        <button
                          type="button"
                          onClick={() => openSession(tb)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg whitespace-nowrap"
                        >
                          <MessageSquareText className="w-3.5 h-3.5" />
                          Mulai Penilaian
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenDossier({ type: 'tugas_belajar', id: tb.id })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
