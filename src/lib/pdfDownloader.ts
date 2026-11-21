import { jsPDF } from 'jspdf';
import { formatDateIndo } from './dateUtils';

export interface OfficialPdfPayload {
  fileName: string;
  judulDokumen: string;
  nomorSurat?: string;
  tanggalSurat?: string;
  namaPegawai: string;
  nipPegawai: string;
  pangkatGolongan?: string;
  jabatan?: string;
  unitKerja: string;
  universitas?: string;
  programStudi?: string;
  jenjang?: string;
  sumberDana?: string;
  tmtMulai?: string;
  tmtSelesai?: string;
  penandatangan?: string;
  jabatanPenandatangan?: string;
  digitalHash?: string;
  catatanTambahan?: string;
  existingUrl?: string;
}

function ensurePdfFilename(name: string): string {
  const clean = name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]+/g, '_');
  return `${clean || 'Dokumen_SITUBEL'}.pdf`;
}

export function downloadDocumentAsPdf(payload: OfficialPdfPayload): void {
  const finalName = ensurePdfFilename(payload.fileName);

  if (payload.existingUrl && payload.existingUrl.startsWith('data:application/pdf')) {
    const a = document.createElement('a');
    a.href = payload.existingUrl;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const left = 22;
  const width = 166;

  // Kop Surat Resmi BASARNAS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BADAN NASIONAL PENCARIAN DAN PERTOLONGAN', 105, 20, { align: 'center' });
  doc.setFontSize(10.5);
  doc.text('BIRO KEPEGAWAIAN DAN ORGANISASI', 105, 26, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    'Jl. Angkasa Blok B.15 Kav. 2-3, Kemayoran, Jakarta Pusat 10720 • Telp. (021) 65701116',
    105,
    31,
    { align: 'center' }
  );

  doc.setLineWidth(0.7);
  doc.line(left, 35, left + width, 35);
  doc.setLineWidth(0.2);
  doc.line(left, 36.2, left + width, 36.2);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text(payload.judulDokumen.toUpperCase(), 105, 47, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nomor: ${payload.nomorSurat || 'B/SITUBEL/2025/BASARNAS'}`, 105, 53, {
    align: 'center',
  });

  // Pembuka
  let y = 65;
  doc.setFontSize(10);
  const intro =
    'Berdasarkan Peraturan Badan Nasional Pencarian dan Pertolongan Nomor 10 Tahun 2024 tentang Pedoman Tugas Belajar serta Surat Edaran Menteri PANRB Nomor 28 Tahun 2021, dengan ini diterbitkan dokumen resmi bagi pegawai berikut:';
  const introLines = doc.splitTextToSize(intro, width);
  doc.text(introLines, left, y);
  y += introLines.length * 5.2 + 5;

  const rows: Array<[string, string]> = [
    ['Nama Lengkap', payload.namaPegawai],
    ['NIP', payload.nipPegawai],
    ['Pangkat / Golongan', payload.pangkatGolongan || '—'],
    ['Jabatan', payload.jabatan || '—'],
    ['Unit Kerja', payload.unitKerja],
  ];

  if (payload.universitas) rows.push(['Perguruan Tinggi', payload.universitas]);
  if (payload.programStudi) {
    rows.push([
      'Program Studi / Jenjang',
      payload.jenjang ? `${payload.jenjang} — ${payload.programStudi}` : payload.programStudi,
    ]);
  }
  if (payload.sumberDana) rows.push(['Sumber Pendanaan', payload.sumberDana]);
  if (payload.tmtMulai || payload.tmtSelesai) {
    rows.push([
      'Masa Tugas Belajar',
      `${formatDateIndo(payload.tmtMulai)} s.d. ${formatDateIndo(payload.tmtSelesai)}`,
    ]);
  }

  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(':', left + 48, y);
    const valLines = doc.splitTextToSize(value, width - 52);
    doc.text(valLines, left + 52, y);
    y += Math.max(6.5, valLines.length * 5.2);
  });

  if (payload.catatanTambahan) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Ketentuan & Catatan:', left, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(payload.catatanTambahan, width);
    doc.text(noteLines, left, y);
    y += noteLines.length * 5 + 4;
  }

  // Penandatangan
  y = Math.max(y + 10, 195);
  const signX = 115;
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Jakarta, ${formatDateIndo(payload.tanggalSurat || new Date())}`,
    signX,
    y
  );
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(
    payload.jabatanPenandatangan || 'Kepala Biro Kepegawaian dan Organisasi,',
    signX,
    y
  );

  if (payload.digitalHash) {
    y += 10;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.rect(signX, y, 70, 18);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text('DITANDATANGANI SECARA ELEKTRONIK', signX + 3, y + 6);
    doc.setFont('courier', 'normal');
    doc.text(`Hash BSrE: ${payload.digitalHash}`, signX + 3, y + 11);
    doc.text('Sertifikat Elektronik BSrE — BSSN', signX + 3, y + 15);
    y += 25;
  } else {
    y += 24;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(payload.penandatangan || 'Dr. Hendra Gunawan, S.H., M.Si.', signX, y);

  // Footer verifikasi
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Dokumen ini diterbitkan melalui SITUBEL — Sistem Informasi Tugas Belajar Terpadu BASARNAS.',
    105,
    284,
    { align: 'center' }
  );

  doc.save(finalName);
}
