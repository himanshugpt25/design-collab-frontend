import type { DesignElement } from '../../../entities/design/model/types';

interface PropertiesPanelProps {
  element?: DesignElement;
}

export const PropertiesPanel = ({ element }: PropertiesPanelProps) => {
  if (!element) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-center text-sm text-slate-500">
        Select a layer to inspect its properties.
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-slate-500">Properties</p>
        <h3 className="text-lg font-semibold text-slate-50">{element.type} layer</h3>
      </header>
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
        <div>
          <p className="text-xs uppercase text-slate-500">Position</p>
          <p>
            x: {element.x}px · y: {element.y}px
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Size</p>
          <p>
            {element.width} × {element.height}px
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Rotation</p>
          <p>{element.rotation}°</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Opacity</p>
          <p>{Math.round(element.opacity * 100)}%</p>
        </div>
      </div>
      {element.type === 'text' && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-200">
          <p className="font-semibold text-slate-100">Preview</p>
          <p style={{ fontFamily: element.fontFamily, fontWeight: element.fontWeight }}>
            {element.text}
          </p>
        </div>
      )}
    </section>
  );
};

