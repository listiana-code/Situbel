import { jsPDF } from 'jspdf';
import type { RequiredDocumentConfig } from '../types';

export function downloadTemplateDocument(docConfig: RequiredDocumentConfig): void {
  if (docConfig.template_file_base64 && docConfig.template_file_name) {
    const a = document.createElement('a');
    a.href = docConfig.template_file_base64;
    a.download = docConfig.template_file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  const safeName = docConfig.nama_dokumen.replace(/[^a-zA-Z0-9]+/g, '_');

  if (docConfig.template_format === 'pdf') {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('BADAN NASIONAL PENCARIAN DAN PERTOLONGAN', 105, 22, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`TEMPLATE RESMI: ${docConfig.nama_dokumen.toUpperCase()}`, 105, 34, {
      align: 'center',
    });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const body = [
      `Kode Dokumen : ${docConfig.kode_dokumen}`,
      `Layanan      : ${docConfig.jenis_pengajuan.toUpperCase()}`,
      `Format       : ${docConfig.format_diizinkan.toUpperCase()} (Maks ${docConfig.max_size_mb} MB)`,
      '',
      'Keterangan Pengisian:',
      docConfig.keterangan,
      '',
      'Nama Pegawai     : ...........................................................',
      'NIP              : ...........................................................',
      'Pangkat / Gol    : ...........................................................',
      'Unit Kerja       : ...........................................................',
      'Program Studi    : ...........................................................',
      'Perguruan Tinggi : ...........................................................',
      '',
      'Jakarta, ........................ 2026',
      'Mengetahui Pimpinan Unit Kerja,',
      '',
      '',
      '( ............................................ )',
    ];
    pdf.text(body, 22, 48);
    pdf.save(`Template_${safeName}.pdf`);
    return;
  }

  // Generate clean Word-compatible HTML .doc template
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Template ${docConfig.nama_dokumen}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; margin: 2.5cm; color: #111; }
  h1 { text-align: center; font-size: 13pt; margin: 0; }
  h2 { text-align: center; font-size: 11pt; margin: 4px 0 12px; font-weight: normal; }
  hr { border: none; border-top: 2px solid #000; margin-bottom: 18px; }
  .title { text-align: center; font-weight: bold; text-decoration: underline; margin: 16px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  td { padding: 4px 6px; vertical-align: top; }
  .sign { margin-top: 40px; width: 45%; margin-left: 55%; }
</style>
</head>
<body>
  <h1>BADAN NASIONAL PENCARIAN DAN PERTOLONGAN</h1>
  <h2>Jl. Angkasa Blok B.15 Kav. 2-3, Kemayoran, Jakarta Pusat 10720</h2>
  <hr />
  <div class="title">${docConfig.nama_dokumen.toUpperCase()}</div>
  <p style="text-align:center;margin-top:0;">Nomor: B/........../SITUBEL/2026</p>
  <p>Yang bertanda tangan di bawah ini menerangkan bahwa pegawai berikut diusulkan dalam layanan <strong>${docConfig.jenis_pengajuan.toUpperCase()}</strong> sesuai ketentuan Perka Basarnas No. 10 Tahun 2024:</p>
  <table>
    <tr><td width="32%">Nama Lengkap</td><td width="3%">:</td><td>................................................................</td></tr>
    <tr><td>NIP</td><td>:</td><td>................................................................</td></tr>
    <tr><td>Pangkat / Golongan</td><td>:</td><td>................................................................</td></tr>
    <tr><td>Jabatan</td><td>:</td><td>................................................................</td></tr>
    <tr><td>Unit Kerja</td><td>:</td><td>................................................................</td></tr>
    <tr><td>Perguruan Tinggi / Prodi</td><td>:</td><td>................................................................</td></tr>
  </table>
  <p><em>Catatan Pengisian: ${docConfig.keterangan}</em></p>
  <div class="sign">
    <p>Jakarta, ........................ 2026<br />Pimpinan Unit Kerja,</p>
    <br /><br /><br />
    <p><strong>( ................................................ )</strong><br />NIP. ........................................</p>
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Template_${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
