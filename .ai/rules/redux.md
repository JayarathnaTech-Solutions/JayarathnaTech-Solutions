# Redux

Redux Toolkit is JayarathnaTech Solutions' chosen state library for global client state **if and when the app needs one**. It is not installed today: the only global state is authentication, held in two React contexts — `src/admin/AuthContext.ts` (staff) and `src/portal/CustomerAuthContext.ts` (customers) — and everything else is local component state or data loaded by `src/lib` hooks. Adding `@reduxjs/toolkit` and `react-redux` is a dependency change and needs the user's approval. These rules are mandatory from the moment Redux is in use.

**Local state stays local.** Redux is for state that genuinely spans feature areas. `useState`, lifting to the nearest common parent, and a narrow context still cover most cases — see [`frontend-react.md`](frontend-react.md). Putting form state or a toggle in the store is a smell, not thoroughness.

**When to adopt it:** a second piece of state that several areas read and write (not just auth), or a context whose value changes often enough that re-rendering every consumer is a measured problem. Until then, a context with a typed value and a `use…` hook is the right tool. Contexts follow the same rules below where they apply: typed value interface in `src/types/`, no business logic inside the provider, every async operation handling loading, success and failure.

## Layout

The store and every slice live in one `store` folder:

```
src/store/
├── store.ts          # configureStore, RootState, AppDispatch
├── hooks.ts          # typed useAppDispatch / useAppSelector
├── exampleSlice.ts   # one slice per file, named <name>Slice.ts
└── userSlice.ts
```

- **The store file is `store.ts`, in a folder named `store`.** Not `index.ts`, not `configureStore.ts`, not `stores/`.
- **A slice file is named `<sliceName>Slice.ts`** — `exampleSlice.ts`, `userSlice.ts`. The `name` passed to `createSlice` matches the file's prefix.
- One slice per file. Never two slices in one file.

This deliberately departs from bulletproof-react, which uses a plural `stores/` folder and colocates state inside each feature. The singular `store/` folder holding every slice is this project's convention — **do not "correct" it toward bulletproof-react's layout.**

## Thunks Live Inside the Slice

**`createAsyncThunk` is defined in the slice file that owns the state it updates, above the `createSlice` call.**

**There is no `thunk.ts`, `thunks.ts`, `actions.ts`, or `asyncActions.ts`.** Do not create one. A thunk separated from its slice hides the connection between the request and the reducers that handle it, and forces a reader to open two files to answer one question.

## No RTK Query

**Do not use RTK Query.** No `createApi`, no `fetchBaseQuery`, no generated hooks, no `api.ts` slice built on it.

Server data is loaded with `createAsyncThunk` calling the `src/lib` data-access functions (Firestore) or `fetch` (this project's `/api/*`), per [`api-client.md`](api-client.md), and its lifecycle is handled in `extraReducers`. The consequence is that loading, error, and any caching are state you own and must write explicitly — handle all three lifecycle cases every time, and do not let a component infer loading from an empty array.

## The Shape

`store/store.ts`:

```ts
import { configureStore } from '@reduxjs/toolkit';
import exampleReducer from './exampleSlice';

export const store = configureStore({
  reducer: {
    example: exampleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

`src/types/example.ts` — the state interface, like every other interface, lives here and not in the slice:

```ts
export interface IExampleState {
  items: IExample[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}
```

`store/exampleSlice.ts` — thunk and slice together, in this order:

```ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { exampleFromDoc } from '../lib/firestore';
import type { IApiError, IExample, IExampleState } from '../types';
import type { RootState } from './store';

const initialState: IExampleState = {
  items: [],
  status: 'idle',
  error: null,
};

export const loadExamples = createAsyncThunk(
  'example/loadExamples',
  async (_, { rejectWithValue }) => {
    try {
      const snapshot = await getDocs(collection(db, 'examples'));

      return snapshot.docs.map(exampleFromDoc);
    } catch (error) {
      return rejectWithValue(toApiError(error));
    }
  },
);

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    cleared: (state) => {
      state.items = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadExamples.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadExamples.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(loadExamples.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as IApiError).message;
      });
  },
});

export const { cleared } = exampleSlice.actions;
export const selectExamples = (state: RootState) => state.example.items;
export const selectExampleStatus = (state: RootState) => state.example.status;
export default exampleSlice.reducer;
```

(`toApiError` is the normalizer described in [`api-client.md`](api-client.md).)

`store/hooks.ts`:

```ts
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

`withTypes` needs react-redux 9 or later. On an older version use the explicit generics instead: `useDispatch<AppDispatch>()` and `useSelector: TypedUseSelectorHook<RootState>`. Confirm the installed version in `package.json` before writing either — do not assume.

## Rules

- **`extraReducers` uses the builder callback.** The object form was removed in Redux Toolkit 2.
- **Handle all three lifecycle cases** — `pending`, `fulfilled`, `rejected` — for every thunk. A missing `rejected` case is a silent failure in the UI.
- **Use `rejectWithValue` for expected failures** so the reducer gets the normalized, serializable `IApiError` rather than a raw `FirebaseError` or `Response`.
- **`store/` is a shared-tier module.** It must not import from `admin/`, `portal/`, `pages/` or `App.tsx` — that would break the unidirectional flow in [`frontend-react.md`](frontend-react.md), and it would be circular, since the areas import the typed hooks and selectors from here.
- **A thunk calls the data layer directly** — a `src/lib` data-access function or mapper for Firestore, `fetch` for `/api/*` — per [`api-client.md`](api-client.md). There is no separate per-resource request module to call instead. axios stays forbidden.
- **A thunk returns domain data, not a `Response` or `DocumentSnapshot`.** Either in a payload breaks the serializability rule below.
- **The slice imports `RootState` as a type only** (`import type`). The runtime import direction is slice → store for types and store → slice for the reducer; a value import would make that circular.
- **Selectors are exported from the slice file**, named `select…`. Components never reach into `state.example.items` directly.
- **Slice state is an interface named `I<SliceName>State`, declared in `src/types/`** — see [`typescript.md`](typescript.md). Never declare it inside the slice file.
- **`RootState` and `AppDispatch` stay `type` aliases** in `store.ts`. They are derived from a value with `ReturnType`/`typeof` and cannot be interfaces; they are on the closed exception list in [`typescript.md`](typescript.md) and take no `I` prefix.
- **State must be serializable.** No class instances, `Date` objects, Firestore `Timestamp`s, `Map`, `Set`, or functions in state or in action payloads. Store an ISO string (the mappers already produce one) and convert at the edge.
- **Mutate the draft, do not also return it.** Immer allows either, never both in one reducer.
- **Export the reducer as the default**, named actions and selectors as named exports.
- **Register every slice in `store.ts`'s `reducer` map.** A slice not registered there is dead code.
- **Reducers are pure.** No requests, no `Date.now()`, no `Math.random()`, no side effects — those belong in the thunk.
- **Reducers are arrow functions**, per the function-style rule in [`frontend-react.md`](frontend-react.md) — no method shorthand in `reducers`.

## Testing

Per [`frontend-testing.md`](frontend-testing.md): test reducers as pure functions — given a state and an action, assert the next state. Cover `pending`, `fulfilled`, and `rejected` for every thunk, with the data layer faked at the `firebase/*` or `fetch` boundary. These are unit tests, and they are the clearest example of logic that belongs in the unit layer. The same applies to a context provider's state transitions today.
