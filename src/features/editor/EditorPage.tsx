import { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useRealtime } from '../../hooks/useRealtime';
import { CanvasStage } from './CanvasStage';
import { CommentsPanel } from './CommentsPanel';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { TopBar } from './TopBar';
import { redo, undo } from '../design/historySlice';

export const EditorPage = () => {
  const dispatch = useAppDispatch();
  const { items, activeDesignId } = useAppSelector((state) => state.design);
  const collaborators = useAppSelector((state) => state.presence.collaborators);
  const activeDesign = useMemo(
    () => items.find((design) => design._id === activeDesignId),
    [items, activeDesignId]
  );
  const [selectedElementId, setSelectedElementId] = useState<string | undefined>(
    activeDesign?.elements[0]?.id
  );

  useRealtime(activeDesign?._id);

  if (!activeDesign) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-400">
        Select a design from the list to open the editor.
      </section>
    );
  }

  const selectedElement = activeDesign.elements.find((el) => el.id === selectedElementId);

  const handleShare = async () => {
    const shareData = {
      title: activeDesign.name,
      text: 'Collaborate with me on this design!',
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.text);
    }
  };

  return (
    <section className="space-y-6">
      <TopBar
        title={activeDesign.name}
        isDirty={false}
        onUndo={() => dispatch(undo())}
        onRedo={() => dispatch(redo())}
        onShare={handleShare}
      />
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <LayersPanel
            elements={activeDesign.elements}
            selectedElementId={selectedElementId}
            onSelect={setSelectedElementId}
          />
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                Presence
              </h3>
              <span className="text-xs text-slate-500">
                {Object.keys(collaborators).length} online
              </span>
            </header>
            <div className="mt-3 space-y-2">
              {Object.values(collaborators).map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: collaborator.color }}
                  />
                  <div>
                    <p className="font-semibold">{collaborator.name}</p>
                    <p className="text-xs text-slate-500">
                      Active {new Date(collaborator.lastActiveAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {!Object.keys(collaborators).length && (
                <p className="text-xs text-slate-500">
                  Waiting for collaborators to join this design…
                </p>
              )}
            </div>
          </section>
        </div>
        <CanvasStage
          design={activeDesign}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
        />
        <div className="space-y-4">
          <PropertiesPanel element={selectedElement} />
          <CommentsPanel designId={activeDesign._id} />
        </div>
      </div>
    </section>
  );
};

