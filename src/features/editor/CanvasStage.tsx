import { Layer, Rect, Stage, Text, Circle } from 'react-konva';

import type { Design, DesignElement } from '../../types/design';

interface CanvasStageProps {
  design: Design;
  selectedElementId?: string;
  onSelectElement: (elementId: string) => void;
}

export const CanvasStage = ({
  design,
  selectedElementId,
  onSelectElement,
}: CanvasStageProps) => {
  const renderElement = (element: DesignElement) => {
    const isSelected = element.id === selectedElementId;
    const commonProps = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      opacity: element.opacity,
      listening: true,
      onClick: () => onSelectElement(element.id),
    };

    switch (element.type) {
      case 'text':
        return (
          <Text
            key={element.id}
            {...commonProps}
            text={element.text}
            fontFamily={element.fontFamily}
            fontSize={element.fontSize}
            fontStyle={element.fontWeight}
            fill={element.fill}
            align={element.align}
            shadowColor={isSelected ? '#38bdf8' : 'transparent'}
            shadowBlur={isSelected ? 20 : 0}
          />
        );
      case 'rect':
        return (
          <Rect
            key={element.id}
            {...commonProps}
            cornerRadius={element.radius}
            fill={element.fill}
            stroke={isSelected ? '#38bdf8' : element.stroke}
            strokeWidth={isSelected ? element.strokeWidth + 2 : element.strokeWidth}
          />
        );
      case 'circle':
        return (
          <Circle
            key={element.id}
            x={element.x}
            y={element.y}
            radius={element.radius}
            rotation={element.rotation}
            opacity={element.opacity}
            fill={element.fill}
            stroke={isSelected ? '#38bdf8' : element.stroke}
            strokeWidth={isSelected ? element.strokeWidth + 2 : element.strokeWidth}
            onClick={() => onSelectElement(element.id)}
          />
        );
      case 'image':
      default:
        return (
          <Rect
            key={element.id}
            {...commonProps}
            fill="#1f2937"
            stroke={isSelected ? '#38bdf8' : '#0ea5e9'}
            strokeWidth={2}
            dash={[12, 8]}
          />
        );
    }
  };

  return (
    <div className="h-full w-full overflow-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-inner shadow-slate-950/50">
      <div
        className="mx-auto max-w-full"
        style={{ width: design.width, height: design.height }}
      >
        <Stage width={design.width} height={design.height} className="rounded-xl bg-slate-800">
          <Layer>{design.elements.map(renderElement)}</Layer>
        </Stage>
      </div>
    </div>
  );
};

