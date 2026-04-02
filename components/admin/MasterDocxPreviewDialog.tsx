'use client';

import { renderAsync } from 'docx-preview';
import { X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Read-only .docx rendering in the browser (approximates Word layout; not pixel-perfect).
 * True Word editing requires Microsoft 365 on the web or a product like OnlyOffice.
 */
export function MasterDocxPreviewDialog({
  open,
  onOpenChange,
  fileDataUrl,
  fileName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileDataUrl: string;
  fileName: string;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !fileDataUrl) return;
    const el = bodyRef.current;
    if (!el) return;

    let cancelled = false;
    el.innerHTML = '';
    setStatus('loading');
    setErrorMessage(null);

    (async () => {
      try {
        const res = await fetch(fileDataUrl);
        if (!res.ok) throw new Error('Could not read the file.');
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        await renderAsync(buf, el, undefined, {
          inWrapper: true,
          breakPages: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          className: 'co-docx-preview',
        });
        if (!cancelled) setStatus('idle');
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(e instanceof Error ? e.message : 'Could not render this document.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, fileDataUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-label="Close preview"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="co-docx-preview-title"
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15',
          'bg-[#0f1419] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.9)]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p id="co-docx-preview-title" className="truncate text-sm font-bold text-white">
              {fileName || 'Resume'} — browser preview
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Read-only. Download and open in Word for full editing. Layout may differ slightly from Word.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-neutral-100 p-4 sm:p-6">
          {status === 'loading' ? (
            <p className="text-center text-sm text-neutral-600">Loading preview…</p>
          ) : null}
          {status === 'error' && errorMessage ? (
            <p className="text-center text-sm text-red-700">{errorMessage}</p>
          ) : null}
          <div
            ref={bodyRef}
            className={cn(
              'docx-wrapper-root min-h-[200px] text-black',
              status === 'loading' && 'opacity-40'
            )}
          />
        </div>
      </div>
    </div>
  );
}
