export const adminTheme = {
  pageBackground:
    'bg-[radial-gradient(circle_at_top,rgba(181,255,36,0.08),transparent_35%),linear-gradient(to_bottom,#05070b,#0a0f16)]',
  sidebar:
    'border-r border-white/10 bg-[#070b11]/95 text-slate-200 backdrop-blur-xl',
  topbar:
    'border-b border-white/10 bg-[#070b11]/80 text-slate-100 backdrop-blur-xl',
  hero:
    'rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c121a] via-[#0b1118] to-[#090e14] p-8 text-slate-100 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.85)]',
  surface:
    'rounded-3xl border border-white/10 bg-[#0b1118]/85 text-slate-100 shadow-[0_20px_60px_-32px_rgba(0,0,0,0.95)] backdrop-blur-sm',
  surfaceSubtle:
    'rounded-xl border border-white/10 bg-white/[0.03]',
  sectionHeader: 'border-b border-white/10 bg-white/[0.03]',
  fieldLabel: 'text-sm font-semibold text-slate-300',
  input:
    'mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-lime-300/45 focus:ring-2 focus:ring-lime-300/20',
  textarea:
    'mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-lime-300/45 focus:ring-2 focus:ring-lime-300/20',
  select:
    'mt-1.5 w-full rounded-xl border border-white/15 bg-[#0e1621] px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-lime-300/45 focus:ring-2 focus:ring-lime-300/20',
  badge:
    'inline-flex items-center rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-xs font-semibold text-lime-200',
  buttonPrimary:
    'rounded-xl bg-gradient-to-r from-lime-300 to-lime-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50',
  linkAccent: 'text-sm font-semibold text-lime-200 transition hover:text-lime-100',
  tableWrap: 'overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]',
  tableHeadRow: 'bg-white/[0.04]',
  tableHeadCell: 'px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400',
  tableRow: 'transition hover:bg-white/[0.03]',
  tableCell: 'px-4 py-3 text-sm text-slate-200',
  emptyState: 'px-4 py-12 text-center text-sm text-slate-400',
} as const;

// Backward-compatible alias while imports are migrated.
export const adminPremiumUi = adminTheme;
