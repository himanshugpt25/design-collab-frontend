Stack: **React + TypeScript + Redux Toolkit + RTK Query + react-konva + socket.io-client**

---

## 1. High-level principles

I’d base everything on these:

1. **Feature-first structure**, not “type-based” (no giant `components/` and `redux/` buckets).
2. **Thin, boring Redux setup**:

   - RTK slices for local/global app state.
   - RTK Query for all HTTP data fetching.

3. **Sockets isolated** behind a small service + hooks, not scattered socket calls in components.
4. **Konva isolated** into its own feature (canvas module) with:

   - Clear state shape (shapes, selection, history).
   - Dedicated utilities (hit testing, serialization) instead of inline logic.

5. **TypeScript strict**:

   - No `any` in app code (only in small, controlled boundaries if absolutely needed).
   - Types live close to where they’re used (feature-local types).

---

## 2. Recommended folder structure

Feature-sliced, with a thin `app/` layer:

```text
src/
├─ app/
│  ├─ App.tsx
│  ├─ index.tsx              # main entry
│  ├─ store.ts               # configureStore
│  ├─ hooks.ts               # useAppDispatch/useAppSelector
│  ├─ routes.tsx             # route config (React Router)
│  └─ Providers.tsx          # Redux, Router, Theme, etc.
│
├─ shared/
│  ├─ ui/                    # reusable UI components (buttons, modals, inputs)
│  ├─ lib/                   # generic helpers (date utils, validators)
│  ├─ config/                # env/config helpers
│  ├─ api/
│  │  └─ baseApi.ts          # RTK Query baseApi
│  ├─ types/                 # global types (e.g. Maybe, ID type)
│  ├─ constants/
│  └─ styles/
│
├─ entities/                 # fundamental domain entities
│  ├─ user/
│  │  ├─ model/
│  │  │  ├─ types.ts
│  │  │  ├─ slice.ts
│  │  │  └─ selectors.ts
│  │  ├─ api/
│  │  │  └─ userApi.ts       # injects endpoints into baseApi
│  │  └─ ui/
│  │     └─ UserAvatar.tsx
│  └─ ...
│
├─ features/                 # user-facing features (auth, canvas tools, chat, etc.)
│  ├─ auth/
│  │  ├─ model/
│  │  │  ├─ types.ts
│  │  │  ├─ slice.ts
│  │  │  └─ selectors.ts
│  │  ├─ api/
│  │  │  └─ authApi.ts       # login, register, refresh, etc.
│  │  ├─ ui/
│  │  │  ├─ LoginForm.tsx
│  │  │  └─ LogoutButton.tsx
│  │  └─ lib/
│  │     └─ validators.ts
│  │
│  ├─ canvas/                # react-konva-based canvas feature
│  │  ├─ model/
│  │  │  ├─ types.ts         # Shape, Layer, StageState, etc.
│  │  │  ├─ slice.ts         # canvas RTK slice (shapes, selection, history)
│  │  │  └─ selectors.ts
│  │  ├─ ui/
│  │  │  ├─ CanvasStage.tsx  # wrapper around <Stage> & <Layer>
│  │  │  ├─ ShapeNode.tsx    # generic shape renderer
│  │  │  ├─ Toolbar.tsx
│  │  │  └─ Sidebar.tsx
│  │  ├─ lib/
│  │  │  ├─ konvaUtils.ts    # transformations, hit-testing, snap, etc.
│  │  │  └─ serialization.ts # save/load canvas JSON, etc.
│  │  └─ hooks/
│  │     └─ useCanvasTools.ts
│  │
│  └─ ...
│
├─ processes/                # long-running flows across features (optional)
│  └─ collaborationSession/
│     ├─ model/
│     │  ├─ slice.ts
│     │  └─ selectors.ts
│     └─ lib/
│        └─ collaborationController.ts
│
├─ pages/
│  ├─ HomePage/
│  │  └─ HomePage.tsx
│  ├─ EditorPage/
│  │  └─ EditorPage.tsx      # composes canvas + side panels
│  └─ ...
│
├─ services/
│  ├─ socket/
│  │  ├─ socketClient.ts     # socket.io-client singleton & connection logic
│  │  ├─ events.ts           # typed event names & payloads
│  │  └─ hooks.ts            # useSocket, useSocketEvent
│  └─ ...
│
├─ test/
│  ├─ unit/
│  └─ integration/
├─ index.html
├─ vite.config.ts / webpack.config.js
├─ tsconfig.json
├─ .eslintrc.cjs
├─ .prettierrc
└─ package.json
```

You can simplify this if the app is small — but **feature-first structure** (entities/features/pages) is the main idea.

---

## 3. Redux Toolkit & RTK Query practices

### 3.1 Store and hooks

**`app/store.ts`**

- Only configure store here:

  - RTK slices.
  - RTK Query `baseApi.reducer`.
  - RTK Query middleware.

- No feature logic.

```ts
// app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../shared/api/baseApi";
import authReducer from "../features/auth/model/slice";
import canvasReducer from "../features/canvas/model/slice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    canvas: canvasReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**`app/hooks.ts`**

```ts
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 3.2 RTK Query baseApi

**Single `baseApi`, inject endpoints per feature:**

```ts
// shared/api/baseApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../../app/store";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["User", "Canvas", "Session"],
  endpoints: () => ({}),
});
```

Then in a feature:

```ts
// features/canvas/api/canvasApi.ts
import { baseApi } from "../../../shared/api/baseApi";
import type { CanvasSnapshot } from "../model/types";

export const canvasApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    saveCanvas: build.mutation<void, CanvasSnapshot>({
      query: (snapshot) => ({
        url: "/canvas",
        method: "POST",
        body: snapshot,
      }),
      invalidatesTags: ["Canvas"],
    }),
    loadCanvas: build.query<CanvasSnapshot, string>({
      query: (id) => `/canvas/${id}`,
      providesTags: ["Canvas"],
    }),
  }),
});

export const { useSaveCanvasMutation, useLoadCanvasQuery } = canvasApi;
```

**Practices:**

- **No manual `useEffect` + `dispatch` for fetching**; use RTKQ hooks (`useXxxQuery`).
- Use `selectFromResult` & `useMemo` for performance when reading parts of cached data.
- Use `tagTypes` + `invalidatesTags` for cache invalidation instead of manual refetch calls everywhere.
- Keep API concerns in `api/`, not mixed into slices or UI.

---

## 4. React + TypeScript practices

### 4.1 TypeScript config

- `strict: true`, `noImplicitAny: true`.
- `noUnusedLocals`, `noUnusedParameters` to keep code clean.
- Use **type imports** (`import type { ... } from '...'`) where appropriate to reduce circular deps.

### 4.2 Component structure

- Prefer **function components with hooks**.
- Smart vs dumb is OK, but in feature-first architecture we usually do:

  - `pages` → compose multiple features.
  - `features` → “smart” feature components (connect to store/query).
  - `entities`/`shared/ui` → mostly presentational + small local hooks.

**Rules:**

- Components should mostly do:

  - Read data (from RTK Query or Redux).
  - Call `dispatch` or local handlers.
  - Render.

- Heavy data transformation logic → move to **selectors** or **lib** functions.

### 4.3 Types close to usage

Inside a feature:

- `model/types.ts` for domain types used in that feature (e.g., `Shape`, `CanvasSnapshot`, `ToolType`).
- Avoid a huge global `types.ts` at root — only truly shared types go under `shared/types`.

### 4.4 Props & events

- Define explicit props interfaces:

```ts
type ShapeNodeProps = {
  shape: Shape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (partial: Partial<Shape>) => void;
};
```

- Avoid `any` props.
- Prefer discriminated unions for shape types / tool modes (e.g. `'rect' | 'circle' | 'arrow'` with dedicated payloads).

---

## 5. `react-konva` (canvas) practices

### 5.1 Keep Konva isolated

- All direct Konva usage (`Stage`, `Layer`, `Rect`, `Text`, event handlers) lives under `features/canvas/ui`.
- Canvas state lives in `features/canvas/model/slice.ts`:

  - Shapes list (normalized by id).
  - Selected shape ids.
  - History stack if you support undo/redo.
  - Canvas-level settings (zoom, pan, grid snap).

Example slice structure:

```ts
type ShapeBase = {
  id: string;
  type: "rect" | "circle" | "arrow" | "text";
  x: number;
  y: number;
  rotation: number;
  // ...others
};

type CanvasState = {
  shapes: Record<string, ShapeBase>;
  order: string[]; // z-order
  selectedIds: string[];
  tool: "select" | "rect" | "arrow" | "pan";
  history: CanvasSnapshot[];
  historyIndex: number;
};
```

**Rules:**

- **No Konva node references** in Redux state. If you need refs, keep them inside components via `useRef`, not in global state.
- **Konva-specific math** (drag limits, snap, alignment) → put into `lib/konvaUtils.ts`.
- UI components should be thin wrappers that:

  - Map Redux/props state to Konva props.
  - Emit synthetic events (`onShapeChange`, `onSelectionChange`).

### 5.2 Performance considerations

- Use `React.memo` or `useMemo` for shape components.
- Use `useAppSelector` with selectors that pick minimally required slices of state.
- Use RTK immutable updates-efficient patterns in slice (arrays -> use IDs; don’t mutate massive nested structures unnecessarily).

---

## 6. `socket.io-client` practices

### 6.1 Socket client isolation

- One module: `services/socket/socketClient.ts`:

```ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const createSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL, {
      withCredentials: true,
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error("Socket not initialized");
  return socket;
};
```

### 6.2 Typed events

- `services/socket/events.ts`:

```ts
export type ServerToClientEvents = {
  "canvas:update": (payload: CanvasUpdatePayload) => void;
  "session:joined": (payload: SessionInfo) => void;
};

export type ClientToServerEvents = {
  "canvas:patch": (payload: CanvasPatchPayload) => void;
  "session:join": (sessionId: string) => void;
};
```

With TypeScript, you can use generics with `Socket<ServerToClientEvents, ClientToServerEvents>`.

### 6.3 Hooks

Simple hook to subscribe:

```ts
// services/socket/hooks.ts
import { useEffect } from "react";
import { createSocket } from "./socketClient";

export const useSocketEvent = <TPayload>(
  event: string,
  handler: (payload: TPayload) => void
) => {
  useEffect(() => {
    const socket = createSocket();
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);
};
```

Then in a feature:

```ts
// features/canvas/hooks/useCanvasRealtime.ts
import { useAppDispatch } from "../../../app/hooks";
import { applyRemotePatch } from "../model/slice";
import { useSocketEvent } from "../../../services/socket/hooks";

export const useCanvasRealtime = () => {
  const dispatch = useAppDispatch();

  useSocketEvent("canvas:update", (patch) => {
    dispatch(applyRemotePatch(patch));
  });
};
```

**Rules:**

- Socket logic never directly manipulates the DOM.
- Prefer: socket event → dispatch Redux action → state change → UI re-render.
- Don’t create/destroy sockets in random components; keep connection management centralized.

---

## 7. General coding practices

### 7.1 ESLint + Prettier

- Use a solid base: `eslint-config-next` or `eslint-config-airbnb` + React and TS plugins, then customize.
- Enforce:

  - `no-console` (allow maybe `console.error` in dev).
  - `no-floating-promises` (with `eslint-plugin-promise` or `@typescript-eslint` rules).
  - React Hooks rules (`eslint-plugin-react-hooks`).

### 7.2 State management rules

- Local UI state (`open/close`, `hover`, small ephemeral stuff) → `useState` inside component.
- Global/app state (auth, canvas contents, collaboration session) → Redux.
- Server data → RTK Query.
- Don’t duplicate the same source of truth:

  - If RTK Query has the data, don’t also store it in slice unless you really need extra derived structure.

### 7.3 Naming & structure

- Files: `PascalCase` for components (`CanvasStage.tsx`), `camelCase` for utilities (`konvaUtils.ts`).
- Export default only for main component in a folder, named exports for everything else.
- Avoid deeply nested hierarchy; 3–4 levels deep is okay, beyond that consider flattening.

---

## 8. Testing & Storybook (optional but “good dev” territory)

- **Unit tests** for:

  - Redux slices (pure functions).
  - Utility functions (`konvaUtils`, serialization).

- **Integration tests** for:

  - Features (canvas actions, auth flows) using `@testing-library/react`.

- **Storybook** for:

  - Shared UI components.
  - Critical feature components like `CanvasStage` with various states (many shapes, empty canvas, selection, etc.).

Keep tests close to features:

```text
features/canvas/model/slice.test.ts
features/canvas/lib/konvaUtils.test.ts
features/canvas/ui/CanvasStage.stories.tsx
```
