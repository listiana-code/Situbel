export interface UploadedFilePayload {
  nama_file: string;
  file_url: string;
  ukuran_mb: number;
  google_drive_file_id: string;
  google_drive_path: string;
}

function sanitizeSegment(text: string): string {
  return text
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_');
}

export function generateGoogleDrivePath(
  jenis: string,
  nip: string,
  nama: string,
  noReg: string
): string {
  return `SITUBEL_BASARNAS/${sanitizeSegment(jenis)}/${sanitizeSegment(nip)}_${sanitizeSegment(nama)}/${sanitizeSegment(noReg)}`;
}

export async function readUploadedFileAsUrl(file: File): Promise<string> {
  const maxInlineBytes = 1.5 * 1024 * 1024;
  if (file.size <= maxInlineBytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
      reader.readAsDataURL(file);
    });
  }
  return URL.createObjectURL(file);
}

export async function prepareDocumentUpload(
  file: File,
  context: { jenis: string; nip: string; nama: string; noReg: string }
): Promise<UploadedFilePayload> {
  const fileUrl = await readUploadedFileAsUrl(file);
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return {
    nama_file: sanitizeSegment(file.name),
    file_url: fileUrl,
    ukuran_mb: Number((file.size / (1024 * 1024)).toFixed(2)) || 0.05,
    google_drive_file_id: `drv-${hex}`,
    google_drive_path: generateGoogleDrivePath(
      context.jenis,
      context.nip,
      context.nama,
      context.noReg
    ),
  };
}
