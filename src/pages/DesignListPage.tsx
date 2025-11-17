import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { useGetDesignsQuery } from '../api/designsApi';
import { setActiveDesignId, upsertDesign } from '../features/design/designSlice';
import type { Design } from '../types/design';

const isApiConfigured = Boolean(import.meta.env.VITE_API_URL);

export const DesignListPage = () => {
  const dispatch = useAppDispatch();
  const { data, isFetching } = useGetDesignsQuery(undefined, {
    skip: !isApiConfigured,
  });
  const designs = useAppSelector((state) => state.design.items);
  const activeDesignId = useAppSelector((state) => state.design.activeDesignId);

  useEffect(() => {
    if (!data?.length) return;
    data.forEach((design: Design) => dispatch(upsertDesign(design)));
  }, [data, dispatch]);

  const handleCreateDesign = () => {
    const now = new Date().toISOString();
    const newDesign: Design = {
      _id: crypto.randomUUID(),
      name: `Untitled Design ${designs.length + 1}`,
      width: 1080,
      height: 1080,
      elements: [],
      createdAt: now,
      updatedAt: now,
    };
    dispatch(upsertDesign(newDesign));
    dispatch(setActiveDesignId(newDesign._id));
  };

  const list = data?.length ? data : designs;

  return (
    <section className="space-y-6 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-8 shadow-2xl shadow-slate-950/60">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-50">Design workspace</h1>
          <p className="text-sm text-slate-400">
            Manage drafts, jump back into the editor, and collaborate with teammates.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateDesign}
          className="rounded-full bg-gradient-to-r from-purple-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-sky-500/40"
        >
          New design
        </button>
      </header>
      {isFetching && isApiConfigured && (
        <p className="text-xs text-slate-500">Syncing with API…</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((design) => {
          const isActive = design._id === activeDesignId;
          return (
            <button
              key={design._id}
              type="button"
              onClick={() => dispatch(setActiveDesignId(design._id))}
              className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                isActive
                  ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/20'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-600'
              }`}
            >
              <p className="text-sm uppercase tracking-widest text-slate-500">
                {new Date(design.updatedAt).toLocaleDateString()}
              </p>
              <h2 className="text-2xl font-semibold text-slate-50">{design.name}</h2>
              <p className="text-sm text-slate-400">
                {design.width}×{design.height} · {design.elements.length} layers
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};

