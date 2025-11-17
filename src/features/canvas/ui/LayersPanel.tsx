import type { DesignElement } from '../../../entities/design/model/types';

interface LayersPanelProps {
  elements: DesignElement[];
  selectedElementId?: string;
  onSelect: (id: string) => void;
}

const elementTypeLabel: Record<DesignElement['type'], string> = {
  text: 'Text',
  rect: 'Rectangle',
  circle: 'Circle',
  image: 'Image',
};

export const LayersPanel = ({ elements, selectedElementId, onSelect }: LayersPanelProps) => (
  <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
    <header className="flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Layers</h2>
      <span className="text-xs text-slate-500">{elements.length} items</span>
    </header>
    <div className="space-y-2">
      {[...elements]
        .sort((a, b) => b.zIndex - a.zIndex)
        .map((element) => {
          const isSelected = element.id === selectedElementId;
          return (
            <button
              key={element.id}
              type="button"
              onClick={() => onSelect(element.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                isSelected
                  ? 'border-sky-500/80 bg-sky-500/10 text-slate-50'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
              }`}
            >
              <p className="text-sm font-semibold">{elementTypeLabel[element.type]}</p>
              <p className="text-xs text-slate-500">
                id:{' '}
                <span className="font-mono text-slate-400">
                  {element.id.length > 10 ? `${element.id.slice(0, 10)}…` : element.id}
                </span>
              </p>
            </button>
          );
        })}
    </div>
  </section>
);

