## 0. Project Overview

We are building a **web-based collaborative design editor** (think very light Figma/Canva):

- Users can create designs made of **text, images, and basic shapes**.
- Each design has:
  - A fixed **canvas size** (e.g. 1080×1080).
  - A list of elements (text, rect, circle, image).
  - Layer ordering, styling, and geometry.

- Users can:
  - Add/move/resize/rotate elements.
  - Change styles (text properties, colors, etc.).
  - Reorder layers.
  - Add comments with `@mentions`.
  - Collaborate in real-time (multi-user editing).
  - Undo/redo changes.
  - Export the design as a PNG image.

The system is split into:

- **Backend**: Node.js + Express + MongoDB + Mongoose + Zod + Socket.IO.
- **Frontend**: React + TypeScript + Redux Toolkit + RTK Query + `react-konva` + `socket.io-client`.

You (the copilot) must follow the conventions below when generating code.

---

## 1. Tech Stack & Global Conventions

### 1.1 Backend

- **Language**: TypeScript (Node.js).
- **Framework**: Express.
- **Database**: MongoDB via Mongoose.
- **Validation**: Zod for request validation.
- **Realtime**: Socket.IO server.
- **Testing**: Jest (+ Supertest for HTTP routes).

### 1.2 Frontend

- **Language**: TypeScript.
- **Framework**: React.
- **State mgmt**: Redux Toolkit (RTK) + RTK Query.
- **Canvas**: `konva` + `react-konva`.
- **Realtime**: `socket.io-client`.
- **Testing**: Vitest or Jest + React Testing Library; Playwright/Cypress for E2E.

### 1.3 Coding style

- Prefer **functional components** with hooks.
- Use **named exports** where possible.
- Keep **types** in dedicated `types/` folders when shared.
- Use **async/await** for async code.
- Use TypeScript everywhere; no `any` unless absolutely unavoidable.

---

## 2. Project & Folder Structure

At repo root:

```text
design-collab-editor/
  backend/
    src/
      index.ts
      db/
        connection.ts
      models/
        Design.ts
        Comment.ts
      types/
        design.ts
        comment.ts
      schemas/
        design.schema.ts
        comment.schema.ts
      routes/
        designs.routes.ts
        comments.routes.ts
      sockets/
        realtime.ts
      middleware/
        errorHandler.ts
        notFound.ts
      config/
        env.ts
      tests/
        ...
    package.json
  frontend/
    src/
      app/
        store.ts
      api/
        designsApi.ts
        commentsApi.ts
      features/
        design/
          designSlice.ts
          historySlice.ts
          presenceSlice.ts
        editor/
          EditorPage.tsx
          CanvasStage.tsx
          LayersPanel.tsx
          PropertiesPanel.tsx
          CommentsPanel.tsx
          TopBar.tsx
      types/
        design.ts
        comment.ts
      hooks/
        useRealtime.ts
      pages/
        DesignListPage.tsx
      tests/
        ...
    package.json
```

When generating new files, follow this structure.

---

## 3. Domain Model (Shared)

### 3.1 Element & Design Types

Use these as the canonical types (TS):

```ts
// frontend/src/types/design.ts
// backend/src/types/design.ts (identical)

export type ElementType = 'text' | 'image' | 'rect' | 'circle';

export interface BaseElement {
  id: string; // UUID, generated on client
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  zIndex: number;
  opacity: number; // 0–1
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
  src: string; // URL
  fit: 'contain' | 'cover';
}

export interface RectElement extends BaseElement {
  type: 'rect';
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number; // corner radius
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
  _id: string; // Mongo ObjectId as string on FE
  name: string;
  width: number;
  height: number;
  elements: DesignElement[];
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}
```

### 3.2 Comment Types

```ts
// frontend/src/types/comment.ts
// backend/src/types/comment.ts (matching)

export interface CommentMention {
  userId?: string; // optional
  username: string; // parsed from "@username"
}

export interface Comment {
  _id: string;
  designId: string;
  authorName: string;
  text: string;
  mentions: CommentMention[];
  createdAt: string;
}
```

---

## 4. Backend Design

### 4.1 Express App Setup

- Single Express app with:
  - JSON body parsing
  - CORS configured for frontend origin
  - `/health` route
  - `/api` routes
  - Attached Socket.IO server.

Example entrypoint:

```ts
// backend/src/index.ts
import http from 'http';
import express from 'express';
import cors from 'cors';
import { connectDb } from './db/connection';
import { registerDesignRoutes } from './routes/designs.routes';
import { registerCommentRoutes } from './routes/comments.routes';
import { registerRealtime } from './sockets/realtime';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

async function start() {
  await connectDb();

  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json());

  app.get('/health', (_, res) => res.json({ ok: true }));

  registerDesignRoutes(app);
  registerCommentRoutes(app);

  app.use(notFound);
  app.use(errorHandler);

  const server = http.createServer(app);
  registerRealtime(server); // attach Socket.IO

  const port = process.env.PORT || 4000;
  server.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 4.2 Mongo & Mongoose Models

**Design model:**

```ts
// backend/src/models/Design.ts
import { Schema, model, Document } from 'mongoose';
import { DesignElement } from '../types/design';

export interface DesignDoc extends Document {
  name: string;
  width: number;
  height: number;
  elements: DesignElement[];
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const elementSchema = new Schema<DesignElement>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'rect', 'circle'], required: true },
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    rotation: Number,
    zIndex: Number,
    opacity: Number,
    locked: Boolean,
    // type-specific props (define minimally strict, we rely on Zod at boundary)
    text: String,
    fontFamily: String,
    fontSize: Number,
    fontWeight: String,
    fill: String,
    align: String,
    src: String,
    fit: String,
    stroke: String,
    strokeWidth: Number,
    radius: Number,
  },
  { _id: false }
);

const designSchema = new Schema<DesignDoc>(
  {
    name: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    elements: { type: [elementSchema], default: [] },
    thumbnailUrl: String,
  },
  { timestamps: true }
);

export const DesignModel = model<DesignDoc>('Design', designSchema);
```

**Comment model:**

```ts
// backend/src/models/Comment.ts
import { Schema, model, Document } from 'mongoose';

export interface CommentMention {
  userId?: string;
  username: string;
}

export interface CommentDoc extends Document {
  designId: string;
  authorName: string;
  text: string;
  mentions: CommentMention[];
  createdAt: Date;
  updatedAt: Date;
}

const mentionSchema = new Schema<CommentMention>(
  {
    userId: String,
    username: { type: String, required: true },
  },
  { _id: false }
);

const commentSchema = new Schema<CommentDoc>(
  {
    designId: { type: Schema.Types.ObjectId, ref: 'Design', required: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true },
    mentions: { type: [mentionSchema], default: [] },
  },
  { timestamps: true }
);

export const CommentModel = model<CommentDoc>('Comment', commentSchema);
```

### 4.3 Zod Schemas

Validate all payloads using Zod.

```ts
// backend/src/schemas/design.schema.ts
import { z } from 'zod';

const baseElementSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'rect', 'circle']),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  zIndex: z.number(),
  opacity: z.number().min(0).max(1),
  locked: z.boolean().optional(),
});

const textElementSchema = baseElementSchema.extend({
  type: z.literal('text'),
  text: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
  fontWeight: z.enum(['normal', 'bold']),
  fill: z.string(),
  align: z.enum(['left', 'center', 'right']),
});

const imageElementSchema = baseElementSchema.extend({
  type: z.literal('image'),
  src: z.string().url(),
  fit: z.enum(['contain', 'cover']),
});

const rectElementSchema = baseElementSchema.extend({
  type: z.literal('rect'),
  fill: z.string(),
  stroke: z.string(),
  strokeWidth: z.number(),
  radius: z.number(),
});

const circleElementSchema = baseElementSchema.extend({
  type: z.literal('circle'),
  fill: z.string(),
  stroke: z.string(),
  strokeWidth: z.number(),
  radius: z.number(),
});

export const designElementSchema = z.discriminatedUnion('type', [
  textElementSchema,
  imageElementSchema,
  rectElementSchema,
  circleElementSchema,
]);

export const designSchema = z.object({
  name: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  elements: z.array(designElementSchema),
});
```

Comment schema:

```ts
// backend/src/schemas/comment.schema.ts
import { z } from 'zod';

export const commentCreateSchema = z.object({
  authorName: z.string().min(1),
  text: z.string().min(1),
});
```

### 4.4 Routes – Designs

Follow this pattern for REST endpoints.

```ts
// backend/src/routes/designs.routes.ts
import { Express, Request, Response } from 'express';
import { DesignModel } from '../models/Design';
import { designSchema } from '../schemas/design.schema';
import { z } from 'zod';

export function registerDesignRoutes(app: Express) {
  // POST /api/designs
  app.post('/api/designs', async (req: Request, res: Response, next) => {
    try {
      const bodySchema = z.object({
        name: z.string().min(1),
        width: z.number().positive(),
        height: z.number().positive(),
      });
      const parsed = bodySchema.parse(req.body);

      const design = await DesignModel.create({
        name: parsed.name,
        width: parsed.width,
        height: parsed.height,
        elements: [],
      });

      res.status(201).json({ data: design, error: null });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/designs
  app.get('/api/designs', async (_req, res, next) => {
    try {
      const designs = await DesignModel.find({})
        .select('name updatedAt thumbnailUrl')
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();
      res.json({ data: designs, error: null });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/designs/:id
  app.get('/api/designs/:id', async (req, res, next) => {
    try {
      const design = await DesignModel.findById(req.params.id).lean();
      if (!design) {
        return res
          .status(404)
          .json({ data: null, error: { code: 'NOT_FOUND', message: 'Design not found' } });
      }
      res.json({ data: design, error: null });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/designs/:id
  app.put('/api/designs/:id', async (req, res, next) => {
    try {
      const parsed = designSchema.parse(req.body);

      const design = await DesignModel.findByIdAndUpdate(
        req.params.id,
        {
          name: parsed.name,
          width: parsed.width,
          height: parsed.height,
          elements: parsed.elements,
        },
        { new: true }
      ).lean();

      if (!design) {
        return res
          .status(404)
          .json({ data: null, error: { code: 'NOT_FOUND', message: 'Design not found' } });
      }

      res.json({ data: design, error: null });
    } catch (err) {
      next(err);
    }
  });
}
```

### 4.5 Routes – Comments

```ts
// backend/src/routes/comments.routes.ts
import { Express, Request, Response } from 'express';
import { CommentModel } from '../models/Comment';
import { commentCreateSchema } from '../schemas/comment.schema';

function extractMentions(text: string) {
  const regex = /@(\w+)/g;
  const mentions: { username: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    mentions.push({ username: match[1] });
  }
  return mentions;
}

export function registerCommentRoutes(app: Express) {
  // GET /api/designs/:id/comments
  app.get('/api/designs/:id/comments', async (req: Request, res: Response, next) => {
    try {
      const comments = await CommentModel.find({ designId: req.params.id })
        .sort({ createdAt: 1 })
        .lean();
      res.json({ data: comments, error: null });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/designs/:id/comments
  app.post('/api/designs/:id/comments', async (req: Request, res: Response, next) => {
    try {
      const parsed = commentCreateSchema.parse(req.body);
      const mentions = extractMentions(parsed.text);

      const comment = await CommentModel.create({
        designId: req.params.id,
        authorName: parsed.authorName,
        text: parsed.text,
        mentions,
      });

      res.status(201).json({ data: comment, error: null });
    } catch (err) {
      next(err);
    }
  });
}
```

### 4.6 Error Handling Middleware

```ts
// backend/src/middleware/errorHandler.ts
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.flatten(),
      },
    });
  }

  return res.status(500).json({
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
}
```

---

## 5. Realtime (Socket.IO) – Backend

The server acts as a **relay**, not as the persistence layer for operations.

### 5.1 Socket.IO Setup

```ts
// backend/src/sockets/realtime.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

interface JoinDesignPayload {
  designId: string;
  userId: string;
  name: string;
  color: string;
}

export function registerRealtime(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  const nsp = io.of('/realtime');

  nsp.on('connection', (socket: Socket) => {
    console.log('Socket connected', socket.id);

    socket.on('join-design', (payload: JoinDesignPayload) => {
      const { designId, userId, name, color } = payload;
      socket.join(designId);
      socket.data.userId = userId;

      socket.to(designId).emit('user-joined', { userId, name, color });
    });

    socket.on('leave-design', ({ designId }) => {
      socket.leave(designId);
      if (socket.data.userId) {
        socket.to(designId).emit('user-left', { userId: socket.data.userId });
      }
    });

    // Element relay events
    socket.on('element-create', (payload) => {
      const { designId } = payload;
      socket.to(designId).emit('element-create', payload);
    });

    socket.on('element-update', (payload) => {
      const { designId } = payload;
      socket.to(designId).emit('element-update', payload);
    });

    socket.on('element-delete', (payload) => {
      const { designId } = payload;
      socket.to(designId).emit('element-delete', payload);
    });

    socket.on('layer-reorder', (payload) => {
      const { designId } = payload;
      socket.to(designId).emit('layer-reorder', payload);
    });

    socket.on('cursor-move', (payload) => {
      const { designId } = payload;
      socket.to(designId).emit('cursor-move', payload);
    });

    socket.on('comment-added', (payload) => {
      const { designId } = payload;
      socket.to(designId).emit('comment-added', payload);
    });

    socket.on('disconnect', () => {
      // Optionally broadcast user-left if we track designId here
      console.log('Socket disconnected', socket.id);
    });
  });
}
```

---

## 6. Frontend – State & APIs

### 6.1 Redux Store & RTK Query

Create store:

```ts
// frontend/src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { designsApi } from '../api/designsApi';
import { commentsApi } from '../api/commentsApi';
import designReducer from '../features/design/designSlice';
import historyReducer from '../features/design/historySlice';
import presenceReducer from '../features/design/presenceSlice';

export const store = configureStore({
  reducer: {
    [designsApi.reducerPath]: designsApi.reducer,
    [commentsApi.reducerPath]: commentsApi.reducer,
    design: designReducer,
    history: historyReducer,
    presence: presenceReducer,
  },
  middleware: (getDefault) => getDefault().concat(designsApi.middleware, commentsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

RTK Query for designs:

```ts
// frontend/src/api/designsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Design } from '../types/design';

export const designsApi = createApi({
  reducerPath: 'designsApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL }),
  tagTypes: ['Design', 'DesignList'],
  endpoints: (build) => ({
    getDesigns: build.query<Design[], void>({
      query: () => '/designs',
      providesTags: ['DesignList'],
    }),
    getDesign: build.query<Design, string>({
      query: (id) => `/designs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Design', id }],
    }),
    createDesign: build.mutation<Design, { name: string; width: number; height: number }>({
      query: (body) => ({
        url: '/designs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DesignList'],
    }),
    updateDesign: build.mutation<
      Design,
      { id: string; design: Omit<Design, '_id' | 'createdAt' | 'updatedAt'> }
    >({
      query: ({ id, design }) => ({
        url: `/designs/${id}`,
        method: 'PUT',
        body: design,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Design', id: arg.id }, 'DesignList'],
    }),
  }),
});

export const {
  useGetDesignsQuery,
  useGetDesignQuery,
  useCreateDesignMutation,
  useUpdateDesignMutation,
} = designsApi;
```

RTK Query for comments follows similar pattern.

---

## 7. Frontend – Design Slice & History

### 7.1 Design Slice

Design slice represents the current design in the editor.

```ts
// frontend/src/features/design/designSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DesignElement } from '../../types/design';

interface DesignState {
  designId: string | null;
  name: string;
  width: number;
  height: number;
  elementsById: Record<string, DesignElement>;
  layerOrder: string[]; // ordered element ids
  selectedElementId: string | null;
  dirty: boolean;
}

const initialState: DesignState = {
  designId: null,
  name: '',
  width: 1080,
  height: 1080,
  elementsById: {},
  layerOrder: [],
  selectedElementId: null,
  dirty: false,
};

const designSlice = createSlice({
  name: 'design',
  initialState,
  reducers: {
    loadDesign(
      state,
      action: PayloadAction<{
        designId: string;
        name: string;
        width: number;
        height: number;
        elements: DesignElement[];
      }>
    ) {
      const { designId, name, width, height, elements } = action.payload;
      state.designId = designId;
      state.name = name;
      state.width = width;
      state.height = height;
      state.elementsById = {};
      state.layerOrder = [];
      elements.forEach((el) => {
        state.elementsById[el.id] = el;
        state.layerOrder.push(el.id);
      });
      state.selectedElementId = null;
      state.dirty = false;
    },
    addElement(state, action: PayloadAction<DesignElement>) {
      const el = action.payload;
      state.elementsById[el.id] = el;
      state.layerOrder.push(el.id);
      state.dirty = true;
    },
    updateElement(state, action: PayloadAction<{ id: string; patch: Partial<DesignElement> }>) {
      const { id, patch } = action.payload;
      const existing = state.elementsById[id];
      if (!existing) return;
      state.elementsById[id] = { ...existing, ...patch };
      state.dirty = true;
    },
    deleteElement(state, action: PayloadAction<{ id: string }>) {
      const { id } = action.payload;
      delete state.elementsById[id];
      state.layerOrder = state.layerOrder.filter((eid) => eid !== id);
      if (state.selectedElementId === id) {
        state.selectedElementId = null;
      }
      state.dirty = true;
    },
    reorderLayers(state, action: PayloadAction<{ newOrder: string[] }>) {
      state.layerOrder = action.payload.newOrder;
      state.dirty = true;
    },
    setSelectedElement(state, action: PayloadAction<string | null>) {
      state.selectedElementId = action.payload;
    },
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
      state.dirty = true;
    },
  },
});

export const {
  loadDesign,
  addElement,
  updateElement,
  deleteElement,
  reorderLayers,
  setSelectedElement,
  setName,
} = designSlice.actions;

export default designSlice.reducer;
```

### 7.2 History Slice (Undo/Redo)

Use present/past/future pattern; history is **local to the user** and not synced.

```ts
// frontend/src/features/design/historySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DesignState } from './types'; // define a shared DesignState type, e.g. same as slice

interface HistoryState {
  past: DesignState[];
  present: DesignState | null;
  future: DesignState[];
}

const initialState: HistoryState = {
  past: [],
  present: null,
  future: [],
};

// Approaches:
// - Wrap design reducers to push past states when an undoable action occurs.
// - Or manually dispatch a "snapshot" after each action.

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    savePresent(state, action: PayloadAction<DesignState>) {
      if (state.present) {
        state.past.push(state.present);
        if (state.past.length > 50) state.past.shift();
      }
      state.present = action.payload;
      state.future = [];
    },
    undo(state) {
      if (!state.past.length || !state.present) return;
      const previous = state.past[state.past.length - 1];
      state.past = state.past.slice(0, -1);
      state.future.unshift(state.present);
      state.present = previous;
    },
    redo(state) {
      if (!state.future.length || !state.present) return;
      const next = state.future[0];
      state.future = state.future.slice(1);
      state.past.push(state.present);
      state.present = next;
    },
  },
});

export const { savePresent, undo, redo } = historySlice.actions;
export default historySlice.reducer;
```

The editor should:

- After each meaningful design action, call `savePresent` with a snapshot of current design state (or integrate with reducers in a more sophisticated way).

---

## 8. Frontend – Canvas & Konva

### 8.1 CanvasStage

Use `react-konva` and a `Stage` + `Layer` structure.

```tsx
// frontend/src/features/editor/CanvasStage.tsx
import React, { useRef } from 'react';
import { Stage, Layer, Rect, Text, Circle, Image as KonvaImage, Transformer } from 'react-konva';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { DesignElement } from '../../types/design';
import { setSelectedElement, updateElement } from '../design/designSlice';

interface CanvasStageProps {
  width: number;
  height: number;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({ width, height }) => {
  const dispatch = useAppDispatch();
  const { elementsById, layerOrder, selectedElementId } = useAppSelector((s) => s.design);
  const transformerRef = useRef<any>(null);
  const selectedNodeRef = useRef<any>(null);

  const elements = layerOrder.map((id) => elementsById[id]).filter(Boolean);

  const handleSelect = (id: string) => {
    dispatch(setSelectedElement(id));
  };

  const handleTransformEnd = (el: DesignElement, node: any) => {
    const newAttrs = {
      x: node.x(),
      y: node.y(),
      width: node.width() * node.scaleX(),
      height: node.height() * node.scaleY(),
      rotation: node.rotation(),
    };
    node.scaleX(1);
    node.scaleY(1);
    dispatch(updateElement({ id: el.id, patch: newAttrs }));
  };

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
        {elements.map((el) => {
          const isSelected = el.id === selectedElementId;

          const commonProps = {
            key: el.id,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            rotation: el.rotation,
            opacity: el.opacity,
            onClick: () => handleSelect(el.id),
            onTap: () => handleSelect(el.id),
            draggable: true,
            onDragEnd: (e: any) => {
              dispatch(updateElement({ id: el.id, patch: { x: e.target.x(), y: e.target.y() } }));
            },
            ref: isSelected ? selectedNodeRef : undefined,
            onTransformEnd: (e: any) => handleTransformEnd(el, e.target),
          };

          if (el.type === 'rect') {
            return (
              <Rect
                {...commonProps}
                fill={el.fill}
                stroke={el.stroke}
                strokeWidth={el.strokeWidth}
                cornerRadius={el.radius}
              />
            );
          }
          if (el.type === 'circle') {
            return (
              <Circle
                {...commonProps}
                radius={el.radius}
                fill={el.fill}
                stroke={el.stroke}
                strokeWidth={el.strokeWidth}
              />
            );
          }
          if (el.type === 'text') {
            return (
              <Text
                {...commonProps}
                text={el.text}
                fontSize={el.fontSize}
                fontFamily={el.fontFamily}
                fill={el.fill}
                fontStyle={el.fontWeight === 'bold' ? 'bold' : 'normal'}
                align={el.align}
              />
            );
          }
          if (el.type === 'image') {
            // For image, assume a custom hook to load image
            // keep it simple: use placeholder or implement later
            return <KonvaImage {...commonProps} />;
          }
          return null;
        })}
        {selectedElementId && selectedNodeRef.current && (
          <Transformer ref={transformerRef} nodes={[selectedNodeRef.current]} />
        )}
      </Layer>
    </Stage>
  );
};
```

You can refine `Image` handling later with an `useImage` hook.

---

## 9. Realtime – Frontend Hook

### 9.1 useRealtime Hook

Create a hook to manage socket connection and wiring.

```ts
// frontend/src/hooks/useRealtime.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  addElement,
  updateElement,
  deleteElement,
  reorderLayers,
} from '../features/design/designSlice';
import { commentsApi } from '../api/commentsApi';
// also presenceSlice for user-joined/user-left, cursor updates, etc.

export function useRealtime(
  designId: string,
  userInfo: { userId: string; name: string; color: string }
) {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/realtime`, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join-design', { designId, ...userInfo });

    socket.on('element-create', (payload) => {
      dispatch(addElement(payload.element));
    });

    socket.on('element-update', (payload) => {
      dispatch(updateElement({ id: payload.id, patch: payload.patch }));
    });

    socket.on('element-delete', (payload) => {
      dispatch(deleteElement({ id: payload.id }));
    });

    socket.on('layer-reorder', (payload) => {
      dispatch(reorderLayers({ newOrder: payload.newOrder }));
    });

    socket.on('comment-added', (payload) => {
      const comment = payload.comment;
      dispatch(
        commentsApi.util.updateQueryData('getComments', designId, (draft: any) => {
          draft.push(comment);
        })
      );
    });

    return () => {
      socket.emit('leave-design', { designId });
      socket.disconnect();
    };
  }, [designId, dispatch, userInfo.userId]);

  const emit = (event: string, payload: any) => {
    socketRef.current?.emit(event, payload);
  };

  return { emit };
}
```

When updating elements locally, use this hook to emit events (e.g. in thunks or event handlers) so changes propagate to other clients.

---

## 10. Comments UI

Create a `CommentsPanel` with RTK Query and socket updates.

Key points:

- Fetch comments with `useGetCommentsQuery(designId)`.
- Allow posting via `useAddCommentMutation`.
- After posting, emit `comment-added` via socket (hook).
- On receiving `comment-added`, merge into RTK Query cache.

---

## 11. Autosave & Export

### 11.1 Autosave

Implement debounced autosave in `EditorPage`:

- Watch `design.dirty` and design state.
- Use `setTimeout` or `lodash.debounce` to call `updateDesign` mutation after idle.

### 11.2 Export PNG

In `EditorPage`:

- Hold a `ref` to `Stage` inside `CanvasStage` (pass via props).
- On click “Download PNG”:

```ts
const uri = stageRef.current?.toDataURL({ mimeType: 'image/png' });
if (uri) {
  const link = document.createElement('a');
  link.href = uri;
  link.download = `${name || 'design'}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

## 12. Testing

### 12.1 Backend

- **Unit + integration** with Jest + Supertest:
  - Validate:
    - `POST /api/designs` creation & validation.
    - `PUT /api/designs/:id` rejects invalid payloads.
    - `POST /api/designs/:id/comments` parses mentions correctly.

### 12.2 Frontend

- **Unit** with Vitest/Jest + RTL:
  - Reducers in `designSlice` & `historySlice`.
  - `LayersPanel` renders correct number of layers.

- **E2E** with Playwright/Cypress:
  - Create design → add text → save → reload → persists.
  - Reorder layers → undo/redo.
  - Download PNG triggers download.

---

## 13. When Generating Code, Remember

- Use **these types** as the source of truth.
- Use **Zod** for validation at the API boundary.
- Use **Mongoose** only as persistence, not for complex validation logic.
- Use **RTK Query** for all server data fetching and caching.
- Use **`react-konva`** for canvas operations; keep the canvas as pure as possible (state → shapes).
- Keep **undo/redo local**; we do **not** attempt to sync histories between users.
- For realtime, the server is a **relay**; **persistence flows through REST**, not sockets.

This is the shared contract for the system.
