const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const SHORT_MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function parseDate(input?: string | Date): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateIndo(input?: string | Date, shortMonth = false): string {
  const d = parseDate(input);
  if (!d) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = shortMonth ? SHORT_MONTHS_ID[d.getMonth()] : MONTHS_ID[d.getMonth()];
  return `${day} ${month} ${d.getFullYear()}`;
}

export function formatTimeIndo(input?: string | Date): string {
  const d = parseDate(input);
  if (!d) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} WIB`;
}

export function formatDateTimeIndo(input?: string | Date): string {
  const d = parseDate(input);
  if (!d) return '—';
  return `${formatDateIndo(d, true)}, ${formatTimeIndo(d)}`;
}

export function formatDateTimeDetailed(input?: string | Date): string {
  const d = parseDate(input);
  if (!d) return '—';
  const ss = String(d.getSeconds()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatDateIndo(d, false)} • ${hh}:${mm}:${ss} WIB`;
}

export function addWorkingDays(startDateStr: string, workingDays: number): string {
  const d = parseDate(startDateStr) ?? new Date();
  let added = 0;
  const cur = new Date(d);
  while (added < workingDays) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      added += 1;
    }
  }
  return cur.toISOString().slice(0, 10);
}

export function addSemestersToDate(dateStr: string, semesters: number): string {
  const d = parseDate(dateStr) ?? new Date();
  const next = new Date(d);
  next.setMonth(next.getMonth() + semesters * 6);
  return next.toISOString().slice(0, 10);
}
