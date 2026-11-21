import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

type AlertTone = 'info' | 'warning' | 'danger';

interface DialogState {
  mode: 'alert' | 'confirm';
  tone: AlertTone;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (value: boolean) => void;
}

interface AlertContextValue {
  showAlert: (opts: { title: string; message: string; tone?: AlertTone; confirmLabel?: string }) => Promise<void>;
  showConfirm: (opts: {
    title: string;
    message: string;
    tone?: AlertTone;
    confirmLabel?: string;
    cancelLabel?: string;
  }) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue>({
  showAlert: async () => {},
  showConfirm: async () => false,
});

export function useAlert() {
  return useContext(AlertContext);
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (dialog) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [dialog]);

  const showAlert = useCallback(
    (opts: { title: string; message: string; tone?: AlertTone; confirmLabel?: string }) =>
      new Promise<void>((resolve) => {
        setDialog({
          mode: 'alert',
          tone: opts.tone ?? 'info',
          title: opts.title,
          message: opts.message,
          confirmLabel: opts.confirmLabel ?? 'Mengerti',
          resolve: () => resolve(),
        });
      }),
    []
  );

  const showConfirm = useCallback(
    (opts: {
      title: string;
      message: string;
      tone?: AlertTone;
      confirmLabel?: string;
      cancelLabel?: string;
    }) =>
      new Promise<boolean>((resolve) => {
        setDialog({
          mode: 'confirm',
          tone: opts.tone ?? 'warning',
          title: opts.title,
          message: opts.message,
          confirmLabel: opts.confirmLabel ?? 'Ya, Lanjutkan',
          cancelLabel: opts.cancelLabel ?? 'Batal',
          resolve,
        });
      }),
    []
  );

  const handleClose = (result: boolean) => {
    if (!dialog) return;
    const resolver = dialog.resolve;
    setDialog(null);
    resolver(result);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          handleClose(false);
        }}
        className="m-auto p-0 bg-transparent border-0 max-w-md w-[calc(100vw-2rem)] rounded-xl overflow-visible"
      >
        {dialog && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-6">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  dialog.tone === 'danger'
                    ? 'bg-red-50 text-red-700'
                    : dialog.tone === 'warning'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {dialog.tone === 'danger' ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : dialog.tone === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">{dialog.title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{dialog.message}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              {dialog.mode === 'confirm' && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  {dialog.cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  dialog.tone === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : dialog.tone === 'warning'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </AlertContext.Provider>
  );
};
