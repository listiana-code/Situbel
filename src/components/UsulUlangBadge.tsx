import React from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { getUsulUlangQuota } from '../lib/statusUtils';

interface UsulUlangBadgeProps {
  usedCount: number;
  maxAllowed: number;
}

export const UsulUlangBadge: React.FC<UsulUlangBadgeProps> = ({ usedCount, maxAllowed }) => {
  const quota = getUsulUlangQuota(usedCount, maxAllowed);
  if (usedCount === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 tabular-nums">
      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
      Usul Ulang ke-{usedCount} (sisa {quota.remaining}/{quota.max})
    </span>
  );
};

interface UsulUlangNoticeProps {
  usedCount: number;
  maxAllowed: number;
  reason?: string;
  rejectedBy?: string;
  onResubmit?: () => void;
}

export const UsulUlangNotice: React.FC<UsulUlangNoticeProps> = ({
  usedCount,
  maxAllowed,
  reason,
  rejectedBy,
  onResubmit,
}) => {
  const quota = getUsulUlangQuota(usedCount, maxAllowed);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-900">
            Pengajuan Ditolak{rejectedBy ? ` oleh ${rejectedBy}` : ''}
          </p>
          {reason && <p className="text-xs text-red-800 mt-1 leading-relaxed">{reason}</p>}
          <p className="text-xs text-slate-600 mt-1.5 tabular-nums">
            Kuota Usul Ulang: terpakai {quota.used} dari {quota.max} kesempatan
            {quota.canResubmit
              ? ` · Tersisa ${quota.remaining} kali perbaikan.`
              : ' · Kuota usul ulang telah habis.'}
          </p>
        </div>
      </div>
      {onResubmit && quota.canResubmit && (
        <button
          type="button"
          onClick={onResubmit}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Ajukan Usul Ulang
        </button>
      )}
    </div>
  );
};
