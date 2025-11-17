export type ElementType = 'text' | 'image' | 'rect' | 'circle';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  locked?: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fill: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  fit: 'contain' | 'cover';
}

export interface RectElement extends BaseElement {
  type: 'rect';
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
}

export type DesignElement = TextElement | ImageElement | RectElement | CircleElement;

export interface Design {
  _id: string;
  name: string;
  width: number;
  height: number;
  elements: DesignElement[];
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

