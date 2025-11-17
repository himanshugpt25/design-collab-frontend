interface TopBarProps {
  title: string;
  isDirty?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onShare: () => void;
}

export const TopBar = ({ title, isDirty, onRedo, onShare, onUndo }: TopBarProps) => (
  <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4 shadow-lg shadow-slate-950/50 backdrop-blur">
    <div>
      <p className="text-xs uppercase tracking-widest text-slate-500">Active design</p>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-50">{title}</h1>
        {isDirty && (
          <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300">
            Unsaved
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onUndo}
        className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onRedo}
        className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
      >
        Redo
      </button>
      <button
        type="button"
        onClick={onShare}
        className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-indigo-500/40"
      >
        Share
      </button>
    </div>
  </header>
);

